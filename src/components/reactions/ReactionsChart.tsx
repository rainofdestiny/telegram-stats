// src/components/reactions/ReactionsChart.tsx
import React, { useMemo } from "react";
import ThemedArea from "../charts/ThemedArea";
import { formatISODateRU } from "../../lib/helpers";

export default function ReactionsChart({
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
      title="📈 Динамика реакций"
      data={points}
      tooltipLabel="реакций"
      xTickFormatter={formatISODateRU}
    />
  );
}
