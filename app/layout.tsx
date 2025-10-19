import type { Metadata } from "next";
import "./uswds.css";
import "./globals.css";
import USWDSInitializer from "@/components/USWDSInitializer";

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
      <body>
        <USWDSInitializer />
        {children}
      </body>
    </html>
  );
}
