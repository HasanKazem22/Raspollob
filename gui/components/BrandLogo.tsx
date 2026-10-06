import Link from "next/link";
import { useStoreConfig } from "@/context/StoreConfigContext";
import { resolveMediaUrl } from "@/lib/api";

interface BrandLogoProps {
  className?: string;
  onClick?: () => void;
}

export function BrandLogo({ className = "", onClick }: BrandLogoProps) {
  const { config } = useStoreConfig();
  const logoUrl = config?.storeLogo ? resolveMediaUrl(config.storeLogo) : "/RaspollobLogo_02.png";

  return (
    <Link
      href="/"
      className={`flex items-center gap-2 transition-transform hover:scale-105 ${className}`}
      onClick={onClick}
    >
      <img
        src={logoUrl}
        alt="Logo"
        className="h-12 md:h-14 w-auto object-contain drop-shadow-sm"
      />
    </Link>
  );
}
