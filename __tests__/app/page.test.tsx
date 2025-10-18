import { render, screen } from "../utils/test-utils";
import Home from "../../app/page";

// Mock Next.js Link component
jest.mock("next/link", () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

describe("Home Page", () => {
  it("renders the main heading", () => {
    render(<Home />);

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent(
      "TTB Label Verification: AI-Powered Alcohol Label Compliance"
    );
  });

  it("renders the skip navigation link", () => {
    render(<Home />);

    const skipLink = screen.getByText("Skip to main content");
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute("href", "#main-content");
  });

  it("renders the banner with correct content", () => {
    render(<Home />);

    expect(
      screen.getByText("TTB Label Verification System")
    ).toBeInTheDocument();
    expect(screen.getByText("Demo Application")).toBeInTheDocument();
  });

  it("renders the header with TTB branding", () => {
    render(<Home />);

    const logoLink = screen.getByRole("link", {
      name: /TTB Label Verification home/i,
    });
    expect(logoLink).toBeInTheDocument();
    expect(logoLink).toHaveAttribute("href", "/");
  });

  it("renders navigation menu items", () => {
    render(<Home />);

    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("About")).toBeInTheDocument();
    expect(screen.getByText("Contact")).toBeInTheDocument();
  });

  it("renders the hero section with call-to-action", () => {
    render(<Home />);

    expect(
      screen.getByText(/Verify alcohol labels using advanced AI technology/)
    ).toBeInTheDocument();

    const getStartedButton = screen.getByRole("link", { name: /Get Started/i });
    expect(getStartedButton).toBeInTheDocument();
    expect(getStartedButton).toHaveAttribute("href", "/verify");
  });

  it("renders the how it works section", () => {
    render(<Home />);

    expect(screen.getByText("How it works")).toBeInTheDocument();
    expect(
      screen.getByText("Upload an image of an alcohol label")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Our AI analyzes the label for TTB compliance")
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Receive detailed verification results and recommendations"
      )
    ).toBeInTheDocument();
  });

  it("renders the features section", () => {
    render(<Home />);

    expect(screen.getByText("Features")).toBeInTheDocument();
    expect(
      screen.getByText("OCR text extraction from label images")
    ).toBeInTheDocument();
    expect(
      screen.getByText("TTB regulatory compliance checking")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Batch processing capabilities")
    ).toBeInTheDocument();
    expect(screen.getByText("Detailed compliance reports")).toBeInTheDocument();
  });

  it("renders the footer with TTB branding", () => {
    render(<Home />);

    expect(
      screen.getByText(
        "TTB Label Verification - Alcohol and Tobacco Tax and Trade Bureau"
      )
    ).toBeInTheDocument();
  });

  it("has proper accessibility attributes", () => {
    render(<Home />);

    const mainContent = screen.getByRole("main");
    expect(mainContent).toHaveAttribute("id", "main-content");

    // Check that there are navigation elements (header and footer nav)
    const navigations = screen.getAllByRole("navigation");
    expect(navigations).toHaveLength(2);
    expect(navigations[0]).toBeInTheDocument(); // Header nav
    expect(navigations[1]).toBeInTheDocument(); // Footer nav
  });
});
