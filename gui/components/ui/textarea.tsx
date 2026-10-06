import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent px-3 py-2 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-zinc-400 dark:focus-visible:border-zinc-500 focus-visible:ring-1 focus-visible:ring-zinc-400/50 dark:focus-visible:ring-zinc-500/50 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:bg-zinc-100/50 disabled:opacity-50 dark:bg-zinc-950/40",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
