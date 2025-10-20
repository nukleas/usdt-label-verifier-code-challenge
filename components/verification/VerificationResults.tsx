"use client";

/**
 * VerificationResults Component
 *
 * Displays the complete verification results with all field checks
 */

import React, { useState } from "react";
import { Alert, Button, Accordion } from "@trussworks/react-uswds";
import type { VerificationResultsProps } from "../../types/verification";
import FieldVerification from "./FieldVerification";
import LabelCanvas from "./LabelCanvas";
import { getRequiredFields } from "../../lib/constants";

export default function VerificationResults({
  result,
  onReset,
  imageFile,
  alcoholType,
}: VerificationResultsProps) {
  const [showRawText] = useState(false);
  const [showCanvas] = useState(false);

  const {
    overallStatus,
    fields,
    rawOCRText,
    processingTime,
    ocrBlocks,
  } = result;

  // Separate required and optional fields based on alcohol type
  const requiredFieldNames = getRequiredFields(alcoholType);
  const requiredFields = fields.filter((f) =>
    requiredFieldNames.includes(f.field)
  );
  const optionalFields = fields.filter(
    (f) => !requiredFieldNames.includes(f.field)
  );

  return (
    <div className="verification-results margin-top-4">
      {/* Overall Status Alert */}
      <Alert
        type={overallStatus === "pass" ? "success" : "error"}
        heading={
          overallStatus === "pass"
            ? "Label Verification Passed"
            : "Label Verification Failed"
        }
        headingLevel="h2"
      >
        {overallStatus === "pass" ? (
          <span>
            ✓ The label matches the form data. All required information is
            consistent.
          </span>
        ) : (
          <span>
            ✗ The label does not match the form data. Please review the
            discrepancies below.
          </span>
        )}
        <br />
        <span className="text-base margin-top-1">
          Processing time: {(processingTime / 1000).toFixed(2)}s
        </span>
      </Alert>

      {/* Required Fields */}
      <div className="margin-top-4">
        <h3 className="margin-bottom-2">Required Fields</h3>
        {requiredFields.map((field, index) => (
          <FieldVerification key={index} field={field} detailed={true} />
        ))}
      </div>

      {/* Optional Fields */}
      {optionalFields.length > 0 && (
        <div className="margin-top-4">
          <h3 className="margin-bottom-2">Additional Checks</h3>
          {optionalFields.map((field, index) => (
            <FieldVerification key={index} field={field} detailed={true} />
          ))}
        </div>
      )}

      {/* Label Visualization (Collapsible) */}
      {imageFile && (
        <div className="margin-top-4">
          <Accordion
            items={[
              {
                title: "View Detected Fields on Label",
                content: (
                  <div className="padding-2 bg-base-lightest">
                    <p className="font-sans-xs margin-top-0 margin-bottom-2">
                      The image below shows the label with highlighted regions
                      where each field was detected. Colors correspond to
                      different field types.
                    </p>
                    <LabelCanvas
                      imageFile={imageFile}
                      fieldVerifications={fields}
                    />
                  </div>
                ),
                expanded: showCanvas,
                id: "label-canvas",
                headingLevel: "h4",
              },
            ]}
          />
        </div>
      )}

      {/* Raw OCR Text and Blocks (Collapsible) */}
      <div className="margin-top-4">
        <Accordion
          items={[
            {
              title: "View Extracted Text from Label",
              content: (
                <div className="padding-2 bg-base-lightest">
                  <h5 className="margin-top-0">Full Text:</h5>
                  <pre
                    className="font-mono-xs padding-2 bg-white border-1px border-base-light"
                    style={{ whiteSpace: "pre-wrap" }}
                  >
                    {rawOCRText || "No text extracted"}
                  </pre>

                  {ocrBlocks && ocrBlocks.length > 0 && (
                    <>
                      <h5 className="margin-top-3">
                        Detected Words ({ocrBlocks.length} words):
                      </h5>
                      <p className="font-sans-3xs text-base-dark margin-top-05">
                        Individual words extracted from the label with
                        confidence scores and locations. Keywords are
                        highlighted for verification matching.
                      </p>
                      <div
                        className="usa-table-container--scrollable margin-top-2"
                        style={{ maxHeight: "400px" }}
                      >
                        <table className="usa-table usa-table--borderless usa-table--striped">
                          <thead>
                            <tr>
                              <th scope="col">#</th>
                              <th scope="col">Word</th>
                              <th scope="col">Confidence</th>
                              <th scope="col">Location (x,y)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {ocrBlocks.map((block, idx) => {
                              const text = block.text.trim();
                              const isKeyword =
                                /alc|vol|abv|alcohol|%|proof/i.test(text);
                              return (
                                <tr
                                  key={idx}
                                  className={isKeyword ? "bg-gold-10" : ""}
                                >
                                  <td>{idx + 1}</td>
                                  <td className="font-mono-xs">
                                    {text || "(empty)"}
                                    {isKeyword && (
                                      <span className="usa-tag usa-tag--big margin-left-1 bg-gold text-ink">
                                        KEY
                                      </span>
                                    )}
                                  </td>
                                  <td>
                                    <span
                                      className={
                                        block.confidence >= 80
                                          ? "text-green"
                                          : block.confidence >= 60
                                          ? "text-gold"
                                          : "text-red"
                                      }
                                    >
                                      {block.confidence.toFixed(1)}%
                                    </span>
                                  </td>
                                  <td className="font-mono-2xs">
                                    ({block.bbox.x0}, {block.bbox.y0})
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              ),
              expanded: showRawText,
              id: "raw-text",
              headingLevel: "h4",
            },
          ]}
        />
      </div>

      {/* Actions */}
      {onReset && (
        <div className="margin-top-4">
          <Button type="button" onClick={onReset}>
            Verify Another Label
          </Button>
        </div>
      )}
    </div>
  );
}
