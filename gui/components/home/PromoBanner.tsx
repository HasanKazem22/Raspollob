"use client";

import { LuStar } from "react-icons/lu";
import { useStoreConfig } from "@/context/StoreConfigContext";
import { resolveMediaUrl } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

const SIZE = "w-full h-[140px] md:h-[200px] lg:h-[240px] rounded-2xl";

export function PromoBanner() {
  const { config, status } = useStoreConfig();
  const image = config?.promoBannerImage?.trim();

  // Server answered but no promo banner configured
  if ((status === "success" && !image) || status === "error") return null;

  return (
    <section className="py-6 bg-[#FDFBF9]">
      <div className="container mx-auto px-4 lg:px-8 xl:px-12 max-w-7xl">
        {status === "loading" && <Skeleton className={SIZE} />}

        {status === "offline" && (
          <div className={`${SIZE} overflow-hidden border border-zinc-100 flex items-center justify-center relative group`}>
            <div className="absolute inset-0 bg-[#e8ece7] transition-colors duration-500 group-hover:bg-[#dce3da] flex flex-col items-center justify-center">
              <LuStar className="w-8 h-8 text-[#5a6b47]/40 mb-2" />
              <span className="text-zinc-500 font-bold tracking-wide">Promo Banner Image</span>
              <span className="text-xs text-zinc-400 mt-1 font-mono">1200x240px</span>
            </div>
          </div>
        )}

        {status === "success" && image && (
          <div className={`${SIZE} overflow-hidden border border-zinc-100`}>
            <img src={resolveMediaUrl(image)} alt="Promotion" className="w-full h-full object-cover" />
          </div>
        )}
      </div>
    </section>
  );
}
