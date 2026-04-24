"use client";

import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import PainSection from "@/components/PainSection";
import Calculator from "@/components/Calculator";
import DemoTheatre from "@/components/DemoTheatre";
import Library from "@/components/Library";
import FutureFeatures from "@/components/FutureFeatures";
import Pricing from "@/components/Pricing";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";
import StickyFunnel from "@/components/StickyFunnel";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: "DrCliniq",
      applicationCategory: "HealthApplication",
      operatingSystem: "Web, WhatsApp",
      description:
        "AI chatbot and LLM-powered WhatsApp automation for Indian clinics. Auto-replies to patient messages, AI triage, Hindi + English support, appointment booking, and morning briefings.",
      offers: [
        {
          "@type": "Offer",
          name: "Starter",
          price: "0",
          priceCurrency: "INR",
          description: "Free plan with 50 AI replies/month",
        },
        {
          "@type": "Offer",
          name: "Pro",
          price: "1999",
          priceCurrency: "INR",
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            billingDuration: "P1M",
          },
          description: "Unlimited AI replies, protocols, appointment booking",
        },
      ],
      featureList: [
        "AI chatbot auto-replies on WhatsApp",
        "LLM-powered medical protocol matching",
        "Hindi and English language support",
        "Smart patient triage and urgent case flagging",
        "Automated appointment booking",
        "Morning briefing summaries",
        "DPDP and NMC compliant",
      ],
    },
    {
      "@type": "Organization",
      name: "DrCliniq",
      url: "https://drcliniq.in",
      description:
        "AI-powered clinical assistant for Indian doctors — automating WhatsApp patient communication with LLM chatbot technology.",
      foundingDate: "2026",
      areaServed: {
        "@type": "Country",
        name: "India",
      },
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "What is DrCliniq?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "DrCliniq is an AI chatbot and LLM-powered WhatsApp automation platform built exclusively for Indian clinics. It auto-replies to patient messages, handles appointment booking, triages urgent cases, and supports both Hindi and English.",
          },
        },
        {
          "@type": "Question",
          name: "How does DrCliniq's AI chatbot work?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "DrCliniq uses LLM (Large Language Model) technology to understand patient messages in Hindi or English, match them to doctor-configured medical protocols, and send accurate auto-replies via WhatsApp — 24/7, even when the clinic is closed.",
          },
        },
        {
          "@type": "Question",
          name: "Is DrCliniq compliant with Indian healthcare regulations?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. DrCliniq is DPDP (Digital Personal Data Protection) compliant and NMC (National Medical Commission) aligned. ABDM integration is coming soon.",
          },
        },
        {
          "@type": "Question",
          name: "How much does DrCliniq cost?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "DrCliniq offers a free Starter plan with 50 AI replies per month. The Pro plan at ₹1,999/month includes unlimited AI replies, custom protocols, appointment booking, and priority support.",
          },
        },
      ],
    },
  ],
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main>
        <Navbar />
        <Hero />
        <PainSection />
        <Calculator />
        <DemoTheatre />
        <Library />
        <FutureFeatures />
        <Pricing />
        <FinalCTA />
        <Footer />
        <StickyFunnel />
      </main>
    </>
  );
}
