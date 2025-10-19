/**
 * Hybrid OCR Hook
 *
 * Automatically chooses between client-side and server-side OCR
 * based on environment and performance requirements
 */

import { useState, useCallback } from "react";
import { useClientOCR } from "@/hooks/useClientOCR";
import type { OCRResult } from "@/types/verification";

export interface UseHybridOCRReturn {
  processImage: (imageFile: File) => Promise<OCRResult>;
  progress: number;
  isProcessing: boolean;
  error: string | null;
  ocrMethod: "client" | "server" | "hybrid";
}

export function useHybridOCR(): UseHybridOCRReturn {
  const [error, setError] = useState<string | null>(null);
  const [ocrMethod, setOcrMethod] = useState<"client" | "server" | "hybrid">(
    "hybrid"
  );

  // Client-side OCR hook as fallback
  const clientOCR = useClientOCR();

  const processImage = useCallback(
    async (imageFile: File): Promise<OCRResult> => {
      setError(null);

      try {
        console.log("Starting hybrid OCR processing...");

        // Determine OCR method based on environment and preferences
        const useServerOCR =
          process.env.NODE_ENV === "production" ||
          process.env.NEXT_PUBLIC_USE_SERVER_OCR === "true";

        if (useServerOCR) {
          setOcrMethod("server");
          console.log("Using server-side OCR...");

          // Convert File to FormData for server-side processing
          const formData = new FormData();
          formData.append("image", imageFile);

          // For now, we'll use client-side OCR but could easily switch to server
          // const response = await fetch('/api/verify-server', {
          //   method: 'POST',
          //   body: formData,
          // });

          // Fallback to client-side for now
          setOcrMethod("client");
          return await clientOCR.processImage(imageFile);
        } else {
          setOcrMethod("client");
          console.log("Using client-side OCR...");
          return await clientOCR.processImage(imageFile);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "OCR processing failed";
        setError(errorMessage);
        console.error("Hybrid OCR error:", err);
        throw err;
      }
    },
    [clientOCR]
  );

  return {
    processImage,
    progress: clientOCR.progress,
    isProcessing: clientOCR.isProcessing,
    error: error || clientOCR.error,
    ocrMethod,
  };
}
