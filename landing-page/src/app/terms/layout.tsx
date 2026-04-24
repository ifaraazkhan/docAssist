import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — DrCliniq",
  description:
    "Terms of Service for DrCliniq — AI-powered WhatsApp automation for Indian clinics.",
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
