import React from "react";
import ThemedArea from "../charts/ThemedArea";
import ChartCard from "../ui/ChartCard";

export default function WeeklyActiveAuthorsChart({
  data,
}: {
  data: { date: string; value: number }[];
}) {
  return (
    <ChartCard title="📈 Активные авторы по неделям">
      <ThemedArea
        data={data}
        xKey="date"
        yKey="value"
        tooltipLabel="активных авторов/неделя"
        xTickFormatter={(d) => d}
      />
    </ChartCard>
  );
}
