// src/components/social/WeeklyActiveAuthorsChart.tsx
import React, { useMemo } from "react";
import ThemedArea from "../charts/ThemedArea";
import { formatISODateRU } from "../../lib/helpers";

export default function WeeklyActiveAuthorsChart({
  data,
}: {
  data: { date: string; value: number }[];
}) {
  const points = useMemo(
    () => data.map((d) => ({ date: d.date, value: d.value })),
    [data],
  );

  return (
    <ThemedArea
      title="📈 Активные авторы по неделям"
      data={points}
      tooltipLabel="авторов"
      xTickFormatter={formatISODateRU}
    />
  );
}
