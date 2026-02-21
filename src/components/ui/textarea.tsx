import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-zinc-300 placeholder:text-zinc-500 focus-visible:border-zinc-900 focus-visible:ring-zinc-900/20 aria-invalid:ring-red-500/20 aria-invalid:border-red-500 bg-white flex field-sizing-content min-h-16 w-full rounded-md border px-3 py-2 text-base shadow-sm transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
