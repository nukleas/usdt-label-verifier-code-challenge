/**
 * Constants for TTB Label Verification
 *
 * This file contains all constant values, regex patterns, TTB requirements,
 * and configuration values used throughout the application.
 */

import type { MatchingConfig, OCRConfig } from "@/types/verification";

// ============================================================================
// TTB Regulatory Requirements
// ============================================================================

/**
 * Official TTB government warning text as required by law
 * Source: 27 CFR § 16.21
 */
export const TTB_GOVERNMENT_WARNING =
  "GOVERNMENT WARNING: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems.";

/**
 * Required phrases in government warning
 * At least 60% of these must be present for a match
 */
export const WARNING_REQUIRED_PHRASES = [
  "government warning",
  "surgeon general",
  "pregnant",
  "birth defects",
  "impairs",
  "health problems",
] as const;

// ============================================================================
// Regex Patterns
// ============================================================================

/**
 * Pattern to match alcohol content (ABV)
 * Matches: "45%", "45.0%", "45 %", etc.
 */
export const ABV_PERCENTAGE_PATTERN = /(\d+\.?\d*)\s*%/g;

/**
 * Pattern to match "Alc." or "Alcohol" followed by volume
 * Matches: "45 Alc./Vol.", "45.0 Alcohol by Volume"
 */
export const ABV_ALCOHOL_PATTERN = /(\d+\.?\d*)\s*(?:Alc|Alcohol)/gi;

/**
 * Pattern to match ABV notation
 * Matches: "45 ABV", "45.0 ABV"
 */
export const ABV_NOTATION_PATTERN = /(\d+\.?\d*)\s*ABV/gi;

/**
 * Pattern to match proof (Proof = ABV * 2)
 * Matches: "90 Proof", "90 PROOF"
 */
export const PROOF_PATTERN = /(\d+\.?\d*)\s*proof/gi;

/**
 * Pattern to match volume in milliliters
 * Matches: "750 mL", "750ml", "750 ML", "750 milliliters"
 */
export const VOLUME_ML_PATTERN = /(\d+\.?\d*)\s*(?:ml|mL|ML|milliliters?)/gi;

/**
 * Pattern to match volume in ounces
 * Matches: "12 oz", "12 OZ", "12 fl oz", "12 FL.OZ.", "12 fl. oz", "12 ounces"
 */
export const VOLUME_OZ_PATTERN =
  /(\d+\.?\d*)\s*(?:fl\.?\s*oz\.?|FL\.?\s*OZ\.?|oz\.?|OZ\.?|ounces?)/gi;

/**
 * Pattern to match volume in liters
 * Matches: "1 L", "1.5 L", "1 liter"
 */
export const VOLUME_L_PATTERN = /(\d+\.?\d*)\s*(?:l|L|liters?)/gi;

/**
 * Pattern to extract brand name variations
 * Matches alphanumeric characters, spaces, hyphens, apostrophes
 */
