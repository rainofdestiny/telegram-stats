import React from "react";
import ThemedArea from "../charts/ThemedArea";
import ChartCard from "../ui/ChartCard";

export default function WeeklyNewAuthorsChart({
  data,
}: {
  data: { week: string; newAuthors: number }[];
}) {
  return (
    <ChartCard title="🆕 Новые авторы по неделям">
      <ThemedArea
        data={data}
        xKey="week"
        yKey="newAuthors"
        tooltipLabel="новых авторов/неделя"
        xTickFormatter={(w) => w}
      />
    </ChartCard>
  );
}
