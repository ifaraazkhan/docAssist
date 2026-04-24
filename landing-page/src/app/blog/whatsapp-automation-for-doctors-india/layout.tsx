import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "WhatsApp Automation for Doctors in India: Complete 2026 Guide — DrCliniq",
  description:
    "Learn how Indian doctors use AI-powered WhatsApp automation to auto-reply to patients, book appointments, and handle 80% of queries automatically. Step-by-step guide.",
  keywords: [
    "WhatsApp automation for doctors",
    "doctor WhatsApp bot India",
    "clinic WhatsApp automation",
    "auto reply WhatsApp doctor",
    "WhatsApp Business API healthcare India",
    "patient WhatsApp automation",
  ],
  openGraph: {
    title: "WhatsApp Automation for Doctors in India: Complete 2026 Guide",
    description: "How Indian doctors handle 80% of patient queries automatically using AI WhatsApp automation.",
    type: "article",
    locale: "en_IN",
  },
  alternates: {
    canonical: "https://drcliniq.in/blog/whatsapp-automation-for-doctors-india",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
