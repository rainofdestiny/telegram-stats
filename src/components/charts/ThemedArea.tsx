// src/components/charts/ThemedArea.tsx
import React from "react";
import ChartCard from "./ChartCard";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export type Point = { date: string; value: number };

type Props = {
  data: Point[];
  title: string;
  tooltipLabel?: string;
  right?: React.ReactNode;
  height?: number;
  xTickFormatter?: (s: string) => string;
};

export default function ThemedArea({
  data,
  title,
  tooltipLabel = "значение",
  right,
  height = 260,
  xTickFormatter,
}: Props) {
  return (
    <ChartCard title={title} right={right}>
      <div className="w-full h-[260px] md:h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ left: 8, right: 8, top: 8, bottom: 8 }}
          >
            <defs>
              <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#a855f7" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#26263a" strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={xTickFormatter}
              stroke="#8b8ca7"
            />
            <YAxis stroke="#8b8ca7" />
            <Tooltip
              contentStyle={{
                background: "#0b0b16",
                border: "1px solid #3b3b5c",
                borderRadius: 12,
              }}
              labelFormatter={(v) =>
                xTickFormatter ? xTickFormatter(String(v)) : String(v)
              }
              formatter={(v) => [String(v), tooltipLabel]}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#a855f7"
              fill="url(#grad)"
              strokeWidth={2}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
