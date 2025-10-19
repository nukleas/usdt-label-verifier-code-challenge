"use client";

/**
 * SiteFooter Component
 *
 * Shared footer component with comprehensive links and government-style organization
 * Uses USWDS medium footer variant for professional appearance
 */

import React from "react";
import {
  Footer,
  FooterNav,
  Link,
  Grid,
  GridContainer,
} from "@trussworks/react-uswds";

export default function SiteFooter() {
  const primaryLinks = [
    <Link href="/" key="home">
      Home
    </Link>,
    <Link href="/verify" key="verify">
      Verify Label
    </Link>,
    <Link
      href="https://www.ttb.gov"
      key="ttb"
      target="_blank"
      rel="noopener noreferrer"
    >
      Official TTB Website
    </Link>,
    <Link
      href="https://www.ttb.gov/about-ttb/accessibility"
      key="accessibility"
      target="_blank"
      rel="noopener noreferrer"
    >
      Accessibility
    </Link>,
  ];

  const secondaryLinks = [
    <Link
      href="https://www.ttb.gov/contact"
      key="contact"
      target="_blank"
      rel="noopener noreferrer"
    >
      Contact TTB
    </Link>,
    <Link
      href="https://www.ttb.gov/privacy-policy"
      key="privacy"
      target="_blank"
      rel="noopener noreferrer"
    >
      Privacy Policy
    </Link>,
    <Link
      href="https://www.ttb.gov/foia"
      key="foia"
      target="_blank"
      rel="noopener noreferrer"
    >
      FOIA
    </Link>,
  ];

  return (
    <Footer
      size="medium"
      primary={<FooterNav links={primaryLinks} size="medium" />}
      secondary={
        <div className="usa-footer__contact-info">
          <div className="usa-footer__contact-heading">
            TTB Label Verification Tool
          </div>
          <p className="usa-footer__contact-text">
            This is a demonstration application for educational and testing
            purposes.
            <br />
            For official TTB services, visit{" "}
            <Link
              href="https://www.ttb.gov"
              target="_blank"
              rel="noopener noreferrer"
            >
              ttb.gov
            </Link>
          </p>
        </div>
      }
    >
      <GridContainer>
        <Grid row>
          <Grid tablet={{ col: 12 }}>
            <div className="usa-footer__secondary-section">
              <div className="grid-row grid-gap">
                <div className="tablet:grid-col-8">
                  <FooterNav links={secondaryLinks} size="medium" />
                </div>
                <div className="tablet:grid-col-4">
                  <div className="usa-footer__contact-info">
                    <p className="usa-footer__contact-text">
                      Built with the U.S. Web Design System
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Grid>
        </Grid>
      </GridContainer>
    </Footer>
  );
}
