"use client";

/**
 * FieldVerification Component
 *
 * Displays the verification status of a single field
 */

import React from "react";
import type { FieldVerificationProps } from "@/types/verification";

export default function FieldVerification({
  field,
  detailed = true,
}: FieldVerificationProps) {
  const { status, expected, found, confidence, message } = field;

  // Status icons and colors
  const statusConfig = {
    match: {
      icon: "✓",
      color: "text-success",
      bgColor: "bg-success-lighter",
      label: "Match",
    },
    mismatch: {
      icon: "✗",
      color: "text-error",
      bgColor: "bg-error-lighter",
      label: "Mismatch",
    },
    not_found: {
      icon: "⚠",
      color: "text-warning",
      bgColor: "bg-warning-lighter",
      label: "Not Found",
    },
  };

  const config = statusConfig[status];

  // Format field name
  const fieldNames: Record<string, string> = {
    brandName: "Brand Name",
    productType: "Product Type",
    alcoholContent: "Alcohol Content",
    netContents: "Net Contents",
    governmentWarning: "Government Warning",
  };

  const displayName = fieldNames[field.field] || field.field;

  return (
    <div
      className={`padding-2 border-left-05 border-${
        status === "match" ? "success" : status === "mismatch" ? "error" : "warning"
      } ${config.bgColor} margin-bottom-2`}
    >
      <div className="display-flex flex-align-center">
        <span
          className={`${config.color} text-bold font-sans-lg margin-right-1`}
          aria-label={config.label}
        >
          {config.icon}
        </span>
        <h4 className="margin-0 flex-fill">{displayName}</h4>
        {confidence !== undefined && (
          <span className="text-base text-bold">
            {confidence}%
          </span>
        )}
      </div>

      <p className="margin-top-1 margin-bottom-0 text-base">{message}</p>

      {detailed && (status === "mismatch" || status === "match") && (
        <div className="margin-top-1 font-mono-xs">
          <div className="margin-bottom-05">
            <span className="text-bold">Expected:</span> {expected}
          </div>
          {found && (
            <div>
              <span className="text-bold">Found:</span> {found}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
