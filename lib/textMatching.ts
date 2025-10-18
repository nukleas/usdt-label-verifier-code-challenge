/**
 * Text Matching Algorithms
 *
 * This module implements the core text matching and comparison logic
 * for verifying label information against form data.
 */

import type {
  LabelFormData,
  FieldVerification,
  VerificationResult,
  SimilarityResult,
} from "@/types/verification";
import {
  DEFAULT_MATCHING_CONFIG,
  PRODUCT_TYPE_VARIATIONS,
  ABV_PERCENTAGE_PATTERN,
  ABV_ALCOHOL_PATTERN,
  ABV_NOTATION_PATTERN,
  PROOF_PATTERN,
  VOLUME_ML_PATTERN,
  VOLUME_OZ_PATTERN,
  VOLUME_L_PATTERN,
  VOLUME_TO_ML,
  WARNING_REQUIRED_PHRASES,
} from "./constants";
import {
  findMatchingBBoxes,
  findAlcoholContentBBoxes,
  findPatternBBoxes,
  mergeBBoxes,
  deduplicateBBoxes,
  findBBoxesAcrossRotations,
  type TesseractResult,
} from "./bboxMatching";
import type { BoundingBox } from "@/types/verification";

/**
 * Transforms bboxes from primary rotation coordinate system to original orientation
 */
function transformPrimaryBBoxes(
  bboxes: BoundingBox[],
  rotationDegrees: number,
  imageWidth: number,
  imageHeight: number
): BoundingBox[] {
  if (rotationDegrees === 0 || bboxes.length === 0) {
    return bboxes;
  }

  // Import the transformation function from bboxMatching
  // For now, inline the transformation logic
  return bboxes.map((bbox) => {
    const { x0, y0, x1, y1 } = bbox;

    switch (rotationDegrees) {
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
        return bbox;
    }
  });
}

// ============================================================================
// Main Comparison Function
// ============================================================================

/**
 * Compares form data against OCR results and generates verification result
 *
 * @param formData - User-submitted form data
 * @param ocrResult - OCR results with text and block data
 * @returns Complete verification result
 */
export function compareFields(
  formData: LabelFormData,
  ocrResult: {
    text: string;
    blocks?: Array<{
      text: string;
      confidence: number;
      bbox: { x0: number; y0: number; x1: number; y1: number };
    }>;
    rawTesseractResult?: unknown;
    allRotationResults?: Array<{ angle: number; result: unknown }>;
    imageWidth?: number;
    imageHeight?: number;
    rotationAppliedRadians?: number;
  }
): VerificationResult {
  const fields: FieldVerification[] = [];
  const ocrText = ocrResult.text;
  const blocks = ocrResult.blocks || [];
  const rawTesseract = ocrResult.rawTesseractResult as
    | TesseractResult
    | undefined;
  const allRotations = ocrResult.allRotationResults;
  const imageWidth = ocrResult.imageWidth ?? 0;
  const imageHeight = ocrResult.imageHeight ?? 0;

  // Convert primary rotation from radians to degrees
  const primaryRotationDegrees = ocrResult.rotationAppliedRadians
    ? Math.round((ocrResult.rotationAppliedRadians * 180) / Math.PI)
    : 0;

  // Verify each field (pass blocks and raw result for context-aware matching)
  fields.push(
    matchBrandName(
      formData.brandName,
      ocrText,
      rawTesseract,
      primaryRotationDegrees,
      imageWidth,
      imageHeight
    )
  );
  fields.push(
    matchProductType(
      formData.productType,
      ocrText,
      rawTesseract,
      primaryRotationDegrees,
      imageWidth,
      imageHeight
    )
  );
  fields.push(
    matchAlcoholContent(
      formData.alcoholContent,
      ocrText,
      blocks,
      rawTesseract,
      primaryRotationDegrees,
      imageWidth,
      imageHeight
    )
  );

  if (formData.netContents) {
    fields.push(
      matchNetContents(
        formData.netContents,
        ocrText,
        rawTesseract,
        primaryRotationDegrees,
        imageWidth,
        imageHeight
      )
    );
  }

  // Bonus: Check government warning (needs all rotations for vertical text!)
  fields.push(
    matchGovernmentWarning(
      ocrText,
      rawTesseract,
      allRotations,
      imageWidth,
      imageHeight
    )
  );

  // Determine overall status
  const overallStatus = determineOverallStatus(fields);

  return {
    overallStatus,
    fields,
    rawOCRText: ocrText,
    processingTime: 0, // Will be set by API route
  };
}

