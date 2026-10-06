import { LuCircleCheck, LuCircleX } from "react-icons/lu";

interface StatusBadgeButtonProps {
  isActive: boolean;
  onToggle: () => void;
  canToggle: boolean;
  inactiveLabel?: string;
}

/** Active / inactive pill that toggles the account status when clicked. */
export function StatusBadgeButton({
  isActive,
  onToggle,
  canToggle,
  inactiveLabel = "Inactive",
}: StatusBadgeButtonProps) {
  return (
    <button
      onClick={() => canToggle && onToggle()}
      disabled={!canToggle}
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase transition-all ${
        isActive
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
          : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
      } ${canToggle ? "cursor-pointer" : "opacity-75 cursor-not-allowed"}`}
    >
      {isActive ? <LuCircleCheck className="w-3 h-3" /> : <LuCircleX className="w-3 h-3" />}
      {isActive ? "Active" : inactiveLabel}
    </button>
  );
}
