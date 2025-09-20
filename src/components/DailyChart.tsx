import React from "react";
import ThemedArea from "./charts/ThemedArea";
import ChartCard from "./ui/ChartCard";

export default function DailyChart({
  data,
}: {
  data: { date: string; count: number }[];
}) {
  return (
    <ChartCard title="📈 Сообщения по дням">
      <ThemedArea
        data={data}
        xKey="date"
        yKey="count"
        tooltipLabel="сообщений/день"
        xTickFormatter={(d) => d}
      />
    </ChartCard>
  );
}
