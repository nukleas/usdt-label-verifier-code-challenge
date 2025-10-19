"use client";

/**
 * Verification Page
 *
 * Main page for TTB label verification
 * Combines form, image upload, and results display
 */

import React, { useState, useCallback } from "react";
import {
  GridContainer,
  Grid,
  Alert,
  Header,
  Footer,
  FooterNav,
  Link,
} from "@trussworks/react-uswds";
import LabelForm from "@/components/verification/LabelForm";
import VerificationResults from "@/components/verification/VerificationResults";
import LoadingState from "@/components/verification/LoadingState";
import type { LabelFormData, VerificationResult } from "@/types/verification";

export default function VerifyPage() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  /**
   * Handles form submission and verification
   */
  const handleSubmit = useCallback(
    async (formData: LabelFormData, image: File) => {
      setLoading(true);
      setProgress(0);
      setError(null);
      setResult(null);
      setImageFile(image); // Store image file for canvas visualization

      try {
        // Create FormData for API request
        const body = new FormData();
        body.append("brandName", formData.brandName);
        body.append("productType", formData.productType);
        body.append("alcoholContent", formData.alcoholContent);
        if (formData.netContents) {
          body.append("netContents", formData.netContents);
        }
        body.append("image", image);

        // Simulate progress (OCR happens on server)
        const progressInterval = setInterval(() => {
          setProgress((prev) => Math.min(prev + 0.1, 0.9));
        }, 200);

        // Call OCR API
        const response = await fetch("/api/verify", {
          method: "POST",
          body,
        });

        clearInterval(progressInterval);
        setProgress(1);

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Verification failed");
        }

        if (data.success) {
          setResult(data.result);
        } else {
          throw new Error(data.error || "Unknown error");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Resets the page for a new verification
   */
  const handleReset = useCallback(() => {
    setResult(null);
    setError(null);
    setProgress(0);
    setImageFile(null);
  }, []);

  return (
    <>
      <Header basic>
        <div className="usa-nav-container">
          <div className="usa-navbar">
            <div className="usa-logo" id="basic-logo">
              <em className="usa-logo__text">
                <Link
                  href="/"
                  title="Home"
                  aria-label="TTB Label Verification home"
                >
                  TTB Label Verification
                </Link>
              </em>
            </div>
          </div>
        </div>
      </Header>

      <main id="main-content">
        <GridContainer className="padding-y-4">
          {/* Page Header */}
          <div className="margin-bottom-4">
            <h1 className="margin-top-0">Alcohol Label Verification</h1>
            <p className="usa-intro">
              Upload an image of your alcohol beverage label and enter the
              corresponding form information. Our system will verify if the
              label matches your submission.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert type="error" heading="Verification Error" headingLevel="h2">
              {error}
            </Alert>
          )}

          {/* Main Content - Two Column Layout */}
          <Grid row gap>
            {/* Left Column - Form (Always Visible) */}
            <Grid tablet={{ col: 12 }} desktop={{ col: 6 }}>
              <LabelForm
                onSubmit={handleSubmit}
                loading={loading}
                onReset={handleReset}
              />
            </Grid>

            {/* Right Column - Instructions / Loading / Results */}
            <Grid tablet={{ col: 12 }} desktop={{ col: 6 }}>
              {/* Instructions (Initial State) */}
              {!result && !loading && (
                <div className="bg-base-lightest padding-3 border-1px border-base-lighter">
                  <h3 className="margin-top-0">Instructions</h3>
                  <ol className="usa-list">
                    <li>
                      <strong>Enter Label Information:</strong> Fill in the
                      brand name, product type, and alcohol content as they
                      appear on your label.
                    </li>
                    <li>
                      <strong>Upload Label Image:</strong> Select a clear image
                      of your alcohol label (JPEG, PNG, or WebP format).
                    </li>
                    <li>
                      <strong>Verify:</strong> Click &ldquo;Verify Label&rdquo;
                      to process your submission.
                    </li>
                    <li>
                      <strong>Review Results:</strong> Check if your label
                      matches the form data and review any discrepancies.
                    </li>
                  </ol>

                  <h4>Tips for Best Results:</h4>
                  <ul className="usa-list">
                    <li>Use a high-quality, well-lit image</li>
                    <li>Ensure all text is clearly visible</li>
                    <li>Avoid glare or reflections on the label</li>
                    <li>Image should be at least 800x600 pixels</li>
                  </ul>
                </div>
              )}

              {/* Loading State */}
              {loading && (
                <LoadingState
                  message="Processing label image with OCR..."
                  progress={progress}
                />
              )}

              {/* Results */}
              {result && !loading && (
                <VerificationResults
                  result={result}
                  onReset={handleReset}
                  imageFile={imageFile || undefined}
                />
              )}
            </Grid>
          </Grid>
        </GridContainer>
      </main>

      <Footer
        size="slim"
        primary={
          <FooterNav
            links={[
              <Link href="/" key="home">
                Home
              </Link>,
              <Link
                href="https://www.ttb.gov"
                key="ttb"
                target="_blank"
                rel="noopener noreferrer"
              >
                TTB.gov
              </Link>,
              <Link
                href="https://github.com"
                key="github"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </Link>,
            ]}
          />
        }
        secondary={
          <div className="usa-footer__contact-info">
            <p className="usa-footer__contact-heading">
              TTB Label Verification - Automated Compliance Tool
            </p>
          </div>
        }
      />
    </>
  );
}
