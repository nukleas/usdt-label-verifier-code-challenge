/**
 * Validation utilities for form data and images
 *
 * This module provides validation functions for user inputs including
 * form fields and uploaded images.
 */

import type {
  LabelFormData,
  ValidationResult,
  ValidationError,
  ValidImageType,
} from "@/types/verification";
import {
  ABV_RANGE,
  VALID_IMAGE_TYPES,
  MAX_IMAGE_SIZE,
  MIN_IMAGE_DIMENSIONS,
  MAX_IMAGE_DIMENSIONS,
  ERROR_MESSAGES,
} from "./constants";

// ============================================================================
// Form Validation
// ============================================================================

/**
 * Validates complete form data including image
 *
 * @param data - Form data with image
 * @returns Validation result with any errors
 *
 * @example
 * const result = validateFormData({
 *   brandName: 'Old Tom',
 *   productType: 'Bourbon',
 *   alcoholContent: '45',
 *   image: imageFile
 * });
 *
 * if (!result.valid) {
 *   console.error(result.errors);
 * }
 */
export function validateFormData(
  data: LabelFormData & { image: File | null }
): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate brand name
  const brandNameError = validateBrandName(data.brandName);
  if (brandNameError) errors.push(brandNameError);

  // Validate product type
  const productTypeError = validateProductType(data.productType);
  if (productTypeError) errors.push(productTypeError);

  // Validate alcohol content
  const alcoholContentError = validateAlcoholContent(data.alcoholContent);
  if (alcoholContentError) errors.push(alcoholContentError);

  // Validate net contents (optional field)
  if (data.netContents) {
    const netContentsError = validateNetContents(data.netContents);
    if (netContentsError) errors.push(netContentsError);
  }

  // Validate image
  if (!data.image) {
    errors.push({
      field: "image",
      message: ERROR_MESSAGES.NO_IMAGE,
      code: "REQUIRED_IMAGE",
    });
  } else {
    const imageError = validateImageFile(data.image);
    if (imageError) errors.push(imageError);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates brand name field
 *
 * @param brandName - Brand name to validate
 * @returns Validation error if invalid, null if valid
 */
export function validateBrandName(brandName: string): ValidationError | null {
  if (!brandName || brandName.trim().length === 0) {
    return {
      field: "brandName",
      message: ERROR_MESSAGES.REQUIRED_FIELD,
      code: "REQUIRED_BRAND_NAME",
    };
  }

  if (brandName.length > 200) {
    return {
      field: "brandName",
      message: ERROR_MESSAGES.INVALID_BRAND_NAME,
      code: "INVALID_BRAND_NAME_LENGTH",
    };
  }

  // Check for valid characters (alphanumeric, spaces, hyphens, apostrophes)
  const validPattern = /^[A-Za-z0-9\s\-'&.]+$/;
  if (!validPattern.test(brandName)) {
    return {
      field: "brandName",
      message: "Brand name contains invalid characters",
      code: "INVALID_BRAND_NAME_CHARS",
    };
  }

  return null;
}

/**
 * Validates product type field
 *
 * @param productType - Product type to validate
 * @returns Validation error if invalid, null if valid
 */
export function validateProductType(
  productType: string
): ValidationError | null {
  if (!productType || productType.trim().length === 0) {
    return {
      field: "productType",
      message: ERROR_MESSAGES.REQUIRED_FIELD,
      code: "REQUIRED_PRODUCT_TYPE",
    };
  }

  if (productType.length > 200) {
    return {
      field: "productType",
      message: ERROR_MESSAGES.INVALID_PRODUCT_TYPE,
      code: "INVALID_PRODUCT_TYPE_LENGTH",
    };
  }

  return null;
}

/**
 * Validates alcohol content field
 *
 * @param alcoholContent - Alcohol content to validate
 * @returns Validation error if invalid, null if valid
 */
export function validateAlcoholContent(
  alcoholContent: string
): ValidationError | null {
  if (!alcoholContent || alcoholContent.trim().length === 0) {
    return {
      field: "alcoholContent",
      message: ERROR_MESSAGES.REQUIRED_FIELD,
      code: "REQUIRED_ALCOHOL_CONTENT",
    };
  }

  // Extract numeric value (handle "45" or "45%")
  const numericValue = parseFloat(alcoholContent.replace("%", "").trim());

  if (isNaN(numericValue)) {
    return {
      field: "alcoholContent",
      message: "Alcohol content must be a valid number",
      code: "INVALID_ALCOHOL_CONTENT_FORMAT",
    };
  }

  if (numericValue < ABV_RANGE.min || numericValue > ABV_RANGE.max) {
    return {
      field: "alcoholContent",
      message: ERROR_MESSAGES.INVALID_ABV,
      code: "INVALID_ALCOHOL_CONTENT_RANGE",
    };
  }

  return null;
}

/**
 * Validates net contents field (optional)
 *
 * @param netContents - Net contents to validate
 * @returns Validation error if invalid, null if valid
 */
export function validateNetContents(
  netContents: string
): ValidationError | null {
  if (!netContents || netContents.trim().length === 0) {
    return null; // Optional field
  }

  // Check for valid format: number + space + unit
  const pattern = /^\d+\.?\d*\s*(ml|mL|ML|oz|OZ|fl\s*oz|FL\s*OZ|L|l)$/i;

  if (!pattern.test(netContents)) {
    return {
      field: "netContents",
      message: ERROR_MESSAGES.INVALID_VOLUME,
      code: "INVALID_NET_CONTENTS_FORMAT",
    };
  }

  return null;
}

// ============================================================================
// Image Validation
// ============================================================================

/**
 * Validates an uploaded image file
 *
 * @param file - Image file to validate
 * @returns Validation error if invalid, null if valid
 *
 * @example
 * const error = validateImageFile(imageFile);
 * if (error) {
 *   alert(error.message);
 * }
 */
export function validateImageFile(file: File): ValidationError | null {
  // Check file type
  if (!VALID_IMAGE_TYPES.includes(file.type as ValidImageType)) {
    return {
      field: "image",
      message: ERROR_MESSAGES.INVALID_IMAGE_TYPE,
      code: "INVALID_IMAGE_TYPE",
    };
  }

  // Check file size
  if (file.size > MAX_IMAGE_SIZE) {
    return {
      field: "image",
      message: ERROR_MESSAGES.IMAGE_TOO_LARGE,
      code: "IMAGE_TOO_LARGE",
    };
  }

  if (file.size === 0) {
    return {
      field: "image",
      message: "Image file is empty",
      code: "EMPTY_IMAGE",
    };
  }

  return null;
}

/**
 * Validates image dimensions
 * Note: This requires loading the image, so it's async
 *
 * @param file - Image file to check
 * @returns Promise resolving to validation error or null
 *
 * @example
 * const error = await validateImageDimensions(imageFile);
 * if (error) {
 *   console.error(error.message);
 * }
 */
export async function validateImageDimensions(
  file: File
): Promise<ValidationError | null> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      if (
        img.width < MIN_IMAGE_DIMENSIONS.width ||
        img.height < MIN_IMAGE_DIMENSIONS.height
      ) {
        resolve({
          field: "image",
          message: ERROR_MESSAGES.IMAGE_TOO_SMALL,
          code: "IMAGE_TOO_SMALL",
        });
        return;
      }

      if (
        img.width > MAX_IMAGE_DIMENSIONS.width ||
        img.height > MAX_IMAGE_DIMENSIONS.height
      ) {
        resolve({
          field: "image",
          message: ERROR_MESSAGES.IMAGE_TOO_BIG,
          code: "IMAGE_TOO_BIG",
        });
        return;
      }

      resolve(null);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({
        field: "image",
        message: "Failed to load image",
        code: "IMAGE_LOAD_ERROR",
      });
    };

    img.src = url;
  });
}

