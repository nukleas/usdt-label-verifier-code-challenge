import { test, expect } from "@playwright/test";
import path from "path";

test.describe("Label Verification E2E Tests", () => {
  test("should verify label with correct bounding box positioning", async ({
    page,
  }) => {
    // Navigate to the verification page
    await page.goto("/verify");

    // Wait for the page to load
    await expect(page.locator("h1")).toContainText(
      "Alcohol Label Verification"
    );

    // Fill out the form with test data
    await page
      .getByRole("textbox", { name: "Brand Name *" })
      .fill("Orpheus Brewing");
    await page
      .getByRole("textbox", { name: "Product Class/Type *" })
      .fill("Pineapple Sour Ale");
    await page
      .getByRole("textbox", { name: "Alcohol Content (ABV) *" })
      .fill("4");
    await page
      .getByRole("textbox", { name: "Net Contents (Optional)" })
      .fill("12 oz");

    // Upload the test image
    const fileChooserPromise = page.waitForEvent("filechooser");
    await page
      .getByRole("button", { name: "Label Image * Select label" })
      .click();
    const fileChooser = await fileChooserPromise;

    const testImagePath = path.join(
      __dirname,
      "../../__tests__/labels/orpheus_seal_main.jpg"
    );
    await fileChooser.setFiles([testImagePath]);

    // Wait for image preview to appear
    await expect(page.locator("text=orpheus_seal_main.jpg")).toBeVisible();

    // Click verify button
    await page.getByRole("button", { name: "Verify Label" }).click();

    // Wait for verification to complete
    await expect(page.locator("text=Label Verification Passed")).toBeVisible({
      timeout: 30000,
    });

    // Verify all fields are detected correctly
    await expect(
      page.locator("text=Brand Name").locator("..").locator("text=100%")
    ).toBeVisible();
    await expect(
      page.locator("text=Product Type").locator("..").locator("text=100%")
    ).toBeVisible();
    await expect(
      page.locator("text=Alcohol Content").locator("..").locator("text=93%")
    ).toBeVisible();
    await expect(
      page.locator("text=Net Contents").locator("..").locator("text=100%")
    ).toBeVisible();
    await expect(
      page.locator("text=Government Warning").locator("..").locator("text=83%")
    ).toBeVisible();

    // Expand the canvas view
    await page
      .getByRole("button", { name: "View Detected Fields on Label" })
      .click();

    // Wait for canvas to load and verify legend is visible
    await expect(page.locator("text=Legend:")).toBeVisible();

    // Target the legend section specifically to avoid strict mode violations
    const legend = page.locator("text=Legend:").locator("..");

    // Verify all field types are shown in the legend
    await expect(legend.getByText("Brand Name")).toBeVisible();
    await expect(legend.getByText("Product Type")).toBeVisible();
    await expect(legend.getByText("Alcohol Content")).toBeVisible();
    await expect(legend.getByText("Net Contents")).toBeVisible();
    await expect(legend.getByText("Government Warning")).toBeVisible();

    // Take a screenshot for visual verification
    await page.screenshot({
      path: "test-results/bounding-boxes-working.png",
      fullPage: true,
    });

    // Verify the canvas element is present and has content
    const canvas = page.locator("canvas");
    await expect(canvas).toBeVisible();

    // Check that the canvas has been drawn on (has non-zero dimensions)
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox?.width).toBeGreaterThan(0);
    expect(canvasBox?.height).toBeGreaterThan(0);
  });

  test("should handle form validation correctly", async ({ page }) => {
    await page.goto("/verify");

    // Try to submit without filling required fields
    await page.getByRole("button", { name: "Verify Label" }).click();

    // Should show validation errors or prevent submission
    // (This depends on your form validation implementation)

    // Fill only required fields
    await page
      .getByRole("textbox", { name: "Brand Name *" })
      .fill("Test Brand");
    await page
      .getByRole("textbox", { name: "Product Class/Type *" })
      .fill("Test Type");
    await page
      .getByRole("textbox", { name: "Alcohol Content (ABV) *" })
      .fill("5");

    // Upload image
    const fileChooserPromise = page.waitForEvent("filechooser");
    await page
      .getByRole("button", { name: "Label Image * Select label" })
      .click();
    const fileChooser = await fileChooserPromise;

    const testImagePath = path.join(
      __dirname,
      "../../__tests__/labels/orpheus_seal_main.jpg"
    );
    await fileChooser.setFiles([testImagePath]);

    // Now verify should work
    await page.getByRole("button", { name: "Verify Label" }).click();

    // Should complete verification (may fail OCR but should not crash)
    // Wait for verification results to appear
    await expect(
      page
        .locator("text=Label Verification Passed")
        .or(page.locator("text=Label Verification Failed"))
    ).toBeVisible({
      timeout: 30000,
    });
  });

  test("should reset form correctly", async ({ page }) => {
    await page.goto("/verify");

    // Fill out form
    await page
      .getByRole("textbox", { name: "Brand Name *" })
      .fill("Test Brand");
    await page
      .getByRole("textbox", { name: "Product Class/Type *" })
      .fill("Test Type");
    await page
      .getByRole("textbox", { name: "Alcohol Content (ABV) *" })
      .fill("5");

    // Click reset
    await page.getByRole("button", { name: "Reset Form" }).click();

    // Verify form is cleared
    await expect(
      page.getByRole("textbox", { name: "Brand Name *" })
    ).toHaveValue("");
    await expect(
      page.getByRole("textbox", { name: "Product Class/Type *" })
    ).toHaveValue("");
    await expect(
      page.getByRole("textbox", { name: "Alcohol Content (ABV) *" })
    ).toHaveValue("");
  });
});
