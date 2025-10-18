/**
 * Bounding Box Matching Utilities
 *
 * This module provides functions to traverse Tesseract.js OCR results
 * and find bounding boxes for matched text patterns.
 */

import type { BoundingBox } from "@/types/verification";

// ============================================================================
// Types for Tesseract.js Result Structure
// ============================================================================

/**
 * Tesseract.js uses objects with numeric keys instead of arrays
 */
type NumericKeyedObject<T> = {
  [key: number]: T;
};

interface TesseractSymbol {
  bbox: BoundingBox;
  text: string;
  confidence: number;
  is_superscript: number;
  is_subscript: number;
  is_dropcap: number;
}

interface TesseractWord {
  bbox: BoundingBox;
  text: string;
  confidence: number;
  choices?: NumericKeyedObject<{
    text: string;
    confidence: number;
  }>;
  font_name?: string;
  symbols?: NumericKeyedObject<TesseractSymbol>;
}

interface TesseractLine {
  bbox: BoundingBox;
  text: string;
  confidence: number;
  baseline?: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
  words?: NumericKeyedObject<TesseractWord>;
}

interface TesseractParagraph {
  bbox: BoundingBox;
  text: string;
  confidence: number;
  is_ltr?: number;
  lines?: NumericKeyedObject<TesseractLine>;
}

interface TesseractBlock {
  bbox: BoundingBox;
  text: string;
  confidence: number;
  blocktype?: number;
  paragraphs?: NumericKeyedObject<TesseractParagraph>;
}

export interface TesseractResult {
  text: string;
  confidence: number;
  blocks?: NumericKeyedObject<TesseractBlock>;
  [key: string]: unknown;
}

// ============================================================================
// Text Normalization
// ============================================================================

/**
 * Normalizes text for matching (lowercase, trim, remove special chars)
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s.%]/g, "")
    .replace(/\./g, "");
}

// ============================================================================
// Helper Functions to Extract Elements from Numeric-Keyed Objects
// ============================================================================

/**
 * Converts numeric-keyed object to array
 */
function objectToArray<T>(obj: NumericKeyedObject<T> | undefined): T[] {
  if (!obj) return [];
  return Object.keys(obj)
    .sort((a, b) => parseInt(a) - parseInt(b))
    .map((key) => obj[parseInt(key)]);
}

// ============================================================================
// Core Matching Functions
// ============================================================================

/**
 * Finds all words in the Tesseract result that match the search text
 * Returns their bounding boxes with scoring to prioritize best matches
 *
 * @param searchText - Text to search for (will be normalized)
 * @param tesseractResult - Full Tesseract.js result object
 * @param options - Matching options
 * @returns Array of bounding boxes for matched text
 */
