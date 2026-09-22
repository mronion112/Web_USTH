import * as React from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

export interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export const Sheet = ({ open, onOpenChange, children }: SheetProps) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-body">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#14271C]/50 backdrop-blur-xs transition-opacity duration-300"
        onClick={() => onOpenChange(false)}
      />
      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 flex max-w-full pl-10">
        <div className="relative w-screen max-w-md bg-white shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

export const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex flex-col space-y-2 text-left mb-6 pb-4 border-b border-[#E2E8E3]", className)}
    {...props}
  />
)

export const SheetTitle = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h2
    className={cn("font-display text-xl font-semibold text-[#14271C]", className)}
    {...props}
  />
)

export const SheetDescription = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn("text-sm text-[#6B726C]", className)} {...props} />
)

export const SheetClose = ({
  onClick,
  className,
  children,
}: {
  onClick?: () => void;
  className?: string;
  asChild?: boolean;
  children?: React.ReactNode;
}) => {
  if (children) {
    return (
      <div onClick={onClick} className={className}>
        {children}
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "absolute right-4 top-4 rounded-full p-2 text-[#6B726C] hover:bg-[#F8F9F5] hover:text-[#14271C] transition-colors cursor-pointer",
        className
      )}
    >
      <X className="h-5 w-5" />
    </button>
  );
};
