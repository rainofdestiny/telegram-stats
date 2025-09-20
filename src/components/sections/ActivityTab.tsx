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
  // 🏆 Топ дней
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

  // 🕒 Теплокарта
  const heat = useMemo(() => buildHourWeekdayHeatmap(humans), [humans]);

  // 📈 По дням
  const dailyChart = useMemo(() => buildDailyChart(humans), [humans]);

  // 📈 По неделям
  const weeklyTrend = useMemo(() => buildWeeklyTrend(humans), [humans]);

  return (
    <>
      {/* 🏆 Топ дней по сообщениям */}
      <div className="card relative bg-gradient-to-br from-[#111122] to-[#0a0a15] shadow-lg shadow-purple-500/20">
        <div className="hdr mb-3">🏆 Топ дней по сообщениям</div>
        <TopDaysTable rows={dailyTop} />
      </div>

      {/* 🕒 По дням недели и часам */}
      <div className="card relative bg-gradient-to-br from-[#111122] to-[#0a0a15] shadow-lg shadow-purple-500/20">
        <div className="hdr mb-3">🕒 По дням недели и часам</div>
        <div className="rounded-xl bg-slate-900/40 p-3">
          <HourWeekdayHeatmap data={heat} />
        </div>
      </div>

      {/* 📈 Сообщения по дням */}
      <DailyChart data={dailyChart} />

      {/* 📈 Тренд по неделям */}
      <WeeklyTrend data={weeklyTrend} />
    </>
  );
}
