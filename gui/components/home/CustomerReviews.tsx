"use client";

import { useEffect, useState, useRef } from "react";
import type { CustomerReview } from "@/services/configService";
import { useStoreConfig } from "@/context/StoreConfigContext";

import { HomeSection } from "@/components/ui/home-section";
import { StarRating } from "@/components/ui/star-display";
import { resolveMediaUrl } from "@/lib/api";

function ReviewCard({ review }: { review: CustomerReview }) {
  const initials = review.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="w-[85vw] md:w-[calc(33.333%-13px)] lg:w-[calc(25%-15px)] shrink-0 snap-start">
      <div className="h-full bg-white border border-zinc-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col relative overflow-hidden">
        
        {/* Comment at the top */}
        <p className="text-[14px] text-zinc-600 leading-relaxed mb-6 italic">
          "{review.comment}"
        </p>

        {/* Spacer to push everything else to the bottom */}
        <div className="mt-auto">
          {/* Star Rating in the middle */}
          <div className="mb-4">
            <StarRating rating={review.rating} />
          </div>

          {/* Profile at the bottom (no top border) */}
          <div className="flex items-center gap-3">
            {review.profileImage ? (
              <img
                src={resolveMediaUrl(review.profileImage)}
                alt={review.name}
                className="w-10 h-10 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#5c8b29]/10 text-[#5c8b29] flex items-center justify-center text-xs font-bold shrink-0">
                {initials}
              </div>
            )}
            <div>
              <p className="text-[13px] font-medium text-zinc-900 leading-tight">{review.name}</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">Verified Buyer</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CustomerReviews() {
  const { config, status } = useStoreConfig();
  // Real reviews only; the section hides when there are none
  const reviews: CustomerReview[] = status === "success" ? config?.customerReviews ?? [] : [];
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const slideTimer = setInterval(() => {
      if (scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        const card = container.children[0] as HTMLElement;
        if (card) {
          const cardWidth = card.offsetWidth + 20;
          let nextIndex = activeIndex + 1;
          
          // Total possible dots
          const dotsCount = Math.max(1, reviews.length - 3);
          if (nextIndex >= dotsCount) {
            nextIndex = 0; // loop back to start
          }
          
          container.scrollTo({ left: nextIndex * cardWidth, behavior: 'smooth' });
        }
      }
    }, 4000);

    return () => clearInterval(slideTimer);
  }, [activeIndex, reviews.length]);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const scrollLeft = scrollContainerRef.current.scrollLeft;
      const card = scrollContainerRef.current.children[0] as HTMLElement;
      if (card) {
        const cardWidth = card.offsetWidth + 20; // 20px is the gap-5
        const newIndex = Math.round(scrollLeft / cardWidth);
        setActiveIndex(newIndex);
      }
    }
  };

  const scrollToCard = (index: number) => {
    if (scrollContainerRef.current) {
      const card = scrollContainerRef.current.children[0] as HTMLElement;
      if (card) {
        const cardWidth = card.offsetWidth + 20;
        scrollContainerRef.current.scrollTo({ left: index * cardWidth, behavior: 'smooth' });
      }
    }
  };

  // If 4 items are visible, the number of dots should be (Total - 3)
  // On mobile (1 item visible), it will just cap out gracefully.
  const dotsCount = Math.max(1, reviews.length - 3);

  // Loading, or the server has no reviews yet
  if (reviews.length === 0) return null;

  return (
    <HomeSection
      title="What Our Customers Say" 
      description="Real reviews from real people who love our pure, organic products."
      className="py-16 bg-[#FDFBF9] relative group"
    >
        {/* Scrollable Review Cards */}
        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto snap-x snap-mandatory gap-5 pb-4 no-scrollbar scroll-smooth px-2 mt-8"
        >
          {reviews.map((review, idx) => (
            <ReviewCard key={idx} review={review} />
          ))}
        </div>

        {/* Under Toggle Dots */}
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: dotsCount }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => scrollToCard(idx)}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                idx === activeIndex 
                  ? "bg-[#5c8b29] w-6" 
                  : "bg-transparent border border-[#5c8b29] w-2.5"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
    </HomeSection>
  );
}

