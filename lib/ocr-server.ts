/**
 * Server-Side OCR Processing
 *
 * Uses Tesseract.js in Node.js environment for better performance
 * and server-side processing without client-side dependencies
 */

import { createWorker, type Worker } from "tesseract.js";
import type { OCRResult, TextBlock } from "@/types/verification";

// Rotation angles to try (covers all 4 orientations)
const ROTATION_ANGLES = [0, 90, 180, 270] as const;

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
 * Server-Side OCR Processor
 *
 * Handles multi-rotation OCR processing using Tesseract.js in Node.js
 * with proper server-side configuration
 */
export class ServerOCRProcessor {
  private worker: Worker | null = null;

  /**
   * Initialize the Tesseract worker for server-side processing
   */
  async initializeWorker(): Promise<void> {
    console.log("Initializing server-side Tesseract worker...");

    this.worker = await createWorker("eng", 1, {
      // Server-side specific configuration
      workerPath: "./node_modules/tesseract.js/src/worker-script/node/index.js",
      corePath: "./node_modules/tesseract.js-core",
      logger: (m: { status?: string; progress?: number }) => {
        if (m.status === "recognizing text") {
          console.log(`OCR Progress: ${Math.round((m.progress || 0) * 100)}%`);
        } else if (m.status) {
          console.log(`OCR Status: ${m.status}`);
        }
      },
    });

    // Configure for better label recognition
    await this.worker.setParameters({
      tessedit_pageseg_mode: "3",
      preserve_interword_spaces: "1",
    } as Record<string, string>);

    console.log("Server-side Tesseract worker initialized successfully");
  }

  /**
   * Process image buffer with multi-rotation OCR
   */
  async processWithRotations(imageBuffer: Buffer): Promise<OCRResult> {
    if (!this.worker) {
      await this.initializeWorker();
    }

    if (!this.worker) {
      throw new Error("Failed to initialize Tesseract worker");
    }

    const pipelineStart = Date.now();
    console.log(
      `Starting server-side multi-rotation OCR processing... (${ROTATION_ANGLES.length} rotations)`
    );

    // Import Jimp for image rotation
    const jimpModule = await import("jimp");
    const Jimp = jimpModule.default;
    const baseImage = await Jimp.read(imageBuffer);
    const sourceMime = baseImage.getMIME();
    const imageWidth = baseImage.bitmap.width;
    const imageHeight = baseImage.bitmap.height;

    const attempts: RotationAttempt[] = [];

    for (const angle of ROTATION_ANGLES) {
      const attemptStart = Date.now();

      // Rotate image if needed
      let rotatedBuffer: Buffer;
      if (angle === 0) {
        rotatedBuffer = imageBuffer;
      } else {
        // Auto-resize canvas to prevent cropping
        const rotatedImage = baseImage.clone().rotate(angle);
        rotatedBuffer = await rotatedImage.getBufferAsync(sourceMime);
      }

      // Run Tesseract OCR with blocks output enabled
      const result = await this.worker.recognize(
        rotatedBuffer,
        {},
        { blocks: true }
      );

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
        rawResult: result.data,
      });

      console.log(
        `Rotation ${angle}° completed in ${
          Date.now() - attemptStart
        }ms (words=${words.length}, conf=${confidence.toFixed(1)}%)`
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

    console.log(
      `Total server-side OCR processing time: ${finalProcessingTime}ms`
    );
    console.log(
      `Extracted ${allBlocks.length} words from ${attempts.length} rotations`
    );
    console.log(`Primary orientation: ${primaryAttempt.angle}°`);

    // Store ALL rotation results for bbox matching
    const allRawResults = attempts.map((a) => ({
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
      rotationCandidatesDegrees: Array.from(ROTATION_ANGLES),
      rawTesseractResult: primaryAttempt.rawResult,
      allRotationResults: allRawResults,
      imageWidth,
      imageHeight,
    };
  }

  /**
   * Process single rotation without multi-rotation merging
   */
  async processSingleRotation(
    imageBuffer: Buffer,
    angle: number = 0
  ): Promise<OCRResult> {
    if (!this.worker) {
      await this.initializeWorker();
    }

    if (!this.worker) {
      throw new Error("Failed to initialize Tesseract worker");
    }

    const startTime = Date.now();

    // Rotate if needed
    let processBuffer = imageBuffer;
    if (angle !== 0) {
      const jimpModule = await import("jimp");
      const Jimp = jimpModule.default;
      const image = await Jimp.read(imageBuffer);
      const rotated = image.rotate(angle);
      processBuffer = await rotated.getBufferAsync(image.getMIME());
    }

    // Run OCR with blocks output enabled
    const result = await this.worker.recognize(
      processBuffer,
      {},
      { blocks: true }
    );

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
      rawTesseractResult: result.data,
    };
  }

  /**
   * Terminate the worker and clean up resources
   */
  async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      console.log("Server-side Tesseract worker terminated");
    }
  }

  private degToRad(angle: number): number {
    return (angle * Math.PI) / 180;
  }

  /**
   * Extracts word-level data from Tesseract blocks hierarchy
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
            if (
              !word.text ||
              typeof word.text !== "string" ||
              word.text.trim().length === 0
            )
              continue;

            const text = word.text.trim();
            const confidence =
              typeof word.confidence === "number" ? word.confidence : 0;

            // Filter out low-confidence words
            if (confidence < MIN_WORD_CONFIDENCE) continue;

            words.push({
              text,
              confidence,
              bbox: (word.bbox as {
                x0: number;
                y0: number;
                x1: number;
                y1: number;
              }) || {
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

// Singleton instance for reuse across requests
let serverOCRInstance: ServerOCRProcessor | null = null;

/**
 * Get or create the server-side OCR processor instance
 */
export async function getServerOCRProcessor(): Promise<ServerOCRProcessor> {
  if (!serverOCRInstance) {
    serverOCRInstance = new ServerOCRProcessor();
    await serverOCRInstance.initializeWorker();
  }
  return serverOCRInstance;
}

/**
 * Process image buffer using server-side OCR
 */
export async function processImageServerSide(
  imageBuffer: Buffer
): Promise<OCRResult> {
  const processor = await getServerOCRProcessor();
  return await processor.processWithRotations(imageBuffer);
}
