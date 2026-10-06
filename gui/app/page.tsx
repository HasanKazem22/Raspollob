"use client";

import { HeroBanner } from "@/components/home/HeroBanner";
import { ShopByCategory } from "@/components/home/ShopByCategory";
import { PromoBanner } from "@/components/home/PromoBanner";
import { TrendingProducts } from "@/components/home/TrendingProducts";
import { JustForYou } from "@/components/home/JustForYou";
import { CustomerReviews } from "@/components/home/CustomerReviews";
import { ServerErrorCard } from "@/components/ui/ServerErrorCard";
import { useStoreConfig } from "@/context/StoreConfigContext";

export default function Home() {
  const { status, refresh } = useStoreConfig();

  if (status === "offline") {
    return (
      <div className="min-h-[60vh] bg-[#FDFBF9] py-12">
        <ServerErrorCard
          onRetry={refresh}
          title="The store is temporarily unavailable"
          description="We couldn't reach the store right now. Please try again in a moment."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#FDFBF9]">
      <HeroBanner />
      <ShopByCategory />
      <PromoBanner />
      <TrendingProducts />
      <JustForYou />
      <CustomerReviews />
    </div>
  );
}
