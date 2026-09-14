import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-xl border border-[#D9E5DC] bg-white px-4 py-2 text-sm text-[#14271C] ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[#8EAA97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3B2B] focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50 font-body transition-all",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
