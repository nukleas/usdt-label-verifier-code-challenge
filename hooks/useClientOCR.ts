/**
 * Client-Side OCR Hook
 *
 * Runs Tesseract.js OCR in the browser with multi-rotation support
 * to avoid serverless timeout issues
 */

import { useState, useCallback } from "react";
import { createWorker, type Page } from "tesseract.js";
import type { OCRResult, TextBlock } from "@/types/verification";

export interface UseClientOCRReturn {
  processImage: (imageFile: File) => Promise<OCRResult>;
  progress: number;
  isProcessing: boolean;
  error: string | null;
}

export function useClientOCR(): UseClientOCRReturn {
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processImage = useCallback(
    async (imageFile: File): Promise<OCRResult> => {
      setIsProcessing(true);
      setProgress(0);
      setError(null);

      try {
        console.log("Starting client-side multi-rotation OCR processing...");

        // Create Tesseract worker with local bundled files
        setProgress(0.1);
        const worker = await createWorker("eng", 1, {
          logger: (m) => {
            if (m.status === "recognizing text") {
              setProgress(0.2 + (m.progress || 0) * 0.175);
            }
          },
          // Use absolute URLs for worker and core files
          workerPath: `${window.location.origin}/tesseract-bundled/worker.min.js`,
          corePath: `${window.location.origin}/tesseract-bundled/tesseract-core-simd.wasm.js`,
        });

        // Configure for better label recognition
        await worker.setParameters({
          tessedit_pageseg_mode: "3",
          preserve_interword_spaces: "1",
        } as Record<string, string>);

        setProgress(0.2);

        // Use browser Canvas API for image rotation instead of Jimp
        const rotateImage = async (
          file: File,
          degrees: number
        ): Promise<Blob> => {
          return new Promise((resolve, reject) => {
            const img = new Image();
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            img.onload = () => {
              if (!ctx) {
                reject(new Error("Failed to get canvas context"));
                return;
              }

              // Calculate new canvas size for rotation
              const rad = (degrees * Math.PI) / 180;
              const sin = Math.abs(Math.sin(rad));
              const cos = Math.abs(Math.cos(rad));
              canvas.width = img.width * cos + img.height * sin;
              canvas.height = img.width * sin + img.height * cos;

              // Translate to center and rotate
              ctx.translate(canvas.width / 2, canvas.height / 2);
              ctx.rotate(rad);
              ctx.drawImage(img, -img.width / 2, -img.height / 2);

              canvas.toBlob((blob) => {
                if (blob) resolve(blob);
                else reject(new Error("Failed to create blob"));
              }, file.type || "image/png");
            };

            img.onerror = () => reject(new Error("Failed to load image"));
            img.src = URL.createObjectURL(file);
          });
        };

        // Try all 4 rotations (0, 90, 180, 270) to catch text in any orientation
        const rotations = [0, 90, 180, 270];
        const attempts: Array<{
          angle: number;
          text: string;
          blocks: TextBlock[];
          confidence: number;
          wordCount: number;
          rawResult: Page;
        }> = [];

        // Get original image dimensions
        let imageWidth = 0;
        let imageHeight = 0;
        await new Promise<void>((resolve, reject) => {
          const img = new Image();
          const url = URL.createObjectURL(imageFile);

          const cleanup = () => {
            URL.revokeObjectURL(url);
            img.onload = null;
            img.onerror = null;
          };

          // Add timeout fallback to prevent hanging
          const timeoutId = setTimeout(() => {
            cleanup();
            reject(new Error("Image loading timeout"));
          }, 10000); // 10 second timeout

          img.onload = () => {
            clearTimeout(timeoutId);
            imageWidth = img.width;
            imageHeight = img.height;
            cleanup();
            resolve();
          };

          img.onerror = () => {
            clearTimeout(timeoutId);
            cleanup();
            reject(new Error("Failed to load image"));
          };

          img.src = url;
        });

        for (let i = 0; i < rotations.length; i++) {
          const angle = rotations[i];
          setProgress(0.2 + (i / rotations.length) * 0.7);

          // Rotate image using Canvas API
          const rotatedImage =
            angle === 0 ? imageFile : await rotateImage(imageFile, angle);

          // Run OCR
          const result = await worker.recognize(
            rotatedImage,
            {},
            { blocks: true }
          );

          // Extract words using clean functional approach
          const words: TextBlock[] = result.data.blocks
            ? result.data.blocks
                .flatMap((block) => block.paragraphs)
                .flatMap((paragraph) => paragraph.lines)
                .flatMap((line) => line.words)
                .filter((word) => word.text.trim().length > 0)
                .map((word) => ({
                  text: word.text.trim(),
                  confidence: word.confidence,
                  bbox: word.bbox,
                }))
            : [];

          attempts.push({
            angle,
            text: result.data.text || "",
            blocks: words,
            confidence: result.data.confidence || 0,
            wordCount: words.length,
            rawResult: result.data, // Store full Tesseract result
          });
        }

        await worker.terminate();
        setProgress(0.95);

        // Choose best rotation (highest word count and confidence)
        const best = attempts.reduce((prev, curr) => {
          if (curr.wordCount > prev.wordCount) return curr;
          if (
            curr.wordCount === prev.wordCount &&
            curr.confidence > prev.confidence
          )
            return curr;
          return prev;
        });

        // Merge all rotation texts for comprehensive matching
        const allTexts = attempts.map((a) => a.text).join("\n\n");

        // Convert best rotation angle to radians
        const rotationAppliedRadians = (best.angle * Math.PI) / 180;

        // Prepare all rotation results for multi-rotation bbox matching
        const allRotationResults = attempts.map((attempt) => ({
          angle: attempt.angle,
          result: attempt.rawResult,
        }));

        setProgress(1);

        const ocrResult: OCRResult = {
          text: allTexts,
          confidence: best.confidence,
          blocks: best.blocks,
          processingTime: 0, // Not tracking in client
          rawTesseractResult: best.rawResult, // Full Tesseract result for bbox matching
          allRotationResults, // All rotation results for comprehensive bbox search
          imageWidth,
          imageHeight,
          rotationAppliedRadians,
        };

        console.log(
          `Client-side OCR completed. Best rotation: ${best.angle}°, Confidence: ${best.confidence}%`
        );

        return ocrResult;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "OCR processing failed";
        setError(errorMessage);
        console.error("Client-side OCR error:", err);
        throw err;
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  return {
    processImage,
    progress,
    isProcessing,
    error,
  };
}