export const BRAND_NAME_PATTERN = /[A-Za-z0-9\s\-']+/g;

// ============================================================================
// Matching Configuration
// ============================================================================

/**
 * Default configuration for text matching algorithms
 * These thresholds can be adjusted to tune sensitivity
 */
export const DEFAULT_MATCHING_CONFIG: MatchingConfig = {
  brandName: {
    /**
     * Threshold for exact match (100% = perfect match)
     */
    exactMatchThreshold: 100,

    /**
     * Threshold for fuzzy match using Levenshtein distance
     * 80% = up to 20% of characters can be different
     */
    fuzzyMatchThreshold: 80,

    /**
     * Threshold for word-by-word matching
     * 75% = at least 3 out of 4 words must match
     */
    wordMatchThreshold: 75,
  },

  productType: {
    /**
     * Threshold for exact match
     */
    exactMatchThreshold: 100,

    /**
     * Threshold for fuzzy match (more lenient for product types)
     * 70% = allows for "Bourbon" vs "Bourbon Whiskey"
     */
    fuzzyMatchThreshold: 70,
  },

  alcoholContent: {
    /**
     * Tolerance for exact match (±0.5%)
     * Allows for minor OCR rounding errors
     */
    exactTolerance: 0.5,

    /**
     * Tolerance for loose match (±2.0%)
     * Flags as mismatch but acknowledges detection
     */
    looseTolerance: 2.0,
  },

  netContents: {
    /**
     * Tolerance for volume comparison (2%)
     * Allows for manufacturing tolerances and unit conversion rounding
     */
    volumeTolerance: 0.02,
  },

  governmentWarning: {
    /**
     * Threshold for required phrase matching (60%)
     * At least 60% of required phrases must be present
     */
    phraseMatchThreshold: 0.6,
  },
};

// ============================================================================
// OCR Configuration
// ============================================================================

/**
 * Default Tesseract.js configuration
 */
export const DEFAULT_OCR_CONFIG: OCRConfig = {
  /**
   * Language for OCR (English)
   */
  language: "eng",

  /**
   * OCR Engine Mode
   * 3 = Default, based on what is available
   */
  oem: 3,

  /**
   * Page Segmentation Mode
   * 6 = Assume a single uniform block of text (faster than 3)
   * 3 = Fully automatic page segmentation (more accurate but slower)
   */
  psm: 6,

  /**
   * Preserve interword spaces
   * Helps maintain formatting in extracted text
   */
  preserveInterwordSpaces: true,
};

// ============================================================================
// Product Type Variations
// ============================================================================

/**
 * Common product type variations and synonyms
 * Used for more flexible product type matching
 */
export const PRODUCT_TYPE_VARIATIONS: Record<string, string[]> = {
  bourbon: [
    "bourbon",
    "bourbon whiskey",
    "kentucky bourbon",
    "straight bourbon",
    "kentucky straight bourbon",
  ],
  whiskey: ["whisky", "whiskey", "bourbon", "rye", "scotch"],
  vodka: ["vodka", "distilled vodka", "premium vodka"],
  gin: ["gin", "distilled gin", "dry gin", "london dry gin"],
  rum: ["rum", "distilled rum", "white rum", "dark rum"],
  tequila: ["tequila", "añejo", "reposado", "blanco"],
  brandy: ["brandy", "cognac", "armagnac"],
  ipa: ["ipa", "india pale ale", "pale ale"],
  lager: ["lager", "lager beer", "pilsner"],
  ale: ["ale", "pale ale", "amber ale"],
  stout: ["stout", "porter", "imperial stout"],
  wine: ["wine", "red wine", "white wine", "table wine"],
  "red wine": ["red wine", "cabernet", "merlot", "pinot noir"],
  "white wine": ["white wine", "chardonnay", "sauvignon blanc", "pinot grigio"],
  champagne: ["champagne", "sparkling wine"],
};

// ============================================================================
// Unit Conversion
// ============================================================================

/**
 * Conversion factors for volume units to milliliters
 */
export const VOLUME_TO_ML: Record<string, number> = {
  mL: 1,
  ml: 1,
  ML: 1,
  oz: 29.5735, // US fluid ounce
  OZ: 29.5735,
  "fl oz": 29.5735,
  "FL OZ": 29.5735,
  L: 1000,
  l: 1000,
};

/**
 * Common bottle sizes in mL
 */
export const STANDARD_BOTTLE_SIZES = [
  50, // Miniature (airplane bottle)
  100, // Miniature
  200, // Half pint
  375, // Half bottle (split)
  500, // Half liter
  750, // Standard bottle (fifth)
  1000, // Liter
  1500, // Magnum
  1750, // Half gallon
] as const;

// ============================================================================
// Validation Constants
// ============================================================================

/**
 * Valid alcohol by volume (ABV) range
 */
export const ABV_RANGE = {
  min: 0.5, // Minimum ABV (e.g., low-alcohol beer)
  max: 95, // Maximum ABV (e.g., high-proof spirits)
} as const;

/**
 * Valid image MIME types
 */
export const VALID_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
] as const;

/**
 * Maximum image file size (5 MB)
 */
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB in bytes

/**
 * Minimum image dimensions (pixels)
 */
export const MIN_IMAGE_DIMENSIONS = {
  width: 100,
  height: 100,
} as const;

