"use client";

/**
 * LabelCanvas Component
 *
 * Renders the label image on a canvas and draws colored bounding boxes
 * around detected text fields for visual verification.
 */

import React, { useEffect, useRef, useState } from "react";
import type { FieldVerification } from "@/types/verification";

interface LabelCanvasProps {
  /** Image file to render */
  imageFile: File;
  /** Field verifications with bbox data */
  fieldVerifications: FieldVerification[];
}

// Field color mappings for bounding boxes
const FIELD_COLORS: Record<string, string> = {
  brandName: "#2e8bc0", // Blue
  productType: "#00a91c", // Green
  alcoholContent: "#ff7e23", // Orange
  netContents: "#8168b3", // Purple
  governmentWarning: "#ffbe2e", // Gold
};

// Field display names for legend
const FIELD_LABELS: Record<string, string> = {
  brandName: "Brand Name",
  productType: "Product Type",
  alcoholContent: "Alcohol Content",
  netContents: "Net Contents",
  governmentWarning: "Government Warning",
};

export default function LabelCanvas({
  imageFile,
  fieldVerifications,
}: LabelCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Load image from file
    const img = new Image();
    const imageUrl = URL.createObjectURL(imageFile);

    img.onload = () => {
      // Set canvas size to match image
      const maxWidth = 800; // Max canvas width
      const scale = Math.min(1, maxWidth / img.width);
      const canvasWidth = img.width * scale;
      const canvasHeight = img.height * scale;

      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      setImageDimensions({ width: img.width, height: img.height });

      // Draw image on canvas
      ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);

      // Draw bounding boxes for each field
      for (const field of fieldVerifications) {
        if (!field.bboxes || field.bboxes.length === 0) continue;

        const color = FIELD_COLORS[field.field] || "#666666";
        ctx.strokeStyle = color;
        ctx.fillStyle = color + "33"; // Semi-transparent fill
        ctx.lineWidth = 3;

        // Draw each bounding box for this field
        for (const bbox of field.bboxes) {
          // Scale bbox coordinates to canvas size
          const x = bbox.x0 * scale;
          const y = bbox.y0 * scale;
          const width = (bbox.x1 - bbox.x0) * scale;
          const height = (bbox.y1 - bbox.y0) * scale;

          // Draw filled rectangle
          ctx.fillRect(x, y, width, height);

          // Draw border
          ctx.strokeRect(x, y, width, height);
        }
      }

      setImageLoaded(true);
      URL.revokeObjectURL(imageUrl); // Clean up
    };

    img.onerror = () => {
      console.error("Failed to load image for canvas");
      URL.revokeObjectURL(imageUrl);
    };

    img.src = imageUrl;

    // Cleanup
    return () => {
      URL.revokeObjectURL(imageUrl);
    };
  }, [imageFile, fieldVerifications]);

  // Get fields that have bboxes
  const fieldsWithBboxes = fieldVerifications.filter(
    (f) => f.bboxes && f.bboxes.length > 0
  );

  return (
    <div className="label-canvas-container">
      <canvas
        ref={canvasRef}
        className="border-1px border-base-light"
        style={{
          maxWidth: "100%",
          height: "auto",
          display: "block",
        }}
      />

      {imageLoaded && fieldsWithBboxes.length > 0 && (
        <div className="margin-top-2">
          <h5 className="margin-bottom-1">Legend:</h5>
          <div className="grid-row grid-gap-1">
            {fieldsWithBboxes.map((field) => (
              <div
                key={field.field}
                className="grid-col-auto display-flex flex-align-center margin-bottom-1"
              >
                <div
                  style={{
                    width: "20px",
                    height: "20px",
                    backgroundColor: FIELD_COLORS[field.field] || "#666666",
                    marginRight: "8px",
                    border: "1px solid #333",
                  }}
                />
                <span className="font-sans-3xs">
                  {FIELD_LABELS[field.field] || field.field}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {imageLoaded && fieldsWithBboxes.length === 0 && (
        <div className="usa-alert usa-alert--info usa-alert--slim margin-top-2">
          <div className="usa-alert__body">
            <p className="usa-alert__text">
              No text regions were detected for highlighting. This may occur if
              the OCR confidence was low or if the text matching did not find
              precise locations.
            </p>
          </div>
        </div>
      )}

      {!imageLoaded && (
        <div className="margin-top-2 text-center text-base-light">
          Loading image...
        </div>
      )}
    </div>
  );
}
