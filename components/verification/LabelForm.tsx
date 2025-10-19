"use client";

/**
 * LabelForm Component
 *
 * USWDS form for entering alcohol label information
 */

import React, { useState, useCallback } from "react";
import {
  Form,
  Label,
  TextInput,
  Button,
  FormGroup,
} from "@trussworks/react-uswds";
import type { LabelFormData, LabelFormProps } from "@/types/verification";
import ImageUpload from "./ImageUpload";
import { validateFormData, sanitizeFormData } from "@/lib/validation";

export default function LabelForm({
  onSubmit,
  loading = false,
  initialValues,
  onReset,
}: LabelFormProps) {
  const [formData, setFormData] = useState<LabelFormData>({
    brandName: initialValues?.brandName || "",
    productType: initialValues?.productType || "",
    alcoholContent: initialValues?.alcoholContent || "",
    netContents: initialValues?.netContents || "",
  });

  const [image, setImage] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  /**
   * Handles form field changes
   */
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
      // Clear error for this field
      if (errors[name]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    },
    [errors]
  );

  /**
   * Handles image selection
   */
  const handleImageChange = useCallback((file: File | null) => {
    setImage(file);
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.image;
      return newErrors;
    });
  }, []);

  /**
   * Handles form submission
   */
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      // Sanitize form data
      const cleanedData = sanitizeFormData(formData);

      // Validate
      const validation = validateFormData({ ...cleanedData, image });

      if (!validation.valid) {
        // Convert errors to object for display
        const errorObj: Record<string, string> = {};
        validation.errors.forEach((err) => {
          errorObj[err.field] = err.message;
        });
        setErrors(errorObj);
        return;
      }

      // Submit
      if (image) {
        onSubmit(cleanedData, image);
      }
    },
    [formData, image, onSubmit]
  );

  /**
   * Resets the form
   */
  const handleReset = useCallback(() => {
    setFormData({
      brandName: "",
      productType: "",
      alcoholContent: "",
      netContents: "",
    });
    setImage(null);
    setErrors({});

    // Call parent reset callback to clear imageFile state
    if (onReset) {
      onReset();
    }
  }, [onReset]);

  return (
    <Form onSubmit={handleSubmit} large>
      <h2 className="margin-top-0">Label Information</h2>
      <p className="text-base">
        Enter the information from your alcohol beverage label application form.
        All fields marked with an asterisk (*) are required for verification.
      </p>

      <FormGroup error={!!errors.brandName}>
        <Label htmlFor="brandName">
          Brand Name <span className="text-secondary-vivid">*</span>
        </Label>
        <span className="usa-hint">
          Enter the exact brand name as it appears on the label (e.g.,
          &ldquo;Old Tom Distillery&rdquo;)
        </span>
        {errors.brandName && (
          <span className="usa-error-message" role="alert">
            {errors.brandName}
          </span>
        )}
        <TextInput
          id="brandName"
          name="brandName"
          type="text"
          value={formData.brandName}
          onChange={handleChange}
          disabled={loading}
          validationStatus={errors.brandName ? "error" : undefined}
          required
        />
      </FormGroup>

      <FormGroup error={!!errors.productType}>
        <Label htmlFor="productType">
          Product Class/Type <span className="text-secondary-vivid">*</span>
        </Label>
        <span className="usa-hint">
          Enter the exact product designation as shown on the label (e.g.,
          &ldquo;Kentucky Straight Bourbon Whiskey&rdquo;, &ldquo;India Pale
          Ale&rdquo;, &ldquo;Red Wine&rdquo;)
        </span>
        {errors.productType && (
          <span className="usa-error-message" role="alert">
            {errors.productType}
          </span>
        )}
        <TextInput
          id="productType"
          name="productType"
          type="text"
          value={formData.productType}
          onChange={handleChange}
          disabled={loading}
          validationStatus={errors.productType ? "error" : undefined}
          required
        />
      </FormGroup>

      <FormGroup error={!!errors.alcoholContent}>
        <Label htmlFor="alcoholContent">
          Alcohol Content (ABV) <span className="text-secondary-vivid">*</span>
        </Label>
        <span className="usa-hint">
          Enter the alcohol content exactly as shown on the label (e.g.,
          &ldquo;45&rdquo;, &ldquo;45%&rdquo;, &ldquo;90 Proof&rdquo;)
        </span>
        {errors.alcoholContent && (
          <span className="usa-error-message" role="alert">
            {errors.alcoholContent}
          </span>
        )}
        <TextInput
          id="alcoholContent"
          name="alcoholContent"
          type="text"
          value={formData.alcoholContent}
          onChange={handleChange}
          disabled={loading}
          validationStatus={errors.alcoholContent ? "error" : undefined}
          required
        />
      </FormGroup>

      <FormGroup error={!!errors.netContents}>
        <Label htmlFor="netContents">Net Contents (Optional)</Label>
        <span className="usa-hint">
          Enter the volume exactly as shown on the label (e.g., &ldquo;750
          mL&rdquo;, &ldquo;12 fl oz&rdquo;, &ldquo;1 L&rdquo;)
        </span>
        {errors.netContents && (
          <span className="usa-error-message" role="alert">
            {errors.netContents}
          </span>
        )}
        <TextInput
          id="netContents"
          name="netContents"
          type="text"
          value={formData.netContents}
          onChange={handleChange}
          disabled={loading}
          validationStatus={errors.netContents ? "error" : undefined}
        />
      </FormGroup>

      <FormGroup error={!!errors.image}>
        <Label htmlFor="label-image">
          Label Image <span className="text-secondary-vivid">*</span>
        </Label>
        {errors.image && (
          <span className="usa-error-message" role="alert">
            {errors.image}
          </span>
        )}
        <ImageUpload
          onChange={handleImageChange}
          value={image}
          disabled={loading}
        />
      </FormGroup>

      <div className="display-flex flex-gap-2 margin-top-4">
        <Button type="submit" disabled={loading}>
          {loading ? "Verifying..." : "Verify Label"}
        </Button>
        <Button type="button" unstyled onClick={handleReset} disabled={loading}>
          Reset Form
        </Button>
      </div>
    </Form>
  );
}
