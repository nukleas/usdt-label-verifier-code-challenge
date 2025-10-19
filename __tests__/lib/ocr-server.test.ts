/**
 * Test for improved orientation selection logic and singleton pattern
 */

import {
  ServerOCRProcessor,
  getServerOCRProcessor,
  resetServerOCRProcessor,
} from "../../lib/ocr-server";

describe("ServerOCRProcessor Orientation Selection", () => {
  let processor: ServerOCRProcessor;

  beforeEach(() => {
    processor = new ServerOCRProcessor();
  });

  describe("calculateOrientationScore", () => {
    it("should calculate base score using wordCount and confidence", () => {
      const attempt = {
        angle: 0,
        text: "Test Brand Name 4% Alcohol",
        blocks: [
          { text: "Test", confidence: 80 },
          { text: "Brand", confidence: 85 },
          { text: "Name", confidence: 75 },
          { text: "4%", confidence: 90 },
          { text: "Alcohol", confidence: 70 },
        ],
        confidence: 80,
        wordCount: 5,
        rawResult: {},
      };

      // Access private method for testing
      const score = (processor as any).calculateOrientationScore(attempt);

      // Base score should be wordCount * (confidence/100) = 5 * 0.8 = 4.0
      // Plus pattern validation bonus (valid words should get bonus)
      expect(score).toBeGreaterThan(4.0);
      expect(score).toBeLessThan(25.0); // Adjusted based on actual scoring
    });

    it("should penalize noisy text patterns", () => {
      const attempt = {
        angle: 90,
        text: "a b c d e f g h i j k l m n o p q r s t u v w x y z",
        blocks: Array.from({ length: 26 }, (_, i) => ({
          text: String.fromCharCode(97 + i), // a, b, c, etc.
          confidence: 30,
        })),
        confidence: 30,
        wordCount: 26,
        rawResult: {},
      };

      const score = (processor as any).calculateOrientationScore(attempt);

      // Should have lower score compared to high-quality text
      expect(score).toBeLessThan(20.0);
    });

    it("should boost score for high-quality English text", () => {
      const attempt = {
        angle: 180,
        text: "Premium Craft Beer 12 fl oz 4.5% Alcohol by Volume",
        blocks: [
          { text: "Premium", confidence: 95 },
          { text: "Craft", confidence: 90 },
          { text: "Beer", confidence: 95 },
          { text: "12", confidence: 98 },
          { text: "fl", confidence: 85 },
          { text: "oz", confidence: 90 },
          { text: "4.5%", confidence: 95 },
          { text: "Alcohol", confidence: 90 },
          { text: "by", confidence: 85 },
          { text: "Volume", confidence: 90 },
        ],
        confidence: 91.3,
        wordCount: 10,
        rawResult: {},
      };

      const score = (processor as any).calculateOrientationScore(attempt);

      // Should have high score due to high confidence and valid patterns
      expect(score).toBeGreaterThan(8.0);
    });
  });

  describe("calculatePatternScore", () => {
    it("should reward English words and penalize noise", () => {
      const text = "Brand Name 4% Alcohol";
      const blocks = [
        { text: "Brand", confidence: 80 },
        { text: "Name", confidence: 85 },
        { text: "4%", confidence: 90 },
        { text: "Alcohol", confidence: 70 },
      ];

      const score = (processor as any).calculatePatternScore(text, blocks);

      // Should be positive due to valid English words and percentages
      expect(score).toBeGreaterThan(0);
    });

    it("should penalize single character noise", () => {
      const text = "a b c d e f g h";
      const blocks = Array.from({ length: 8 }, (_, i) => ({
        text: String.fromCharCode(97 + i),
        confidence: 20,
      }));

      const score = (processor as any).calculatePatternScore(text, blocks);

      // Should be low due to noise patterns (may be 0 due to clamping)
      expect(score).toBeLessThanOrEqual(0);
    });

    it("should handle empty or invalid input gracefully", () => {
      expect((processor as any).calculatePatternScore("", [])).toBe(0);
      expect((processor as any).calculatePatternScore("   ", [])).toBe(0);
    });
  });
});

describe("getServerOCRProcessor Singleton Pattern", () => {
  beforeEach(() => {
    // Reset singleton state before each test
    resetServerOCRProcessor();
  });

  it("should return the same instance when called multiple times", async () => {
    // Mock the initializeWorker method to avoid Tesseract initialization issues
    const mockInitializeWorker = jest.fn().mockResolvedValue(undefined);
    const originalInitializeWorker =
      ServerOCRProcessor.prototype.initializeWorker;
    ServerOCRProcessor.prototype.initializeWorker = mockInitializeWorker;

    try {
      const instance1 = await getServerOCRProcessor();
      const instance2 = await getServerOCRProcessor();

      expect(instance1).toBe(instance2);
      expect(instance1).toBeInstanceOf(ServerOCRProcessor);
      expect(mockInitializeWorker).toHaveBeenCalledTimes(1); // Only called once due to singleton
    } finally {
      // Restore original method
      ServerOCRProcessor.prototype.initializeWorker = originalInitializeWorker;
    }
  });

  it("should handle concurrent calls without creating multiple instances", async () => {
    // Mock the initializeWorker method
    const mockInitializeWorker = jest.fn().mockResolvedValue(undefined);
    const originalInitializeWorker =
      ServerOCRProcessor.prototype.initializeWorker;
    ServerOCRProcessor.prototype.initializeWorker = mockInitializeWorker;

    try {
      // Create multiple concurrent calls
      const promises = Array.from({ length: 10 }, () =>
        getServerOCRProcessor()
      );

      const instances = await Promise.all(promises);

      // All instances should be the same reference
      const firstInstance = instances[0];
      instances.forEach((instance) => {
        expect(instance).toBe(firstInstance);
      });

      // InitializeWorker should only be called once despite 10 concurrent calls
      expect(mockInitializeWorker).toHaveBeenCalledTimes(1);
    } finally {
      // Restore original method
      ServerOCRProcessor.prototype.initializeWorker = originalInitializeWorker;
    }
  });

  it("should handle initialization failure and allow retries", async () => {
    // Mock initializeWorker to fail on first call, succeed on second
    let callCount = 0;
    const mockInitializeWorker = jest
      .fn()
      .mockImplementation(async function () {
        callCount++;
        if (callCount === 1) {
          throw new Error("Initialization failed");
        }
        // Success on second call
      });

    const originalInitializeWorker =
      ServerOCRProcessor.prototype.initializeWorker;
    ServerOCRProcessor.prototype.initializeWorker = mockInitializeWorker;

    try {
      // First call should fail
      await expect(getServerOCRProcessor()).rejects.toThrow(
        "Initialization failed"
      );

      // Second call should succeed
      const instance = await getServerOCRProcessor();
      expect(instance).toBeInstanceOf(ServerOCRProcessor);
      expect(callCount).toBe(2);
      expect(mockInitializeWorker).toHaveBeenCalledTimes(2);
    } finally {
      // Restore original method
      ServerOCRProcessor.prototype.initializeWorker = originalInitializeWorker;
    }
  });
});
