// app/components/ui/chart.tsx
import * as React from "react";
import * as Recharts from "recharts";
import type { Payload as RechartsPayload } from "recharts/types/component/DefaultTooltipContent";
import { cn } from "../../libs/utils";

// Chart config context
export type ChartConfig = { [key: string]: { label?: React.ReactNode; color?: string } };
const ChartContext = React.createContext<{ config: ChartConfig } | null>(null);
export const useChart = () => {
  const ctx = React.useContext(ChartContext);
  if (!ctx) throw new Error("useChart must be inside <ChartContainer>");
  return ctx;
};

// ------------------- ChartContainer -------------------
export const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & { config: ChartConfig; children: React.ReactNode }
>(({ children, config, className, ...props }, ref) => (
  <ChartContext.Provider value={{ config }}>
    <div ref={ref} className={cn("flex aspect-video justify-center", className)} {...props}>
      <Recharts.ResponsiveContainer>{children}</Recharts.ResponsiveContainer>
    </div>
  </ChartContext.Provider>
));
ChartContainer.displayName = "ChartContainer";

// ------------------- ChartTooltipContent -------------------
type ChartTooltipProps = {
  active?: boolean;
  payload?: RechartsPayload<any, any>[];
  hideLabel?: boolean;
  hideIndicator?: boolean;
};

export const ChartTooltipContent = React.forwardRef<HTMLDivElement, ChartTooltipProps>(
  ({ active, payload, hideLabel = false, hideIndicator = false }, ref) => {
    if (!active || !payload?.length) return null;
    return (
      <div ref={ref} className="bg-white border rounded p-2 text-xs shadow">
        {payload.map((item, idx) => (
          <div key={idx} className="flex items-center gap-1">
            {!hideIndicator && <div style={{ backgroundColor: item.color, width: 8, height: 8 }} />}
            <span>{item.name}</span>
            {item.value != null && <span>{item.value}</span>}
          </div>
        ))}
      </div>
    );
  }
);
ChartTooltipContent.displayName = "ChartTooltipContent";

// ------------------- ChartLegendContent -------------------
type ChartLegendProps = { payload?: RechartsPayload<any, any>[]; hideIcon?: boolean };
export const ChartLegendContent = React.forwardRef<HTMLDivElement, ChartLegendProps>(
  ({ payload, hideIcon = false }, ref) => {
    if (!payload?.length) return null;
    return (
      <div ref={ref} className="flex gap-2">
        {payload.map((item, idx) => (
          <div key={idx} className="flex items-center gap-1">
            {!hideIcon && (
              <div style={{ backgroundColor: item.color, width: 8, height: 8 }} />
            )}
            <span>{item.name}</span>
          </div>
        ))}
      </div>
    );
  }
);
ChartLegendContent.displayName = "ChartLegendContent";

// ------------------- ChartStyle -------------------
export const ChartStyle = ({ config }: { config: ChartConfig }) => {
  if (!Object.keys(config).length) return null;
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(config)
          .map(([k, v]) => `--color-${k}: ${v.color || "currentColor"};`)
          .join("\n"),
      }}
    />
  );
};
ChartStyle.displayName = "ChartStyle";
