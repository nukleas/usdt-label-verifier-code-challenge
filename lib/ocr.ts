/**
 * OCR Processing Utilities
 *
 * This module provides wrapper functions for Tesseract.js OCR processing
 * with multi-rotation text merging to handle mixed orientations.
 *
 * Alcohol labels often have text in multiple orientations:
 * - Horizontal: Brand name, alcohol content, product type
 * - Vertical/Rotated: Government warnings along the side
 *
 * We run OCR at all 4 rotations and merge results to capture everything.
 */

import { createWorker } from "tesseract.js";
import { resolve } from "path";
import { existsSync } from "fs";
import type { OCRResult } from "@/types/verification";
import { ERROR_MESSAGES } from "./constants";
import { OCRProcessor } from "./ocr-core";

// ============================================================================
// Worker Configuration
// ============================================================================

/**
 * Creates a Tesseract worker with appropriate paths for the environment
 */
export async function createTesseractWorker() {
  // Detect if running in Node.js (API routes, tests) vs browser
  const isNode =
    typeof process !== "undefined" && process.versions && process.versions.node;

  // Detect if running in serverless environment (Vercel, AWS Lambda, etc.)
  const isServerless =
    isNode &&
    (process.env.VERCEL ||
      process.env.AWS_LAMBDA_FUNCTION_NAME ||
      process.env.NETLIFY ||
      process.env.RAILWAY_ENVIRONMENT ||
      process.env.NODE_ENV === "production");

  let worker;

  try {
    if (isServerless) {
      // For serverless environments, try multiple path strategies
      console.log(
        "Creating Tesseract worker for serverless environment using local bundled files"
      );

      // Try different possible paths for serverless environments
      const possiblePaths = [
        // Vercel deployment structure
        resolve(process.cwd(), ".next/server/chunks/public/tesseract-bundled"),
        // Standard public directory
        resolve(process.cwd(), "public/tesseract-bundled"),
        // Alternative Vercel structure
        resolve(process.cwd(), "tesseract-bundled"),
        // Fallback to relative paths
        "./public/tesseract-bundled",
        "./tesseract-bundled",
      ];

      // For serverless environments, we need to use the Node.js worker, not the browser worker
      const nodeWorkerPath = resolve(
        process.cwd(),
        "node_modules/tesseract.js/src/worker-script/node/index.js"
      );

      console.log(
        `Serverless environment detected. Current working directory: ${process.cwd()}`
      );
      console.log(
        `Node.js worker path: ${nodeWorkerPath} (exists: ${existsSync(
          nodeWorkerPath
        )})`
      );

      let workerPath, corePath, langPath;

      // For serverless environments, use Node.js worker with bundled assets
      if (existsSync(nodeWorkerPath)) {
        workerPath = nodeWorkerPath;

        // Find bundled assets for core and language data
        for (const basePath of possiblePaths) {
          const testCorePath = resolve(basePath, "tesseract-core-simd.wasm.js");
          const testLangPath = resolve(basePath, "traineddata");

          if (existsSync(testCorePath) && existsSync(testLangPath)) {
            corePath = testCorePath;
            langPath = testLangPath;
            console.log(`Found bundled assets at: ${basePath}`);
            break;
          }
        }

        if (!corePath || !langPath) {
          console.warn("Could not find bundled assets, using default paths");
          corePath = resolve(process.cwd(), "public/tesseract");
          langPath = resolve(process.cwd(), "public/tesseract");
        }
      }

      if (workerPath) {
        worker = await createWorker("eng", 1, {
          workerPath,
          corePath,
          langPath,
          gzip: false,
        });
        console.log(
          "Successfully created worker using Node.js worker with bundled assets"
        );
      } else {
        console.warn("Node.js worker not found, trying CDN fallback");
        // Try CDN as fallback for serverless environments
        try {
          worker = await createWorker("eng", 1, {
            workerPath: "https://unpkg.com/tesseract.js@4/dist/worker.min.js",
            corePath:
              "https://unpkg.com/tesseract.js-core@4/tesseract-core-simd.wasm.js",
            gzip: false,
          });
          console.log("Successfully created worker using CDN fallback");
        } catch (cdnError) {
          console.warn(
            "CDN fallback failed, using default configuration:",
            cdnError
          );
          worker = await createWorker("eng", 1);
        }
      }
    } else if (isNode) {
      // Local development and testing
      console.log("Creating Tesseract worker for local Node.js environment");
      worker = await createWorker("eng", 1, {
        workerPath: resolve(
          process.cwd(),
          "node_modules/tesseract.js/src/worker-script/node/index.js"
        ),
        langPath: resolve(process.cwd(), "public/tesseract"),
        gzip: false,
      });
    } else {
      // Browser environment
      console.log("Creating Tesseract worker for browser environment");
      worker = await createWorker("eng", 1, {
        workerPath: "/tesseract/worker.min.js",
        corePath: "/tesseract/tesseract-core-lstm.wasm.js",
        langPath: "/tesseract",
        gzip: false,
      });
    }
  } catch (error) {
    console.warn(
      "Failed to create worker with custom paths, falling back to default:",
      error
    );
    // Fallback: let Tesseract.js handle everything automatically
    worker = await createWorker("eng", 1);
  }

  // Configure Tesseract for better accuracy on alcohol labels
  await worker.setParameters({
    tessedit_pageseg_mode: "3", // PSM 3: Fully automatic page segmentation (default, works well for mixed content)
    preserve_interword_spaces: "1", // Preserve spaces between words
  } as Record<string, string>);

  return worker;
}

