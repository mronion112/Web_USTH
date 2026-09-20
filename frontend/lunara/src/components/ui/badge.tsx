import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold leading-none tracking-wide transition-colors font-body",
  {
    variants: {
      variant: {
        default:
          "bg-[#1E3B2B] text-white",
        secondary:
          "bg-[#D9E5DC] text-[#14271C]",
        gold:
          "bg-[#C5A880]/20 text-[#2D1D02] border border-[#C5A880]/30",
        outline:
          "border border-[#E2E8E3] text-[#6B726C]",
        success:
          "bg-[#E8F5E9] text-[#2E7D32] border border-[#2E7D32]/20",
        danger:
          "bg-[#FFEBEE] text-[#D32F2F] border border-[#D32F2F]/20",
        warning:
          "bg-amber-50 text-amber-800 border border-amber-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
