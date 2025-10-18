/**
 * Test Server-Side OCR
 *
 * Simple test to verify server-side OCR processing works
 */

import { processImageServerSide } from "@/lib/ocr-server";
import fs from "fs";
import path from "path";

async function testServerOCR() {
  try {
    console.log("🧪 Testing Server-Side OCR...");

    // Load test image
    const imagePath = path.join(
      __dirname,
      "../__tests__/labels/orpheus_seal_main.jpg"
    );
    const imageBuffer = fs.readFileSync(imagePath);

    console.log(`📸 Loaded test image: ${imagePath}`);
    console.log(`📏 Image size: ${imageBuffer.length} bytes`);

    // Process with server-side OCR
    const startTime = Date.now();
    const result = await processImageServerSide(imageBuffer);
    const processingTime = Date.now() - startTime;

    console.log("\n✅ Server-Side OCR Results:");
    console.log(`⏱️  Processing time: ${processingTime}ms`);
    console.log(`🎯 Confidence: ${result.confidence.toFixed(1)}%`);
    console.log(`📝 Text length: ${result.text.length} characters`);
    console.log(`🔤 Word blocks: ${result.blocks.length}`);
    console.log(
      `🔄 Rotations tried: ${result.rotationCandidatesDegrees?.length || 0}`
    );
    console.log(
      `📐 Image dimensions: ${result.imageWidth}x${result.imageHeight}`
    );

    // Show first 200 characters of extracted text
    console.log("\n📄 Extracted text (first 200 chars):");
    console.log("─".repeat(50));
    console.log(
      result.text.substring(0, 200) + (result.text.length > 200 ? "..." : "")
    );
    console.log("─".repeat(50));

    // Show word blocks summary
    if (result.blocks.length > 0) {
      console.log("\n🔤 Word blocks summary:");
      result.blocks.slice(0, 10).forEach((block, i) => {
        console.log(
          `  ${i + 1}. "${block.text}" (${block.confidence.toFixed(1)}%)`
        );
      });
      if (result.blocks.length > 10) {
        console.log(`  ... and ${result.blocks.length - 10} more words`);
      }
    }

    console.log("\n🎉 Server-Side OCR test completed successfully!");
  } catch (error) {
    console.error("❌ Server-Side OCR test failed:", error);
    process.exit(1);
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testServerOCR();
}

export { testServerOCR };
