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
  title: "DrCliniq — AI Chatbot & LLM-Powered WhatsApp Automation for Indian Clinics",
  description:
    "AI chatbot for doctors — auto-reply to patient WhatsApp messages using LLM-powered protocols. Hindi + English support, smart triage, appointment booking & morning briefings. Built for Indian clinics.",
  keywords: [
    "AI chatbot for doctors",
    "LLM healthcare India",
    "WhatsApp automation clinic",
    "AI medical chatbot",
    "doctor WhatsApp bot",
    "clinic AI assistant",
    "patient WhatsApp automation",
    "AI triage chatbot",
    "DrCliniq",
    "medical protocol automation",
    "healthcare LLM",
    "AI clinic management",
    "WhatsApp Business API healthcare",
    "Hindi medical chatbot",
    "India clinic software",
    "AI appointment booking",
    "DPDP compliant healthcare AI",
    "NMC compliant chatbot",
  ],
  openGraph: {
    title: "DrCliniq — AI Chatbot for Indian Clinics on WhatsApp",
    description:
      "LLM-powered WhatsApp automation — auto-replies, AI triage, Hindi support & appointment booking. Built exclusively for Indian doctors.",
    type: "website",
    locale: "en_IN",
    siteName: "DrCliniq",
  },
  twitter: {
    card: "summary_large_image",
    title: "DrCliniq — AI Chatbot & LLM-Powered WhatsApp Automation",
    description:
      "Auto-reply to patient WhatsApp messages using AI. Hindi + English, smart triage, appointment booking. Built for Indian clinics.",
  },
  alternates: {
    canonical: "https://drcliniq.in",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  other: {
    "google-site-verification": "",
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
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
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
