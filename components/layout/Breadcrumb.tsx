"use client";

/**
 * Breadcrumb Component
 *
 * Navigation breadcrumb component following USWDS patterns
 */

import React from "react";
import Link from "next/link";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="usa-breadcrumb" aria-label="Breadcrumb">
      <ol className="usa-breadcrumb__list">
        {items.map((item, index) => (
          <li key={index} className="usa-breadcrumb__list-item">
            {item.href && index < items.length - 1 ? (
              <Link href={item.href} className="usa-breadcrumb__link">
                {item.label}
              </Link>
            ) : (
              <span className="usa-breadcrumb__current" aria-current="page">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
