import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — DrCliniq",
  description:
    "Privacy Policy for DrCliniq — how we collect, use, and protect your personal data. DPDP compliant.",
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
