/**
 * Test Server-Side OCR via API
 *
 * Tests the server-side OCR API endpoint with a real image
 */

import fs from "fs";
import path from "path";
import FormData from "form-data";

async function testServerOCRAPI() {
  try {
    console.log("🧪 Testing Server-Side OCR API...");

    // Load test image
    const imagePath = path.join(
      __dirname,
      "../__tests__/labels/orpheus_seal_main.jpg"
    );
    const imageBuffer = fs.readFileSync(imagePath);

    console.log(`📸 Loaded test image: ${imagePath}`);
    console.log(`📏 Image size: ${imageBuffer.length} bytes`);

    // Create form data
    const formData = new FormData();
    formData.append("brandName", "Orpheus Brewing");
    formData.append("productType", "Pineapple Sour Ale");
    formData.append("alcoholContent", "4");
    formData.append("netContents", "12 oz");
    formData.append("image", imageBuffer, {
      filename: "orpheus_seal_main.jpg",
      contentType: "image/jpeg",
    });

    // Test the API endpoint
    const startTime = Date.now();
    const response = await fetch("http://localhost:3000/api/verify", {
      method: "POST",
      body: formData,
    });

    const processingTime = Date.now() - startTime;

    if (!response.ok) {
      throw new Error(
        `API request failed: ${response.status} ${response.statusText}`
      );
    }

    const result = await response.json();

    console.log("\n✅ Server-Side OCR API Results:");
    console.log(`⏱️  Total processing time: ${processingTime}ms`);
    console.log(`🎯 API success: ${result.success}`);

    if (result.success && result.result) {
      const verification = result.result;
      console.log(
        `🎯 OCR confidence: ${verification.ocrConfidence?.toFixed(1)}%`
      );
      console.log(
        `📝 OCR text length: ${verification.ocrBlocks?.length || 0} words`
      );
      console.log(
        `🔄 Rotations tried: ${
          verification.ocrRotation?.candidatesDegrees?.length || 0
        }`
      );

      // Show verification results
      console.log("\n📊 Verification Results:");
      if (verification.fieldVerifications) {
        Object.entries(verification.fieldVerifications).forEach(
          ([field, verification]) => {
            console.log(
              `  ${field}: ${verification.confidence}% (${verification.status})`
            );
          }
        );
      }

      console.log(`\n🏆 Overall result: ${verification.overallResult}`);
      console.log(`⏱️  Processing time: ${verification.processingTime}ms`);
    } else {
      console.log("❌ API returned error:", result.error);
    }

    console.log("\n🎉 Server-Side OCR API test completed!");
  } catch (error) {
    console.error("❌ Server-Side OCR API test failed:", error);
    process.exit(1);
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testServerOCRAPI();
}

export { testServerOCRAPI };
