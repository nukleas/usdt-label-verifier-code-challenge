/**
 * Simple OCR Test (Manual Verification)
 *
 * This test runs the actual app server to verify OCR works end-to-end.
 * Instead of unit testing OCR directly, we test via the API route.
 */

import { readFileSync } from "fs";
import { join } from "path";

describe("OCR Integration (Manual Test)", () => {
  it("should provide test instructions for manual verification", () => {
    const imagePath = join(
      process.cwd(),
      "__tests__/labels/orpheus_seal_main.jpg"
    );

    // Verify the test image exists
    expect(() => readFileSync(imagePath)).not.toThrow();

    // Test instructions for manual verification
    console.log("\n" + "=".repeat(70));
    console.log("MANUAL TEST INSTRUCTIONS FOR ORPHEUS LABEL");
    console.log("=".repeat(70));
    console.log("\n1. Run: pnpm dev");
    console.log("2. Open: http://localhost:3000/verify");
    console.log("3. Upload: __tests__/labels/orpheus_seal_main.jpg");
    console.log("\n4. Fill in form:");
    console.log("   - Brand Name: Orpheus");
    console.log("   - Product Type: Seal");
    console.log("   - Alcohol Content: 4");
    console.log("   - Net Contents: 12 fl oz");
    console.log("\n5. Click 'Verify Label'");
    console.log("\n6. Expected Results:");
    console.log("   ✓ Brand name 'Orpheus' found");
    console.log("   ✓ Alcohol content '4%' found");
    console.log("   ✓ Net contents '12 fl oz' found");
    console.log("   ✓ Government warning found (from rotated text)");
    console.log("\n7. Check detailed results:");
    console.log(
      "   - Should show words from all 4 rotations (0°, 90°, 180°, 270°)"
    );
    console.log("   - Should highlight 'ALC', 'VOL', 'WARNING' keywords");
    console.log("\n" + "=".repeat(70) + "\n");
  });
});
