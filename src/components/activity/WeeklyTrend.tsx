// src/components/activity/WeeklyTrend.tsx
import React, { useMemo } from "react";
import ThemedArea from "../charts/ThemedArea";
import { weekKeyStartISO, formatISODateRU } from "../../lib/helpers";

export default function WeeklyTrend({
  data,
}: {
  data: { week: string; count: number }[];
}) {
  const points = useMemo(
    () =>
      data.map((d) => ({
        date: weekKeyStartISO(d.week), // начало недели
        value: d.count,
      })),
    [data],
  );

  return (
    <ThemedArea
      title="📈 Тренд по неделям"
      data={points}
      tooltipLabel="сообщений"
      xTickFormatter={formatISODateRU}
    />
  );
}
