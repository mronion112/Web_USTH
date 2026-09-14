import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <select
          ref={ref}
          className={cn(
            "flex h-11 w-full appearance-none rounded-xl border border-[#D9E5DC] bg-white px-4 py-2 pr-10 text-sm text-[#14271C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3B2B] focus-visible:border-transparent font-body disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer",
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8EAA97]" />
      </div>
    )
  }
)
Select.displayName = "Select"
