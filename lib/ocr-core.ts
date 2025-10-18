/**
 * Core OCR Processing Logic
 *
 * This module contains the core multi-rotation OCR logic,
 * separated from worker initialization for easier testing.
 */

import type { Worker } from "tesseract.js";
import type { OCRResult, TextBlock } from "@/types/verification";

// Rotation angles to try (covers all 4 orientations)
const ROTATION_ANGLES = [0, 90, 180, 270] as const;

// Reduced rotations for serverless environments to improve performance
const SERVERLESS_ROTATION_ANGLES = [0, 90] as const;

// Minimum confidence threshold for including words (0-100)
const MIN_WORD_CONFIDENCE = 60;

interface RotationAttempt {
  angle: number;
  text: string;
  blocks: TextBlock[];
  confidence: number;
  wordCount: number;
  rawResult?: unknown;
}

/**
 * OCR Processor class that handles multi-rotation text extraction
 */
export class OCRProcessor {
  /**
   * Processes an image buffer with multi-rotation OCR
   *
   * @param worker - Initialized Tesseract worker
   * @param imageBuffer - Image as Buffer
   * @returns Promise resolving to OCR result with merged text from all rotations
   */
  async processWithRotations(
    worker: Worker,
    imageBuffer: Buffer
  ): Promise<OCRResult> {
    const pipelineStart = Date.now();

    // Detect serverless environment for optimized processing
    const isServerless = typeof process !== "undefined" && (
      process.env.VERCEL ||
      process.env.AWS_LAMBDA_FUNCTION_NAME ||
      process.env.NETLIFY ||
      process.env.RAILWAY_ENVIRONMENT ||
      process.env.NODE_ENV === "production"
    );

    const rotationAngles = isServerless ? SERVERLESS_ROTATION_ANGLES : ROTATION_ANGLES;
    
    console.log(`Starting multi-rotation OCR processing... (${rotationAngles.length} rotations)`);

    // Run OCR at selected rotations
    const attempts: RotationAttempt[] = [];
    const jimpModule = await import("jimp");
    const Jimp = jimpModule.default;
    const baseImage = await Jimp.read(imageBuffer);
    const sourceMime = baseImage.getMIME();
    const imageWidth = baseImage.bitmap.width;
    const imageHeight = baseImage.bitmap.height;

    for (const angle of rotationAngles) {
      const attemptStart = Date.now();

      // Rotate image if needed
      let rotatedBuffer: Buffer;
      if (angle === 0) {
        rotatedBuffer = imageBuffer;
      } else {
        // Auto-resize canvas to prevent cropping (critical for vertical text detection!)
        const rotatedImage = baseImage.clone().rotate(angle);
        rotatedBuffer = await rotatedImage.getBufferAsync(sourceMime);
      }

      // Run Tesseract OCR with blocks output enabled to get word-level data
      const result = await worker.recognize(rotatedBuffer, {}, { blocks: true });

      const text = result.data.text || "";
      const blocks = result.data.blocks || [];

      // Extract words from blocks hierarchy
      const words = this.extractWordsFromBlocks(blocks);

      const confidence = result.data.confidence || 0;

      attempts.push({
        angle,
        text,
        blocks: words,
        confidence,
        wordCount: words.length,
        rawResult: result.data, // Store raw Tesseract result
      });

      console.log(
        `Rotation ${angle}° completed in ${Date.now() - attemptStart}ms (words=${words.length}, conf=${confidence.toFixed(1)}%)`
      );
    }

    // Find the rotation with the most text (primary orientation)
    const primaryAttempt = attempts.reduce((best, current) =>
      current.wordCount > best.wordCount ? current : best
    );

    // Merge all text from all rotations
    const allText = attempts
      .map((a) => a.text.trim())
      .filter((text) => text.length > 0)
      .join("\n\n");

    // Merge all word blocks from all rotations
    const allBlocks = attempts.flatMap((a) => a.blocks);

    // Calculate average confidence across all rotations
    const avgConfidence =
      attempts.length > 0
        ? attempts.reduce((sum, a) => sum + a.confidence, 0) / attempts.length
        : 0;

    const finalProcessingTime = Date.now() - pipelineStart;

    console.log(`Total OCR processing time: ${finalProcessingTime}ms`);
    console.log(`Extracted ${allBlocks.length} words from ${attempts.length} rotations`);
    console.log(`Primary orientation: ${primaryAttempt.angle}°`);

    // Store ALL rotation results for bbox matching (important for vertical text!)
    const allRawResults = attempts.map(a => ({
      angle: a.angle,
      result: a.rawResult,
    }));

    return {
      text: allText,
      confidence: avgConfidence,
      processingTime: finalProcessingTime,
      blocks: allBlocks,
      rotationAppliedRadians: this.degToRad(primaryAttempt.angle),
      rotationStrategy: "auto",
      rotationCandidatesDegrees: Array.from(rotationAngles),
      rawTesseractResult: primaryAttempt.rawResult, // Primary result for compatibility
      allRotationResults: allRawResults, // All results for multi-orientation bbox matching
      imageWidth, // Original image dimensions for bbox transformation
      imageHeight,
    };
  }

