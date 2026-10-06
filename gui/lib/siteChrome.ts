/**
 * Pages that use their own full-screen layout: no footer, help chat or floating cart.
 * Shared by Footer, FloatingContact and FloatingCart so the three always agree.
 */
const BARE_PREFIXES = ["/login", "/signup", "/admin", "/print", "/profile"];

const matches = (pathname: string, prefix: string) => pathname === prefix || pathname.startsWith(`${prefix}/`);

/** Footer and help chat. */
export function showsSiteChrome(pathname: string): boolean {
  return !BARE_PREFIXES.some((p) => matches(pathname, p));
}

/** Floating cart: also hidden where the cart itself is already on screen. */
export function showsFloatingCart(pathname: string): boolean {
  return showsSiteChrome(pathname) && !matches(pathname, "/checkout") && !matches(pathname, "/cart");
}
