import type { IconType } from "react-icons";

interface AdminPageHeaderProps {
  title: string;
  description: string;
  icon: IconType;
}

export function AdminPageHeader({ title, description, icon: Icon }: AdminPageHeaderProps) {
  return (
    <div className="text-center max-w-xl mx-auto space-y-1.5 pt-2">
      <h1 className="text-lg md:text-xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center justify-center gap-2">
        <Icon className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
        {title}
      </h1>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
        {description}
      </p>
    </div>
  );
}
