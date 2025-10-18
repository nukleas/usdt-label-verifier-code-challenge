/**
 * API Route: /api/verify
 *
 * Processes label verification requests:
 * 1. Receives form data and image
 * 2. Runs OCR on the image
 * 3. Compares extracted text with form data
 * 4. Returns verification results
 */

import { NextRequest, NextResponse } from "next/server";
import { processOCR } from "@/lib/ocr";
import { compareFields } from "@/lib/textMatching";
import { validateFormData } from "@/lib/validation";
import type { LabelFormData } from "@/types/verification";
import { ERROR_MESSAGES } from "@/lib/constants";

/**
 * POST /api/verify
 *
 * Processes label verification request
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Parse multipart form data
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

    // Convert File to Blob for OCR processing
    const imageBuffer = await imageFile.arrayBuffer();
    const imageBlob = new Blob([imageBuffer], { type: imageFile.type });

    // Process OCR
    console.log("Starting OCR processing...");
    const ocrResult = await processOCR(imageBlob);
    console.log(`OCR completed. Confidence: ${ocrResult.confidence}%`);

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

    // Build form data object
    const labelData: LabelFormData = {
      brandName,
      productType,
      alcoholContent,
      netContents,
    };

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
      verificationResult.warnings = [
        ERROR_MESSAGES.LOW_CONFIDENCE,
      ];
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
            error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR,
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
      contentType: "multipart/form-data",
      fields: {
        brandName: "string (required)",
        productType: "string (required)",
        alcoholContent: "string (required)",
        netContents: "string (optional)",
        image: "File (required)",
      },
    },
  });
}