// ============================================================================
// Field Matching Functions
// ============================================================================

/**
 * Matches brand name against OCR text
 */
export function matchBrandName(
  expected: string,
  ocrText: string,
  rawTesseract?: TesseractResult,
  rotationDegrees: number = 0,
  imageWidth: number = 0,
  imageHeight: number = 0
): FieldVerification {
  const normalizedExpected = normalizeText(expected);
  const normalizedOCR = normalizeText(ocrText);

  // Find bboxes if raw Tesseract result is available
  // For brand name, prefer larger text at the top of the image
  let bboxes = rawTesseract
    ? findMatchingBBoxes(expected, rawTesseract, {
        minConfidence: 75,
        preferLarger: true,
        preferTop: true,
        maxResults: 2, // Limit to top 2 matches to avoid highlighting body text
      })
    : [];
  bboxes = deduplicateBBoxes(mergeBBoxes(bboxes, 10));

  // Transform bboxes from primary rotation to original orientation
  bboxes = transformPrimaryBBoxes(
    bboxes,
    rotationDegrees,
    imageWidth,
    imageHeight
  );

  // Step 1: Exact match
  if (normalizedOCR.includes(normalizedExpected)) {
    return {
      field: "brandName",
      status: "match",
      expected,
      found: extractMatch(ocrText, expected),
      confidence: 100,
      message: "Brand name verified",
      bboxes: bboxes.length > 0 ? bboxes : undefined,
    };
  }

  // Step 2: Fuzzy match
  const similarity = calculateSimilarity(normalizedExpected, normalizedOCR);
  if (
    similarity.score >= DEFAULT_MATCHING_CONFIG.brandName.fuzzyMatchThreshold
  ) {
    return {
      field: "brandName",
      status: "match",
      expected,
      found: extractMatch(ocrText, expected),
      confidence: similarity.score,
      message: "Brand name verified",
      bboxes: bboxes.length > 0 ? bboxes : undefined,
    };
  }

  // Step 3: Word-by-word matching
  const words = normalizedExpected.split(/\s+/).filter((w) => w.length > 2);
  const matchedWords = words.filter((word) => normalizedOCR.includes(word));
  const wordMatchRate =
    words.length > 0 ? (matchedWords.length / words.length) * 100 : 0;

  if (wordMatchRate >= DEFAULT_MATCHING_CONFIG.brandName.wordMatchThreshold) {
    return {
      field: "brandName",
      status: "match",
      expected,
      found: matchedWords.join(" "),
      confidence: Math.round(wordMatchRate),
      message: "Brand name verified",
      bboxes: bboxes.length > 0 ? bboxes : undefined,
    };
  }

  return {
    field: "brandName",
    status: "not_found",
    expected,
    confidence: 0,
    message: "Brand name not detected",
  };
}

/**
 * Matches product type against OCR text
 */
