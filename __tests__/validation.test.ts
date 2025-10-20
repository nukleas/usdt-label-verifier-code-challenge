// Example utility function tests
// This would test utility functions like form validation, data processing, etc.

import {
  formatConfidenceScore,
  validateAlcoholContentBoolean,
  validateVolumeBoolean,
} from "../lib/validation";

describe("Validation Utilities", () => {
  describe("validateAlcoholContent", () => {
    it("should accept valid alcohol content percentages", () => {
      expect(validateAlcoholContentBoolean("12.5%")).toBe(true);
      expect(validateAlcoholContentBoolean("0.5%")).toBe(true);
      expect(validateAlcoholContentBoolean("95%")).toBe(true);
      expect(validateAlcoholContentBoolean("40")).toBe(true);
    });

    it("should reject invalid alcohol content percentages", () => {
      expect(validateAlcoholContentBoolean("101%")).toBe(false);
      expect(validateAlcoholContentBoolean("0%")).toBe(false);
      expect(validateAlcoholContentBoolean("-5%")).toBe(false);
      expect(validateAlcoholContentBoolean("abc%")).toBe(false);
      expect(validateAlcoholContentBoolean("")).toBe(false);
    });
  });

  describe("validateVolume", () => {
    it("should accept valid volume formats", () => {
      expect(validateVolumeBoolean("750ml")).toBe(true);
      expect(validateVolumeBoolean("750 mL")).toBe(true);
      expect(validateVolumeBoolean("1.5L")).toBe(true);
      expect(validateVolumeBoolean("500 l")).toBe(true);
    });

    it("should reject invalid volume formats", () => {
      expect(validateVolumeBoolean("750")).toBe(false);
      expect(validateVolumeBoolean("abc ml")).toBe(false);
      expect(validateVolumeBoolean("")).toBe(false);
      expect(validateVolumeBoolean("750oz")).toBe(false);
    });
  });

  describe("formatConfidenceScore", () => {
    it("should format confidence scores correctly", () => {
      expect(formatConfidenceScore(0.95)).toBe("95%");
      expect(formatConfidenceScore(0.876)).toBe("88%");
      expect(formatConfidenceScore(1)).toBe("100%");
      expect(formatConfidenceScore(0)).toBe("0%");
    });

    it("should throw error for invalid inputs", () => {
      expect(() => formatConfidenceScore(NaN)).toThrow(
        "Confidence score cannot be NaN"
      );
      expect(() => formatConfidenceScore(Infinity)).toThrow(
        "Confidence score cannot be Infinity or -Infinity"
      );
      expect(() => formatConfidenceScore(-Infinity)).toThrow(
        "Confidence score cannot be Infinity or -Infinity"
      );
      expect(() => formatConfidenceScore(-0.1)).toThrow(
        "Confidence score must be between 0 and 1"
      );
      expect(() => formatConfidenceScore(1.1)).toThrow(
        "Confidence score must be between 0 and 1"
      );
      expect(() => formatConfidenceScore("0.5" as any)).toThrow(
        "Confidence score must be a number"
      );
    });
  });
});
