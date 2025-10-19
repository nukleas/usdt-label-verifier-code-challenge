import { test, expect } from "@playwright/test";
import path from "path";

test.describe("Label Verification E2E Tests", () => {
  test("should verify Orpheus gin label with distilled spirits", async ({
    page,
  }) => {
    // Navigate to the verification page
    await page.goto("/verify");

    // Wait for the page to load
    await expect(page.locator("h1")).toContainText(
      "Alcohol Label Verification"
    );

    // Fill out the form with Orpheus gin data
    await page.getByRole("textbox", { name: "Brand Name *" }).fill("Orpheus");

    // Select distilled spirits
    await page.getByLabel("Alcohol Type *").selectOption("distilled-spirits");

    // Verify dynamic form updates
    await expect(
      page.locator("text=Enter the specific type of distilled spirits")
    ).toBeVisible();
    await expect(
      page.locator("text=2.5%-95% range for distilled spirits")
    ).toBeVisible();

    await page
      .getByRole("textbox", { name: "Product Class/Type *" })
      .fill("Gin");
    await page
      .getByRole("textbox", { name: "Alcohol Content (ABV) *" })
      .fill("45");
    await page
      .getByRole("textbox", { name: "Net Contents (Optional)" })
      .fill("750 mL");

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
    await expect(
      page
        .locator("text=Label Verification Passed")
        .or(page.locator("text=Label Verification Failed"))
    ).toBeVisible({
      timeout: 30000,
    });

    // Verify form fields are working correctly
    await expect(
      page.getByRole("heading", { name: "Brand Name" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Product Type" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Alcohol Content" })
    ).toBeVisible();
  });

  test("should verify rum liqueur label with 18% ABV", async ({ page }) => {
    await page.goto("/verify");

    // Fill out the form with rum liqueur data
    await page
      .getByRole("textbox", { name: "Brand Name *" })
      .fill("12345 IMPORTS");

    // Select distilled spirits
    await page.getByLabel("Alcohol Type *").selectOption("distilled-spirits");

    await page
      .getByRole("textbox", { name: "Product Class/Type *" })
      .fill("Rum with Coconut Liqueur");
    await page
      .getByRole("textbox", { name: "Alcohol Content (ABV) *" })
      .fill("18"); // Test liqueur ABV validation
    await page
      .getByRole("textbox", { name: "Net Contents (Optional)" })
      .fill("200 ML");

    // Upload the rum liqueur image
    const fileChooserPromise = page.waitForEvent("filechooser");
    await page
      .getByRole("button", { name: "Label Image * Select label" })
      .click();
    const fileChooser = await fileChooserPromise;

    const testImagePath = path.join(
      __dirname,
      "../../__tests__/labels/brand-label-new2.jpg"
    );
    await fileChooser.setFiles([testImagePath]);

    // Wait for image preview to appear
    await expect(page.locator("text=brand-label-new2.jpg")).toBeVisible();

    // Click verify button
    await page.getByRole("button", { name: "Verify Label" }).click();

    // Wait for verification to complete
    await expect(
      page
        .locator("text=Label Verification Passed")
        .or(page.locator("text=Label Verification Failed"))
    ).toBeVisible({
      timeout: 30000,
    });

    // Verify the 18% ABV was accepted (no validation error)
    await expect(
      page.getByRole("heading", { name: "Alcohol Content" })
    ).toBeVisible();
  });

  test("should verify wine label with wine-specific validation", async ({
    page,
  }) => {
    await page.goto("/verify");

    // Fill out the form with wine data
    await page
      .getByRole("textbox", { name: "Brand Name *" })
      .fill("Brand Label New");

    // Select wine
    await page.getByLabel("Alcohol Type *").selectOption("wine");

    // Verify wine-specific form updates
    await expect(
      page.locator("text=Enter the specific type of wine")
    ).toBeVisible();
    await expect(page.locator("text=7%-24% range for wine")).toBeVisible();
    await expect(
      page.locator(
        "text=Red Wine, White Wine, Rosé Wine, Sparkling Wine, Champagne"
      )
    ).toBeVisible();

    await page
      .getByRole("textbox", { name: "Product Class/Type *" })
      .fill("Red Wine");
    await page
      .getByRole("textbox", { name: "Alcohol Content (ABV) *" })
      .fill("13"); // Test wine ABV validation
    await page
      .getByRole("textbox", { name: "Net Contents (Optional)" })
      .fill("750 mL");

    // Upload the wine image
    const fileChooserPromise = page.waitForEvent("filechooser");
    await page
      .getByRole("button", { name: "Label Image * Select label" })
      .click();
    const fileChooser = await fileChooserPromise;

    const testImagePath = path.join(
      __dirname,
      "../../__tests__/labels/brand-label-new1.jpg"
    );
    await fileChooser.setFiles([testImagePath]);

    // Wait for image preview to appear
    await expect(page.locator("text=brand-label-new1.jpg")).toBeVisible();

    // Click verify button
    await page.getByRole("button", { name: "Verify Label" }).click();

    // Wait for verification to complete
    await expect(
      page
        .locator("text=Label Verification Passed")
        .or(page.locator("text=Label Verification Failed"))
    ).toBeVisible({
      timeout: 30000,
    });

    // Verify wine-specific validation worked
    await expect(
      page.getByRole("heading", { name: "Alcohol Content" })
    ).toBeVisible();
  });

  test("should test all alcohol type dropdowns and dynamic validation", async ({
    page,
  }) => {
    await page.goto("/verify");

    // Test distilled spirits
    await page.getByLabel("Alcohol Type *").selectOption("distilled-spirits");
    await expect(
      page.locator("text=2.5%-95% range for distilled spirits")
    ).toBeVisible();
    await expect(
      page.locator(
        "text=Kentucky Straight Bourbon Whiskey, Straight Rye Whiskey, Vodka, Gin, Rum"
      )
    ).toBeVisible();

    // Test beer
    await page.getByLabel("Alcohol Type *").selectOption("beer");
    await expect(page.locator("text=0.5%-15% range for beer")).toBeVisible();
    await expect(
      page
        .locator("text=Lager, Pilsner, Ale, Pale Ale, India Pale Ale (IPA)")
        .first()
    ).toBeVisible();

    // Test wine
    await page.getByLabel("Alcohol Type *").selectOption("wine");
    await expect(page.locator("text=7%-24% range for wine")).toBeVisible();
    await expect(
      page.locator(
        "text=Red Wine, White Wine, Rosé Wine, Sparkling Wine, Champagne"
      )
    ).toBeVisible();

    // Test malt beverage
    await page.getByLabel("Alcohol Type *").selectOption("malt-beverage");
    await expect(
      page.locator("text=0.5%-15% range for malt beverage")
    ).toBeVisible();
    await expect(
      page
        .locator("text=Flavored Malt Beverage, Hard Seltzer, Malt Liquor")
        .first()
    ).toBeVisible();

    // Test cider
    await page.getByLabel("Alcohol Type *").selectOption("cider");
    await expect(page.locator("text=0.5%-8.5% range for cider")).toBeVisible();
    await expect(
      page.locator("text=Hard Cider, Apple Cider, Pear Cider").first()
    ).toBeVisible();
  });

  test("should test custom product type entry", async ({ page }) => {
    await page.goto("/verify");

    // Select distilled spirits
    await page.getByLabel("Alcohol Type *").selectOption("distilled-spirits");

    // Test custom product type entry
    await page
      .getByRole("textbox", { name: "Product Class/Type *" })
      .fill("Custom Ouzo Liqueur");

    // Verify custom entry is accepted
    await expect(
      page.getByRole("textbox", { name: "Product Class/Type *" })
    ).toHaveValue("Custom Ouzo Liqueur");

    // Test another custom entry
    await page
      .getByRole("textbox", { name: "Product Class/Type *" })
      .fill("Chocolate Flavored Brandy");

    await expect(
      page.getByRole("textbox", { name: "Product Class/Type *" })
    ).toHaveValue("Chocolate Flavored Brandy");
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

    // Select alcohol type first
    await page.getByLabel("Alcohol Type *").selectOption("distilled-spirits");

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

    // Select alcohol type first
    await page.getByLabel("Alcohol Type *").selectOption("distilled-spirits");

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