export function matchProductType(
  expected: string,
  ocrText: string,
  rawTesseract?: TesseractResult,
  rotationDegrees: number = 0,
  imageWidth: number = 0,
  imageHeight: number = 0
): FieldVerification {
  const normalizedExpected = normalizeText(expected);
  const normalizedOCR = normalizeText(ocrText);

  // Find bboxes if raw Tesseract result is available
  // For product type, prefer larger text
  let bboxes = rawTesseract
    ? findMatchingBBoxes(expected, rawTesseract, {
        minConfidence: 70,
        preferLarger: true,
        maxResults: 2, // Limit to top 2 matches
      })
    : [];
  bboxes = deduplicateBBoxes(mergeBBoxes(bboxes, 10));

  // Transform bboxes from primary rotation to original orientation
  bboxes = transformPrimaryBBoxes(
    bboxes,
    rotationDegrees,
    imageWidth,
    imageHeight
  );

  // Step 1: Exact substring match
  if (normalizedOCR.includes(normalizedExpected)) {
    return {
      field: "productType",
      status: "match",
      expected,
      found: extractMatch(ocrText, expected),
      confidence: 100,
      message: "Product type verified",
      bboxes: bboxes.length > 0 ? bboxes : undefined,
    };
  }

  // Step 2: Reverse check (OCR might have abbreviated form)
  if (normalizedExpected.includes(normalizedOCR.slice(0, 50))) {
    return {
      field: "productType",
      status: "match",
      expected,
      found: extractMatch(ocrText, expected),
      confidence: 95,
      message: "Product type verified",
      bboxes: bboxes.length > 0 ? bboxes : undefined,
    };
  }

  // Step 3: Check variations
  const variations = getProductTypeVariations(normalizedExpected);
  for (const variation of variations) {
    if (normalizedOCR.includes(variation)) {
      // Try to find bboxes for the variation
      let variationBboxes = rawTesseract
        ? findMatchingBBoxes(variation, rawTesseract, {
            minConfidence: 70,
            preferLarger: true,
            maxResults: 2,
          })
        : [];
      variationBboxes = deduplicateBBoxes(mergeBBoxes(variationBboxes, 10));
      variationBboxes = transformPrimaryBBoxes(
        variationBboxes,
        rotationDegrees,
        imageWidth,
        imageHeight
      );

      return {
        field: "productType",
        status: "match",
        expected,
        found: variation,
        confidence: 90,
        message: "Product type verified",
        bboxes: variationBboxes.length > 0 ? variationBboxes : undefined,
      };
    }
  }

  // Step 4: Fuzzy match
  const similarity = calculateSimilarity(normalizedExpected, normalizedOCR);
  if (
    similarity.score >= DEFAULT_MATCHING_CONFIG.productType.fuzzyMatchThreshold
  ) {
    return {
      field: "productType",
      status: "match",
      expected,
      found: extractMatch(ocrText, expected),
      confidence: similarity.score,
      message: "Product type verified",
      bboxes: bboxes.length > 0 ? bboxes : undefined,
    };
  }

  return {
    field: "productType",
    status: "not_found",
    expected,
    confidence: 0,
    message: "Product type not detected",
  };
}

/**
 * Helper: Matches alcohol content using word-level data for improved accuracy
 * Looks for words containing "ALC/VOL" or "ABV" keywords and extracts nearby numbers
 */
function matchAlcoholContentFromBlocks(
  expectedNum: number,
  words: Array<{
    text: string;
    confidence: number;
    bbox: { x0: number; y0: number; x1: number; y1: number };
  }>,
  tolerance: number,
  looseTolerance: number
): FieldVerification | null {
  // Find words containing alcohol keywords (case-insensitive)
  const keywordIndices = words
    .map((word, idx) => {
      const text = word.text.toLowerCase();
      if (
        text.includes("alc") ||
        text.includes("vol") ||
        text.includes("abv") ||
        text.includes("alcohol")
      ) {
        return idx;
      }
      return -1;
    })
    .filter((idx) => idx !== -1);

  if (keywordIndices.length === 0) return null;

  // Extract numbers from keyword words and nearby words (within 5 words distance)
  const candidateNumbers: Array<{
    value: number;
    confidence: number;
    source: string;
  }> = [];

  for (const keywordIdx of keywordIndices) {
    const keywordWord = words[keywordIdx];

    // Check words near the keyword (up to 5 words before/after)
    const nearbyStart = Math.max(0, keywordIdx - 5);
    const nearbyEnd = Math.min(words.length - 1, keywordIdx + 5);

    for (let i = nearbyStart; i <= nearbyEnd; i++) {
      const word = words[i];
      const text = word.text;

      // Extract numbers from this word
      // Check for "X% ALC/VOL" pattern
      const matches = text.matchAll(ABV_ALCOHOL_PATTERN);
      for (const match of matches) {
        const num = parseFloat(match[1]);
        if (num >= 0.5 && num <= 95) {
          candidateNumbers.push({
            value: num,
            confidence: word.confidence,
            source: `${num}% ALC/VOL (confidence: ${word.confidence.toFixed(
              1
            )}%)`,
          });
        }
      }

      // Check for "X% ABV" pattern
      const abvMatches = text.matchAll(ABV_NOTATION_PATTERN);
      for (const match of abvMatches) {
        const num = parseFloat(match[1]);
        if (num >= 0.5 && num <= 95) {
          candidateNumbers.push({
            value: num,
            confidence: word.confidence,
            source: `${num}% ABV (confidence: ${word.confidence.toFixed(1)}%)`,
          });
        }
      }

      // Check for standalone percentages near keywords
      const percentMatches = text.matchAll(/(\d+(?:\.\d+)?)\s*%/g);
      for (const match of percentMatches) {
        const num = parseFloat(match[1]);
        if (num >= 0.5 && num <= 20) {
          // Stricter range for standalone percentages
          const distance = Math.abs(i - keywordIdx);
          candidateNumbers.push({
            value: num,
            confidence: word.confidence,
            source: `${num}% (${distance} words from keyword, confidence: ${word.confidence.toFixed(
              1
            )}%)`,
          });
        }
      }

      // Also check for just numbers near keywords
      const numberMatch = text.match(/^(\d+(?:\.\d+)?)$/);
      if (numberMatch) {
        const num = parseFloat(numberMatch[1]);
        if (num >= 0.5 && num <= 20) {
          const distance = Math.abs(i - keywordIdx);
          candidateNumbers.push({
            value: num,
            confidence: word.confidence,
            source: `${num} (${distance} words from "${
              keywordWord.text
            }", confidence: ${word.confidence.toFixed(1)}%)`,
          });
        }
      }
    }
  }

  // Sort by confidence (descending) to prioritize high-confidence matches
  candidateNumbers.sort((a, b) => b.confidence - a.confidence);

  // Check for exact match
  for (const candidate of candidateNumbers) {
    if (Math.abs(candidate.value - expectedNum) <= tolerance) {
      return {
        field: "alcoholContent",
        status: "match",
        expected: `${expectedNum}%`,
        found: `${candidate.value}%`,
        confidence: Math.round(candidate.confidence),
        message: "Alcohol content verified",
      };
    }
  }

  // Check for loose match
  for (const candidate of candidateNumbers) {
    if (Math.abs(candidate.value - expectedNum) <= looseTolerance) {
      return {
        field: "alcoholContent",
        status: "mismatch",
        expected: `${expectedNum}%`,
        found: `${candidate.value}%`,
        confidence: Math.round(candidate.confidence),
        message: "Alcohol content discrepancy detected",
      };
    }
  }

  // If we found candidates but none match, report the best one
  if (candidateNumbers.length > 0) {
    const best = candidateNumbers[0];
    return {
      field: "alcoholContent",
      status: "mismatch",
      expected: `${expectedNum}%`,
      found: `${best.value}%`,
      confidence: Math.round(best.confidence),
      message: "Alcohol content does not match",
    };
  }

  return null; // No block-based match found, fallback to text matching
}

