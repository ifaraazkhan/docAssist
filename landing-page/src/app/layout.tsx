import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DrCliniq — AI-Powered WhatsApp Automation for Indian Clinics",
  description:
    "Smart protocol auto-replies, AI triage, Hindi + English support, and morning briefings — all on WhatsApp. Built exclusively for Indian doctors.",
  keywords: [
    "WhatsApp automation",
    "clinic management",
    "doctor WhatsApp",
    "India healthcare",
    "AI clinic",
    "DrCliniq",
    "medical protocols",
  ],
  openGraph: {
    title: "DrCliniq — Your Clinic, Intelligent",
    description:
      "AI-powered WhatsApp automation built exclusively for Indian doctors.",
    type: "website",
    locale: "en_IN",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0d9488",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`scroll-smooth ${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
