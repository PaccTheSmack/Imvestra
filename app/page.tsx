import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
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
      <HeroSection />
      <LogoBar />
      <ProblemSection />
      <FeatureSection />
      <FeatureDeepDive />
      <ScreenshotSection />
      <PricingSection />
      <FAQSection />
      <WaitlistSection />
      <Footer />
    </main>
  );
}
