/**
 * API Route: /api/verify
 *
 * Label verification endpoint:
 * 1. Receives form data and image
 * 2. Runs OCR on the image
 * 3. Compares extracted text with form data
 * 4. Returns verification results
 */

import { NextRequest, NextResponse } from "next/server";
import { processImageServerSide } from "@/lib/ocr-server";
import { compareFields } from "@/lib/textMatching";
import { validateFormData } from "@/lib/validation";
import type { LabelFormData, OCRResult } from "@/types/verification";
import { ERROR_MESSAGES } from "@/lib/constants";

/**
 * POST /api/verify
 *
 * Processes label verification request
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const contentType = request.headers.get("content-type") || "";

    let labelData: LabelFormData;
    let ocrResult: OCRResult;

    if (contentType.includes("multipart/form-data")) {
      // Handle multipart form data (direct image upload)
      const formData = await request.formData();

      // Extract fields
      const brandName = formData.get("brandName") as string;
      const productType = formData.get("productType") as string;
      const alcoholContent = formData.get("alcoholContent") as string;
      const netContents = (formData.get("netContents") as string) || undefined;
      const imageFile = formData.get("image") as File;

      // Validate inputs
      const validation = validateFormData({
        brandName,
        productType,
        alcoholContent,
        netContents,
        image: imageFile,
      });

      if (!validation.valid) {
        return NextResponse.json(
          {
            success: false,
            error: ERROR_MESSAGES.VALIDATION_ERROR,
            details: validation.errors,
          },
          { status: 400 }
        );
      }

      // Convert File to Buffer for OCR processing
      const imageBuffer = Buffer.from(await imageFile.arrayBuffer());

      // Process with OCR
      console.log("Starting OCR processing...");
      ocrResult = await processImageServerSide(imageBuffer);
      console.log(`OCR completed. Confidence: ${ocrResult.confidence}%`);

      // Build form data object
      labelData = {
        brandName,
        productType,
        alcoholContent,
        netContents,
      };
    } else {
      // Handle JSON data (client-side OCR results)
      const body = await request.json();

      // Extract fields
      const { brandName, productType, alcoholContent, netContents } = body;

      // Validate inputs (no image required for JSON mode)
      const validation = validateFormData({
        brandName,
        productType,
        alcoholContent,
        netContents,
        image: null, // No image validation for JSON mode
      });

      if (!validation.valid) {
        return NextResponse.json(
          {
            success: false,
            error: ERROR_MESSAGES.VALIDATION_ERROR,
            details: validation.errors,
          },
          { status: 400 }
        );
      }

      // Use client-side OCR results
      ocrResult = {
        text: body.ocrText || "",
        confidence: body.ocrConfidence || 0,
        blocks: body.ocrBlocks || [],
        processingTime: 0,
        rawTesseractResult: body.rawTesseractResult,
        allRotationResults: body.allRotationResults || [],
        imageWidth: body.imageWidth || 0,
        imageHeight: body.imageHeight || 0,
        rotationAppliedRadians: body.rotationAppliedRadians || 0,
      };

      // Build form data object
      labelData = {
        brandName,
        productType,
        alcoholContent,
        netContents,
      };
    }

    // Check if OCR extracted sufficient text
    if (!ocrResult.text || ocrResult.text.trim().length < 10) {
      return NextResponse.json(
        {
          success: false,
          error: ERROR_MESSAGES.NO_TEXT_FOUND,
          details: {
            message: ERROR_MESSAGES.NO_TEXT_FOUND,
            confidence: ocrResult.confidence,
          },
        },
        { status: 422 }
      );
    }

    // Compare fields (pass full OCR result for block-aware matching)
    console.log("Starting field comparison...");
    const verificationResult = compareFields(labelData, ocrResult);

    // Add metadata
    verificationResult.processingTime = Date.now() - startTime;
    verificationResult.ocrConfidence = ocrResult.confidence;
    verificationResult.ocrBlocks = ocrResult.blocks;
    verificationResult.rawTesseractResult = ocrResult.rawTesseractResult;
    verificationResult.allRotationResults = ocrResult.allRotationResults;
    verificationResult.imageWidth = ocrResult.imageWidth;
    verificationResult.imageHeight = ocrResult.imageHeight;
    if (typeof ocrResult.rotationAppliedRadians === "number") {
      verificationResult.ocrRotation = {
        appliedRadians: ocrResult.rotationAppliedRadians,
        strategy: ocrResult.rotationStrategy ?? "none",
        candidatesDegrees: ocrResult.rotationCandidatesDegrees,
      };
    }

    // Add warnings if OCR confidence is low
    if (ocrResult.confidence < 70) {
      verificationResult.warnings = [ERROR_MESSAGES.LOW_CONFIDENCE];
    }

    console.log(
      `Verification completed in ${verificationResult.processingTime}ms`
    );

    return NextResponse.json({
      success: true,
      result: verificationResult,
    });
  } catch (error) {
    console.error("API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: ERROR_MESSAGES.INTERNAL_ERROR,
        details: {
          message:
            error instanceof Error
              ? error.message
              : ERROR_MESSAGES.INTERNAL_ERROR,
        },
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/verify
 *
 * Returns API information
 */
export async function GET() {
  return NextResponse.json({
    name: "TTB Label Verification API",
    version: "1.0.0",
    endpoints: {
      POST: "/api/verify - Verify label against form data",
    },
    usage: {
      method: "POST",
      contentType: "multipart/form-data OR application/json",
      fields: {
        brandName: "string (required)",
        productType: "string (required)",
        alcoholContent: "string (required)",
        netContents: "string (optional)",
        image: "File (required for multipart)",
        // OR for JSON:
        ocrText: "string (from client-side OCR)",
        ocrConfidence: "number (from client-side OCR)",
        ocrBlocks: "array (from client-side OCR)",
      },
    },
  });
}
