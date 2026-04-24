import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog — DrCliniq | AI WhatsApp Automation for Indian Clinics",
  description:
    "Insights on AI chatbots, LLM healthcare, WhatsApp automation, DPDP compliance, and clinic management for Indian doctors.",
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
