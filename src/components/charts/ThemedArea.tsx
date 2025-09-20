// src/components/charts/ThemedArea.tsx
import React from "react";
import ChartCard from "./ChartCard";
import {
  ResponsiveContainer,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Area,
} from "recharts";

export type Point = { date: string; value: number };

type Props = {
  data: Point[];
  /** Заголовок карточки (обязателен) */
  title: string;
  /** Правый блок в заголовке (кнопки/селекты) */
  right?: React.ReactNode;
  /** Ключ по X */
  xKey?: string;
  /** Ключ по Y */
  yKey?: string;
  /** Подпись в тултипе */
  tooltipLabel?: string;
  /** Форматер оси X */
  xTickFormatter?: (d: string) => string;
  /** Высота графика */
  height?: number;
};

export default function ThemedArea({
  data,
  title,
  right,
  xKey = "date",
  yKey = "value",
  tooltipLabel = "",
  xTickFormatter = (d) => d,
  height: _height = 260,
}: Props) {
  return (
    <ChartCard title={title} right={right}>
      <div style={{ height: _height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 4, right: 8, bottom: 0, left: -8 }}
          >
            <CartesianGrid strokeOpacity={0.1} vertical={false} />
            <XAxis
              dataKey={xKey}
              tickFormatter={xTickFormatter}
              tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              height={24}
            />
            <YAxis
              tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={36}
              allowDecimals={false}
            />
            <Tooltip
              cursor={{ strokeOpacity: 0.15 }}
              contentStyle={{
                background: "#0f0f1a",
                border: "1px solid rgba(148,163,184,0.2)",
                borderRadius: 12,
                color: "#fff",
                fontSize: 12,
              }}
              formatter={(val: any) => [String(val), tooltipLabel]}
              labelFormatter={(lab) => String(lab)}
            />
            <Area
              type="monotone"
              dataKey={yKey}
              stroke="rgba(168,85,247,0.9)"
              fill="rgba(168,85,247,0.25)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
