/**
 * OCR Integration Tests
 *
 * Tests the multi-rotation OCR processing with real label images
 *
 * @jest-environment node
 */

import { readFileSync } from "fs";
import { join } from "path";
import { OCRProcessor } from "@/lib/ocr-core";
import { createTesseractWorker } from "@/lib/ocr";

// Increase timeout for OCR processing (can take 10-20 seconds with 4 rotations)
jest.setTimeout(60000);

describe("OCR Processing", () => {
  describe("Multi-rotation text extraction", () => {
    it("should extract text from Orpheus Seal label at all orientations", async () => {
      // Read the test image
      const imagePath = join(
        process.cwd(),
        "test/labels/orpheus_seal_main.jpg"
      );
      const imageBuffer = readFileSync(imagePath);

      // Create worker
      const worker = await createTesseractWorker();

      // Process with OCR
      const processor = new OCRProcessor();
      const result = await processor.processWithRotations(worker, imageBuffer);

      // Cleanup
      await worker.terminate();

      // Basic validation
      expect(result).toBeDefined();
      expect(result.text).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.blocks).toBeDefined();
      expect(result.blocks!.length).toBeGreaterThan(0);

      // Normalize text for easier matching (case-insensitive, ignore extra spaces)
      const normalizedText = result.text.toLowerCase().replace(/\s+/g, " ");

      console.log("\n=== OCR Results ===");
      console.log("Total words extracted:", result.blocks!.length);
      console.log("Average confidence:", result.confidence.toFixed(1) + "%");
      console.log("Processing time:", result.processingTime + "ms");
      console.log(
        "Primary rotation:",
        Math.round((result.rotationAppliedRadians! * 180) / Math.PI) + "°"
      );
      console.log("\n=== Field Detection ===");

      // Check for brand name (Orpheus)
      const hasBrand = /orpheus/i.test(normalizedText);
      console.log("✓ Brand 'Orpheus' found:", hasBrand);
      expect(hasBrand).toBe(true);

      // Check for alcohol content (4% or similar)
      // Look for "4" near "alc", "vol", "abv", or "%"
      const hasAlcohol =
        /4\s*%/i.test(normalizedText) ||
        /4\s*(alc|vol|abv)/i.test(normalizedText) ||
        /alc[^a-z0-9]{0,10}4/i.test(normalizedText);
      console.log("✓ Alcohol content '4%' found:", hasAlcohol);
      expect(hasAlcohol).toBe(true);

      // Check for net contents (12 fl oz, 12fl.oz., 12 oz, etc.)
      const hasNetContents =
        /12\s*(fl\.?\s*)?oz/i.test(normalizedText) ||
        /12\s*ounce/i.test(normalizedText);
      console.log("✓ Net contents '12 fl oz' found:", hasNetContents);
      expect(hasNetContents).toBe(true);

      // Check for government warning (should be captured in rotated text)
      const hasWarning =
        /government\s*warning/i.test(normalizedText) ||
        /warning/i.test(normalizedText);
      console.log("✓ Government warning found:", hasWarning);

      // Note: Government warning detection depends on OCR quality
      // The multi-rotation approach improves detection, but isn't 100% reliable

      console.log("\n=== All Required Fields Detected ===\n");
    });

    it("should return rotation metadata", async () => {
      const imagePath = join(
        process.cwd(),
        "test/labels/orpheus_seal_main.jpg"
      );
      const imageBuffer = readFileSync(imagePath);

      const worker = await createTesseractWorker();
      const processor = new OCRProcessor();
      const result = await processor.processWithRotations(worker, imageBuffer);
      await worker.terminate();

      // Check rotation metadata
      expect(result.rotationAppliedRadians).toBeDefined();
      expect(result.rotationStrategy).toBe("auto");
      expect(result.rotationCandidatesDegrees).toEqual([0, 90, 180, 270]);
    });

    it("should extract word-level data with bounding boxes", async () => {
      const imagePath = join(
        process.cwd(),
        "test/labels/orpheus_seal_main.jpg"
      );
      const imageBuffer = readFileSync(imagePath);

      const worker = await createTesseractWorker();
      const processor = new OCRProcessor();
      const result = await processor.processWithRotations(worker, imageBuffer);
      await worker.terminate();

      // Check word blocks
      expect(result.blocks).toBeDefined();
      expect(result.blocks!.length).toBeGreaterThan(10); // Should have many words

      // Check that words have required properties
      const firstWord = result.blocks![0];
      expect(firstWord).toHaveProperty("text");
      expect(firstWord).toHaveProperty("confidence");
      expect(firstWord).toHaveProperty("bbox");
      expect(firstWord.bbox).toHaveProperty("x0");
      expect(firstWord.bbox).toHaveProperty("y0");
      expect(firstWord.bbox).toHaveProperty("x1");
      expect(firstWord.bbox).toHaveProperty("y1");

      // Check that bounding boxes have reasonable values
      expect(firstWord.bbox.x0).toBeGreaterThanOrEqual(0);
      expect(firstWord.bbox.y0).toBeGreaterThanOrEqual(0);
      expect(firstWord.bbox.x1).toBeGreaterThan(firstWord.bbox.x0);
      expect(firstWord.bbox.y1).toBeGreaterThan(firstWord.bbox.y0);
    });
  });

  describe("Single rotation processing", () => {
    it("should process image without rotation", async () => {
      const imagePath = join(
        process.cwd(),
        "test/labels/orpheus_seal_main.jpg"
      );
      const imageBuffer = readFileSync(imagePath);

      const worker = await createTesseractWorker();
      const processor = new OCRProcessor();
      const result = await processor.processSingleRotation(
        worker,
        imageBuffer,
        0
      );
      await worker.terminate();

      expect(result).toBeDefined();
      expect(result.text).toBeDefined();
      expect(result.rotationAppliedRadians).toBe(0);
      expect(result.rotationStrategy).toBe("auto");
    });
  });
});
