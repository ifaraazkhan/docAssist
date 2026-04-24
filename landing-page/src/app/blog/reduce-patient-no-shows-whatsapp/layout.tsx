import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How to Reduce Patient No-Shows by 40% Using WhatsApp Reminders — DrCliniq",
  description:
    "Indian clinics lose ₹2-5 lakh/year to patient no-shows. Learn how automated WhatsApp reminders with smart follow-ups cut no-shows by 40%. Step-by-step playbook.",
  keywords: [
    "reduce patient no shows",
    "WhatsApp appointment reminder",
    "clinic no show India",
    "patient reminder WhatsApp",
    "appointment reminder automation",
    "reduce missed appointments clinic",
    "WhatsApp reminder doctor India",
  ],
  openGraph: {
    title: "How to Reduce Patient No-Shows by 40% Using WhatsApp Reminders",
    description: "Automated WhatsApp reminders are cutting clinic no-shows by 40%. Here's the playbook for Indian doctors.",
    type: "article",
    locale: "en_IN",
  },
  alternates: {
    canonical: "https://drcliniq.in/blog/reduce-patient-no-shows-whatsapp",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