/**
 * Matches alcohol content against OCR text with optional block-level matching
 */
export function matchAlcoholContent(
  expected: string,
  ocrText: string,
  blocks?: Array<{
    text: string;
    confidence: number;
    bbox: { x0: number; y0: number; x1: number; y1: number };
  }>,
  rawTesseract?: TesseractResult,
  rotationDegrees: number = 0,
  imageWidth: number = 0,
  imageHeight: number = 0
): FieldVerification {
  const expectedNum = parseFloat(expected.replace("%", ""));
  const tolerance = DEFAULT_MATCHING_CONFIG.alcoholContent.exactTolerance;
  const looseTolerance = DEFAULT_MATCHING_CONFIG.alcoholContent.looseTolerance;

  // Find bboxes using specialized alcohol content matcher
  let bboxes = rawTesseract
    ? findAlcoholContentBBoxes(expectedNum, rawTesseract)
    : [];
  bboxes = deduplicateBBoxes(mergeBBoxes(bboxes, 10));

  // Transform bboxes from primary rotation to original orientation
  bboxes = transformPrimaryBBoxes(
    bboxes,
    rotationDegrees,
    imageWidth,
    imageHeight
  );

  // If blocks are available, use block-aware matching for better accuracy
  if (blocks && blocks.length > 0) {
    const blockResult = matchAlcoholContentFromBlocks(
      expectedNum,
      blocks,
      tolerance,
      looseTolerance
    );
    if (blockResult) {
      // Add bboxes to block result
      return {
        ...blockResult,
        bboxes: bboxes.length > 0 ? bboxes : undefined,
      };
    }
  }

  // Fallback to text-based matching
  // Priority 1: Extract "Alc./Vol." patterns (most reliable - official format)
  const alcVolMatches: number[] = [];
  for (const match of ocrText.matchAll(ABV_ALCOHOL_PATTERN)) {
    const num = parseFloat(match[1]);
    if (num >= 0.5 && num <= 95) alcVolMatches.push(num);
  }

  // Check ALC/VOL matches first (highest priority)
  for (const found of alcVolMatches) {
    if (Math.abs(found - expectedNum) <= tolerance) {
      return {
        field: "alcoholContent",
        status: "match",
        expected: `${expectedNum}%`,
        found: `${found}%`,
        confidence: 100,
        message: "Alcohol content verified",
        bboxes: bboxes.length > 0 ? bboxes : undefined,
      };
    }
  }

  // Priority 2: Extract "ABV" patterns (also reliable)
  const abvMatches: number[] = [];
  for (const match of ocrText.matchAll(ABV_NOTATION_PATTERN)) {
    const num = parseFloat(match[1]);
    if (num >= 0.5 && num <= 95) abvMatches.push(num);
  }

  // Check ABV matches
  for (const found of abvMatches) {
    if (Math.abs(found - expectedNum) <= tolerance) {
      return {
        field: "alcoholContent",
        status: "match",
        expected: `${expectedNum}%`,
        found: `${found}%`,
        confidence: 100,
        message: "Alcohol content verified",
        bboxes: bboxes.length > 0 ? bboxes : undefined,
      };
    }
  }

  // Priority 3: Extract Proof (Proof = ABV * 2)
  const proofMatches: number[] = [];
  for (const match of ocrText.matchAll(PROOF_PATTERN)) {
    const proof = parseFloat(match[1]);
    const abv = proof / 2;
    if (abv >= 0.5 && abv <= 95) proofMatches.push(abv);
  }

  // Check Proof matches
  for (const found of proofMatches) {
    if (Math.abs(found - expectedNum) <= tolerance) {
      return {
        field: "alcoholContent",
        status: "match",
        expected: `${expectedNum}%`,
        found: `${found}%`,
        confidence: 100,
        message: "Alcohol content verified",
        bboxes: bboxes.length > 0 ? bboxes : undefined,
      };
    }
  }

  // Priority 4: Generic percentage patterns (least reliable - only if no contextual match)
  const percentageMatches: number[] = [];
  for (const match of ocrText.matchAll(ABV_PERCENTAGE_PATTERN)) {
    const num = parseFloat(match[1]);
    // More strict range for generic percentages to avoid false positives
    if (num >= 0.5 && num <= 20) percentageMatches.push(num);
  }

  // Combine all found numbers for loose matching (in priority order)
  const allMatches = [
    ...alcVolMatches,
    ...abvMatches,
    ...proofMatches,
    ...percentageMatches,
  ];

  // Find exact match in all patterns
  for (const found of allMatches) {
    if (Math.abs(found - expectedNum) <= tolerance) {
      return {
        field: "alcoholContent",
        status: "match",
        expected: `${expectedNum}%`,
        found: `${found}%`,
        confidence: 100,
        message: "Alcohol content verified",
        bboxes: bboxes.length > 0 ? bboxes : undefined,
      };
    }
  }

  // Check loose tolerance
  for (const found of allMatches) {
    if (Math.abs(found - expectedNum) <= looseTolerance) {
      return {
        field: "alcoholContent",
        status: "mismatch",
        expected: `${expectedNum}%`,
        found: `${found}%`,
        confidence: 50,
        message: "Alcohol content discrepancy detected",
        bboxes: bboxes.length > 0 ? bboxes : undefined,
      };
    }
  }

  // Report the first high-confidence match as mismatch
  if (alcVolMatches.length > 0) {
    return {
      field: "alcoholContent",
      status: "mismatch",
      expected: `${expectedNum}%`,
      found: `${alcVolMatches[0]}%`,
      confidence: 0,
      message: "Alcohol content does not match",
      bboxes: bboxes.length > 0 ? bboxes : undefined,
    };
  }

  if (abvMatches.length > 0) {
    return {
      field: "alcoholContent",
      status: "mismatch",
      expected: `${expectedNum}%`,
      found: `${abvMatches[0]}%`,
      confidence: 0,
      message: "Alcohol content does not match",
      bboxes: bboxes.length > 0 ? bboxes : undefined,
    };
  }

  if (allMatches.length > 0) {
    return {
      field: "alcoholContent",
      status: "mismatch",
      expected: `${expectedNum}%`,
      found: `${allMatches[0]}%`,
      confidence: 0,
      message: "Alcohol content does not match",
      bboxes: bboxes.length > 0 ? bboxes : undefined,
    };
  }

  return {
    field: "alcoholContent",
    status: "not_found",
    expected: `${expectedNum}%`,
    confidence: 0,
    message: "Alcohol content not detected",
  };
}

