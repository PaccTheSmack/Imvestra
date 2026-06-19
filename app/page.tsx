import Navbar from "@/components/landing/Navbar";
import BeamsHero from "@/components/landing/BeamsHero";
import LogoBar from "@/components/landing/LogoBar";
import ProblemSection from "@/components/landing/ProblemSection";
import FeatureSection from "@/components/landing/FeatureSection";
import FeatureDeepDive from "@/components/landing/FeatureDeepDive";
import ScreenshotSection from "@/components/landing/ScreenshotSection";
import PricingSection from "@/components/landing/PricingSection";
import FAQSection from "@/components/landing/FAQSection";
import WaitlistSection from "@/components/landing/WaitlistSection";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <main>
      <Navbar />

      {/* Hero stays sticky — content card scrolls over it */}
      <div className="relative">
        <div className="sticky top-0 z-0">
          <BeamsHero />
        </div>

        {/* Content card lifts up over the hero */}
        <div
          className="relative z-10"
          style={{
            borderRadius: "24px 24px 0 0",
            boxShadow: "0 -16px 60px rgba(0,0,0,0.45), 0 -2px 0 rgba(255,255,255,0.06)",
            overflow: "hidden",
            marginTop: "-2px",
          }}
        >
          <LogoBar />
          <ProblemSection />
          <FeatureSection />
          <FeatureDeepDive />
          <ScreenshotSection />
          <PricingSection />
          <FAQSection />
          <WaitlistSection />
          <Footer />
        </div>
      </div>
    </main>
  );
}
