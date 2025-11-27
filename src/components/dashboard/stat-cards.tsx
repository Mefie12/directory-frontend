import type { LucideIcon } from "lucide-react";
import { Minus } from "lucide-react";

interface StatCardProps {
  title: string;
  icon: LucideIcon | string; // <= can be a Lucide icon or image path
  statValue?: number | null; // <= backend value (can be null)
  trendIconUp: LucideIcon;
  trendIconDown: LucideIcon;
  trend: number | null; // positive or negative percentage
}

export default function StatCards({
  title,
  icon: Icon,
  statValue,
  trendIconUp: TrendUpIcon,
  trendIconDown: TrendDownIcon,
  trend,
}: StatCardProps) {
  const isUp = trend !== null && trend >= 0;
  const TrendIcon = isUp ? TrendUpIcon : TrendDownIcon;
  const trendColor = isUp ? "text-[#4CAF50]" : "text-[#E65552]";
  const showDash = statValue === null || statValue === undefined;

  return (
    <div className="w-full rounded-2xl border border-[#E3E8EF] border-t-4 border-t-[#93C01F] bg-white p-3 shadow-xs relative">
      <div className="flex items-center justify-between px-3">
        {/* dash OR value */}
        {showDash ? (
          <Minus className="text-[#0F1A2A] w-6 h-6 mb-6" strokeWidth={3} />
        ) : (
          <span className="text-xl font-semibold text-[#0F1A2A] mb-6">
            {statValue}
          </span>
        )}

        {/* top-right circular icon */}
        <div className="w-10 h-10 rounded-full bg-[#EDF3F9] flex items-center justify-center">
          <Icon className="w-5 h-5 text-[#0F1A2A]" strokeWidth={2.2} />
        </div>
      </div>

      <div className="px-3">
        <h2 className="text-lg font-normal text-[#0F1A2A] mb-8">{title}</h2>

        <div className="flex items-center gap-2 mt-6">
          {trend === null || trend === 0 ? (
            <span className="text-[#65758B] text-lg">No changes</span>
          ) : (
            <>
              <TrendIcon
                className={`${trendColor} w-5 h-5`}
                strokeWidth={2.5}
              />
              <span className="text-[#65758B] text-lg">
                {`${Math.abs(trend)}% ${isUp ? "up" : "down"} last week`}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
