import { Hero } from "@/app/components/landing/Hero";
import { BrowserDemo } from "./components/landing/BrowserDemo";
import { StatsSection } from "./components/landing/StatsSection";
import { FeaturesSection } from "./components/landing/FeaturesSection";
import { PrivacySection } from "./components/landing/PrivacySection";
import { FAQSection } from "./components/landing/FAQSection";
import { CTAFooterSection } from "./components/landing/CTAFooterSection";
import { RoadmapSection } from "./components/landing/RoadmapSection";

export default function Home() {
  return (
    <main className="bg-[#030303] text-white min-h-screen">
      <Hero />
      <BrowserDemo />
      <StatsSection />
      <FeaturesSection />
      <RoadmapSection />
      <PrivacySection />
      <FAQSection />
      <CTAFooterSection />
    </main>
  );
}
