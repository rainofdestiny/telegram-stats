import React, { useMemo } from "react";
import TopDaysTable from "../activity/TopDaysTable";
import HourWeekdayHeatmap from "../activity/HourWeekdayHeatmap";
import DailyChart from "../DailyChart";
import WeeklyTrend from "../activity/WeeklyTrend";
import {
  buildHourWeekdayHeatmap,
  buildDailyChart,
  buildWeeklyTrend,
} from "../../lib/telegram";
import type { ParsedMessage } from "../../types";

export default function ActivityTab({ humans }: { humans: ParsedMessage[] }) {
  const dailyTop = useMemo(() => {
    const byDate = new Map<string, number>();
    humans.forEach((m) => {
      const d = m.fullDateISO.slice(0, 10);
      byDate.set(d, (byDate.get(d) ?? 0) + 1);
    });
    return Array.from(byDate.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) =>
        a.count === b.count ? (a.date > b.date ? -1 : 1) : b.count - a.count,
      );
  }, [humans]);

  const heat = useMemo(() => buildHourWeekdayHeatmap(humans), [humans]);
  const dailyChart = useMemo(() => buildDailyChart(humans), [humans]);
  const weeklyTrend = useMemo(() => buildWeeklyTrend(humans), [humans]);

  return (
    <>
      <TopDaysTable rows={dailyTop} />
      <HourWeekdayHeatmap data={heat} />
      <DailyChart data={dailyChart} />
      <WeeklyTrend data={weeklyTrend} />
    </>
  );
}
