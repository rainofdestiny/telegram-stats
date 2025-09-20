import React from "react";
import LongestMessagesTable from "./LongestMessagesTable";

type Row = { id: number; from: string; text: string; length: number };

export default function LongestMessagesCard({
  rows,
  chatSlug,
}: {
  rows: Row[];
  chatSlug: string;
}) {
  const top10 = rows.slice(0, 10);

  return (
    <div>
      <LongestMessagesTable rows={top10} chatSlug={chatSlug} />
    </div>
  );
}
