import type { IconType } from "react-icons";
import { LuEye, LuPencil, LuPrinter, LuTrash2 } from "react-icons/lu";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface RowActionButtonProps {
  onClick: () => void;
  /** Shown as the tooltip and used as the accessible name */
  title: string;
  className?: string;
}

const neutralButton =
  "w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 flex items-center justify-center transition-colors";
const dangerButton =
  "w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 flex items-center justify-center transition-colors";

function RowIconButton({
  icon: Icon,
  onClick,
  title,
  className,
  base,
}: RowActionButtonProps & { icon: IconType; base: string }) {
  return (
    <Tooltip content={title}>
      <button type="button" onClick={onClick} aria-label={title} className={cn(base, className)}>
        <Icon className="h-3.5 w-3.5" />
      </button>
    </Tooltip>
  );
}

/** Small square edit button used in admin table "Actions" columns. */
export function RowEditButton(props: RowActionButtonProps) {
  return <RowIconButton icon={LuPencil} base={neutralButton} {...props} />;
}

/** Small square print button used in admin table "Actions" columns. */
export function RowPrintButton(props: RowActionButtonProps) {
  return <RowIconButton icon={LuPrinter} base={neutralButton} {...props} />;
}

/** Small square view button used in admin table "Actions" columns. */
export function RowViewButton(props: RowActionButtonProps) {
  return <RowIconButton icon={LuEye} base={neutralButton} {...props} />;
}

/** Small square delete button used in admin table "Actions" columns. */
export function RowDeleteButton(props: RowActionButtonProps) {
  return <RowIconButton icon={LuTrash2} base={dangerButton} {...props} />;
}

