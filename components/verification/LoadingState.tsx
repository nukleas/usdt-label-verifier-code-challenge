"use client";

/**
 * LoadingState Component
 *
 * Displays a loading indicator with optional progress bar
 */

import React from "react";
import type { LoadingStateProps } from "@/types/verification";

export default function LoadingState({
  message = "Processing image...",
  progress,
}: LoadingStateProps) {
  return (
    <div className="loading-state margin-top-4 padding-4 bg-base-lightest border-1px border-base-lighter text-center">
      {/* Spinner */}
      <div className="display-flex flex-justify-center margin-bottom-2">
        <div
          className="spinner-border"
          role="status"
          style={{
            width: "3rem",
            height: "3rem",
            border: "0.25em solid currentColor",
            borderRightColor: "transparent",
            borderRadius: "50%",
            animation: "spin 0.75s linear infinite",
          }}
        >
          <span className="usa-sr-only">Loading...</span>
        </div>
      </div>

      {/* Message */}
      <p className="text-bold margin-top-0">{message}</p>

      {/* Progress Bar */}
      {progress !== undefined && (
        <div className="margin-top-2">
          <div
            className="bg-base-lighter"
            style={{
              height: "8px",
              borderRadius: "4px",
              overflow: "hidden",
              width: "100%",
              maxWidth: "400px",
              margin: "0 auto",
            }}
          >
            <div
              className="bg-primary"
              style={{
                height: "100%",
                width: `${Math.round(progress * 100)}%`,
                transition: "width 0.3s ease",
              }}
              role="progressbar"
              aria-valuenow={Math.round(progress * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <p className="text-base margin-top-1">
            {Math.round(progress * 100)}%
          </p>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
