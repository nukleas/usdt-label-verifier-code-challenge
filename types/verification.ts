/**
 * Type definitions for the TTB Label Verification System
 *
 * This file contains all TypeScript interfaces and types used throughout
 * the application for type safety and code documentation.
 */

// ============================================================================
// Form Data Types
// ============================================================================

/**
 * Form data submitted by the user for label verification
 */
export interface LabelFormData {
  /** Brand name of the alcohol product (e.g., "Old Tom Distillery") */
  brandName: string;

  /** Product class/type (e.g., "Kentucky Straight Bourbon Whiskey", "IPA") */
  productType: string;

  /** Alcohol by volume percentage (e.g., "45", "45%", "45.0") */
  alcoholContent: string;

  /** Optional net contents/volume (e.g., "750 mL", "12 oz") */
  netContents?: string;
}

// ============================================================================
// OCR Types
// ============================================================================

/**
 * Result from Tesseract.js OCR processing
 */
export interface OCRResult {
  /** Extracted text from the image */
  text: string;

  /** Overall confidence score (0-100) */
  confidence: number;

  /** Optional text blocks with bounding boxes */
  blocks?: TextBlock[];

  /** Processing time in milliseconds */
  processingTime?: number;

  /** Optional: Radians of rotation applied during OCR normalization */
  rotationAppliedRadians?: number;

  /** Optional: Strategy used to handle image rotation */
  rotationStrategy?: "auto" | "manual" | "none";

  /** Optional: Candidate rotation angles (degrees) evaluated during OCR */
  rotationCandidatesDegrees?: number[];

  /** Optional: Raw Tesseract result structure for bbox matching */
  rawTesseractResult?: unknown;

  /** Optional: All rotation results for multi-orientation bbox matching */
  allRotationResults?: Array<{ angle: number; result: unknown }>;

  /** Optional: Original image dimensions for bbox coordinate transformation */
  imageWidth?: number;
  imageHeight?: number;
}

/**
 * Individual text block detected by OCR with position information
 */
export interface TextBlock {
  /** Text content of this block */
  text: string;

  /** Confidence score for this block (0-100) */
  confidence: number;

  /** Bounding box coordinates */
  bbox: BoundingBox;

  /** Optional: Line number in the original image */
  lineNumber?: number;
}

/**
 * Bounding box coordinates for text location in image
 */
export interface BoundingBox {
  /** Left X coordinate */
  x0: number;

  /** Top Y coordinate */
  y0: number;

  /** Right X coordinate */
  x1: number;

  /** Bottom Y coordinate */
  y1: number;
}

// ============================================================================
// Verification Types
// ============================================================================

/**
 * Status of a field verification
 */
export type VerificationStatus = "match" | "mismatch" | "not_found";

/**
 * Overall status of the verification
 */
export type OverallStatus = "pass" | "fail" | "error";

/**
 * Result of verifying a single form field against OCR text
 */
export interface FieldVerification {
  /** Name of the field being verified */
  field: string;

  /** Verification status */
  status: VerificationStatus;

  /** Expected value from form */
  expected: string;

  /** Value found in OCR text (if any) */
  found?: string;

  /** Confidence score of the match (0-100) */
  confidence?: number;

  /** Human-readable message explaining the result */
  message: string;

  /** Optional: Location in image where text was found */
  location?: BoundingBox;

  /** Optional: Multiple bounding boxes for matched text (for canvas highlighting) */
  bboxes?: BoundingBox[];
}

/**
 * Complete verification result for all fields
 */
export interface VerificationResult {
  /** Overall verification status */
  overallStatus: OverallStatus;

  /** Array of individual field verification results */
  fields: FieldVerification[];

  /** Raw OCR text extracted from the image */
  rawOCRText: string;

  /** Total processing time in milliseconds */
  processingTime: number;

  /** Optional warnings (non-critical issues) */
  warnings?: string[];

  /** Optional: OCR confidence score */
  ocrConfidence?: number;

  /** Optional: OCR text blocks with location data */
  ocrBlocks?: TextBlock[];

  /** Optional: rotation metadata used by OCR normalization */
  ocrRotation?: {
    /** Rotation applied to align text (radians) */
    appliedRadians: number;

    /** Strategy describing how rotation was determined */
    strategy: "auto" | "manual" | "none";

    /** Candidate angles evaluated (degrees) */
    candidatesDegrees?: number[];
  };

  /** Optional: Raw Tesseract result structure for bbox matching */
  rawTesseractResult?: unknown;

  /** Optional: All rotation results for multi-orientation bbox matching */
  allRotationResults?: Array<{ angle: number; result: unknown }>;

  /** Optional: Original image dimensions for bbox coordinate transformation */
  imageWidth?: number;
  imageHeight?: number;
}

