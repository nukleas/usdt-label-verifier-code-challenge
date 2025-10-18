import type { Metadata } from "next";
import "./uswds.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "TTB Label Verification - Alcohol and Tobacco Tax and Trade Bureau",
  description:
    "AI-Powered Alcohol Label Verification Application for TTB Compliance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
