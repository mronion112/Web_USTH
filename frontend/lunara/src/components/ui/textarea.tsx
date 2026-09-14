import * as React from "react"
import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[90px] w-full rounded-xl border border-[#D9E5DC] bg-white px-4 py-3 text-sm text-[#14271C] placeholder:text-[#8EAA97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3B2B] focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50 font-body transition-all",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
