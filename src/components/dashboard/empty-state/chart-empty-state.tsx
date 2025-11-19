import { BarChart3 } from "lucide-react";

export function EmptyChartState() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-muted-foreground">
      <BarChart3 className="h-8 w-8 mb-4 opacity-50" />
      <p className="text-base font-medium">No data available</p>
      <p className="text-xs">Chart data will appear here once available</p>
    </div>
  );
}
