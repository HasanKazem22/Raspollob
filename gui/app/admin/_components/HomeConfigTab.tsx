"use client";

import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  LuImage,
  LuStar,
  LuLayoutTemplate,
  LuTrash2,
  LuPlus,
  LuTag,
  LuLayoutGrid,
  LuChevronRight,
  LuMessageSquare,
  LuPalette,
  LuCreditCard,
  LuBanknote,
} from "react-icons/lu";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { BD_PHONE_ERROR, isValidBdPhone } from "@/lib/phone";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";
import { SegmentedTabs } from "@/components/ui/tabs";
import { Switch, SwitchCard } from "@/components/ui/switch";
import { ImageInput } from "@/components/ui/image-input";
import { StarRatingInput } from "@/components/ui/star-rating-input";
import { NoData } from "@/components/ui/no-data";
import { Loader } from "@/components/ui/loader";
import { ServerErrorCard } from "@/components/ui/ServerErrorCard";
import { uploadImage } from "@/services/fileService";
import { getStoreConfig, updateStoreConfig, parseFaqs, StoreConfig, CustomerReview } from "@/services/configService";
import { useStoreConfig } from "@/context/StoreConfigContext";
import { useAuth } from "@/context/AuthContext";
import { PERM } from "@/lib/permissions";

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: StoreConfig;
  setConfig: (c: StoreConfig) => void;
  /** Undefined when the user can only view settings: the modal then shows just "Close" */
  onSave?: () => void;
  isSaving: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared pieces for list editors (reviews, FAQs)
// ─────────────────────────────────────────────────────────────────────────────
function ListItemCard({
  title,
  onRemove,
  children,
}: {
  title: string;
  onRemove: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-900 px-2 py-0.5 rounded-full">
          {title}
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors cursor-pointer"
        >
          <LuTrash2 className="w-3.5 h-3.5" />
          Remove
        </button>
      </div>
      {children}
    </div>
  );
}

function AddItemButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <div className="flex justify-center pt-1">
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 text-xs font-bold text-zinc-500 hover:border-[#5c8b29] hover:text-[#5c8b29] hover:bg-[#5c8b29]/5 transition-all cursor-pointer"
      >
        <LuPlus className="w-3.5 h-3.5" />
        {label}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Homepage Sections Modal — brand, banners, section titles
// ─────────────────────────────────────────────────────────────────────────────
type BrandTab = "brand" | "banners" | "sections";

const SECTION_FIELDS: {
  title: string;
  titleKey: keyof StoreConfig;
  descKey: keyof StoreConfig;
  titlePlaceholder: string;
  descPlaceholder: string;
}[] = [
  {
    title: "Shop By Category",
    titleKey: "categorySectionTitle",
    descKey: "categorySectionDesc",
    titlePlaceholder: "e.g. Shop by Category",
    descPlaceholder: "e.g. Discover our farm-fresh, 100% pure organic goods sorted by category.",
  },
  {
    title: "Trending Products",
    titleKey: "trendingSectionTitle",
    descKey: "trendingSectionDesc",
    titlePlaceholder: "e.g. Trending Products",
    descPlaceholder: "e.g. Our most popular pure, organic items loved by customers.",
  },
  {
    title: "Just For You",
    titleKey: "justForYouSectionTitle",
    descKey: "justForYouSectionDesc",
    titlePlaceholder: "e.g. Just For You",
    descPlaceholder: "e.g. Discover all our premium organic products carefully selected for you.",
  },
];

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <FormField label={label}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-9 h-9 shrink-0 rounded-md cursor-pointer border border-zinc-200 p-0.5 bg-white"
        />
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="font-mono" />
      </div>
    </FormField>
  );
}

