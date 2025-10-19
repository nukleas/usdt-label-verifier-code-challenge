/**
 * Text Matching Tests
 *
 * Tests field matching and comparison logic
 */

import {
  matchBrandName,
  matchProductType,
  matchAlcoholContent,
  matchNetContents,
  matchGovernmentWarning,
  normalizeText,
  calculateSimilarity,
} from "../../lib/textMatching";

describe("Text Matching Utilities", () => {
  describe("normalizeText", () => {
    it("should lowercase and trim text", () => {
      expect(normalizeText("  ORPHEUS BREWING  ")).toBe("orpheus brewing");
    });

    it("should normalize whitespace", () => {
      expect(normalizeText("ORPHEUS    BREWING")).toBe("orpheus brewing");
    });

    it("should remove special characters except alphanumerics, spaces, dots, percent", () => {
      expect(normalizeText("Orpheus-Brewing's")).toBe("orpheusbrewings");
    });

    it("should remove dots", () => {
      expect(normalizeText("Orpheus Brewing Co.")).toBe("orpheus brewing co");
    });
  });

  describe("calculateSimilarity", () => {
    it("should return 100% for identical strings", () => {
      const result = calculateSimilarity("orpheus", "orpheus");
      expect(result.score).toBe(100);
      expect(result.distance).toBe(0);
      expect(result.isMatch).toBe(true);
    });

    it("should calculate Levenshtein distance", () => {
      const result = calculateSimilarity("orpheus", "orphaus");
      expect(result.distance).toBe(1); // One character different
      expect(result.score).toBeGreaterThan(80);
    });

    it("should handle completely different strings", () => {
      const result = calculateSimilarity("orpheus", "xyz");
      expect(result.score).toBeLessThan(50);
      expect(result.isMatch).toBe(false);
    });
  });

  describe("matchBrandName", () => {
    it("should match exact brand name", () => {
      const result = matchBrandName(
        "ORPHEUS BREWING",
        "ORPHEUS BREWING DON'T LOOK BACK"
      );

      expect(result.status).toBe("match");
      expect(result.confidence).toBe(100);
    });

    it("should match with fuzzy matching", () => {
      const result = matchBrandName("ORPHEUS BREWING", "ORPHAUS BREWING"); // Typo

      // Should still match with high similarity
      expect(result.status).toBe("match");
      expect(result.confidence).toBeGreaterThan(80);
    });

    it("should match word-by-word", () => {
      const result = matchBrandName("ORPHEUS BREWING CO", "ORPHEUS BREWING");

      expect(result.status).toBe("match");
      expect(result.confidence).toBeGreaterThan(70);
    });

    it("should not match completely different brand", () => {
      const result = matchBrandName("ORPHEUS BREWING", "BUDWEISER");

      expect(result.status).toBe("not_found");
      expect(result.confidence).toBe(0);
    });
  });

  describe("matchProductType", () => {
    it("should match exact product type", () => {
      const result = matchProductType("IPA", "INDIA PALE ALE IPA");

      expect(result.status).toBe("match");
      expect(result.confidence).toBe(100);
    });

    it("should match product type variations", () => {
      const result = matchProductType(
        "bourbon",
        "kentucky straight bourbon whiskey"
      );

      expect(result.status).toBe("match");
    });

    it("should match abbreviated product type in longer text", () => {
      const result = matchProductType("IPA", "INDIA PALE ALE (IPA)");

      expect(result.status).toBe("match");
    });

    it("should not match different product types", () => {
      const result = matchProductType("IPA", "STOUT");

      expect(result.status).toBe("not_found");
    });
  });

  describe("matchAlcoholContent", () => {
    it("should match exact alcohol content", () => {
      const result = matchAlcoholContent("4%", "4% ALC/VOL");

      expect(result.status).toBe("match");
      expect(result.confidence).toBe(100);
    });

    it("should match ABV notation", () => {
      const result = matchAlcoholContent("4", "4 ABV");

      expect(result.status).toBe("match");
    });

    it("should match proof notation", () => {
      const result = matchAlcoholContent("45", "90 PROOF"); // 90 proof = 45% ABV

      expect(result.status).toBe("match");
    });

    it("should handle tolerance for rounding", () => {
      const result = matchAlcoholContent("4.0", "4.2% ALC/VOL"); // Within exact tolerance (0.5)

      expect(result.status).toBe("match"); // Should match within tolerance
      expect(result.found).toBe("4.2%");
    });

    it("should detect alcohol content outside exact tolerance", () => {
      const result = matchAlcoholContent("4.0", "5.5% ALC/VOL"); // 1.5% difference, within loose tolerance (2.0) but outside exact (0.5)

      expect(result.status).toBe("mismatch");
      expect(result.found).toBe("5.5%");
    });

    it("should not match significantly different percentages", () => {
      const result = matchAlcoholContent("4", "12% ALC/VOL");

      expect(result.status).toBe("mismatch");
      expect(result.found).toBe("12%");
    });

    it("should not match when alcohol content not found", () => {
      const result = matchAlcoholContent("4", "ORPHEUS BREWING");

      expect(result.status).toBe("not_found");
    });
  });

  describe("matchNetContents", () => {
    it("should match exact volume in mL", () => {
      const result = matchNetContents("750 mL", "750 mL");

      expect(result.status).toBe("match");
    });

    it("should match volume in oz", () => {
      const result = matchNetContents("12 oz", "12 FL.OZ.");

      expect(result.status).toBe("match");
    });

    it("should handle unit conversion", () => {
      const result = matchNetContents("750 mL", "25.36 oz"); // ~750mL

      // Should match within tolerance
      expect(result.status).toBe("match");
    });

    it("should detect volume mismatch", () => {
      const result = matchNetContents("750 mL", "500 mL");

      expect(result.status).toBe("mismatch");
      expect(result.found).toBe("500 mL");
    });

    it("should handle invalid format", () => {
      const result = matchNetContents("invalid", "750 mL");

      expect(result.status).toBe("not_found");
      expect(result.message).toContain("Invalid volume format");
    });

    it("should not match when volume not found", () => {
      const result = matchNetContents("750 mL", "ORPHEUS BREWING");

      expect(result.status).toBe("not_found");
    });
  });

  describe("matchGovernmentWarning", () => {
    it("should match complete government warning", () => {
      const warningText =
        "GOVERNMENT WARNING: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems.";

      const result = matchGovernmentWarning(warningText);

      expect(result.status).toBe("match");
      expect(result.confidence).toBeGreaterThan(60);
    });

    it("should match partial warning text", () => {
      const partialText =
        "GOVERNMENT WARNING pregnant birth defects impairs health problems";

      const result = matchGovernmentWarning(partialText);

      expect(result.status).toBe("match");
    });

    it("should detect incomplete warning", () => {
      const incompleteText = "WARNING pregnant";

      const result = matchGovernmentWarning(incompleteText);

      expect(result.status).toBe("mismatch");
      expect(result.message).toContain("incomplete");
    });

    it("should not match when warning not found", () => {
      const result = matchGovernmentWarning("ORPHEUS BREWING IPA");

      expect(result.status).toBe("not_found");
    });

    it("should be case insensitive", () => {
      const warningText =
        "government warning: surgeon general pregnant birth defects impairs health problems";

      const result = matchGovernmentWarning(warningText);

      expect(result.status).toBe("match");
    });
  });
});
