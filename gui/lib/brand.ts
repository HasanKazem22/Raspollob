/**
 * The store's brand colour (design token --brand in app/globals.css).
 * Admins pick it in Admin → Home → Brand & Colors; everything else (hover, tints, strong text)
 * is derived from it in CSS, so this one value re-themes the whole site.
 */

export const DEFAULT_BRAND_COLOR = "#5c8b29";
const STORAGE_KEY = "raspollob_brand";
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export function isHexColor(value: string | null | undefined): value is string {
  return !!value && HEX_COLOR.test(value);
}

/** Puts the colour into --brand for the whole page and remembers it for the next visit. */
export function applyBrandColor(color: string | null | undefined) {
  const brand = isHexColor(color) ? color : DEFAULT_BRAND_COLOR;
  document.documentElement.style.setProperty("--brand", brand);
  try {
    localStorage.setItem(STORAGE_KEY, brand);
  } catch {
    // Not remembered: the next visit briefly shows the default before settings load
  }
}

/**
 * Runs in <head> before the page paints: applies the last known brand colour so visitors never
 * see the default flash before the store settings arrive.
 */
export const BRAND_BOOT_SCRIPT = `try{var c=localStorage.getItem("${STORAGE_KEY}");if(/^#[0-9a-fA-F]{6}$/.test(c))document.documentElement.style.setProperty("--brand",c)}catch(e){}`;

/** WCAG contrast ratio between the colour and white text (white text sits on brand buttons). */
export function contrastWithWhite(hex: string): number {
  const channel = (i: number) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const luminance = 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
  return 1.05 / (luminance + 0.05);
}

/** Minimum contrast for white button text that's bold and/or large (WCAG AA for large text). */
export const MIN_BUTTON_CONTRAST = 3;