function BannerConfigModal({ isOpen, onClose, config, setConfig, onSave, isSaving }: ConfigModalProps) {
  const [activeTab, setActiveTab] = useState<BrandTab>("brand");

  const setHeroBanner = (idx: number, url: string) => {
    const next = [...(config.heroBannerImages || ["", "", ""])];
    next[idx] = url;
    setConfig({ ...config, heroBannerImages: next });
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title="Homepage Sections"
      description="Configure your store's branding, banners, and homepage section titles."
      onSave={onSave}
      isLoading={isSaving}
      size="lg"
    >
      <div className="space-y-5">
        <SegmentedTabs
          fullWidth
          value={activeTab}
          onChange={setActiveTab}
          tabs={[
            { id: "brand", label: "Brand & Colors", icon: LuPalette },
            { id: "banners", label: "Banners", icon: LuImage },
            { id: "sections", label: "Section Titles", icon: LuLayoutGrid },
          ]}
        />

        {activeTab === "brand" && (
          <div className="space-y-5">
            <FormField label="Brand Logo" hint="Shown in the header and footer.">
              <ImageInput
                value={config.storeLogo || ""}
                onChange={(url) => setConfig({ ...config, storeLogo: url })}
                onRemove={() => setConfig({ ...config, storeLogo: "" })}
                onUpload={uploadImage}
                variant="card"
                size="md"
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <ColorField
                label="Main Base Color"
                value={config.primaryColor || "#5c8b29"}
                onChange={(v) => setConfig({ ...config, primaryColor: v })}
              />
              <ColorField
                label="Secondary Color (Buttons)"
                value={config.secondaryColor || "#ff9800"}
                onChange={(v) => setConfig({ ...config, secondaryColor: v })}
              />
            </div>
          </div>
        )}

        {activeTab === "banners" && (
          <div className="space-y-5">
            <FormField label="Hero Banners" hint="Up to 3 slides. Recommended size: 1920 × 600px.">
              <div className="flex flex-wrap gap-4">
                {[0, 1, 2].map((idx) => {
                  const url = (config.heroBannerImages || [])[idx] || "";
                  return (
                    <ImageInput
                      key={idx}
                      value={url}
                      onChange={(newUrl) => setHeroBanner(idx, newUrl)}
                      onRemove={() => setHeroBanner(idx, "")}
                      onUpload={uploadImage}
                      variant="card"
                      size="md"
                      label={idx === 0 ? "Primary Banner" : `Banner ${idx + 1}`}
                    />
                  );
                })}
              </div>
            </FormField>

            <div className="border-t border-zinc-100 dark:border-zinc-800" />

            <FormField label="Promo Banner" hint="One wide promotional image. Recommended size: 1200 × 400px.">
              <ImageInput
                value={config.promoBannerImage || ""}
                onChange={(url) => setConfig({ ...config, promoBannerImage: url })}
                onRemove={() => setConfig({ ...config, promoBannerImage: "" })}
                onUpload={uploadImage}
                variant="card"
                size="lg"
              />
            </FormField>
          </div>
        )}

        {activeTab === "sections" && (
          <div className="space-y-3">
            {SECTION_FIELDS.map((section) => (
              <div
                key={section.title}
                className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 space-y-3"
              >
                <h4 className="text-xs font-bold text-zinc-900 dark:text-white">{section.title}</h4>
                <FormField label="Section Title">
                  <Input
                    value={(config[section.titleKey] as string) || ""}
                    onChange={(e) => setConfig({ ...config, [section.titleKey]: e.target.value })}
                    placeholder={section.titlePlaceholder}
                    className="bg-white"
                  />
                </FormField>
                <FormField label="Section Description">
                  <Textarea
                    rows={2}
                    value={(config[section.descKey] as string) || ""}
                    onChange={(e) => setConfig({ ...config, [section.descKey]: e.target.value })}
                    placeholder={section.descPlaceholder}
                    className="resize-none bg-white"
                  />
                </FormField>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Customer Reviews Modal
// ─────────────────────────────────────────────────────────────────────────────
const MAX_REVIEWS = 6;

function ReviewsConfigModal({ isOpen, onClose, config, setConfig, onSave, isSaving }: ConfigModalProps) {
  const reviews: CustomerReview[] = config.customerReviews || [];

  const setReviews = (next: CustomerReview[]) => setConfig({ ...config, customerReviews: next });
  const updateReview = (idx: number, patch: Partial<CustomerReview>) =>
    setReviews(reviews.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  const addReview = () => setReviews([...reviews, { name: "", rating: 5, comment: "", profileImage: "" }]);

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title="Customer Reviews"
      description={`Add or edit customer testimonials shown on the homepage (max ${MAX_REVIEWS}).`}
      onSave={onSave}
      isLoading={isSaving}
      size="lg"
    >
      <div className="space-y-3">
        {reviews.length === 0 && (
          <NoData
            icon={LuMessageSquare}
            title="No reviews yet"
            description="Add your first customer review. Until then, sample reviews are shown on the homepage."
          />
        )}

        {reviews.map((review, idx) => (
          <ListItemCard
            key={idx}
            title={`Review #${idx + 1}`}
            onRemove={() => setReviews(reviews.filter((_, i) => i !== idx))}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Customer Name">
                <Input
                  value={review.name}
                  onChange={(e) => updateReview(idx, { name: e.target.value })}
                  placeholder="e.g. Md Bahar Uddin"
                />
              </FormField>
              <FormField label="Rating">
                <StarRatingInput value={review.rating} onChange={(rating) => updateReview(idx, { rating })} />
              </FormField>
            </div>
            <FormField label="Review Comment">
              <Textarea
                rows={2}
                value={review.comment}
                onChange={(e) => updateReview(idx, { comment: e.target.value })}
                placeholder="What the customer said about the product..."
                className="resize-none"
              />
            </FormField>
          </ListItemCard>
        ))}

        {reviews.length < MAX_REVIEWS && <AddItemButton onClick={addReview} label="Add Review" />}
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Footer Information Modal
// ─────────────────────────────────────────────────────────────────────────────
type FooterTab = "social" | "policies" | "faqs" | "help";

const SOCIAL_PLATFORMS = ["facebook", "instagram", "youtube", "tiktok"] as const;

const POLICY_FIELDS: { key: keyof StoreConfig; label: string; placeholder: string }[] = [
  { key: "shippingDeliveryInfo", label: "Shipping & Delivery Policy", placeholder: "Enter shipping details..." },
  { key: "returnsRefundsInfo", label: "Returns & Refunds Policy", placeholder: "Enter returns policy..." },
  { key: "trackOrderInfo", label: "Track Order Information", placeholder: "Enter tracking instructions..." },
];

function FooterConfigModal({ isOpen, onClose, config, setConfig, onSave, isSaving }: ConfigModalProps) {
  const [activeTab, setActiveTab] = useState<FooterTab>("social");

  const faqs = parseFaqs(config.faqsInfo);
  const setFaqs = (next: typeof faqs) => setConfig({ ...config, faqsInfo: JSON.stringify(next) });
  const updateFaq = (idx: number, field: "q" | "a", val: string) =>
    setFaqs(faqs.map((faq, i) => (i === idx ? { ...faq, [field]: val } : faq)));

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title="Footer Information"
      description="Configure social links, policies, FAQs, and store contact information."
      onSave={onSave}
      isLoading={isSaving}
      size="lg"
    >
      <div className="space-y-5">
        <SegmentedTabs
          fullWidth
          value={activeTab}
          onChange={setActiveTab}
          tabs={[
            { id: "social", label: "Social Media" },
            { id: "policies", label: "Policies" },
            { id: "faqs", label: "FAQs" },
            { id: "help", label: "Contact Info" },
          ]}
        />

        {activeTab === "social" && (
          <div className="space-y-3">
            {SOCIAL_PLATFORMS.map((platform) => {
              const urlKey = `${platform}Url` as keyof StoreConfig;
              const activeKey = `${platform}Active` as keyof StoreConfig;
              const isActive = !!config[activeKey];
              return (
                <div
                  key={platform}
                  className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-900 dark:text-white capitalize">{platform}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-zinc-500">{isActive ? "Shown" : "Hidden"}</span>
                      <Switch checked={isActive} onChange={(v) => setConfig({ ...config, [activeKey]: v })} />
                    </div>
                  </div>
                  <Input
                    value={(config[urlKey] as string) || ""}
                    onChange={(e) => setConfig({ ...config, [urlKey]: e.target.value })}
                    placeholder={`https://${platform}.com/yourpage`}
                    className="bg-white"
                  />
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "policies" && (
          <div className="space-y-4">
            {POLICY_FIELDS.map((field) => (
              <FormField key={field.key} label={field.label}>
                <Textarea
                  rows={4}
                  value={(config[field.key] as string) || ""}
                  onChange={(e) => setConfig({ ...config, [field.key]: e.target.value })}
                  placeholder={field.placeholder}
                />
              </FormField>
            ))}
          </div>
        )}

        {activeTab === "faqs" && (
          <div className="space-y-3">
            {faqs.length === 0 && (
              <NoData icon={LuMessageSquare} title="No FAQs yet" description="Add questions customers often ask." />
            )}

            {faqs.map((faq, idx) => (
              <ListItemCard key={idx} title={`FAQ #${idx + 1}`} onRemove={() => setFaqs(faqs.filter((_, i) => i !== idx))}>
                <FormField label="Question">
                  <Input
                    value={faq.q}
                    onChange={(e) => updateFaq(idx, "q", e.target.value)}
                    placeholder="e.g. How long does shipping take?"
                  />
                </FormField>
                <FormField label="Answer">
                  <Textarea
                    rows={2}
                    value={faq.a}
                    onChange={(e) => updateFaq(idx, "a", e.target.value)}
                    placeholder="e.g. Shipping usually takes 3-5 business days."
                    className="resize-none"
                  />
                </FormField>
              </ListItemCard>
            ))}

            <AddItemButton onClick={() => setFaqs([...faqs, { q: "", a: "" }])} label="Add FAQ" />
          </div>
        )}

        {activeTab === "help" && (
          <div className="space-y-4">
            <FormField label="Store Address">
              <Textarea
                rows={2}
                value={config.storeAddress || ""}
                onChange={(e) => setConfig({ ...config, storeAddress: e.target.value })}
                placeholder="e.g. 123 Organic Farm Road, Green Valley, NY 10001"
                className="resize-none"
              />
            </FormField>
            <FormField label="Business Hours">
              <Input
                value={config.storeHours || ""}
                onChange={(e) => setConfig({ ...config, storeHours: e.target.value })}
                placeholder="e.g. Mon – Fri: 9:00 AM – 6:00 PM BST"
              />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Support Email">
                <Input
                  type="email"
                  value={config.storeEmail || ""}
                  onChange={(e) => setConfig({ ...config, storeEmail: e.target.value })}
                  placeholder="e.g. hello@raspollob.com"
                />
              </FormField>
              <FormField label="Support Phone">
                <PhoneInput
                  value={config.storePhone || ""}
                  onChange={(storePhone) => setConfig({ ...config, storePhone })}
                />
              </FormField>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Checkout & Payments Modal
// ─────────────────────────────────────────────────────────────────────────────
const MOBILE_BANKING_FIELDS: { key: "bkashNumber" | "nagadNumber" | "rocketNumber"; label: string }[] = [
  { key: "bkashNumber", label: "bKash Number" },
  { key: "nagadNumber", label: "Nagad Number" },
  { key: "rocketNumber", label: "Rocket Number" },
];

/** Number input that stores "" as undefined so the server falls back to its default. */
function AmountInput({ value, onChange, placeholder }: { value?: number | null; onChange: (v: number | null) => void; placeholder: string }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">৳</span>
      <Input
        type="number"
        min="0"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
        placeholder={placeholder}
        className="pl-7"
      />
    </div>
  );
}

function CheckoutConfigModal({ isOpen, onClose, config, setConfig, onSave, isSaving }: ConfigModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title="Checkout & Payments"
      description="Delivery charges and the payment methods customers can choose at checkout."
      onSave={onSave}
      isLoading={isSaving}
      size="lg"
    >
      <div className="space-y-5">
        <div>
          <h4 className="text-xs font-bold text-zinc-900 mb-3">Delivery Charges</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormField label="Inside Dhaka">
              <AmountInput
                value={config.shippingFeeInsideDhaka}
                onChange={(v) => setConfig({ ...config, shippingFeeInsideDhaka: v ?? undefined })}
                placeholder="60"
              />
            </FormField>
            <FormField label="Outside Dhaka">
              <AmountInput
                value={config.shippingFeeOutsideDhaka}
                onChange={(v) => setConfig({ ...config, shippingFeeOutsideDhaka: v ?? undefined })}
                placeholder="120"
              />
            </FormField>
            <FormField label="Free Delivery From" hint="Empty = never free">
              <AmountInput
                value={config.freeShippingThreshold}
                onChange={(v) => setConfig({ ...config, freeShippingThreshold: v })}
                placeholder="e.g. 2000"
              />
            </FormField>
          </div>
        </div>

        <div className="pt-4 border-t border-zinc-100 space-y-3">
          <h4 className="text-xs font-bold text-zinc-900">Payment Methods</h4>
          <SwitchCard
            icon={<LuBanknote className="w-4 h-4" />}
            title="Cash on Delivery"
            description="Customers pay the courier when the order arrives"
            checked={config.codEnabled !== false}
            onChange={(v) => setConfig({ ...config, codEnabled: v })}
          />
          <p className="text-[11px] text-zinc-500">
            Enter a number to enable that mobile-banking option. Customers send money to it and submit the transaction ID.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {MOBILE_BANKING_FIELDS.map((f) => (
              <FormField key={f.key} label={f.label} optional>
                <PhoneInput
                  value={config[f.key] ?? ""}
                  onChange={(number) => setConfig({ ...config, [f.key]: number })}
                  placeholder="Disabled"
                  className="font-mono"
                />
              </FormField>
            ))}
          </div>
          <FormField label="Payment Instructions" optional hint="Shown under the number at checkout, e.g. 'Use Send Money, not Cash Out'.">
            <Textarea
              rows={2}
              value={config.paymentInstructions ?? ""}
              onChange={(e) => setConfig({ ...config, paymentInstructions: e.target.value })}
              className="resize-none"
            />
          </FormField>
        </div>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main HomeConfigTab
// ─────────────────────────────────────────────────────────────────────────────
type ActiveModal = "banner" | "reviews" | "footer" | "checkout" | null;

const CONFIG_CARDS = [
  {
    id: "banner" as const,
    icon: LuLayoutTemplate,
    label: "Homepage Sections",
    description: "Configure the logo, hero banners, promo image, and section headings.",
  },
  {
    id: "reviews" as const,
    icon: LuStar,
    label: "Customer Reviews",
    description: "Manage customer testimonials displayed on the homepage.",
  },
  {
    id: "footer" as const,
    icon: LuTag,
    label: "Footer Information",
    description: "Edit social links, policies, FAQs, and store contact details.",
  },
  {
    id: "checkout" as const,
    icon: LuCreditCard,
    label: "Checkout & Payments",
    description: "Delivery charges, Cash on Delivery, and bKash / Nagad / Rocket numbers.",
  },
];

export function HomeConfigTab() {
  const { refresh: refreshStoreConfig } = useStoreConfig();
  const { can } = useAuth();
  const canUpdate = can(PERM.home.update);
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [config, setConfig] = useState<StoreConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [isSaving, setIsSaving] = useState(false);

  const loadConfig = async () => {
    setIsLoading(true);
    setError(null);
    try {
      setConfig(await getStoreConfig());
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleSave = async () => {
    if (!config) return;
    // Optional numbers: validate only when filled in
    const phoneFields: [string, string | undefined][] = [
      ["Support phone", config.storePhone],
      ["bKash number", config.bkashNumber],
      ["Nagad number", config.nagadNumber],
      ["Rocket number", config.rocketNumber],
    ];
    const invalid = phoneFields.find(([, v]) => v && !isValidBdPhone(v));
    if (invalid) {
      toast.error(`${invalid[0]}: ${BD_PHONE_ERROR}`);
      return;
    }
    setIsSaving(true);
    try {
      setConfig(await updateStoreConfig(config));
      refreshStoreConfig();
      toast.success("Configuration saved!");
      setActiveModal(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to save configuration.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <Loader text="Loading homepage configuration..." />;
  }

  if (error || !config) {
    return (
      <div className="py-8">
        <ServerErrorCard error={error} onRetry={loadConfig} variant="inline" title="Failed to Load Configuration" />
      </div>
    );
  }

  const modalProps = {
    onClose: () => setActiveModal(null),
    config,
    setConfig,
    onSave: canUpdate ? handleSave : undefined,
    isSaving,
  };

  return (
    <>
      {!canUpdate && (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-medium text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
          View only — your role can see these settings but not change them.
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {CONFIG_CARDS.map(({ id, icon: Icon, label, description }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveModal(id)}
            className="group relative bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-300 cursor-pointer flex flex-col items-start gap-3 text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-[#5c8b29]/10 text-[#5c8b29] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white group-hover:text-[#5c8b29] transition-colors">
                {label}
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{description}</p>
            </div>
            <LuChevronRight className="absolute top-4 right-4 w-4 h-4 text-zinc-300 group-hover:text-[#5c8b29] group-hover:translate-x-0.5 transition-all" />
          </button>
        ))}
      </div>

      <BannerConfigModal isOpen={activeModal === "banner"} {...modalProps} />
      <ReviewsConfigModal isOpen={activeModal === "reviews"} {...modalProps} />
      <FooterConfigModal isOpen={activeModal === "footer"} {...modalProps} />
      <CheckoutConfigModal isOpen={activeModal === "checkout"} {...modalProps} />
    </>
  );
}
