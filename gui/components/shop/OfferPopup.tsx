"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { LuCheck, LuCopy, LuX } from "react-icons/lu";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useStoreConfig } from "@/context/StoreConfigContext";
import type { StoreConfig } from "@/services/configService";
import { resolveMediaUrl } from "@/lib/api";
import { showsSiteChrome } from "@/lib/siteChrome";

const STORAGE_KEY = "raspollob_offer_popup";
/** Let the page settle before the offer appears */
const SHOW_DELAY_MS = 1500;

type OfferFields = Pick<
  StoreConfig,
  "offerImage" | "offerTitle" | "offerText" | "offerPromoCode" | "offerButtonText" | "offerButtonLink"
>;

/** Identifies one offer: editing it (new image, code or dates) shows it again straight away. */
function offerKey(c: StoreConfig) {
  return [c.offerImage, c.offerTitle, c.offerPromoCode, c.offerStartsAt, c.offerEndsAt].join("|");
}

/** Today in the visitor's own calendar, e.g. "2026-10-06". */
function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Shown at most once a day per offer: true when this offer was already closed today. */
function closedToday(key: string) {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return saved?.key === key && saved?.day === today();
  } catch {
    return false;
  }
}

function rememberClosed(key: string) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ key, day: today() }));
  } catch {
    // Private mode / storage blocked: it may show again on the next visit, which is acceptable
  }
}

/** Pages where an offer would get in the way. */
const isQuietPage = (pathname: string) =>
  !showsSiteChrome(pathname) || pathname.startsWith("/checkout") || pathname.startsWith("/cart") || pathname.startsWith("/order");

/** The offer card itself; also used for the preview in admin. */
export function OfferCard({
  offer,
  onClose,
  onAction,
}: {
  offer: OfferFields;
  onClose: () => void;
  /** Called after the button is clicked (navigation is handled by the caller) */
  onAction?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const hasContent = offer.offerTitle || offer.offerText || offer.offerPromoCode || offer.offerButtonText;

  const copyCode = async () => {
    if (!offer.offerPromoCode) return;
    try {
      await navigator.clipboard.writeText(offer.offerPromoCode);
      setCopied(true);
      toast.success("Promo code copied, use it at checkout");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy. Please note the code: " + offer.offerPromoCode);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close offer"
        className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/90 hover:bg-white shadow-md flex items-center justify-center text-zinc-700 cursor-pointer transition-colors"
      >
        <LuX className="w-4 h-4" />
      </button>

      {offer.offerImage && (
        <img
          src={resolveMediaUrl(offer.offerImage)}
          alt={offer.offerTitle || "Special offer"}
          className="w-full max-h-[60vh] object-cover bg-zinc-100"
        />
      )}

      {hasContent && (
        <div className="p-5 sm:p-6 text-center space-y-3">
          {offer.offerTitle && (
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-zinc-900 leading-snug">{offer.offerTitle}</h2>
          )}
          {offer.offerText && (
            <p className="text-sm text-zinc-600 leading-relaxed whitespace-pre-line">{offer.offerText}</p>
          )}

          {offer.offerPromoCode && (
            <div className="flex items-center justify-center gap-2 pt-1">
              <span className="px-4 h-10 inline-flex items-center rounded-lg border-2 border-dashed border-brand/50 bg-brand/5 font-mono text-base font-bold tracking-widest text-brand-strong">
                {offer.offerPromoCode}
              </span>
              <button
                type="button"
                onClick={copyCode}
                className="h-10 px-3 rounded-lg border border-zinc-200 text-sm font-semibold text-zinc-700 hover:border-brand hover:text-brand-strong inline-flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                {copied ? <LuCheck className="w-4 h-4" /> : <LuCopy className="w-4 h-4" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          )}

          {offer.offerButtonText && offer.offerButtonLink && (
            <button
              type="button"
              onClick={onAction}
              className="w-full h-11 mt-1 rounded-full bg-brand hover:bg-brand-hover text-white text-sm font-bold shadow-lg shadow-brand/20 transition-colors cursor-pointer"
            >
              {offer.offerButtonText}
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="text-xs font-medium text-zinc-400 hover:text-zinc-600 cursor-pointer"
          >
            No thanks
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Welcome offer, managed in Admin → Home → Offer Popup.
 * Appears shortly after arrival, at most once a day per offer, and never on checkout, admin or sign-in pages.
 */
export function OfferPopup() {
  const { config } = useStoreConfig();
  const pathname = usePathname();
  const router = useRouter();
  const [openKey, setOpenKey] = useState<string | null>(null);

  const active = !!config?.offerActive && !!config.offerImage;
  const key = config ? offerKey(config) : "";
  const quiet = isQuietPage(pathname);

  useEffect(() => {
    if (!active || quiet || closedToday(key)) return;
    const timer = window.setTimeout(() => setOpenKey(key), SHOW_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [active, quiet, key]);

  const isOpen = !!config && active && !quiet && openKey === key;

  const close = () => {
    rememberClosed(key);
    setOpenKey(null);
  };

  const followLink = () => {
    const link = config?.offerButtonLink;
    close();
    if (!link) return;
    if (link.startsWith("/")) router.push(link);
    else window.open(link, "_blank", "noopener,noreferrer");
  };

  if (!config) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent
        showCloseButton={false}
        className="p-0 gap-0 bg-transparent ring-0 sm:max-w-md max-h-[90vh] overflow-y-auto"
        aria-describedby={undefined}
      >
        {/* Screen readers announce the offer; the card shows the same text visually */}
        <DialogTitle className="sr-only">{config.offerTitle || "Special offer"}</DialogTitle>
        <OfferCard offer={config} onClose={close} onAction={followLink} />
      </DialogContent>
    </Dialog>
  );
}
