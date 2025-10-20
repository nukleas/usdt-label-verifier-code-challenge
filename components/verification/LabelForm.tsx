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
import type { LabelFormData, LabelFormProps } from "../../types/verification";
import ImageUpload from "./ImageUpload";
import { validateFormData, sanitizeFormData } from "../../lib/validation";
import {
  ALCOHOL_TYPES,
  PRODUCT_TYPE_OPTIONS,
  ALCOHOL_TYPE_RULES,
} from "../../lib/constants";

export default function LabelForm({
  onSubmit,
  loading = false,
  initialValues,
  onReset,
}: LabelFormProps) {
  const [formData, setFormData] = useState<LabelFormData>({
    brandName: initialValues?.brandName || "",
    alcoholType: initialValues?.alcoholType || "",
    productType: initialValues?.productType || "",
    alcoholContent: initialValues?.alcoholContent || "",
    netContents: initialValues?.netContents || "",
  });

  const [image, setImage] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  /**
   * Gets the available product type options for the selected alcohol type
   */
  const getProductTypeOptions = () => {
    if (!formData.alcoholType) return [];
    return (
      PRODUCT_TYPE_OPTIONS[
        formData.alcoholType as keyof typeof PRODUCT_TYPE_OPTIONS
      ] || []
    );
  };

  /**
   * Gets the ABV range for the selected alcohol type
   */
  const getABVRange = () => {
    if (!formData.alcoholType) return { min: 0.5, max: 95 };
    const rules =
      ALCOHOL_TYPE_RULES[
        formData.alcoholType as keyof typeof ALCOHOL_TYPE_RULES
      ];
    return rules
      ? { min: rules.minABV, max: rules.maxABV }
      : { min: 0.5, max: 95 };
  };

  /**
   * Handles form field changes
   */
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;

      // If alcohol type changes, clear product type
      if (name === "alcoholType") {
        setFormData((prev) => ({
          ...prev,
          [name]: value,
          productType: "", // Clear product type when alcohol type changes
        }));
      } else {
        setFormData((prev) => ({ ...prev, [name]: value }));
      }

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
      alcoholType: "",
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
      </p>

      <FormGroup error={!!errors.brandName}>
        <Label htmlFor="brandName">
          Brand Name <span className="text-secondary-vivid">*</span>
        </Label>
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

      <FormGroup error={!!errors.alcoholType}>
        <Label htmlFor="alcoholType">
          Alcohol Type <span className="text-secondary-vivid">*</span>
        </Label>
        <span className="usa-hint">
          Select the category of alcohol beverage
        </span>
        {errors.alcoholType && (
          <span className="usa-error-message" role="alert">
            {errors.alcoholType}
          </span>
        )}
        <select
          id="alcoholType"
          name="alcoholType"
          value={formData.alcoholType}
          onChange={handleChange}
          disabled={loading}
          className={`usa-select ${
            errors.alcoholType ? "usa-input--error" : ""
          }`}
          required
        >
          <option value="">Select alcohol type...</option>
          {ALCOHOL_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </FormGroup>

      <FormGroup error={!!errors.productType}>
        <Label htmlFor="productType">
          Product Class/Type <span className="text-secondary-vivid">*</span>
        </Label>
        <span className="usa-hint">
          {formData.alcoholType
            ? (() => {
                const alcoholType = ALCOHOL_TYPES.find(
                  (t) => t.value === formData.alcoholType
                );
                return `Enter the specific type of ${
                  alcoholType?.label?.toLowerCase() ?? formData.alcoholType
                }`;
              })()
            : "Select an alcohol type first to see available options"}
        </span>
        {errors.productType && (
          <span className="usa-error-message" role="alert">
            {errors.productType}
          </span>
        )}
        {formData.alcoholType ? (
          <div>
            <TextInput
              id="productType"
              name="productType"
              type="text"
              value={formData.productType}
              onChange={handleChange}
              disabled={loading}
              placeholder={`Enter ${ALCOHOL_TYPES.find(
                (t) => t.value === formData.alcoholType
              )?.label.toLowerCase()} type (e.g., ${getProductTypeOptions()
                .slice(0, 3)
                .join(", ")})`}
              validationStatus={errors.productType ? "error" : undefined}
              required
            />
            <div
              className="usa-hint"
              style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}
            >
              <strong>Common types:</strong>{" "}
              {getProductTypeOptions().slice(0, 5).join(", ")}
              {getProductTypeOptions().length > 5 && (
                <span> and {getProductTypeOptions().length - 5} more...</span>
              )}
              <br />
              <strong>Note:</strong> You can enter any legitimate product type
              (e.g., custom names, flavored varieties, regional specialties)
            </div>
          </div>
        ) : (
          <TextInput
            id="productType"
            name="productType"
            type="text"
            value={formData.productType || ""}
            onChange={handleChange}
            disabled={true}
            placeholder="Select an alcohol type first"
            validationStatus={errors.productType ? "error" : undefined}
            required
          />
        )}
      </FormGroup>

      <FormGroup error={!!errors.alcoholContent}>
        <Label htmlFor="alcoholContent">
          Alcohol Content (ABV) <span className="text-secondary-vivid">*</span>
        </Label>
        <span className="usa-hint">
          {formData.alcoholType
            ? `Enter as percentage (${getABVRange().min}%-${
                getABVRange().max
              }% range for ${
                ALCOHOL_TYPES.find(
                  (t) => t.value === formData.alcoholType
                )?.label?.toLowerCase() ?? "selected type"
              })`
            : "Enter as percentage (e.g., 45 or 45%)"}
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
        <span className="usa-hint">e.g., 750 mL, 12 oz, 1 L</span>
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
