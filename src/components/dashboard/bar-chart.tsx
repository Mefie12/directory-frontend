"use client";

import {
  Bar,
  BarChart as RBarChart,
  Line,
  LineChart as RLineChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EmptyChartState } from "./empty-state/chart-empty-state";

type ChartRecord = Record<string, number | string>;

export type ChartType = "bar" | "line";

export interface ChartDataKey {
  key: string;
  label: string;
  color?: string;
}

interface BaseChartProps<T extends ChartRecord> {
  title?: string;
  data: T[] | null;
  type: ChartType;
  dataKeys: ChartDataKey[];
  xAxisKey: keyof T;
  height?: number;
  showLegend?: boolean;
  stacked?: boolean; // bar only
}

export function Chart<T extends ChartRecord>({
  data,
  type,
  dataKeys,
  xAxisKey,
  height = 300,
  showLegend = true,
  stacked = false,
}: BaseChartProps<T>) {
  const isEmpty = !data || data.length === 0;

  if (isEmpty) {
    return <EmptyChartState />;
  }

  // Reusable axes, grid, tooltip, legend
  const renderShared = () => (
    <>
      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />

      <XAxis
        dataKey={xAxisKey as string}
        className="text-sm"
        tick={{ fill: "#65758B" }}
      />

      <YAxis className="text-sm" tick={{ fill: "#65758B" }} />

      <Tooltip
        contentStyle={{
          backgroundColor: "hsl(var(--card))",
          border: "1px solid hsl(var(--border))",
          borderRadius: "var(--radius)",
        }}
      />

      {showLegend && <Legend />}
    </>
  );

  return (
    <div>
      <ResponsiveContainer width="100%" height={height}>
        {type === "bar" ? (
          <RBarChart data={data}>
            {renderShared()}

            {dataKeys.map((dk, index) => (
              <Bar
                key={dk.key}
                dataKey={dk.key}
                name={dk.label}
                fill={dk.color || `hsl(var(--chart-${(index % 5) + 1}))`}
                stackId={stacked ? "stack" : undefined}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </RBarChart>
        ) : (
          <RLineChart data={data}>
            {renderShared()}

            {dataKeys.map((dk, index) => (
              <Line
                key={dk.key}
                type="monotone"
                dataKey={dk.key}
                name={dk.label}
                stroke={dk.color || `hsl(var(--chart-${(index % 5) + 1}))`}
                strokeWidth={2.4}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </RLineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
