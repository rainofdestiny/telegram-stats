import React from "react";
import Heatmap, { type HeatmapPoint } from "../Heatmap";

export default function HourWeekdayHeatmap({ data }: { data: HeatmapPoint[] }) {
  return <Heatmap data={data} />;
}
