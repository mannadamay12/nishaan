import Header from "@/components/sections/header";
import HeroSection from "@/components/sections/hero";
import AboutSection from "@/components/sections/about";
import JoinSection from "@/components/sections/join";
import Footer from "@/components/sections/footer";

export default function Home() {
  return (
    <div className="container">
      <Header />
      <main>
        <HeroSection />
        <AboutSection />
        <JoinSection />
      </main>
      <Footer />
    </div>
  );
}