// ============================================================================
// Sanitization
// ============================================================================

/**
 * Sanitizes form data by trimming and normalizing
 *
 * @param data - Form data to sanitize
 * @returns Sanitized form data
 *
 * @example
 * const clean = sanitizeFormData({
 *   brandName: '  Old Tom  ',
 *   productType: 'Bourbon  ',
 *   alcoholContent: ' 45 % ',
 * });
 * // Returns: { brandName: 'Old Tom', productType: 'Bourbon', alcoholContent: '45%' }
 */
export function sanitizeFormData(data: LabelFormData): LabelFormData {
  return {
    brandName: data.brandName.trim(),
    productType: data.productType.trim(),
    alcoholContent: data.alcoholContent.trim(),
    netContents: data.netContents?.trim(),
  };
}

/**
 * Normalizes alcohol content format
 * Ensures consistent format (e.g., "45" or "45%" → "45%")
 *
 * @param value - Alcohol content value
 * @returns Normalized value with %
 *
 * @example
 * normalizeAlcoholContent('45')   // Returns: '45%'
 * normalizeAlcoholContent('45%')  // Returns: '45%'
 * normalizeAlcoholContent('45.0') // Returns: '45.0%'
 */
export function normalizeAlcoholContent(value: string): string {
  const cleaned = value.trim().replace(/\s/g, "");
  if (cleaned.endsWith("%")) {
    return cleaned;
  }
  return `${cleaned}%`;
}

