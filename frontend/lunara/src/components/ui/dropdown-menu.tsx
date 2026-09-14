import * as React from "react"
import { cn } from "@/lib/utils"

interface DropdownContextValue {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const DropdownContext = React.createContext<DropdownContextValue | null>(null)

export const DropdownMenu = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <DropdownContext.Provider value={{ isOpen, setIsOpen }}>
      <div ref={ref} className="relative inline-block text-left font-body">
        {children}
      </div>
    </DropdownContext.Provider>
  )
}

export const DropdownMenuTrigger = ({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  const ctx = React.useContext(DropdownContext)
  return (
    <button
      type="button"
      onClick={() => ctx?.setIsOpen((prev) => !prev)}
      className={cn("inline-flex items-center cursor-pointer", className)}
      {...props}
    >
      {children}
    </button>
  )
}

export const DropdownMenuContent = ({
  children,
  align = "end",
  className,
}: {
  children: React.ReactNode;
  align?: "start" | "end";
  className?: string;
}) => {
  const ctx = React.useContext(DropdownContext)
  if (!ctx?.isOpen) return null

  return (
    <div
      className={cn(
        "absolute z-50 mt-2 min-w-[180px] rounded-xl border border-[#E2E8E3] bg-white p-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-150",
        align === "end" ? "right-0" : "left-0",
        className
      )}
    >
      {children}
    </div>
  )
}

export const DropdownMenuItem = ({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) => {
  const ctx = React.useContext(DropdownContext)
  return (
    <div
      onClick={() => {
        onClick?.()
        ctx?.setIsOpen(false)
      }}
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-lg px-3 py-2 text-xs font-medium text-[#14271C] outline-none transition-colors hover:bg-[#F8F9F5] hover:text-[#1E3B2B]",
        className
      )}
    >
      {children}
    </div>
  )
}

export const DropdownMenuLabel = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={cn("px-3 py-1.5 text-xs font-semibold text-[#8EAA97]", className)}>
    {children}
  </div>
)

export const DropdownMenuSeparator = () => (
  <div className="-mx-1 my-1 h-px bg-[#E2E8E3]" />
)
