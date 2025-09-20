import React, { useId } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

type Props = {
  data: Array<Record<string, unknown>>;
  /** ключ по оси X (строка) */
  xKey: string;
  /** ключ по оси Y (число) */
  yKey: string;
  height?: number;
  xTickFormatter?: (v: any) => string;
  yTickFormatter?: (v: number) => string;
  tooltipLabel?: string;
};

export default function ThemedArea({
  data,
  xKey,
  yKey,
  height = 260,
  xTickFormatter,
  yTickFormatter = (v) => String(v),
  tooltipLabel,
}: Props) {
  const gradId = useId().replace(/:/g, "-");

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`area-${gradId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#a78bfa" stopOpacity={0.12} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke="#ffffff10" strokeDasharray="3 3" />
          <XAxis
            dataKey={xKey}
            tick={{ fill: "#9ca3af", fontSize: 12 }}
            axisLine={{ stroke: "#ffffff14" }}
            tickLine={{ stroke: "#ffffff14" }}
            minTickGap={16}
            tickFormatter={xTickFormatter}
          />
          <YAxis
            width={46}
            tick={{ fill: "#9ca3af", fontSize: 12 }}
            axisLine={{ stroke: "#ffffff14" }}
            tickLine={{ stroke: "#ffffff14" }}
            tickFormatter={yTickFormatter}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              background: "#0b0b14",
              border: "1px solid #ffffff22",
              borderRadius: 10,
              color: "#e5e7eb",
            }}
            labelStyle={{ color: "#c4b5fd", marginBottom: 6 }}
            formatter={(v: any) => [String(v), tooltipLabel ?? ""]}
          />
          <Area
            type="monotone"
            dataKey={yKey}
            stroke="#a78bfa"
            fillOpacity={1}
            fill={`url(#area-${gradId})`}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
