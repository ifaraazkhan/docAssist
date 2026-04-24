import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DPDP Act Compliance for Clinics: What Every Indian Doctor Must Know — DrCliniq",
  description:
    "Practical DPDP Act 2023 compliance guide for Indian clinics. Covers patient consent, data storage, WhatsApp communication, penalties, and a ready-to-use checklist.",
  keywords: [
    "DPDP compliance clinic",
    "DPDP Act doctor India",
    "digital personal data protection clinic",
    "patient data privacy India",
    "DPDP healthcare",
    "clinic data compliance India",
    "DPDP Act 2023 healthcare",
  ],
  openGraph: {
    title: "DPDP Act Compliance for Clinics: What Every Indian Doctor Must Know",
    description: "Practical DPDP compliance checklist for Indian clinics — consent, data storage, WhatsApp, and penalties.",
    type: "article",
    locale: "en_IN",
  },
  alternates: {
    canonical: "https://drcliniq.in/blog/dpdp-compliance-clinics-guide",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