  /**
   * Processes a single rotation without multi-rotation merging
   * (Useful for testing or simpler use cases)
   */
  async processSingleRotation(
    worker: Worker,
    imageBuffer: Buffer,
    angle: number = 0
  ): Promise<OCRResult> {
    const startTime = Date.now();

    // Rotate if needed
    let processBuffer = imageBuffer;
    if (angle !== 0) {
      const jimpModule = await import("jimp");
      const Jimp = jimpModule.default;
      const image = await Jimp.read(imageBuffer);
      // Auto-resize canvas to prevent cropping
      const rotated = image.rotate(angle);
      processBuffer = await rotated.getBufferAsync(image.getMIME());
    }

    // Run OCR with blocks output enabled
    const result = await worker.recognize(processBuffer, {}, { blocks: true });

    const text = result.data.text || "";
    const words = this.extractWordsFromBlocks(result.data.blocks || []);

    return {
      text,
      confidence: result.data.confidence || 0,
      processingTime: Date.now() - startTime,
      blocks: words,
      rotationAppliedRadians: this.degToRad(angle),
      rotationStrategy: angle === 0 ? "auto" : "manual",
      rotationCandidatesDegrees: [angle],
      rawTesseractResult: result.data, // Include raw result for bbox matching
    };
  }

  private degToRad(angle: number): number {
    return (angle * Math.PI) / 180;
  }

  /**
   * Extracts word-level data from Tesseract blocks hierarchy
   * Blocks structure: page -> block -> paragraph -> line -> word
   */
  private extractWordsFromBlocks(blocks: unknown[]): TextBlock[] {
    const words: TextBlock[] = [];

    for (const block of blocks as Record<string, unknown>[]) {
      if (!block.paragraphs) continue;

      for (const paragraph of block.paragraphs as Record<string, unknown>[]) {
        if (!paragraph.lines) continue;

        for (const line of paragraph.lines as Record<string, unknown>[]) {
          if (!line.words) continue;

          for (const word of line.words as Record<string, unknown>[]) {
            if (!word.text || typeof word.text !== "string" || word.text.trim().length === 0)
              continue;

            const text = word.text.trim();
            const confidence = typeof word.confidence === "number" ? word.confidence : 0;

            // Filter out low-confidence words
            if (confidence < MIN_WORD_CONFIDENCE) continue;

            words.push({
              text,
              confidence,
              bbox: (word.bbox as { x0: number; y0: number; x1: number; y1: number }) || {
                x0: 0,
                y0: 0,
                x1: 0,
                y1: 0,
              },
            });
          }
        }
      }
    }

    return words;
  }
}
