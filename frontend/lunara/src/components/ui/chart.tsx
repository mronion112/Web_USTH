import * as React from "react"
import { cn } from "@/lib/utils"

export type ChartConfig = Record<
  string,
  {
    label?: React.ReactNode;
    icon?: React.ComponentType;
    color?: string;
  }
>

interface ChartContextProps {
  config: ChartConfig;
}

const ChartContext = React.createContext<ChartContextProps | null>(null)

export function useChart() {
  const context = React.useContext(ChartContext)
  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />")
  }
  return context
}

export const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig;
    children: React.ReactNode;
  }
>(({ id, className, children, config, ...props }, ref) => {
  const chartId = React.useId()

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={id || chartId}
        ref={ref}
        className={cn(
          "flex aspect-auto justify-center text-xs font-body [&_.recharts-cartesian-axis-tick_text]:fill-[#6B726C] [&_.recharts-cartesian-grid_line]:stroke-[#E2E8E3] [&_.recharts-curve.recharts-tooltip-cursor]:stroke-[#1E3B2B]",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </ChartContext.Provider>
  )
})
ChartContainer.displayName = "ChartContainer"

export const ChartTooltip = ({
  active,
  payload,
  label,
  formatter,
  labelFormatter,
}: any) => {
  if (!active || !payload?.length) {
    return null
  }

  return (
    <div className="rounded-xl border border-[#E2E8E3] bg-white p-3 shadow-lg font-body">
      {label && (
        <p className="mb-1 text-xs font-semibold text-[#14271C] border-b border-[#E2E8E3] pb-1">
          {labelFormatter ? labelFormatter(label) : label}
        </p>
      )}
      <div className="flex flex-col gap-1">
        {payload.map((item: any, index: number) => {
          const val = formatter ? formatter(item.value, item.name, item) : `${Number(item.value).toLocaleString('vi-VN')} đ`;
          return (
            <div key={index} className="flex items-center gap-2 text-xs">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: item.color || item.fill }}
              />
              <span className="text-[#526056]">{item.name}:</span>
              <span className="font-semibold text-[#14271C]">{val}</span>
            </div>
          );
        })}
      </div>
    </div>
  )
}
