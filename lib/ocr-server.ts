/**
 * Server-Side OCR Processing
 *
 * Uses Tesseract.js in Node.js environment for better performance
 * and server-side processing without client-side dependencies
 */

import { createWorker, type Worker, type Block } from "tesseract.js";
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

    try {
      // Use local installation - we have tesseract.js installed via npm
      console.log("Using local Tesseract.js installation");

      const workerConfig = {
        gzip: false,
        logger: (m: { status?: string; progress?: number }) => {
          if (m.status === "recognizing text") {
            console.log(
              `OCR Progress: ${Math.round((m.progress || 0) * 100)}%`
            );
          } else if (m.status) {
            console.log(`OCR Status: ${m.status}`);
          }
        },
      };

      this.worker = await createWorker("eng", 1, workerConfig);

      // Configure for better label recognition
      await this.worker.setParameters({
        tessedit_pageseg_mode: "3",
        preserve_interword_spaces: "1",
      } as Record<string, string>);

      console.log("Server-side Tesseract worker initialized successfully");
    } catch (error) {
      console.error("Failed to initialize Tesseract worker:", error);

      // Log detailed error information for debugging
      if (error instanceof Error) {
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }

      // Clean up any partial initialization
      if (this.worker) {
        try {
          await this.worker.terminate();
        } catch (terminateError) {
          console.error(
            "Error terminating worker during cleanup:",
            terminateError
          );
        }
        this.worker = null;
      }

      // Re-throw with more context
      throw new Error(
        `Tesseract worker initialization failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
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

    // Calculate robust scores for each rotation attempt
    const scoredAttempts = attempts.map((attempt) => ({
      ...attempt,
      score: this.calculateOrientationScore(attempt),
    }));

    // Find the rotation with the best score (primary orientation)
    const primaryAttempt = scoredAttempts.reduce((best, current) => {
      if (current.score > best.score) {
        return current;
      } else if (current.score === best.score) {
        // Fallback: prefer higher confidence when scores tie
        return current.confidence > best.confidence ? current : best;
      }
      return best;
    });

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

    // Extract image dimensions and rotate if needed
    let processBuffer = imageBuffer;
    let imageWidth: number;
    let imageHeight: number;

    if (angle !== 0) {
      const jimpModule = await import("jimp");
      const Jimp = jimpModule.default;
      const image = await Jimp.read(imageBuffer);
      imageWidth = image.bitmap.width;
      imageHeight = image.bitmap.height;
      const rotated = image.rotate(angle);
      processBuffer = await rotated.getBufferAsync(image.getMIME());
    } else {
      // Extract dimensions from original buffer when no rotation is applied
      const jimpModule = await import("jimp");
      const Jimp = jimpModule.default;
      const image = await Jimp.read(imageBuffer);
      imageWidth = image.bitmap.width;
      imageHeight = image.bitmap.height;
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
      imageWidth,
      imageHeight,
    };
  }

  /**
   * Terminate the worker and clean up resources
   */
  async terminate(): Promise<void> {
    if (this.worker) {
      try {
        await this.worker.terminate();
        console.log("Server-side Tesseract worker terminated");
      } catch (error) {
        console.error("Error terminating Tesseract worker:", error);
        // Continue with cleanup even if termination fails
      } finally {
        this.worker = null;
      }
    }
  }

  private degToRad(angle: number): number {
    return (angle * Math.PI) / 180;
  }

  /**
   * Extracts word-level data from Tesseract blocks hierarchy
   */
  private extractWordsFromBlocks(blocks: Block[] | null): TextBlock[] {
    if (!blocks) return [];

    return blocks
      .flatMap((block) => block.paragraphs)
      .flatMap((paragraph) => paragraph.lines)
      .flatMap((line) => line.words)
      .filter((word) => word.text.trim().length > 0)
      .filter((word) => word.confidence >= MIN_WORD_CONFIDENCE)
      .map((word) => ({
        text: word.text.trim(),
        confidence: word.confidence,
        bbox: word.bbox,
      }));
  }

  /**
   * Calculates a robust score for orientation selection
   * Uses weighted scoring: wordCount * (avgConfidence/100) + pattern validation bonus/penalty
   */
  private calculateOrientationScore(attempt: RotationAttempt): number {
    const { wordCount, confidence, text, blocks } = attempt;

    // Base weighted score: wordCount * (confidence/100)
    const baseScore = wordCount * (confidence / 100);

    // Pattern validation bonus/penalty
    const patternScore = this.calculatePatternScore(text, blocks);

    // Combine base score with pattern validation
    const totalScore = baseScore + patternScore;

    console.log(
      `Orientation ${attempt.angle}° score: base=${baseScore.toFixed(
        2
      )}, pattern=${patternScore.toFixed(2)}, total=${totalScore.toFixed(2)}`
    );

    return totalScore;
  }

  /**
   * Calculates pattern validation score based on text quality
   * Boosts score for English/alphanumeric patterns, penalizes noise
   */
  private calculatePatternScore(text: string, blocks: TextBlock[]): number {
    if (!text.trim() || blocks.length === 0) {
      return 0;
    }

    const words = text.split(/\s+/).filter((word) => word.length > 0);
    if (words.length === 0) {
      return 0;
    }

    let validWordCount = 0;
    let noiseCount = 0;

    // Analyze each word for pattern quality
    for (const word of words) {
      const cleanWord = word.replace(/[^\w]/g, ""); // Remove punctuation

      if (cleanWord.length === 0) {
        continue;
      }

      // Check if word matches English/alphanumeric patterns
      const isEnglishWord = /^[a-zA-Z]+$/.test(cleanWord);
      const isAlphanumeric = /^[a-zA-Z0-9]+$/.test(cleanWord);
      const isNumeric = /^[0-9]+$/.test(cleanWord);
      const isPercentage = /^\d+%$/.test(word);
      const isVolume = /^\d+(\.\d+)?\s*(ml|mL|oz|fl\.?\s*oz|L|l)$/i.test(word);

      // Check for common OCR noise patterns
      const isNoise =
        /^[^a-zA-Z0-9]*$/.test(cleanWord) ||
        /^[bcdefghjklmnopqrstuvwxyz]{1,2}$/i.test(cleanWord) || // Single/double consonants
        /^[aeiou]{1,2}$/i.test(cleanWord); // Single/double vowels

      if (
        isEnglishWord ||
        isAlphanumeric ||
        isNumeric ||
        isPercentage ||
        isVolume
      ) {
        validWordCount++;
      } else if (isNoise) {
        noiseCount++;
      }
    }

    // Calculate confidence-weighted pattern score
    const validRatio = validWordCount / words.length;
    const noiseRatio = noiseCount / words.length;

    // Base pattern score: reward valid words, penalize noise
    let patternScore = validRatio * 10 - noiseRatio * 5;

    // Additional bonus for high-confidence valid words
    const avgConfidence =
      blocks.reduce((sum, block) => sum + (block.confidence || 0), 0) /
      blocks.length;
    if (validRatio > 0.7 && avgConfidence > 60) {
      patternScore += 5; // Bonus for high-quality text
    }

    // Penalty for very low confidence
    if (avgConfidence < 30) {
      patternScore -= 10;
    }

    return Math.max(-10, Math.min(20, patternScore)); // Clamp between -10 and 20
  }
}

// Singleton instance for reuse across requests
let serverOCRInstance: ServerOCRProcessor | null = null;
// Promise to prevent race conditions during initialization
let inFlightInit: Promise<ServerOCRProcessor> | null = null;

/**
 * Get or create the server-side OCR processor instance
 * Uses synchronization to prevent race conditions when called concurrently
 */
export async function getServerOCRProcessor(): Promise<ServerOCRProcessor> {
  // If instance already exists, return it immediately
  if (serverOCRInstance) {
    return serverOCRInstance;
  }

  // If initialization is already in progress, wait for it
  if (inFlightInit) {
    return inFlightInit;
  }

  // Start initialization and store the promise
  inFlightInit = (async () => {
    try {
      const instance = new ServerOCRProcessor();
      await instance.initializeWorker();

      // Only assign to singleton after successful initialization
      serverOCRInstance = instance;
      return instance;
    } catch (error) {
      // Clear inFlightInit on failure so retries work
      inFlightInit = null;
      throw error;
    } finally {
      // Clear inFlightInit after completion (success or failure)
      inFlightInit = null;
    }
  })();

  return inFlightInit;
}

/**
 * Reset singleton state (for testing purposes only)
 * @internal
 */
export function resetServerOCRProcessor(): void {
  serverOCRInstance = null;
  inFlightInit = null;
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
