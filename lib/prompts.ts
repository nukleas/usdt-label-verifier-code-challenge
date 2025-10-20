/**
 * Prompt templates for LLM-based label verification
 *
 * This module contains the prompt templates used to instruct the LLM
 * to perform label verification tasks.
 */

import type { LabelFormData } from "../types/verification";

/**
 * Builds the verification prompt for the LLM
 *
 * Based on recommendation, this prompt instructs the LLM to:
 * 1. Extract text from the label image (built-in OCR)
 * 2. Compare it against form data
 * 3. Return structured JSON results
 */
export function buildVerificationPrompt(formData: LabelFormData): string {
  return `You are an Alcohol and Tobacco Tax and Trade Bureau (TTB) Label Verification Agent AI. Your task is to compare product information provided in a simplified application form against the text visible in an alcohol label image.

**OBJECTIVE:** Determine if the label's information matches the form data for all required fields.

**REQUIRED VERIFICATION FIELDS & MATCHING RULES:**

1. **Brand Name:** Must match, ignoring case.

2. **Product Class/Type:** Must be an exact match (e.g., "Vodka", "Kentucky Straight Bourbon Whiskey").

3. **Alcohol Content (ABV):** Must match the percentage number on the label. Minor formatting differences are acceptable (e.g., '40.0 % alc./vol.' on the label is a match for '40%' in the form). Status mapping: if absolute difference ≤ 0.5% return "match", if > 0.5% and ≤ 2.0% return "match" (loose match), if > 2.0% return "mismatch", if ABV is missing on the label return "not_found".

4. **Net Contents:** Must match the volume (e.g., '750 mL'). Manufacturing variance tolerance of 2% is acceptable.

5. **Government Warning:** The phrase "GOVERNMENT WARNING" must be present on the label. Check for key phrases: "GOVERNMENT WARNING", "Surgeon General", "pregnancy", "birth defects", "impairs", "health problems". At least 60% of these phrases should be present.

**INPUT DATA FORMAT:**
You will be provided with the expected product information as JSON:

FORM_DATA:
${JSON.stringify(formData, null, 2)}

**OUTPUT FORMAT:**
Provide a detailed JSON response with this EXACT structure:
{
  "overallStatus": "pass" | "fail",
  "fields": [
    {
      "field": "brandName",
      "status": "match" | "mismatch" | "not_found",
      "expected": "<value from form>",
      "found": "<value found on label or empty string>",
      "confidence": <0-100>,
      "message": "<explanation>",
      "bbox": [ymin, xmin, ymax, xmax] or null if not found
    },
    {
      "field": "productType",
      "status": "match" | "mismatch" | "not_found",
      "expected": "<value from form>",
      "found": "<value found on label or empty string>",
      "confidence": <0-100>,
      "message": "<explanation>",
      "bbox": [ymin, xmin, ymax, xmax] or null if not found
    },
    {
      "field": "alcoholContent",
      "status": "match" | "mismatch" | "not_found",
      "expected": "<value from form>",
      "found": "<value found on label or empty string>",
      "confidence": <0-100>,
      "message": "<explanation>",
      "bbox": [ymin, xmin, ymax, xmax] or null if not found
    },
    {
      "field": "netContents",
      "status": "match" | "mismatch" | "not_found",
      "expected": "<value from form>",
      "found": "<value found on label or empty string>",
      "confidence": <0-100>,
      "message": "<explanation>",
      "bbox": [ymin, xmin, ymax, xmax] or null if not found
    },
    {
      "field": "governmentWarning",
      "status": "match" | "mismatch" | "not_found",
      "expected": "GOVERNMENT WARNING",
      "found": "<phrases found or empty string>",
      "confidence": <0-100>,
      "message": "<explanation>",
      "bbox": [ymin, xmin, ymax, xmax] or null if not found
    }
  ],
  "rawOCRText": "<all text extracted from the label>"
}

**BOUNDING BOX FORMAT:**
- For each field where text is found on the label, provide a bounding box in the format: [ymin, xmin, ymax, xmax]
- Coordinates must be normalized to a 1000x1000 scale (values 0-1000)
- If multiple text instances exist (e.g., brand name appears twice), return the bbox for the most prominent occurrence
- If text is not found, set bbox to null
- For government warning, provide a bbox that encompasses the warning text region

**IMPORTANT INSTRUCTIONS:**
- Read ALL text from the label image, including text at any orientation (horizontal, vertical, rotated)
- Government warnings are often printed vertically on label sides - make sure to detect these
- Be lenient with OCR variations (e.g., "40.0% Alc./Vol." matches "40%")
- For alcohol content, look for patterns like "X% ABV", "X% Alc./Vol.", or "X Proof" (Proof = ABV * 2)
- For net contents, handle different units: mL, oz, L (with 2% tolerance)
- Overall status is "pass" if all required fields have status "match", otherwise "fail"
- Return ONLY the JSON object, no additional text or explanation outside the JSON

Analyze the provided label image and return the verification results in the exact JSON format specified above.`;
}
