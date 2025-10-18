"use client";

/**
 * ImageUpload Component
 *
 * Native file input styled with USWDS classes
 * Avoids FileReader conflicts by using URL.createObjectURL for previews
 */

import React, { useCallback, useState, useEffect } from "react";
import { Alert } from "@trussworks/react-uswds";
import Image from "next/image";
import type { ImageUploadProps } from "@/types/verification";
import { validateImageFile } from "@/lib/validation";
import { MAX_IMAGE_SIZE, VALID_IMAGE_TYPES } from "@/lib/constants";

export default function ImageUpload({
  onChange,
  disabled = false,
  maxSize = MAX_IMAGE_SIZE,
  accept = VALID_IMAGE_TYPES.join(","),
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  /**
   * Cleanup preview URL on unmount or when preview changes
   */
  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  /**
   * Handles file selection
   */
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];

      if (!file) {
        // Cleanup old preview
        if (preview) {
          URL.revokeObjectURL(preview);
        }
        setPreview(null);
        setError(null);
        setFileName(null);
        onChange(null);
        return;
      }

      // Validate file
      const validationError = validateImageFile(file);
      if (validationError) {
        setError(validationError.message);
        if (preview) {
          URL.revokeObjectURL(preview);
        }
        setPreview(null);
        setFileName(null);
        onChange(null);
        return;
      }

      // Clear any previous errors
      setError(null);

      // Cleanup old preview URL
      if (preview) {
        URL.revokeObjectURL(preview);
      }

      try {
        // Create object URL for preview (NO FileReader - avoids conflicts!)
        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);
        setFileName(file.name);
      } catch {
        setError("Failed to create image preview");
        setPreview(null);
        setFileName(null);
      }

      // Pass the actual File object to parent for Tesseract OCR
      onChange(file);
    },
    [onChange, preview]
  );

  /**
   * Clears the selected file
   */
  const handleClear = useCallback(() => {
    // Cleanup preview URL
    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setPreview(null);
    setError(null);
    setFileName(null);
    onChange(null);

    // Reset the file input
    const input = document.getElementById("label-image") as HTMLInputElement;
    if (input) {
      input.value = "";
    }
  }, [onChange, preview]);

  return (
    <div className="image-upload">
      {/* Native file input with USWDS styling */}
      <div className="usa-form-group">
        <label className="usa-label" htmlFor="label-image">
          Select label image
        </label>
        <input
          id="label-image"
          name="label-image"
          className="usa-file-input"
          type="file"
          accept={accept}
          onChange={handleFileChange}
          disabled={disabled}
          aria-describedby="file-input-hint"
        />
        <div className="usa-hint" id="file-input-hint">
          Accepted formats: JPEG, PNG, WebP. Maximum size:{" "}
          {(maxSize / (1024 * 1024)).toFixed(0)} MB
        </div>
      </div>

      {error && (
        <Alert type="error" headingLevel="h4" slim className="margin-top-2">
          {error}
        </Alert>
      )}

      {preview && !error && (
        <div className="margin-top-3">
          <div className="display-flex flex-justify flex-align-center margin-bottom-2">
            <div>
              <h4 className="margin-0">Image Preview</h4>
              {fileName && (
                <p className="text-base-dark margin-top-05 margin-bottom-0">
                  {fileName}
                </p>
              )}
            </div>
            <button
              type="button"
              className="usa-button usa-button--unstyled text-secondary"
              onClick={handleClear}
              disabled={disabled}
            >
              Remove
            </button>
          </div>

          <div className="border-2px border-base-lighter padding-2 bg-base-lightest radius-md">
            <Image
              src={preview}
              alt="Label preview"
              width={800}
              height={600}
              className="maxw-full height-auto display-block"
              style={{
                maxHeight: "400px",
                margin: "0 auto",
                width: "auto",
                height: "auto",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
