"use client";

import { useEffect } from "react";

/**
 * USWDS Initializer Component
 *
 * Initializes USWDS JavaScript components for interactive functionality
 * including banner accordion, navigation menus, and other interactive elements.
 */
export default function USWDSInitializer() {
  useEffect(() => {
    // Simple fallback initialization using basic DOM manipulation
    const initializeBanner = () => {
      // Find all banner buttons and add click handlers
      const bannerButtons = document.querySelectorAll(".usa-banner__button");
      bannerButtons.forEach((button) => {
        button.addEventListener("click", (e) => {
          e.preventDefault();
          const button = e.target as HTMLButtonElement;
          const content = document.getElementById("gov-banner");

          if (content) {
            const isExpanded = button.getAttribute("aria-expanded") === "true";
            const newExpanded = !isExpanded;

            button.setAttribute("aria-expanded", newExpanded.toString());
            content.hidden = !newExpanded;

            // Update button text
            const buttonText = button.querySelector(".usa-banner__button-text");
            if (buttonText) {
              buttonText.textContent = newExpanded ? "Hide" : "About this demo";
            }
          }
        });
      });

      console.log("Banner initialization completed");
    };

    // Initialize when component mounts
    initializeBanner();
  }, []);

  // This component doesn't render anything
  return null;
}