// ============================================================================
// OCR Processing
// ============================================================================

/**
 * Processes an image file with OCR using Tesseract.js
 * Runs OCR at multiple rotations and merges all text to handle mixed orientations
 *
 * @param imageFile - Image file to process
 * @returns Promise resolving to OCR result with merged text from all rotations
 *
 * @example
 * const result = await processOCR(imageFile);
 * console.log('Extracted text:', result.text);
 * console.log('Words:', result.blocks);
 */
export async function processOCR(
  imageFile: File | Blob | Buffer
): Promise<OCRResult> {
  // Set timeout for OCR processing (4 minutes for serverless, 10 minutes for local)
  const isServerless =
    typeof process !== "undefined" &&
    (process.env.VERCEL ||
      process.env.AWS_LAMBDA_FUNCTION_NAME ||
      process.env.NETLIFY ||
      process.env.RAILWAY_ENVIRONMENT ||
      process.env.NODE_ENV === "production");

  const timeoutMs = isServerless ? 240000 : 600000; // 4 min serverless, 10 min local

  return new Promise(async (resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(
        new Error(`OCR processing timed out after ${timeoutMs / 1000} seconds`)
      );
    }, timeoutMs);

    try {
      console.log(
        "Starting multi-rotation OCR processing with Tesseract.js..."
      );
      console.log("Environment:", {
        isNode:
          typeof process !== "undefined" &&
          process.versions &&
          process.versions.node,
        isServerless,
        nodeEnv: process.env.NODE_ENV,
        timeoutMs,
      });

      // Convert to buffer for image manipulation
      const bufferStart = Date.now();
      let imageBuffer: Buffer;

      if (Buffer.isBuffer(imageFile)) {
        // Already a Buffer (Node.js)
        imageBuffer = imageFile;
      } else if (typeof (imageFile as Blob).arrayBuffer === "function") {
        // Browser Blob/File with arrayBuffer method
        const arrayBuffer = await (imageFile as Blob).arrayBuffer();
        imageBuffer = Buffer.from(arrayBuffer);
      } else {
        throw new Error("Invalid image input: must be File, Blob, or Buffer");
      }
      console.log(`Image converted to buffer in ${Date.now() - bufferStart}ms`);

      // Initialize Tesseract worker
      const workerStart = Date.now();
      const worker = await createTesseractWorker();
      console.log(
        `Tesseract worker initialized in ${Date.now() - workerStart}ms`
      );

      // Process with OCR core logic
      const processor = new OCRProcessor();
      const result = await processor.processWithRotations(worker, imageBuffer);

      // Terminate worker
      await worker.terminate();

      clearTimeout(timeoutId);
      resolve(result);
    } catch (error) {
      clearTimeout(timeoutId);
      console.error("OCR processing error:", error);
      reject(new Error(ERROR_MESSAGES.OCR_FAILED));
    }
  });
}

/**
 * Processes an image from a data URL or blob URL
 *
 * @param imageUrl - Image URL to process
 * @returns Promise resolving to OCR result
 */
export async function processOCRFromURL(imageUrl: string): Promise<OCRResult> {
  try {
    // Fetch the image and convert to Blob
    const response = await fetch(imageUrl);
    const blob = await response.blob();

    // Use main processing function
    return await processOCR(blob);
  } catch (error) {
    console.error("OCR processing error:", error);
    throw new Error(ERROR_MESSAGES.OCR_FAILED);
  }
}

// ============================================================================
// Image Preprocessing
// ============================================================================

/**
 * Preprocesses image for better OCR results
 * (Optional: Can add contrast/brightness adjustments)
 *
 * @param imageUrl - Image URL
 * @returns Preprocessed image URL
 */
export async function preprocessImage(imageUrl: string): Promise<string> {
  // For now, return as-is
  // Multi-rotation approach handles orientation issues
  return imageUrl;
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validates OCR result
 * Checks if text was extracted successfully
 *
 * @param result - OCR result to validate
 * @returns True if valid, false otherwise
 */
export function isValidOCRResult(result: OCRResult): boolean {
  return (
    result.text !== undefined &&
    result.text.trim().length >= 10 && // At least 10 characters
    result.confidence > 0
  );
}

/**
 * Placeholder for worker termination
 * (Not needed with per-request worker creation)
 */
export async function terminateWorker(): Promise<void> {
  // Workers are terminated after each request
  // No persistent worker to terminate
}
