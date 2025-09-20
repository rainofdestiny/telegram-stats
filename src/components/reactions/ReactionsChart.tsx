import React from "react";
import ThemedArea from "../charts/ThemedArea";
import ChartCard from "../ui/ChartCard";

export default function ReactionsChart({
  data,
}: {
  data: { date: string; count: number }[];
}) {
  return (
    <ChartCard title="📈 Динамика реакций">
      <ThemedArea
        data={data}
        xKey="date"
        yKey="count"
        tooltipLabel="реакций/день"
        xTickFormatter={(d) => d}
      />
    </ChartCard>
  );
}
