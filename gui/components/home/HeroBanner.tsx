"use client";

import { useState, useEffect } from "react";
import { LuChevronLeft, LuChevronRight, LuImage } from "react-icons/lu";
import { useStoreConfig } from "@/context/StoreConfigContext";
import { resolveMediaUrl } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { HOME_SECTION_SIZE } from "@/data/homePlaceholders";

const FRAME =
  "relative w-full rounded-2xl md:rounded-3xl overflow-hidden border border-zinc-100 h-[200px] md:h-[256px] lg:h-[320px] bg-[#e8ece7] group";

function HeroSection({ children }: { children: React.ReactNode }) {
  return (
    <section className="w-full pt-4 md:pt-6 pb-8">
      <div className="container mx-auto px-4 lg:px-8 xl:px-12 max-w-7xl">{children}</div>
    </section>
  );
}

export function HeroBanner() {
  const { config, status } = useStoreConfig();
  const [currentSlide, setCurrentSlide] = useState(0);

  const isPlaceholder = status === "offline";
  const images = (config?.heroBannerImages ?? []).filter((img) => img?.trim());
  const slideCount = isPlaceholder ? HOME_SECTION_SIZE.heroSlides : images.length;

  useEffect(() => {
    if (slideCount <= 1) return;
    const slideTimer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slideCount);
    }, 4000);
    return () => clearInterval(slideTimer);
  }, [slideCount]);

  if (status === "loading") {
    return (
      <HeroSection>
        <Skeleton className="w-full rounded-2xl md:rounded-3xl h-[200px] md:h-[256px] lg:h-[320px]" />
      </HeroSection>
    );
  }

  // Server answered but no banners configured yet
  if (slideCount === 0) return null;

  const goTo = (index: number) => setCurrentSlide((index + slideCount) % slideCount);

  return (
    <HeroSection>
      <div className={FRAME}>
        {Array.from({ length: slideCount }, (_, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
          >
            {isPlaceholder ? (
              <div className="w-full h-full transition-colors duration-500 group-hover:bg-[#dce3da] flex flex-col items-center justify-center">
                <LuImage className="w-8 h-8 text-[#5a6b47]/40 mb-2" />
                <span className="text-zinc-500 font-bold tracking-wide">Hero Banner Slide {index + 1}</span>
                <span className="text-xs text-zinc-400 mt-1 font-mono">1920x600px</span>
              </div>
            ) : (
              <img
                src={resolveMediaUrl(images[index])}
                alt={`Banner ${index + 1}`}
                className="w-full h-full object-cover"
              />
            )}
          </div>
        ))}

        {slideCount > 1 && (
          <>
            <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center gap-3">
              {Array.from({ length: slideCount }, (_, index) => (
                <button
                  key={index}
                  onClick={() => goTo(index)}
                  aria-label={`Go to slide ${index + 1}`}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    index === currentSlide ? "bg-[#5c8b29] w-6" : "bg-black/20 hover:bg-black/40"
                  }`}
                />
              ))}
            </div>
            <div className="absolute inset-y-0 left-4 z-20 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => goTo(currentSlide - 1)}
                aria-label="Previous slide"
                className="w-10 h-10 rounded-full bg-white/50 backdrop-blur-sm flex items-center justify-center text-zinc-800 hover:bg-white hover:shadow-md transition-all shadow-sm"
              >
                <LuChevronLeft className="w-6 h-6" />
              </button>
            </div>
            <div className="absolute inset-y-0 right-4 z-20 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => goTo(currentSlide + 1)}
                aria-label="Next slide"
                className="w-10 h-10 rounded-full bg-white/50 backdrop-blur-sm flex items-center justify-center text-zinc-800 hover:bg-white hover:shadow-md transition-all shadow-sm"
              >
                <LuChevronRight className="w-6 h-6" />
              </button>
            </div>
          </>
        )}
      </div>
    </HeroSection>
  );
}
