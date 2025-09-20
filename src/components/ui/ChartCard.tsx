import React from "react";

type Props = {
  title: React.ReactNode; // заголовок слева
  right?: React.ReactNode; // элементы справа (стрелки/фильтры)
  children: React.ReactNode; // таблица/график/контент
  className?: string;
};

export default function ChartCard({
  title,
  right,
  children,
  className,
}: Props) {
  return (
    <div
      className={
        "card relative rounded-2xl bg-gradient-to-br from-[#111122] to-[#0a0a15] " +
        "shadow-lg shadow-purple-500/20 " +
        (className ?? "")
      }
    >
      <div className="flex items-center justify-between mb-3">
        <div className="hdr">{title}</div>
        {right ? <div className="flex items-center gap-2">{right}</div> : null}
      </div>
      {children}
    </div>
  );
}