/**
 * Normalizes net contents format
 * Ensures consistent spacing and capitalization
 *
 * @param value - Net contents value
 * @returns Normalized value
 *
 * @example
 * normalizeNetContents('750ml')     // Returns: '750 mL'
 * normalizeNetContents('12oz')      // Returns: '12 oz'
 * normalizeNetContents('1.5  L')    // Returns: '1.5 L'
 */
export function normalizeNetContents(value: string): string {
  // Extract number and unit
  const match = value.match(/(\d+\.?\d*)\s*([a-zA-Z\s]+)/);
  if (!match) return value;

  const [, num, unit] = match;
  const normalizedUnit = unit.trim().toLowerCase();

  // Normalize unit capitalization
  let displayUnit = unit.trim();
  if (normalizedUnit === "ml") displayUnit = "mL";
  else if (normalizedUnit === "oz") displayUnit = "oz";
  else if (normalizedUnit.includes("fl") && normalizedUnit.includes("oz"))
    displayUnit = "fl oz";
  else if (normalizedUnit === "l") displayUnit = "L";

  return `${num} ${displayUnit}`;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Checks if a string is empty or whitespace only
 *
 * @param value - String to check
 * @returns True if empty or whitespace only
 */
export function isEmpty(value: string | undefined | null): boolean {
  return !value || value.trim().length === 0;
}

/**
 * Formats validation errors for display
 *
 * @param errors - Array of validation errors
 * @returns Formatted error messages
 *
 * @example
 * const errors = [{field: 'brandName', message: 'Required'}];
 * formatErrors(errors); // Returns: ['Brand Name: Required']
 */
export function formatErrors(errors: ValidationError[]): string[] {
  return errors.map((error) => {
    const fieldName = formatFieldName(error.field);
    return `${fieldName}: ${error.message}`;
  });
}

/**
 * Converts field name from camelCase to Title Case
 *
 * @param field - Field name in camelCase
 * @returns Formatted field name
 *
 * @example
 * formatFieldName('brandName')      // Returns: 'Brand Name'
 * formatFieldName('alcoholContent') // Returns: 'Alcohol Content'
 */
export function formatFieldName(field: string): string {
  // Special cases
  const specialCases: Record<string, string> = {
    brandName: "Brand Name",
    productType: "Product Type",
    alcoholContent: "Alcohol Content",
    netContents: "Net Contents",
    image: "Image",
  };

  if (specialCases[field]) {
    return specialCases[field];
  }

  // Convert camelCase to Title Case
  return field
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}
