import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SiSub: Sinhala Subtitle Converter",
  description:
    "Convert subtitle files to Sinhala using AI-powered translation. Upload an SRT file and get a Sinhala translation in seconds.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="si">
      <head>
        {/* Noto Sans Sinhala for correct rendering of Sinhala script */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Sinhala:wght@400;600;700&family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
