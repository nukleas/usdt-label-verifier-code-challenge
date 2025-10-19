"use client";

/**
 * SiteHeader Component
 *
 * Shared header component with consistent navigation across all pages
 * Inspired by TTB's navigation patterns while maintaining USWDS compliance
 */

import React from "react";
import { NavMenuButton, PrimaryNav } from "@trussworks/react-uswds";
import Link from "next/link";

interface SiteHeaderProps {
  currentPath?: string;
}

export default function SiteHeader({ currentPath = "/" }: SiteHeaderProps) {
  const primaryNavItems = [
    <Link
      key="home"
      href="/"
      className={`usa-nav__link ${currentPath === "/" ? "usa-current" : ""}`}
    >
      <span>Home</span>
    </Link>,
    <Link
      key="verify"
      href="/verify"
      className={`usa-nav__link ${
        currentPath === "/verify" ? "usa-current" : ""
      }`}
    >
      <span>Verify Label</span>
    </Link>,
  ];

  return (
    <header className="usa-header usa-header--basic usa-header--full-width">
      <div className="usa-nav-container">
        <div className="usa-navbar">
          <div className="usa-logo" id="basic-logo">
            <em className="usa-logo__text">
              <Link
                href="/"
                title="Home"
                aria-label="TTB Label Verification Demo home"
                className="usa-logo__text-link"
              >
                <span className="usa-logo__text-primary">TTB</span>
                <span className="usa-logo__text-secondary">
                  Label Verification
                </span>
                <span className="usa-logo__text-demo">Demo</span>
              </Link>
            </em>
          </div>
          <NavMenuButton
            label="Menu"
            onClick={() => {
              // Mobile menu toggle handled by USWDS
            }}
          />
        </div>
        <nav role="navigation" className="usa-nav">
          <div className="usa-nav__inner">
            <button
              className="usa-nav__close"
              onClick={() => {
                // Mobile menu close handled by USWDS
              }}
            >
              <img
                src="/img/close.svg"
                alt="close"
                role="img"
                aria-hidden="true"
              />
            </button>
            <PrimaryNav items={primaryNavItems} />
          </div>
        </nav>
      </div>
    </header>
  );
}
