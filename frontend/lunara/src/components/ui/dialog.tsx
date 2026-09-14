import * as React from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export const Dialog = ({ open, onOpenChange, children }: DialogProps) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#14271C]/60 backdrop-blur-xs transition-opacity"
        onClick={() => onOpenChange(false)}
      />
      {/* Modal Dialog Content */}
      <div className="relative z-50 w-full max-w-lg rounded-2xl bg-white p-6 shadow-modal animate-in fade-in zoom-in-95 duration-200 font-body">
        {children}
      </div>
    </div>
  )
}

export const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex flex-col space-y-1.5 text-center sm:text-left mb-4", className)}
    {...props}
  />
)

export const DialogTitle = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h2
    className={cn("font-display text-xl font-semibold text-[#14271C]", className)}
    {...props}
  />
)

export const DialogDescription = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn("text-sm text-[#6B726C]", className)} {...props} />
)

export const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6", className)}
    {...props}
  />
)

export const DialogClose = ({
  onClose,
  className,
}: {
  onClose?: () => void;
  className?: string;
}) => (
  <button
    onClick={onClose}
    className={cn(
      "absolute right-4 top-4 rounded-full p-1.5 text-[#6B726C] hover:bg-[#F8F9F5] hover:text-[#14271C] transition-colors cursor-pointer",
      className
    )}
  >
    <X className="h-4 w-4" />
  </button>
)
