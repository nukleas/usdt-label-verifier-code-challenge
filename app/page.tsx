import {
  Button,
  Grid,
  GridContainer,
  Link,
  Banner,
} from "@trussworks/react-uswds";
import Image from "next/image";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";

export default function Home() {
  return (
    <>
      <a className="usa-skipnav" href="#main-content">
        Skip to main content
      </a>

      <Banner>
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
                  This application simulates the TTB label verification process
                  for educational and testing purposes.
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
      </Banner>

      <SiteHeader currentPath="/" />

      <main id="main-content">
        <section className="usa-hero">
          <GridContainer>
            <div className="usa-hero__callout">
              <h1 className="usa-hero__heading">
                <span className="usa-hero__heading--alt">
                  TTB Label Verification:
                </span>{" "}
                Automated Alcohol Label Compliance
              </h1>
              <p className="usa-hero__text">
                Verify alcohol labels using OCR and text matching algorithms to
                ensure compliance with TTB (Alcohol and Tobacco Tax and Trade
                Bureau) regulations.
              </p>
              <Link href="/verify">
                <Button type="button" size="big">
                  Get Started
                </Button>
              </Link>
            </div>
          </GridContainer>
        </section>

        <section className="usa-section">
          <GridContainer>
            <Grid row gap>
              <Grid tablet={{ col: 6 }}>
                <h2>How It Works</h2>
                <ol className="usa-list">
                  <li>
                    <strong>Upload Label Image:</strong> Submit a clear image of
                    your alcohol beverage label
                  </li>
                  <li>
                    <strong>Enter Form Data:</strong> Provide the brand name,
                    product type, and alcohol content as they appear on the
                    label
                  </li>
                  <li>
                    <strong>OCR Processing:</strong> Our system extracts text
                    from the image using optical character recognition
                  </li>
                  <li>
                    <strong>Verification:</strong> Compare extracted text
                    against your form data to identify matches and discrepancies
                  </li>
                  <li>
                    <strong>Results:</strong> Receive detailed verification
                    results with field-by-field analysis
                  </li>
                </ol>
              </Grid>
              <Grid tablet={{ col: 6 }}>
                <h2>Key Features</h2>
                <ul className="usa-list">
                  <li>
                    <strong>Multi-Rotation OCR:</strong> Detects text in any
                    orientation (vertical, horizontal, rotated)
                  </li>
                  <li>
                    <strong>Fuzzy Text Matching:</strong> Accounts for minor
                    variations and OCR errors
                  </li>
                  <li>
                    <strong>TTB Compliance Checking:</strong> Verifies required
                    elements like government warning statements
                  </li>
                  <li>
                    <strong>Visual Highlighting:</strong> Shows exactly where
                    each field was detected on the label
                  </li>
                  <li>
                    <strong>Detailed Reporting:</strong> Provides confidence
                    scores and detailed mismatch explanations
                  </li>
                </ul>
              </Grid>
            </Grid>
          </GridContainer>
        </section>

        <section className="usa-section bg-base-lightest">
          <GridContainer>
            <Grid row gap>
              <Grid tablet={{ col: 12 }}>
                <h2>About This Demonstration Tool</h2>
                <p className="usa-intro">
                  This application simulates the Alcohol and Tobacco Tax and
                  Trade Bureau (TTB) label verification process for educational
                  and testing purposes. It demonstrates how automated systems
                  can assist in verifying alcohol beverage label compliance.
                </p>
                <div className="grid-row grid-gap">
                  <div className="tablet:grid-col-6">
                    <h3>Educational Purpose</h3>
                    <p>
                      This tool is designed to help users understand the TTB
                      label verification process and demonstrate modern OCR and
                      text matching technologies.
                    </p>
                  </div>
                  <div className="tablet:grid-col-6">
                    <h3>Not Official TTB Tool</h3>
                    <p>
                      This is not an official TTB application. For actual label
                      approval services, visit{" "}
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
                </div>
              </Grid>
            </Grid>
          </GridContainer>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