/**
 * Matches net contents against OCR text
 */
export function matchNetContents(
  expected: string,
  ocrText: string,
  rawTesseract?: TesseractResult,
  rotationDegrees: number = 0,
  imageWidth: number = 0,
  imageHeight: number = 0
): FieldVerification {
  const expectedParsed = parseVolume(expected);
  if (!expectedParsed) {
    return {
      field: "netContents",
      status: "not_found",
      expected,
      confidence: 0,
      message: "Invalid volume format",
    };
  }

  // Find bboxes for volume patterns
  let bboxes: BoundingBox[] = [];
  if (rawTesseract) {
    const mlBboxes = findPatternBBoxes(VOLUME_ML_PATTERN, rawTesseract);
    const ozBboxes = findPatternBBoxes(VOLUME_OZ_PATTERN, rawTesseract);
    const lBboxes = findPatternBBoxes(VOLUME_L_PATTERN, rawTesseract);
    bboxes = deduplicateBBoxes(
      mergeBBoxes([...mlBboxes, ...ozBboxes, ...lBboxes], 10)
    );

    // Transform bboxes from primary rotation to original orientation
    bboxes = transformPrimaryBBoxes(
      bboxes,
      rotationDegrees,
      imageWidth,
      imageHeight
    );
  }

  const foundVolumes: Array<{ value: number; unit: string }> = [];

  // Extract mL volumes
  for (const match of ocrText.matchAll(VOLUME_ML_PATTERN)) {
    foundVolumes.push({
      value: parseFloat(match[1]),
      unit: "mL",
    });
  }

  // Extract oz volumes
  for (const match of ocrText.matchAll(VOLUME_OZ_PATTERN)) {
    foundVolumes.push({
      value: parseFloat(match[1]),
      unit: "oz",
    });
  }

  // Extract L volumes
  for (const match of ocrText.matchAll(VOLUME_L_PATTERN)) {
    foundVolumes.push({
      value: parseFloat(match[1]),
      unit: "L",
    });
  }

  const expectedML = convertToML(expectedParsed.value, expectedParsed.unit);
  const tolerance = DEFAULT_MATCHING_CONFIG.netContents.volumeTolerance;

  for (const found of foundVolumes) {
    const foundML = convertToML(found.value, found.unit);
    const diff = Math.abs(expectedML - foundML);
    const maxDiff = expectedML * tolerance;

    if (diff <= maxDiff) {
      return {
        field: "netContents",
        status: "match",
        expected,
        found: `${found.value} ${found.unit}`,
        confidence: 100,
        message: "Net contents verified",
        bboxes: bboxes.length > 0 ? bboxes : undefined,
      };
    }
  }

  if (foundVolumes.length > 0) {
    const closest = foundVolumes[0];
    return {
      field: "netContents",
      status: "mismatch",
      expected,
      found: `${closest.value} ${closest.unit}`,
      confidence: 0,
      message: "Net contents does not match",
      bboxes: bboxes.length > 0 ? bboxes : undefined,
    };
  }

  return {
    field: "netContents",
    status: "not_found",
    expected,
    confidence: 0,
    message: "Net contents not detected",
  };
}