export function findMatchingBBoxes(
  searchText: string,
  tesseractResult: TesseractResult,
  options: {
    minConfidence?: number;
    preferLarger?: boolean;
    preferTop?: boolean;
    maxResults?: number;
  } = {}
): BoundingBox[] {
  const {
    minConfidence = 70,
    preferLarger = false,
    preferTop = false,
    maxResults,
  } = options;

  const normalizedSearch = normalizeText(searchText);
  const searchWords = normalizedSearch.split(/\s+/).filter((w) => w.length > 0);
  const candidates: Array<{
    bbox: BoundingBox;
    score: number;
    confidence: number;
    size: number;
  }> = [];

  if (!tesseractResult.blocks) {
    return [];
  }

  const blocks = objectToArray(tesseractResult.blocks);

  for (const block of blocks) {
    if (!block.paragraphs) continue;
    const paragraphs = objectToArray(block.paragraphs);

    for (const paragraph of paragraphs) {
      if (!paragraph.lines) continue;
      const lines = objectToArray(paragraph.lines);

      for (const line of lines) {
        if (!line.words) continue;
        const words = objectToArray(line.words);

        // Strategy 1: Exact phrase matching at line level
        const lineText = normalizeText(line.text);
        if (lineText === normalizedSearch) {
          // Perfect match - highest score
          const size =
            (line.bbox.x1 - line.bbox.x0) * (line.bbox.y1 - line.bbox.y0);
          candidates.push({
            bbox: line.bbox,
            score: 100,
            confidence: line.confidence,
            size,
          });
          continue;
        }

        // Strategy 2: Partial line match (line contains the full phrase)
        if (lineText.includes(normalizedSearch) && searchWords.length > 1) {
          const size =
            (line.bbox.x1 - line.bbox.x0) * (line.bbox.y1 - line.bbox.y0);
          candidates.push({
            bbox: line.bbox,
            score: 90,
            confidence: line.confidence,
            size,
          });
          continue;
        }

        // Strategy 3: Word-by-word matching (only for complete word matches)
        for (const word of words) {
          const wordText = normalizeText(word.text);

          // Skip low confidence words
          if (word.confidence < minConfidence) continue;

          // Check for exact word match
          for (const searchWord of searchWords) {
            if (searchWord.length < 3) continue; // Skip very short words to reduce noise

            if (wordText === searchWord) {
              // Exact word match
              const size =
                (word.bbox.x1 - word.bbox.x0) * (word.bbox.y1 - word.bbox.y0);
              candidates.push({
                bbox: word.bbox,
                score: 80,
                confidence: word.confidence,
                size,
              });
              break;
            } else if (
              wordText.includes(searchWord) &&
              searchWord.length >= 5
            ) {
              // Partial match (only for longer words to avoid false positives)
              const size =
                (word.bbox.x1 - word.bbox.x0) * (word.bbox.y1 - word.bbox.y0);
              candidates.push({
                bbox: word.bbox,
                score: 60,
                confidence: word.confidence,
                size,
              });
              break;
            }
          }
        }
      }
    }
  }

  // Sort candidates by score, then by size if preferLarger, then by position if preferTop
  candidates.sort((a, b) => {
    // Primary: score
    if (a.score !== b.score) return b.score - a.score;

    // Secondary: confidence
    if (a.confidence !== b.confidence) return b.confidence - a.confidence;

    // Tertiary: size (if preferLarger)
    if (preferLarger && a.size !== b.size) return b.size - a.size;

    // Quaternary: position (if preferTop, prefer items higher on the page)
    if (preferTop && a.bbox.y0 !== b.bbox.y0) return a.bbox.y0 - b.bbox.y0;

    return 0;
  });

  // Take top results and return just the bboxes
  const results = maxResults ? candidates.slice(0, maxResults) : candidates;
  return results.map((c) => c.bbox);
}

/**
 * Finds bounding boxes for text patterns using regex
 * Useful for finding numeric patterns like "4%", "750 mL", etc.
 *
 * @param pattern - RegExp pattern to match
 * @param tesseractResult - Full Tesseract.js result object
 * @returns Array of bounding boxes for matched patterns
 */
export function findPatternBBoxes(
  pattern: RegExp,
  tesseractResult: TesseractResult
): BoundingBox[] {
  const bboxes: BoundingBox[] = [];

  if (!tesseractResult.blocks) {
    return bboxes;
  }

  const blocks = objectToArray(tesseractResult.blocks);

  for (const block of blocks) {
    if (!block.paragraphs) continue;
    const paragraphs = objectToArray(block.paragraphs);

    for (const paragraph of paragraphs) {
      if (!paragraph.lines) continue;
      const lines = objectToArray(paragraph.lines);

      for (const line of lines) {
        if (!line.words) continue;
        const words = objectToArray(line.words);

        for (const word of words) {
          // Test if this word matches the pattern
          if (pattern.test(word.text)) {
            bboxes.push(word.bbox);
          }
        }
      }
    }
  }

  return bboxes;
}

