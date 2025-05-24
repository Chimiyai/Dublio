// src/app/page.tsx
import HeroSection from "@/components/home/HeroSection";
import DubbedGamesSection from "@/components/home/DubbedGamesSection";
import DubbedAnimeSection from "@/components/home/DubbedAnimeSection";
import PopularContentSection from "@/components/home/PopularContentSection";
import SuggestGameSection from "@/components/home/SuggestGameSection";
import SiteStatsSection from "@/components/home/SiteStatsSection";
import JoinDiscordSection from "@/components/home/JoinDiscordSection";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <DubbedGamesSection />
      <DubbedAnimeSection />
      <PopularContentSection />
      <SuggestGameSection />
      <SiteStatsSection />
      <JoinDiscordSection />
    </>
  );
}