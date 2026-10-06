"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { parseFaqs } from "@/services/configService";
import { useStoreConfig } from "@/context/StoreConfigContext";
import { LuTruck, LuRefreshCcw, LuCircleHelp, LuMapPin, LuChevronDown } from "react-icons/lu";

function FaqAccordion({ faqsRaw }: { faqsRaw?: string }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const faqs = parseFaqs(faqsRaw);

  if (faqs.length === 0) {
    return <p className="text-zinc-500 text-center">No frequently asked questions available right now.</p>;
  }

  return (
    <div className="space-y-1">
      {faqs.map((faq, idx) => (
        <div key={idx} className="border-b border-zinc-200 bg-transparent overflow-hidden">
          <button
            onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
            className="w-full flex items-center justify-between py-5 text-left transition-colors group"
          >
            <span className="font-bold text-zinc-900 text-base pr-4 group-hover:text-[#5c8b29] transition-colors">{faq.q}</span>
            <LuChevronDown
              className={`w-5 h-5 text-zinc-400 shrink-0 transition-transform duration-300 ${
                openIdx === idx ? "rotate-180 text-[#5c8b29]" : ""
              }`}
            />
          </button>
          <div
            className={`transition-all duration-300 ease-in-out ${
              openIdx === idx ? "max-h-96 opacity-100 mb-5" : "max-h-0 opacity-0"
            }`}
          >
            <div className="text-[15px] text-zinc-600 leading-relaxed">
              {faq.a}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function HelpCenterContent() {
  const { config, isLoading } = useStoreConfig();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  useEffect(() => {
    if (!isLoading && tabParam) {
      setTimeout(() => {
        const element = document.getElementById(tabParam);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    }
  }, [isLoading, tabParam]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 lg:px-8 xl:px-12 max-w-3xl py-16 animate-pulse space-y-16">
        <div className="h-12 w-1/2 mx-auto bg-zinc-200 rounded-full"></div>
        <div className="h-40 w-full bg-zinc-100 rounded-[2rem]"></div>
        <div className="h-40 w-full bg-zinc-100 rounded-[2rem]"></div>
      </div>
    );
  }

  const sections = [
    { id: "shipping", title: "Shipping & Delivery", text: config?.shippingDeliveryInfo, icon: LuTruck },
    { id: "returns", title: "Returns & Refunds", text: config?.returnsRefundsInfo, icon: LuRefreshCcw },
    { id: "track", title: "Track Order", text: config?.trackOrderInfo, icon: LuMapPin },
  ];

  return (
    <div className="container mx-auto px-4 lg:px-8 xl:px-12 max-w-3xl py-10 md:py-16">
      
      {/* Header */}
      <div className="text-center mb-12 md:mb-20 pt-4">
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-zinc-900 tracking-tight mb-3">
          Help Center
        </h1>
        <p className="text-zinc-500 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
          Find answers to your questions, track your orders, and learn about our store policies.
        </p>
      </div>

      <div className="flex flex-col gap-12 md:gap-20">
        
        {/* Text Sections */}
        {sections.map((sec, idx) => {
          const Icon = sec.icon;
          return (
            <section key={idx} id={sec.id} className="scroll-mt-32 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-12 h-12 rounded-full bg-[#5c8b29]/10 text-[#5c8b29] flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5" />
                </div>
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-zinc-900">{sec.title}</h2>
              </div>
              <div className="prose prose-sm prose-zinc max-w-none whitespace-pre-wrap leading-relaxed text-zinc-600 text-center mx-auto">
                {sec.text || <span className="text-zinc-400 italic">No information provided yet.</span>}
              </div>
            </section>
          );
        })}

        {/* FAQs */}
        <section id="faqs" className="scroll-mt-32 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-12">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-12 h-12 rounded-full bg-[#5c8b29]/10 text-[#5c8b29] flex items-center justify-center mb-3">
              <LuCircleHelp className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-zinc-900 mb-2">Frequently Asked Questions</h2>
            <p className="text-zinc-500 text-sm sm:text-base">Can't find what you're looking for? Reach out to us directly.</p>
          </div>
          <FaqAccordion faqsRaw={config?.faqsInfo} />
        </section>

      </div>
    </div>
  );
}

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-[#FDFBF9]">
      <Suspense fallback={<div className="min-h-screen" />}>
        <HelpCenterContent />
      </Suspense>
    </div>
  );
}