/**
 * Finds bounding boxes for alcohol content patterns
 * Looks for "X% ALC/VOL", "X% ABV", "X PROOF", or standalone percentages
 *
 * @param expectedValue - Expected alcohol percentage value
 * @param tesseractResult - Full Tesseract.js result object
 * @returns Array of bounding boxes for alcohol-related text
 */
export function findAlcoholContentBBoxes(
  expectedValue: number,
  tesseractResult: TesseractResult
): BoundingBox[] {
  const bboxes: BoundingBox[] = [];

  if (!tesseractResult.blocks) {
    return bboxes;
  }

  const blocks = objectToArray(tesseractResult.blocks);

  for (const block of blocks) {
    if (!block.paragraphs) continue;
    const paragraphs = objectToArray(block.paragraphs);

    for (const paragraph of paragraphs) {
      if (!paragraph.lines) continue;
      const lines = objectToArray(paragraph.lines);

      for (const line of lines) {
        if (!line.words) continue;
        const words = objectToArray(line.words);

        // Track if we found alcohol-related keywords in this line
        let hasAlcoholKeyword = false;
        let hasMatchingNumber = false;
        const lineBoxes: BoundingBox[] = [];

        for (const word of words) {
          const text = word.text;
          const normalizedText = normalizeText(text);

          // Check for alcohol keywords
          if (
            normalizedText.includes("alc") ||
            normalizedText.includes("vol") ||
            normalizedText.includes("abv") ||
            normalizedText.includes("alcohol") ||
            normalizedText.includes("proof")
          ) {
            hasAlcoholKeyword = true;
            lineBoxes.push(word.bbox);
          }

          // Check for percentage or number
          const percentMatch = text.match(/(\d+(?:\.\d+)?)\s*%/);
          const numberMatch = text.match(/^(\d+(?:\.\d+)?)$/);

          if (percentMatch) {
            const value = parseFloat(percentMatch[1]);
            if (Math.abs(value - expectedValue) <= 2) {
              hasMatchingNumber = true;
              lineBoxes.push(word.bbox);
            }
          } else if (numberMatch) {
            const value = parseFloat(numberMatch[1]);
            if (Math.abs(value - expectedValue) <= 2) {
              hasMatchingNumber = true;
              lineBoxes.push(word.bbox);
            }
          }
        }

        // If we found both keyword and matching number in the same line, include all boxes
        if (hasAlcoholKeyword && hasMatchingNumber) {
          bboxes.push(...lineBoxes);
        } else if (hasAlcoholKeyword) {
          // Even without exact number match, include keyword boxes
          bboxes.push(...lineBoxes);
        }
      }
    }
  }

  return bboxes;
}

/**
 * Merges overlapping or adjacent bounding boxes
 * Useful for combining separate word boxes into phrase boxes
 *
 * @param boxes - Array of bounding boxes to merge
 * @param threshold - Distance threshold for merging (pixels)
 * @returns Array of merged bounding boxes
 */
export function mergeBBoxes(
  boxes: BoundingBox[],
  threshold: number = 10
): BoundingBox[] {
  if (boxes.length === 0) return [];
  if (boxes.length === 1) return boxes;

  // Sort by y0 (top coordinate) first, then by x0 (left coordinate)
  const sorted = [...boxes].sort((a, b) => {
    const yDiff = a.y0 - b.y0;
    return yDiff !== 0 ? yDiff : a.x0 - b.x0;
  });

  const merged: BoundingBox[] = [];
  let current = { ...sorted[0] };

  for (let i = 1; i < sorted.length; i++) {
    const box = sorted[i];

    // Check if boxes are on the same line (similar y coordinates)
    const onSameLine = Math.abs(box.y0 - current.y0) <= threshold;

    // Check if boxes are adjacent horizontally
    const adjacent = box.x0 - current.x1 <= threshold;

    if (onSameLine && adjacent) {
      // Merge boxes
      current = {
        x0: Math.min(current.x0, box.x0),
        y0: Math.min(current.y0, box.y0),
        x1: Math.max(current.x1, box.x1),
        y1: Math.max(current.y1, box.y1),
      };
    } else {
      // Save current and start new
      merged.push(current);
      current = { ...box };
    }
  }

  merged.push(current);
  return merged;
}

