import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-light focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none",
  {
    variants: {
      variant: {
        default:
          "bg-[#1E3B2B] text-white hover:bg-[#14271C] shadow-sm hover:shadow active:scale-[0.98]",
        secondary:
          "bg-[#D9E5DC] text-[#14271C] hover:bg-[#c6d7ca] active:scale-[0.98]",
        outline:
          "border border-[#1E3B2B] text-[#1E3B2B] bg-transparent hover:bg-[#1E3B2B]/5 active:scale-[0.98]",
        gold:
          "bg-[#C5A880] text-[#14271C] font-semibold hover:bg-[#ba9b71] shadow-sm hover:shadow active:scale-[0.98]",
        ghost:
          "hover:bg-[#1E3B2B]/5 text-[#14271C] hover:text-[#1E3B2B]",
        destructive:
          "bg-red-600 text-white hover:bg-red-700 shadow-sm",
        link: "text-[#1E3B2B] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-6 py-2.5",
        sm: "h-9 rounded-lg px-3.5 text-xs",
        lg: "h-13 rounded-2xl px-8 text-base",
        icon: "h-10 w-10 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
