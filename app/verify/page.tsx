"use client";

/**
 * Verification Page
 *
 * Main page for TTB label verification
 * Combines form, image upload, and results display
 * Enhanced with TTB-inspired styling and navigation
 */

import React, { useState, useCallback } from "react";
import Image from "next/image";
import {
  GridContainer,
  Grid,
  Alert,
  Link,
  Accordion,
  Banner,
} from "@trussworks/react-uswds";
import LabelForm from "@/components/verification/LabelForm";
import VerificationResults from "@/components/verification/VerificationResults";
import LoadingState from "@/components/verification/LoadingState";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import Breadcrumb from "@/components/layout/Breadcrumb";
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
      <Banner>
        <div className="usa-accordion">
          <header className="usa-banner__header">
            <div className="usa-banner__inner">
              <div className="grid-col-auto">
                <Image
                  className="usa-banner__header-flag"
                  src="/img/us_flag_small.png"
                  alt="U.S. flag"
                  width={16}
                  height={11}
                />
              </div>
              <div className="grid-col-fill tablet:grid-col-auto">
                <p className="usa-banner__header-text">
                  <strong>DEMONSTRATION APPLICATION</strong> - This is not an
                  official government website
                </p>
                <p className="usa-banner__header-action" aria-hidden="true">
                  TTB Label Verification Demo
                </p>
              </div>
              <button
                className="usa-accordion__button usa-banner__button"
                aria-expanded="false"
                aria-controls="gov-banner"
              >
                <span className="usa-banner__button-text">About this demo</span>
              </button>
            </div>
          </header>
          <div
            className="usa-banner__content usa-accordion__content"
            id="gov-banner"
            hidden
          >
            <div className="grid-row grid-gap-lg">
              <div className="usa-banner__guidance tablet:grid-col-6">
                <Image
                  className="usa-banner__icon usa-media-block__img"
                  src="/img/icon-dot-gov.svg"
                  role="img"
                  alt=""
                  aria-hidden="true"
                  width={24}
                  height={24}
                />
                <div className="usa-media-block__body">
                  <p>
                    <strong>This is a demo application.</strong>
                    <br />
                    This application simulates the TTB label verification
                    process for educational and testing purposes.
                  </p>
                </div>
              </div>
              <div className="usa-banner__guidance tablet:grid-col-6">
                <Image
                  className="usa-banner__icon usa-media-block__img"
                  src="/img/icon-https.svg"
                  role="img"
                  alt=""
                  aria-hidden="true"
                  width={24}
                  height={24}
                />
                <div className="usa-media-block__body">
                  <p>
                    <strong>Built with USWDS.</strong>
                    <br />
                    This application uses the U.S. Web Design System to ensure
                    accessibility and consistency with government design
                    standards.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Banner>

      <SiteHeader currentPath="/verify" />

      <main id="main-content">
        <GridContainer className="padding-y-2">
          {/* Breadcrumb Navigation */}
          <Breadcrumb
            items={[
              { label: "Home", href: "/" },
              { label: "Label Verification" },
            ]}
          />

          {/* Page Header Section */}
          <div className="margin-bottom-4">
            <h1 className="margin-top-0">Alcohol Label Verification</h1>
            <p className="usa-intro">
              Upload an image of your alcohol beverage label and enter the
              corresponding form information. Our system will verify if the
              label matches your submission using optical character recognition
              and text matching algorithms.
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
              <div className="verification-form margin-bottom-4">
                <LabelForm
                  onSubmit={handleSubmit}
                  loading={loading}
                  onReset={handleReset}
                />
              </div>
            </Grid>

            {/* Right Column - Instructions / Loading / Results */}
            <Grid tablet={{ col: 12 }} desktop={{ col: 6 }}>
              <div className="verification-content-area">
                {/* Instructions (Initial State) */}
                {!result && !loading && (
                  <div className="margin-bottom-4">
                    <div className="bg-base-lightest padding-4 border-1px border-base-lighter margin-bottom-4">
                      <h3 className="margin-top-0 margin-bottom-3">
                        Quick Start
                      </h3>
                      <ol className="usa-list margin-bottom-3">
                        <li>
                          <strong>Enter Label Information:</strong> Fill in the
                          brand name, product type, and alcohol content exactly
                          as they appear on your label.
                        </li>
                        <li>
                          <strong>Upload Label Image:</strong> Select a clear
                          image of your alcohol label (JPEG, PNG, or WebP
                          format).
                        </li>
                        <li>
                          <strong>Verify:</strong> Click &ldquo;Verify
                          Label&rdquo; to process your submission.
                        </li>
                      </ol>

                      <h4 className="margin-bottom-2">
                        Tips for Best Results:
                      </h4>
                      <ul className="usa-list">
                        <li>Use a high-quality, well-lit image</li>
                        <li>Ensure all text is clearly visible</li>
                        <li>Image should be at least 800x600 pixels</li>
                      </ul>
                    </div>

                    {/* Additional Information - More Compact */}
                    <Accordion
                      items={[
                        {
                          title: "How the Verification Process Works",
                          content: (
                            <div className="padding-2">
                              <ol className="usa-list">
                                <li>
                                  <strong>Text Extraction:</strong> Our OCR
                                  system extracts all readable text from your
                                  label image, including text in various
                                  orientations.
                                </li>
                                <li>
                                  <strong>Field Matching:</strong> We compare
                                  the extracted text against your form data
                                  using fuzzy matching algorithms to account for
                                  minor variations.
                                </li>
                                <li>
                                  <strong>Compliance Checking:</strong> The
                                  system verifies required elements like
                                  government warning statements and regulatory
                                  compliance.
                                </li>
                                <li>
                                  <strong>Results Display:</strong> You receive
                                  detailed results showing which fields match,
                                  mismatch, or were not found.
                                </li>
                              </ol>
                            </div>
                          ),
                          id: "process-overview",
                          headingLevel: "h4",
                          expanded: false,
                        },
                        {
                          title: "About This Tool",
                          content: (
                            <div className="padding-2">
                              <p>
                                This demonstration application simulates the TTB
                                label verification process for educational and
                                testing purposes. It uses optical character
                                recognition (OCR) technology to extract text
                                from alcohol label images and compares it
                                against submitted form data.
                              </p>
                              <p>
                                <strong>Important:</strong> This is not an
                                official TTB tool. For actual label approval
                                services, visit{" "}
                                <Link
                                  href="https://www.ttb.gov"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  ttb.gov
                                </Link>
                                .
                              </p>
                            </div>
                          ),
                          id: "about-tool",
                          headingLevel: "h4",
                          expanded: false,
                        },
                      ]}
                    />
                  </div>
                )}

                {/* Loading State */}
                {loading && (
                  <div>
                    <LoadingState
                      message="Processing label image with OCR..."
                      progress={progress}
                    />
                  </div>
                )}

                {/* Results */}
                {result && !loading && (
                  <VerificationResults
                    result={result}
                    onReset={handleReset}
                    imageFile={imageFile || undefined}
                  />
                )}
              </div>
            </Grid>
          </Grid>
        </GridContainer>
      </main>

      <SiteFooter />
    </>
  );
}