/**
 * Deduplicates bounding boxes by removing exact duplicates
 */
export function deduplicateBBoxes(boxes: BoundingBox[]): BoundingBox[] {
  const seen = new Set<string>();
  return boxes.filter((box) => {
    const key = `${box.x0},${box.y0},${box.x1},${box.y1}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Transforms bounding box coordinates back to original (0°) orientation
 *
 * @param bbox - Bounding box in rotated coordinate system
 * @param angle - Rotation angle that was applied (in degrees)
 * @param imageWidth - Original image width
 * @param imageHeight - Original image height
 * @returns Transformed bounding box in original orientation
 */
function transformBBoxToOriginalOrientation(
  bbox: BoundingBox,
  angle: number,
  imageWidth: number,
  imageHeight: number
): BoundingBox {
  // For 0° rotation, no transformation needed
  if (angle === 0) {
    return bbox;
  }

  const { x0, y0, x1, y1 } = bbox;

  // Transform based on rotation angle
  // NOTE: Jimp rotates COUNTER-CLOCKWISE for positive angles
  switch (angle) {
    case 90:
      // 90° CCW: rotated image is H×W, point (rx, ry) → original (W - ry, rx)
      return {
        x0: imageWidth - y1,
        y0: x0,
        x1: imageWidth - y0,
        y1: x1,
      };

    case 180:
      // 180°: dimensions stay W×H, point (rx, ry) → original (W - rx, H - ry)
      return {
        x0: imageWidth - x1,
        y0: imageHeight - y1,
        x1: imageWidth - x0,
        y1: imageHeight - y0,
      };

    case 270:
      // 270° CCW (= 90° CW): rotated image is H×W, point (rx, ry) → original (ry, H - rx)
      return {
        x0: y0,
        y0: imageHeight - x1,
        x1: y1,
        y1: imageHeight - x0,
      };

    default:
      // Unknown angle, return as-is
      return bbox;
  }
}

/**
 * Searches through all rotation results to find bboxes
 * This is crucial for detecting vertical text (like government warnings)
 *
 * @param searchText - Text to search for
 * @param allRotationResults - Array of rotation results from OCR
 * @param imageWidth - Original image width (for coordinate transformation)
 * @param imageHeight - Original image height (for coordinate transformation)
 * @param options - Matching options
 * @returns Array of bounding boxes transformed to original orientation
 */
export function findBBoxesAcrossRotations(
  searchText: string,
  allRotationResults: Array<{ angle: number; result: unknown }> | undefined,
  imageWidth: number,
  imageHeight: number,
  options: {
    minConfidence?: number;
    preferLarger?: boolean;
    preferTop?: boolean;
    maxResults?: number;
  } = {}
): BoundingBox[] {
  if (!allRotationResults || allRotationResults.length === 0) {
    return [];
  }

  const allBboxes: BoundingBox[] = [];

  // Search through each rotation
  for (const rotation of allRotationResults) {
    const result = rotation.result as TesseractResult;
    if (!result || !result.blocks) continue;

    const bboxes = findMatchingBBoxes(searchText, result, options);

    // Transform bboxes back to original (0°) orientation
    const transformedBboxes = bboxes.map((bbox) => {
      // IMPORTANT: Pass the ORIGINAL image dimensions for correct coordinate transformation
      // The transformation function handles dimension swapping internally based on rotation angle
      return transformBBoxToOriginalOrientation(
        bbox,
        rotation.angle,
        imageWidth,
        imageHeight
      );
    });

    allBboxes.push(...transformedBboxes);
  }

  return deduplicateBBoxes(allBboxes);
}
