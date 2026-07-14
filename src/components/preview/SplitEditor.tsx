import React, { useState } from "react";

interface SplitEditorProps {
  editor: React.ReactNode;
  preview: React.ReactNode;
  title?: string;
}

export function SplitEditor({ editor, preview, title }: SplitEditorProps) {
  const [tab, setTab] = useState<"edit" | "preview">("edit");

  return (
    <div className="flex flex-col h-full">
      {title && <h2 className="text-lg font-semibold text-gray-800 mb-4">{title}</h2>}
      <div className="lg:hidden flex gap-2 mb-4">
        <button onClick={() => setTab("edit")} className={`px-4 py-2 rounded-lg text-sm ${tab === "edit" ? "bg-[var(--event-primary,#8B7355)] text-white" : "bg-gray-100"}`}>Edit</button>
        <button onClick={() => setTab("preview")} className={`px-4 py-2 rounded-lg text-sm ${tab === "preview" ? "bg-[var(--event-primary,#8B7355)] text-white" : "bg-gray-100"}`}>Preview</button>
      </div>
      <div className="flex gap-6 flex-1 min-h-0">
        <div className={`flex-1 overflow-y-auto ${tab === "preview" ? "hidden lg:block" : ""}`}>
          {editor}
        </div>
        <div className={`flex-1 overflow-y-auto border-l border-gray-200 pl-6 ${tab === "edit" ? "hidden lg:block" : ""}`}>
          {preview}
        </div>
      </div>
    </div>
  );
}