/**
 * Maximum image dimensions (pixels)
 */
export const MAX_IMAGE_DIMENSIONS = {
  width: 10000,
  height: 10000,
} as const;

// ============================================================================
// Error Messages
// ============================================================================

/**
 * Standard error messages for validation
 */
export const ERROR_MESSAGES = {
  // Form validation
  REQUIRED_FIELD: "Required field",
  INVALID_BRAND_NAME: "Brand name must be 1-200 characters",
  INVALID_PRODUCT_TYPE: "Product type must be 1-200 characters",
  INVALID_ABV: "Alcohol content must be 0.5%-95%",
  INVALID_VOLUME: "Invalid volume specification",

  // Image validation
  NO_IMAGE: "Label image required",
  INVALID_IMAGE_TYPE: "Image must be JPEG, PNG, or WebP",
  IMAGE_TOO_LARGE: "Image file exceeds 5 MB limit",
  IMAGE_TOO_SMALL: "Image too small (minimum 100x100 pixels)",
  IMAGE_TOO_BIG: "Image too large (maximum 10000x10000 pixels)",

  // OCR errors
  OCR_FAILED: "Image processing failed",
  NO_TEXT_FOUND: "Unable to extract text from image",
  LOW_CONFIDENCE:
    "Low OCR confidence - image quality may affect accuracy",

  // API errors
  INTERNAL_ERROR: "Processing error occurred",
  VALIDATION_ERROR: "Validation failed",
  PROCESSING_ERROR: "Verification request failed",
} as const;

// ============================================================================
// Success Messages
// ============================================================================

/**
 * Standard success messages
 */
export const SUCCESS_MESSAGES = {
  VERIFICATION_PASS: "Label verification complete. All required information verified.",
  FIELD_MATCH: "verified",
  EXACT_MATCH: "Verified",
  FUZZY_MATCH: "verified",
  PARTIAL_MATCH: "Verified",
} as const;

// ============================================================================
// UI Constants
// ============================================================================

/**
 * Status colors for USWDS alerts
 */
export const STATUS_COLORS = {
  pass: "success",
  fail: "error",
  warning: "warning",
  info: "info",
} as const;

/**
 * Confidence level descriptions
 */
export const CONFIDENCE_LEVELS = {
  excellent: { min: 95, max: 100, label: "Excellent", color: "green" },
  good: { min: 85, max: 94, label: "Good", color: "green" },
  fair: { min: 70, max: 84, label: "Fair", color: "yellow" },
  poor: { min: 50, max: 69, label: "Poor", color: "orange" },
  failed: { min: 0, max: 49, label: "Failed", color: "red" },
} as const;

// ============================================================================
// Exports
// ============================================================================

/**
 * Export all constants as a single object for easier importing
 */
export const CONSTANTS = {
  TTB_GOVERNMENT_WARNING,
  WARNING_REQUIRED_PHRASES,
  PATTERNS: {
    ABV_PERCENTAGE: ABV_PERCENTAGE_PATTERN,
    ABV_ALCOHOL: ABV_ALCOHOL_PATTERN,
    ABV_NOTATION: ABV_NOTATION_PATTERN,
    PROOF: PROOF_PATTERN,
    VOLUME_ML: VOLUME_ML_PATTERN,
    VOLUME_OZ: VOLUME_OZ_PATTERN,
    VOLUME_L: VOLUME_L_PATTERN,
    BRAND_NAME: BRAND_NAME_PATTERN,
  },
  CONFIG: {
    MATCHING: DEFAULT_MATCHING_CONFIG,
    OCR: DEFAULT_OCR_CONFIG,
  },
  PRODUCT_TYPE_VARIATIONS,
  VOLUME_TO_ML,
  STANDARD_BOTTLE_SIZES,
  ABV_RANGE,
  VALID_IMAGE_TYPES,
  MAX_IMAGE_SIZE,
  MIN_IMAGE_DIMENSIONS,
  MAX_IMAGE_DIMENSIONS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  STATUS_COLORS,
  CONFIDENCE_LEVELS,
} as const;

export default CONSTANTS;
