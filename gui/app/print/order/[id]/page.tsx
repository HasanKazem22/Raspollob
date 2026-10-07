"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader } from "@/components/ui/loader";

/** Older single-slip address: delivery slips are printed from /print/orders (one or many). */
export default function PrintOrderRedirect() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/print/orders?ids=${encodeURIComponent(id)}`);
  }, [id, router]);

  return <Loader variant="fullScreen" text="Preparing delivery slip..." />;
}
