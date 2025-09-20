import React from "react";

export default function ChartCard({
  title,
  children,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="card relative bg-gradient-to-br from-[#111122] to-[#0a0a15] shadow-lg shadow-purple-500/20">
      <div className="flex justify-between items-center mb-3">
        <div className="hdr">{title}</div>
      </div>
      {children}
    </div>
  );
}
