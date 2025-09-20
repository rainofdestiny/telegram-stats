import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function WeeklyNewAuthorsChart({
  data,
}: {
  data: { week: string; newAuthors: number }[];
}) {
  return (
    <div className="card">
      <div className="hdr mb-3">🆕 Новые авторы по неделям</div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <XAxis dataKey="week" stroke="#888" />
          <YAxis stroke="#888" />
          <Tooltip />
          <Bar dataKey="newAuthors" fill="#a855f7" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