/**
 * Checks for government warning text
 */
export function matchGovernmentWarning(
  ocrText: string,
  rawTesseract?: TesseractResult,
  allRotations?: Array<{ angle: number; result: unknown }>,
  imageWidth: number = 0,
  imageHeight: number = 0
): FieldVerification {
  const normalizedOCR = normalizeText(ocrText);
  const foundPhrases = Array.from(WARNING_REQUIRED_PHRASES).filter((phrase) =>
    normalizedOCR.includes(normalizeText(phrase))
  );

  // Find bboxes for government warning keywords
  // For warning text, be more permissive - it's often small and vertical
  // IMPORTANT: Search across ALL rotations since warning text is often vertical!
  let bboxes: BoundingBox[] = [];
  const warningKeywords = [
    "GOVERNMENT WARNING",
    "WARNING",
    "SURGEON GENERAL",
    "PREGNANT",
    "BEVERAGE",
    "CONSUMPTION",
    "ALCOHOLIC",
  ];

  // Try all rotations first (for vertical text detection)
  if (
    allRotations &&
    allRotations.length > 0 &&
    imageWidth > 0 &&
    imageHeight > 0
  ) {
    for (const keyword of warningKeywords) {
      const keywordBboxes = findBBoxesAcrossRotations(
        keyword,
        allRotations,
        imageWidth,
        imageHeight,
        {
          minConfidence: 55, // Even lower threshold for small vertical text
          maxResults: 8, // Allow more matches since warning spans multiple lines
        }
      );
      bboxes.push(...keywordBboxes);
    }
  }
  // Fallback to primary rotation if no multi-rotation results
  else if (rawTesseract) {
    for (const keyword of warningKeywords) {
      const keywordBboxes = findMatchingBBoxes(keyword, rawTesseract, {
        minConfidence: 60,
        maxResults: 5,
      });
      bboxes.push(...keywordBboxes);
    }
  }

  bboxes = deduplicateBBoxes(mergeBBoxes(bboxes, 20)); // Larger merge threshold for multi-line warnings

  const matchRate =
    (foundPhrases.length / WARNING_REQUIRED_PHRASES.length) * 100;

  if (
    matchRate >=
    DEFAULT_MATCHING_CONFIG.governmentWarning.phraseMatchThreshold * 100
  ) {
    return {
      field: "governmentWarning",
      status: "match",
      expected: "GOVERNMENT WARNING",
      found: "GOVERNMENT WARNING",
      confidence: Math.round(matchRate),
      message: "Required health warning present",
      bboxes: bboxes.length > 0 ? bboxes : undefined,
    };
  } else if (foundPhrases.length > 0) {
    return {
      field: "governmentWarning",
      status: "mismatch",
      expected: "GOVERNMENT WARNING",
      found: `Partial warning text detected`,
      confidence: Math.round(matchRate),
      message: "Health warning text incomplete or illegible",
      bboxes: bboxes.length > 0 ? bboxes : undefined,
    };
  }

  return {
    field: "governmentWarning",
    status: "not_found",
    expected: "GOVERNMENT WARNING",
    confidence: 0,
    message: "Required health warning not found",
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Normalizes text for comparison
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s.%]/g, "")
    .replace(/\./g, "");
}

