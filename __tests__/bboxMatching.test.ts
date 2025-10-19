/**
 * BBox Matching Utilities Tests
 *
 * Tests coordinate transformation and bbox matching logic
 */

import {
  findMatchingBBoxes,
  findPatternBBoxes,
  mergeBBoxes,
  deduplicateBBoxes,
} from "../lib/bboxMatching";
import type { BoundingBox } from "../types/verification";

describe("BBox Matching Utilities", () => {
  describe("mergeBBoxes", () => {
    it("should merge adjacent bounding boxes on same line", () => {
      const boxes: BoundingBox[] = [
        { x0: 10, y0: 10, x1: 50, y1: 30 },
        { x0: 55, y0: 10, x1: 100, y1: 30 }, // Adjacent horizontally
      ];

      const merged = mergeBBoxes(boxes, 10);

      expect(merged.length).toBe(1);
      expect(merged[0]).toEqual({
        x0: 10,
        y0: 10,
        x1: 100,
        y1: 30,
      });
    });

    it("should not merge boxes on different lines", () => {
      const boxes: BoundingBox[] = [
        { x0: 10, y0: 10, x1: 50, y1: 30 },
        { x0: 10, y0: 50, x1: 50, y1: 70 }, // Different line
      ];

      const merged = mergeBBoxes(boxes, 10);

      expect(merged.length).toBe(2);
    });

    it("should handle empty array", () => {
      const merged = mergeBBoxes([], 10);
      expect(merged).toEqual([]);
    });

    it("should handle single box", () => {
      const boxes: BoundingBox[] = [{ x0: 10, y0: 10, x1: 50, y1: 30 }];

      const merged = mergeBBoxes(boxes, 10);
      expect(merged).toEqual(boxes);
    });
  });

  describe("deduplicateBBoxes", () => {
    it("should remove exact duplicate boxes", () => {
      const boxes: BoundingBox[] = [
        { x0: 10, y0: 10, x1: 50, y1: 30 },
        { x0: 10, y0: 10, x1: 50, y1: 30 }, // Duplicate
        { x0: 60, y0: 10, x1: 100, y1: 30 },
      ];

      const deduped = deduplicateBBoxes(boxes);

      expect(deduped.length).toBe(2);
      expect(deduped).toContainEqual({ x0: 10, y0: 10, x1: 50, y1: 30 });
      expect(deduped).toContainEqual({ x0: 60, y0: 10, x1: 100, y1: 30 });
    });

    it("should handle empty array", () => {
      const deduped = deduplicateBBoxes([]);
      expect(deduped).toEqual([]);
    });

    it("should preserve unique boxes", () => {
      const boxes: BoundingBox[] = [
        { x0: 10, y0: 10, x1: 50, y1: 30 },
        { x0: 60, y0: 10, x1: 100, y1: 30 },
        { x0: 10, y0: 50, x1: 50, y1: 70 },
      ];

      const deduped = deduplicateBBoxes(boxes);
      expect(deduped).toEqual(boxes);
    });
  });

  describe("findMatchingBBoxes", () => {
    it("should find exact matches", () => {
      const tesseractResult = {
        text: "ORPHEUS BREWING",
        confidence: 95,
        blocks: {
          0: {
            bbox: { x0: 0, y0: 0, x1: 200, y1: 50 },
            text: "ORPHEUS BREWING",
            confidence: 95,
            paragraphs: {
              0: {
                bbox: { x0: 0, y0: 0, x1: 200, y1: 50 },
                text: "ORPHEUS BREWING",
                confidence: 95,
                lines: {
                  0: {
                    bbox: { x0: 0, y0: 0, x1: 200, y1: 50 },
                    text: "ORPHEUS BREWING",
                    confidence: 95,
                    words: {
                      0: {
                        bbox: { x0: 0, y0: 0, x1: 100, y1: 50 },
                        text: "ORPHEUS",
                        confidence: 95,
                      },
                      1: {
                        bbox: { x0: 110, y0: 0, x1: 200, y1: 50 },
                        text: "BREWING",
                        confidence: 95,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      };

      const bboxes = findMatchingBBoxes("ORPHEUS", tesseractResult);

      expect(bboxes.length).toBeGreaterThan(0);
      expect(bboxes[0]).toEqual({ x0: 0, y0: 0, x1: 100, y1: 50 });
    });

    it("should filter low confidence word matches but keep line matches", () => {
      const tesseractResult = {
        text: "ORPHEUS",
        confidence: 95,
        blocks: {
          0: {
            bbox: { x0: 0, y0: 0, x1: 100, y1: 50 },
            text: "ORPHEUS",
            confidence: 95,
            paragraphs: {
              0: {
                bbox: { x0: 0, y0: 0, x1: 100, y1: 50 },
                text: "ORPHEUS",
                confidence: 95,
                lines: {
                  0: {
                    bbox: { x0: 0, y0: 0, x1: 100, y1: 50 },
                    text: "ORPHEUS",
                    confidence: 95, // High line confidence
                    words: {
                      0: {
                        bbox: { x0: 0, y0: 0, x1: 100, y1: 50 },
                        text: "ORPHEUS",
                        confidence: 30, // Low word confidence
                      },
                    },
                  },
                },
              },
            },
          },
        },
      };

      const bboxes = findMatchingBBoxes("ORPHEUS", tesseractResult, {
        minConfidence: 70,
      });

      // Should still match at line level (score 100) even though word is low confidence
      expect(bboxes.length).toBe(1);
      expect(bboxes[0]).toEqual({ x0: 0, y0: 0, x1: 100, y1: 50 });
    });

    it("should respect maxResults option", () => {
      const tesseractResult = {
        text: "TEST TEST TEST",
        confidence: 95,
        blocks: {
          0: {
            bbox: { x0: 0, y0: 0, x1: 300, y1: 50 },
            text: "TEST TEST TEST",
            confidence: 95,
            paragraphs: {
              0: {
                bbox: { x0: 0, y0: 0, x1: 300, y1: 50 },
                text: "TEST TEST TEST",
                confidence: 95,
                lines: {
                  0: {
                    bbox: { x0: 0, y0: 0, x1: 300, y1: 50 },
                    text: "TEST TEST TEST",
                    confidence: 95,
                    words: {
                      0: {
                        bbox: { x0: 0, y0: 0, x1: 100, y1: 50 },
                        text: "TEST",
                        confidence: 95,
                      },
                      1: {
                        bbox: { x0: 110, y0: 0, x1: 210, y1: 50 },
                        text: "TEST",
                        confidence: 95,
                      },
                      2: {
                        bbox: { x0: 220, y0: 0, x1: 320, y1: 50 },
                        text: "TEST",
                        confidence: 95,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      };

      const bboxes = findMatchingBBoxes("TEST", tesseractResult, {
        maxResults: 2,
      });

      expect(bboxes.length).toBe(2); // Should limit to 2 results
    });
  });

  describe("findPatternBBoxes", () => {
    it("should find bboxes matching regex pattern", () => {
      const tesseractResult = {
        text: "4% ALC/VOL",
        confidence: 95,
        blocks: {
          0: {
            bbox: { x0: 0, y0: 0, x1: 100, y1: 30 },
            text: "4% ALC/VOL",
            confidence: 95,
            paragraphs: {
              0: {
                bbox: { x0: 0, y0: 0, x1: 100, y1: 30 },
                text: "4% ALC/VOL",
                confidence: 95,
                lines: {
                  0: {
                    bbox: { x0: 0, y0: 0, x1: 100, y1: 30 },
                    text: "4% ALC/VOL",
                    confidence: 95,
                    words: {
                      0: {
                        bbox: { x0: 0, y0: 0, x1: 30, y1: 30 },
                        text: "4%",
                        confidence: 95,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      };

      const pattern = /(\d+\.?\d*)\s*%/gi;
      const bboxes = findPatternBBoxes(pattern, tesseractResult);

      expect(bboxes.length).toBeGreaterThan(0);
      expect(bboxes[0]).toEqual({ x0: 0, y0: 0, x1: 30, y1: 30 });
    });
  });
});
