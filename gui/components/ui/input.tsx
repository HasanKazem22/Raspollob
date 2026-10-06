import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent px-3 py-1.5 text-sm transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-zinc-400 dark:focus-visible:border-zinc-500 focus-visible:ring-1 focus-visible:ring-zinc-400/50 dark:focus-visible:ring-zinc-500/50 focus-visible:ring-offset-0 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-zinc-100/50 disabled:opacity-50 dark:bg-zinc-950/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
