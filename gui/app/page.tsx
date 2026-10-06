"use client";

import { HeroBanner } from "@/components/home/HeroBanner";
import { ShopByCategory } from "@/components/home/ShopByCategory";
import { PromoBanner } from "@/components/home/PromoBanner";
import { TrendingProducts } from "@/components/home/TrendingProducts";
import { JustForYou } from "@/components/home/JustForYou";
import { CustomerReviews } from "@/components/home/CustomerReviews";

export default function Home() {
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
