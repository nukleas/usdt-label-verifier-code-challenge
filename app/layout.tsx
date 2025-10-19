import type { Metadata } from "next";
import "./uswds.css";
import "./globals.scss";

export const metadata: Metadata = {
  title: "TTB Label Verification - Alcohol and Tobacco Tax and Trade Bureau",
  description:
    "Automated Alcohol Label Verification Application for TTB Compliance",
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
