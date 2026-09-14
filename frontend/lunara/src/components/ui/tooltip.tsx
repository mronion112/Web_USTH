import * as React from "react"
import { cn } from "@/lib/utils"

export const TooltipProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}

export const Tooltip = ({ children }: { children: React.ReactNode }) => {
  return <div className="relative group inline-block">{children}</div>
}

export const TooltipTrigger = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return <div className={cn("inline-block", className)}>{children}</div>
}

export const TooltipContent = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return (
    <div
      className={cn(
        "absolute bottom-full mb-2 hidden group-hover:flex z-50 rounded-lg bg-[#14271C] px-3 py-1.5 text-xs text-white shadow-md animate-in fade-in zoom-in-95",
        className
      )}
    >
      {children}
    </div>
  )
}
