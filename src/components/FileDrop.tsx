import React from "react";

interface Props {
  onJSON: (data: any) => void;
}

export default function FileDrop({ onJSON }: Props) {
  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      const data = JSON.parse(text);
      onJSON(data);
    } catch {
      alert("Неверный JSON");
    }
  };

  const onDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      const data = JSON.parse(text);
      onJSON(data);
    } catch {
      alert("Неверный JSON");
    }
  };

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      className="card border-2 border-dashed border-blue-700 bg-[#0f172a] text-center py-10 cursor-pointer hover:bg-[#1e293b] transition"
      onClick={() => document.getElementById("fileInput")?.click()}
    >
      <input
        id="fileInput"
        type="file"
        accept="application/json"
        className="hidden"
        onChange={onChange}
      />
      <p className="hdr">📂 Перетащи сюда result.json</p>
      <p className="lbl">или кликни чтобы выбрать файл</p>
    </div>
  );
}
