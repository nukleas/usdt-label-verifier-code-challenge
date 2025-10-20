/**
 * LLM-based Label Verification
 *
 * This module uses Google's Gemini API with vision capabilities to perform
 * label verification. It replaces the Tesseract OCR + text matching approach
 * with a single multimodal LLM call.
 */

import { GoogleGenAI } from "@google/genai";
import type {
  LabelFormData,
  VerificationResult,
  BoundingBox,
} from "../types/verification";
import { buildVerificationPrompt } from "./prompts";

/**
 * Response format from the LLM
 */
interface LLMVerificationResponse {
  overallStatus: "pass" | "fail";
  fields: Array<{
    field: string;
    status: "match" | "mismatch" | "not_found";
    expected: string;
    found?: string;
    confidence?: number;
    message: string;
    bbox?: number[] | null; // [ymin, xmin, ymax, xmax] in 0-1000 scale
  }>;
  rawOCRText: string;
}

/**
 * Detects the MIME type from a buffer
 */
function detectMimeType(buffer: Buffer): string {
  // Check for magic numbers
  const header = buffer.slice(0, 4).toString("hex");

  if (header.startsWith("ffd8ff")) {
    return "image/jpeg";
  } else if (header.startsWith("89504e47")) {
    return "image/png";
  } else if (header.startsWith("47494638")) {
    return "image/gif";
  } else if (header.startsWith("52494646")) {
    // RIFF header, likely WebP
    return "image/webp";
  }

  // Default to JPEG if unknown
  return "image/jpeg";
}

/**
 * Converts Gemini's bounding box format to our BoundingBox format
 * and scales from [0, 1000] to actual image dimensions
 *
 * @param bbox - Array in [ymin, xmin, ymax, xmax] format (0-1000 scale)
 * @param imageWidth - Actual image width in pixels
 * @param imageHeight - Actual image height in pixels
 * @returns BoundingBox in {x0, y0, x1, y1} format with actual pixel coordinates
 */
function convertGeminiBBox(
  bbox: number[] | null | undefined,
  imageWidth: number,
  imageHeight: number
): BoundingBox[] {
  if (!bbox || bbox.length !== 4) {
    return [];
  }

  const [ymin, xmin, ymax, xmax] = bbox;

  // Scale from [0, 1000] to actual dimensions
  const x0 = Math.round((xmin / 1000) * imageWidth);
  const y0 = Math.round((ymin / 1000) * imageHeight);
  const x1 = Math.round((xmax / 1000) * imageWidth);
  const y1 = Math.round((ymax / 1000) * imageHeight);

  return [{ x0, y0, x1, y1 }];
}

/**
 * Verifies a label using Gemini LLM with vision capabilities
 *
 * @param imageBuffer - The label image as a Buffer
 * @param formData - The expected label data from the form
 * @returns Promise resolving to VerificationResult
 */
export async function verifyWithLLM(
  imageBuffer: Buffer,
  formData: LabelFormData
): Promise<VerificationResult> {
  const startTime = Date.now();

  // Check for API key
  const apiKey = process.env.GOOGLE_GENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GOOGLE_GENAI_API_KEY environment variable is not set. Please set it to use LLM verification mode."
    );
  }

  try {
    // Initialize Gemini client
    const ai = new GoogleGenAI({ apiKey });

    // Convert image to base64
    const base64Image = imageBuffer.toString("base64");
    const mimeType = detectMimeType(imageBuffer);

    console.log(
      `LLM Verification: Using Gemini API with image (${mimeType}, ${Math.round(
        imageBuffer.length / 1024
      )}KB)`
    );

    // Get image dimensions using sharp
    const sharp = (await import("sharp")).default;
    const imageMetadata = await sharp(imageBuffer).metadata();
    const imageWidth = imageMetadata.width || 0;
    const imageHeight = imageMetadata.height || 0;

    console.log(`Image dimensions: ${imageWidth}x${imageHeight}`);

    // Build verification prompt
    const prompt = buildVerificationPrompt(formData);

    // Call Gemini 2.5 Pro for verification with bounding boxes
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType,
                data: base64Image,
              },
            },
          ],
        },
      ],
    });

    // Extract text response
    const responseText = response.text;

    if (!responseText) {
      throw new Error("No response from Gemini API");
    }

    console.log(`LLM Response received (${responseText.length} chars)`);

    // Parse JSON response
    let llmResponse: LLMVerificationResponse;
    try {
      // Try to extract JSON if response contains markdown code blocks
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
      const jsonText = jsonMatch ? jsonMatch[1] : responseText;

      llmResponse = JSON.parse(jsonText.trim());
    } catch (parseError) {
      console.error("Failed to parse LLM response:", parseError);
      console.error("Response text:", responseText);
      throw new Error(
        `Failed to parse LLM response as JSON: ${
          parseError instanceof Error ? parseError.message : "Unknown error"
        }`
      );
    }

    // Map LLM response to our VerificationResult format
    const verificationResult: VerificationResult = {
      overallStatus: llmResponse.overallStatus,
      fields: llmResponse.fields.map((field) => ({
        field: field.field,
        status: field.status,
        expected: field.expected,
        found: field.found,
        confidence: field.confidence ?? 0,
        message: field.message,
        // Convert Gemini bounding boxes to our format
        bboxes: convertGeminiBBox(field.bbox, imageWidth, imageHeight),
      })),
      rawOCRText: llmResponse.rawOCRText || "",
      processingTime: Date.now() - startTime,
      ocrConfidence: calculateAverageConfidence(llmResponse.fields),
      // Add image dimensions for frontend visualization
      imageWidth,
      imageHeight,
    };

    console.log(
      `LLM Verification completed in ${verificationResult.processingTime}ms`
    );

    return verificationResult;
  } catch (error) {
    console.error("LLM Verification error:", error);

    // Provide helpful error messages
    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        throw new Error(
          "Invalid or missing Google AI API key. Please check your GOOGLE_GENAI_API_KEY environment variable."
        );
      } else if (
        error.message.includes("quota") ||
        error.message.includes("rate limit")
      ) {
        throw new Error(
          "API rate limit exceeded. Please try again later or upgrade your API quota."
        );
      }
    }

    throw error;
  }
}

/**
 * Calculates average confidence from field results
 */
function calculateAverageConfidence(
  fields: Array<{ confidence?: number }>
): number {
  const confidences = fields
    .map((f) => f.confidence)
    .filter((c): c is number => c !== undefined);

  if (confidences.length === 0) return 0;

  return Math.round(
    confidences.reduce((sum, c) => sum + c, 0) / confidences.length
  );
}
