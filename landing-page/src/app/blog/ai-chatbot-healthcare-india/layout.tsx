import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Chatbots in Indian Healthcare: What Actually Works in 2026 — DrCliniq",
  description:
    "Why generic AI chatbots fail in Indian clinics and how LLM-powered, protocol-based WhatsApp assistants are solving healthcare communication. Real examples and comparison.",
  keywords: [
    "AI chatbot healthcare India",
    "LLM healthcare",
    "medical AI chatbot",
    "AI doctor assistant India",
    "healthcare chatbot WhatsApp",
    "LLM clinic India",
    "artificial intelligence healthcare India",
  ],
  openGraph: {
    title: "AI Chatbots in Indian Healthcare: What Actually Works in 2026",
    description: "Why generic chatbots fail in Indian clinics — and what LLM-powered protocol-based AI actually delivers.",
    type: "article",
    locale: "en_IN",
  },
  alternates: {
    canonical: "https://drcliniq.in/blog/ai-chatbot-healthcare-india",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
