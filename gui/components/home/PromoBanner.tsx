"use client";

import { useStoreConfig } from "@/context/StoreConfigContext";
import { resolveMediaUrl } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

const SIZE = "w-full h-[140px] md:h-[200px] lg:h-[240px] rounded-2xl";

export function PromoBanner() {
  const { config, status } = useStoreConfig();
  const image = config?.promoBannerImage?.trim();

  // Server answered but no promo banner configured
  // Shown while loading and when a banner is set; hidden otherwise (including when the server is unreachable)
  if (status !== "loading" && !(status === "success" && image)) return null;

  return (
    <section className="py-6 bg-background">
      <div className="container mx-auto px-4 lg:px-8 xl:px-12 max-w-7xl">
        {status === "loading" && <Skeleton className={SIZE} />}

        {status === "success" && image && (
          <div className={`${SIZE} overflow-hidden border border-zinc-100`}>
            <img src={resolveMediaUrl(image)} alt="Promotion" className="w-full h-full object-cover" />
          </div>
        )}
      </div>
    </section>
  );
}
