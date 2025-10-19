/**
 * Validation Tests
 *
 * Tests form validation logic
 */

import { validateFormData } from "../lib/validation";

describe("Form Validation", () => {
  describe("validateFormData", () => {
    it("should accept valid complete form data", () => {
      const result = validateFormData({
        brandName: "ORPHEUS BREWING",
        alcoholType: "beer",
        productType: "IPA",
        alcoholContent: "4%",
        netContents: "12 oz",
        image: new File(["test"], "test.jpg", { type: "image/jpeg" }),
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should accept form without optional netContents", () => {
      const result = validateFormData({
        brandName: "ORPHEUS BREWING",
        alcoholType: "beer",
        productType: "IPA",
        alcoholContent: "4%",
        image: new File(["test"], "test.jpg", { type: "image/jpeg" }),
      });

      expect(result.valid).toBe(true);
    });

    it("should reject missing brand name", () => {
      const result = validateFormData({
        brandName: "",
        alcoholType: "beer",
        productType: "IPA",
        alcoholContent: "4%",
        image: new File(["test"], "test.jpg", { type: "image/jpeg" }),
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: "brandName",
        })
      );
    });

    it("should reject missing product type", () => {
      const result = validateFormData({
        brandName: "ORPHEUS BREWING",
        alcoholType: "beer",
        productType: "",
        alcoholContent: "4%",
        image: new File(["test"], "test.jpg", { type: "image/jpeg" }),
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: "productType",
        })
      );
    });

    it("should reject missing alcohol type", () => {
      const result = validateFormData({
        brandName: "ORPHEUS BREWING",
        alcoholType: "",
        productType: "IPA",
        alcoholContent: "4%",
        image: new File(["test"], "test.jpg", { type: "image/jpeg" }),
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: "alcoholType",
        })
      );
    });

    it("should reject invalid alcohol type", () => {
      const result = validateFormData({
        brandName: "ORPHEUS BREWING",
        alcoholType: "invalid-type",
        productType: "IPA",
        alcoholContent: "4%",
        image: new File(["test"], "test.jpg", { type: "image/jpeg" }),
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: "alcoholType",
        })
      );
    });

    it("should reject invalid alcohol content", () => {
      const result = validateFormData({
        brandName: "ORPHEUS BREWING",
        alcoholType: "beer",
        productType: "IPA",
        alcoholContent: "150%", // Invalid: > 95%
        image: new File(["test"], "test.jpg", { type: "image/jpeg" }),
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: "alcoholContent",
        })
      );
    });

    it("should reject negative alcohol content", () => {
      const result = validateFormData({
        brandName: "ORPHEUS BREWING",
        alcoholType: "beer",
        productType: "IPA",
        alcoholContent: "-5%",
        image: new File(["test"], "test.jpg", { type: "image/jpeg" }),
      });

      expect(result.valid).toBe(false);
    });

    it("should reject missing image", () => {
      const result = validateFormData({
        brandName: "ORPHEUS BREWING",
        alcoholType: "beer",
        productType: "IPA",
        alcoholContent: "4%",
        image: null as any,
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: "image",
        })
      );
    });

    it("should reject invalid image type", () => {
      const result = validateFormData({
        brandName: "ORPHEUS BREWING",
        alcoholType: "beer",
        productType: "IPA",
        alcoholContent: "4%",
        image: new File(["test"], "test.pdf", { type: "application/pdf" }),
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: "image",
        })
      );
    });

    it("should accept all valid image types", () => {
      const types = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

      types.forEach((type) => {
        const result = validateFormData({
          brandName: "ORPHEUS BREWING",
          alcoholType: "beer",
          productType: "IPA",
          alcoholContent: "4%",
          image: new File(["test"], "test.jpg", { type }),
        });

        expect(result.valid).toBe(true);
      });
    });

    it("should reject brand name that is too long", () => {
      const longName = "A".repeat(201);
      const result = validateFormData({
        brandName: longName,
        alcoholType: "beer",
        productType: "IPA",
        alcoholContent: "4%",
        image: new File(["test"], "test.jpg", { type: "image/jpeg" }),
      });

      expect(result.valid).toBe(false);
    });

    it("should accept alcohol content with or without % sign", () => {
      const withPercent = validateFormData({
        brandName: "ORPHEUS BREWING",
        alcoholType: "beer",
        productType: "IPA",
        alcoholContent: "4%",
        image: new File(["test"], "test.jpg", { type: "image/jpeg" }),
      });

      const withoutPercent = validateFormData({
        brandName: "ORPHEUS BREWING",
        alcoholType: "beer",
        productType: "IPA",
        alcoholContent: "4",
        image: new File(["test"], "test.jpg", { type: "image/jpeg" }),
      });

      expect(withPercent.valid).toBe(true);
      expect(withoutPercent.valid).toBe(true);
    });

    it("should accept decimal alcohol content", () => {
      const result = validateFormData({
        brandName: "ORPHEUS BREWING",
        alcoholType: "beer",
        productType: "IPA",
        alcoholContent: "4.5%",
        image: new File(["test"], "test.jpg", { type: "image/jpeg" }),
      });

      expect(result.valid).toBe(true);
    });
  });
});
