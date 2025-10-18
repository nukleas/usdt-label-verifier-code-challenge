import {
  Button,
  Grid,
  GridContainer,
  Header,
  Footer,
  FooterNav,
  Link,
  Banner,
} from "@trussworks/react-uswds";
import Image from "next/image";

export default function Home() {
  return (
    <>
      <a className="usa-skipnav" href="#main-content">
        Skip to main content
      </a>

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
                  TTB Label Verification System
                </p>
                <p className="usa-banner__header-action" aria-hidden="true">
                  Demo Application
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

      <Header basic>
        <div className="usa-nav-container">
          <div className="usa-navbar">
            <div className="usa-logo" id="basic-logo">
              <em className="usa-logo__text">
                <Link
                  href="/"
                  title="Home"
                  aria-label="TTB Label Verification home"
                >
                  TTB Label Verification
                </Link>
              </em>
            </div>
            <button type="button" className="usa-menu-btn">
              Menu
            </button>
          </div>
          <nav role="navigation" className="usa-nav">
            <ul className="usa-nav__primary usa-accordion">
              <li className="usa-nav__primary-item">
                <a className="usa-nav__link" href="#">
                  <span>Home</span>
                </a>
              </li>
              <li className="usa-nav__primary-item">
                <a className="usa-nav__link" href="#">
                  <span>About</span>
                </a>
              </li>
              <li className="usa-nav__primary-item">
                <a className="usa-nav__link" href="#">
                  <span>Contact</span>
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </Header>

      <main id="main-content">
        <section className="usa-hero">
          <GridContainer>
            <div className="usa-hero__callout">
              <h1 className="usa-hero__heading">
                <span className="usa-hero__heading--alt">
                  TTB Label Verification:
                </span>{" "}
                AI-Powered Alcohol Label Compliance
              </h1>
              <p className="usa-hero__text">
                Verify alcohol labels using advanced AI technology to ensure
                compliance with TTB (Alcohol and Tobacco Tax and Trade Bureau)
                regulations.
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
                <h2>How it works</h2>
                <ol className="usa-list">
                  <li>Upload an image of an alcohol label</li>
                  <li>Our AI analyzes the label for TTB compliance</li>
                  <li>
                    Receive detailed verification results and recommendations
                  </li>
                </ol>
              </Grid>
              <Grid tablet={{ col: 6 }}>
                <h2>Features</h2>
                <ul className="usa-list">
                  <li>OCR text extraction from label images</li>
                  <li>TTB regulatory compliance checking</li>
                  <li>Batch processing capabilities</li>
                  <li>Detailed compliance reports</li>
                </ul>
              </Grid>
            </Grid>
          </GridContainer>
        </section>
      </main>

      <Footer
        size="slim"
        primary={
          <FooterNav
            links={[
              <Link href="https://nextjs.org/learn" key="learn">
                Learn
              </Link>,
              <Link href="https://vercel.com/templates" key="examples">
                Examples
              </Link>,
              <Link href="https://nextjs.org" key="nextjs">
                Next.js →
              </Link>,
            ]}
          />
        }
        secondary={
          <div className="usa-footer__contact-info">
            <p className="usa-footer__contact-heading">
              TTB Label Verification - Alcohol and Tobacco Tax and Trade Bureau
            </p>
          </div>
        }
      />
    </>
  );
}
