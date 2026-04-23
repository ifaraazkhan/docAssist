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

export default function Home() {
  return (
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
  );
}
