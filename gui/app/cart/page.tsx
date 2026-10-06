import { redirect } from "next/navigation";

/** Cart and checkout are one page; keep /cart working for old links and bookmarks. */
export default function CartPage() {
  redirect("/checkout");
}