// ============================================================================
// API Types
// ============================================================================

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = unknown> {
  /** Indicates if the request was successful */
  success: boolean;

  /** Data payload (present on success) */
  result?: T;

  /** Error message (present on failure) */
  error?: string;

  /** Additional error details */
  details?: Record<string, unknown>;
}

/**
 * API request payload for verification endpoint
 */
export interface VerificationRequest {
  /** Form data */
  formData: LabelFormData;

  /** Image file */
  image: File;
}

/**
 * API response from verification endpoint
 */
export type VerificationResponse = ApiResponse<VerificationResult>;

// ============================================================================
// Validation Types
// ============================================================================

/**
 * Result of form data validation
 */
export interface ValidationResult {
  /** Whether the data is valid */
  valid: boolean;

  /** Array of validation errors */
  errors: ValidationError[];
}

/**
 * Individual validation error
 */
export interface ValidationError {
  /** Field that failed validation */
  field: string;

  /** Error message */
  message: string;

  /** Error code for programmatic handling */
  code?: string;
}

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Configuration for text matching algorithms
 */
export interface MatchingConfig {
  /** Brand name matching thresholds */
  brandName: {
    exactMatchThreshold: number;
    fuzzyMatchThreshold: number;
    wordMatchThreshold: number;
  };

  /** Product type matching thresholds */
  productType: {
    exactMatchThreshold: number;
    fuzzyMatchThreshold: number;
  };

  /** Alcohol content matching tolerances */
  alcoholContent: {
    exactTolerance: number;
    looseTolerance: number;
  };

  /** Net contents matching tolerance */
  netContents: {
    volumeTolerance: number;
  };

  /** Government warning detection threshold */
  governmentWarning: {
    phraseMatchThreshold: number;
  };
}

/**
 * OCR processing configuration
 */
export interface OCRConfig {
  /** Tesseract language (e.g., "eng") */
  language: string;

  /** OCR engine mode */
  oem: number;

  /** Page segmentation mode */
  psm: number;

  /** Whether to preserve interword spaces */
  preserveInterwordSpaces: boolean;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Parsed volume with value and unit
 */
export interface ParsedVolume {
  /** Numeric value */
  value: number;

  /** Unit (mL, oz, etc.) */
  unit: string;
}

/**
 * Similarity comparison result
 */
export interface SimilarityResult {
  /** Similarity score (0-100) */
  score: number;

  /** Levenshtein distance */
  distance: number;

  /** Whether it meets the threshold */
  isMatch: boolean;
}

// ============================================================================
// Component Props Types
// ============================================================================

/**
 * Props for LabelForm component
 */
export interface LabelFormProps {
  /** Callback when form is submitted */
  onSubmit: (formData: LabelFormData, image: File) => void;

  /** Whether the form is in loading state */
  loading?: boolean;

  /** Initial form values */
  initialValues?: Partial<LabelFormData>;

  /** Callback when form is reset */
  onReset?: () => void;
}

/**
 * Props for ImageUpload component
 */
export interface ImageUploadProps {
  /** Callback when image is selected */
  onChange: (file: File | null) => void;

  /** Current image file */
  value?: File | null;

  /** Whether the component is disabled */
  disabled?: boolean;

  /** Maximum file size in bytes */
  maxSize?: number;

  /** Accepted file types */
  accept?: string;
}

/**
 * Props for VerificationResults component
 */
export interface VerificationResultsProps {
  /** Verification result to display */
  result: VerificationResult;

  /** Callback to reset and try again */
  onReset?: () => void;

  /** Optional: Image file for canvas visualization */
  imageFile?: File;
}

/**
 * Props for FieldVerification component
 */
export interface FieldVerificationProps {
  /** Field verification data */
  field: FieldVerification;

  /** Whether to show detailed information */
  detailed?: boolean;
}

/**
 * Props for LoadingState component
 */
export interface LoadingStateProps {
  /** Loading message */
  message?: string;

  /** Processing progress (0-100) */
  progress?: number;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Field names for verification
 */
export enum VerificationField {
  BRAND_NAME = "brandName",
  PRODUCT_TYPE = "productType",
  ALCOHOL_CONTENT = "alcoholContent",
  NET_CONTENTS = "netContents",
  GOVERNMENT_WARNING = "governmentWarning",
}

/**
 * Valid image MIME types
 */
export const VALID_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
] as const;

export type ValidImageType = (typeof VALID_IMAGE_TYPES)[number];

/**
 * Maximum file size (5 MB)
 */
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB in bytes

/**
 * Valid ABV range
 */
export const ABV_RANGE = {
  min: 0.5,
  max: 95,
} as const;
