// Example utility function tests
// This would test utility functions like form validation, data processing, etc.

describe("Validation Utilities", () => {
  describe("validateAlcoholContent", () => {
    const validateAlcoholContent = (content: string): boolean => {
      const percentage = parseFloat(content.replace("%", ""));
      return percentage >= 0 && percentage <= 100;
    };

    it("should accept valid alcohol content percentages", () => {
      expect(validateAlcoholContent("12.5%")).toBe(true);
      expect(validateAlcoholContent("0%")).toBe(true);
      expect(validateAlcoholContent("100%")).toBe(true);
      expect(validateAlcoholContent("40")).toBe(true);
    });

    it("should reject invalid alcohol content percentages", () => {
      expect(validateAlcoholContent("101%")).toBe(false);
      expect(validateAlcoholContent("-5%")).toBe(false);
      expect(validateAlcoholContent("abc%")).toBe(false);
      expect(validateAlcoholContent("")).toBe(false);
    });
  });

  describe("validateVolume", () => {
    const validateVolume = (volume: string): boolean => {
      const volumeRegex = /^\d+(\.\d+)?\s*(ml|mL|L|l)$/;
      return volumeRegex.test(volume);
    };

    it("should accept valid volume formats", () => {
      expect(validateVolume("750ml")).toBe(true);
      expect(validateVolume("750 mL")).toBe(true);
      expect(validateVolume("1.5L")).toBe(true);
      expect(validateVolume("500 l")).toBe(true);
    });

    it("should reject invalid volume formats", () => {
      expect(validateVolume("750")).toBe(false);
      expect(validateVolume("abc ml")).toBe(false);
      expect(validateVolume("")).toBe(false);
      expect(validateVolume("750oz")).toBe(false);
    });
  });

  describe("formatConfidenceScore", () => {
    const formatConfidenceScore = (score: number): string => {
      return `${Math.round(score * 100)}%`;
    };

    it("should format confidence scores correctly", () => {
      expect(formatConfidenceScore(0.95)).toBe("95%");
      expect(formatConfidenceScore(0.876)).toBe("88%");
      expect(formatConfidenceScore(1)).toBe("100%");
      expect(formatConfidenceScore(0)).toBe("0%");
    });
  });
});
