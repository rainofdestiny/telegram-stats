// src/components/social/WeeklyNewAuthorsChart.tsx
import React, { useMemo } from "react";
import ThemedArea from "../charts/ThemedArea";
import { weekKeyStartISO, formatISODateRU } from "../../lib/helpers";

export default function WeeklyNewAuthorsChart({
  data,
}: {
  data: { week: string; newAuthors: number }[];
}) {
  const points = useMemo(
    () =>
      data.map((d) => ({
        date: weekKeyStartISO(d.week),
        value: d.newAuthors,
      })),
    [data],
  );

  return (
    <ThemedArea
      title="🆕 Новые авторы по неделям"
      data={points}
      tooltipLabel="авторов"
      xTickFormatter={formatISODateRU}
    />
  );
}
