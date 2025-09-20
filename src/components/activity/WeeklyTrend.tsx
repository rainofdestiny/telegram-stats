import React from "react";
import ThemedArea from "../charts/ThemedArea";
import ChartCard from "../ui/ChartCard";

export default function WeeklyTrend({
  data,
}: {
  data: { week: string; count: number }[];
}) {
  return (
    <ChartCard title="📈 Тренд по неделям">
      <ThemedArea
        data={data}
        xKey="week"
        yKey="count"
        tooltipLabel="сообщений/неделя"
        xTickFormatter={(w) => w}
      />
    </ChartCard>
  );
}