/**
 * Extracts matching text from OCR result
 */
function extractMatch(ocrText: string, expected: string): string {
  const normalized = normalizeText(expected);
  const words = normalized.split(/\s+/);

  for (const word of words) {
    const regex = new RegExp(word, "i");
    const match = ocrText.match(regex);
    if (match) return match[0];
  }

  return expected;
}

/**
 * Calculates Levenshtein distance and similarity
 */
export function calculateSimilarity(
  str1: string,
  str2: string
): SimilarityResult {
  const distance = levenshteinDistance(str1, str2);
  const maxLen = Math.max(str1.length, str2.length);
  const score =
    maxLen > 0 ? Math.round(((maxLen - distance) / maxLen) * 100) : 0;

  return {
    score,
    distance,
    isMatch: score >= 80,
  };
}

/**
 * Levenshtein distance algorithm
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str1.length; i++) matrix[i] = [i];
  for (let j = 0; j <= str2.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= str1.length; i++) {
    for (let j = 1; j <= str2.length; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str1.length][str2.length];
}

/**
 * Gets product type variations
 */
function getProductTypeVariations(productType: string): string[] {
  const normalized = normalizeText(productType);

  for (const [key, variations] of Object.entries(PRODUCT_TYPE_VARIATIONS)) {
    if (normalized.includes(key)) {
      return variations;
    }
  }

  return [normalized];
}

/**
 * Parses volume string
 */
function parseVolume(input: string): { value: number; unit: string } | null {
  const match = input.match(/(\d+\.?\d*)\s*([a-zA-Z\s]+)/);
  if (!match) return null;

  let unit = match[2].trim().toLowerCase();
  if (unit.includes("ml")) unit = "mL";
  else if (unit.includes("oz")) unit = "oz";
  else if (unit === "l") unit = "L";

  return {
    value: parseFloat(match[1]),
    unit,
  };
}

/**
 * Converts volume to mL
 */
function convertToML(value: number, unit: string): number {
  const factor = VOLUME_TO_ML[unit] || VOLUME_TO_ML["mL"];
  return value * factor;
}

/**
 * Determines overall status
 */
function determineOverallStatus(fields: FieldVerification[]): "pass" | "fail" {
  const required = ["brandName", "productType", "alcoholContent"];

  for (const field of fields) {
    if (required.includes(field.field) && field.status !== "match") {
      return "fail";
    }
  }

  return "pass";
}
