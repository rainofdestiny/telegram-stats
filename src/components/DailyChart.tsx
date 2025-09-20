// src/components/DailyChart.tsx
import React, { useMemo } from "react";
import ThemedArea from "./charts/ThemedArea";
import { formatISODateRU } from "../lib/helpers";

export default function DailyChart({
  data,
}: {
  data: { date: string; count: number }[];
}) {
  const points = useMemo(
    () => data.map((d) => ({ date: d.date, value: d.count })),
    [data],
  );

  return (
    <ThemedArea
      title="📈 Сообщения по дням"
      data={points}
      tooltipLabel="сообщений"
      xTickFormatter={formatISODateRU}
    />
  );
}
