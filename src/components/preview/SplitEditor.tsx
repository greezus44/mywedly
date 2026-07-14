import { useState, type ReactNode } from "react";
import { cn } from "../../lib/utils";

interface SplitEditorProps {
  editor: ReactNode;
  preview: ReactNode;
}

type Tab = "edit" | "preview";

export function SplitEditor({ editor, preview }: SplitEditorProps) {
  const [activeTab, setActiveTab] = useState<Tab>("edit");

  return (
    <>
      {/* Desktop: two columns */}
      <div className="hidden lg:flex h-full min-h-0">
        {/* Left: scrollable editor */}
        <div className="w-[420px] shrink-0 overflow-y-auto border-r border-dash-border bg-dash-bg">
          <div className="p-6">{editor}</div>
        </div>
        {/* Right: sticky preview */}
        <div className="flex-1 overflow-hidden bg-dash-surface-alt">
          <div className="sticky top-0 h-screen flex flex-col items-center justify-start p-6 overflow-hidden">
            {preview}
          </div>
        </div>
      </div>

      {/* Mobile: tabbed */}
      <div className="flex flex-col h-full lg:hidden">
        {/* Tab bar */}
        <div className="flex border-b border-dash-border bg-dash-bg shrink-0">
          {(["edit", "preview"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={cn(
                "flex-1 py-3 text-sm font-medium capitalize transition-colors",
                activeTab === t
                  ? "border-b-2 border-dash-primary text-dash-primary"
                  : "text-dash-muted hover:text-dash-text",
              )}
            >
              {t}
            </button>
          ))}
        </div>
        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === "edit" ? (
            <div className="p-4">{editor}</div>
          ) : (
            <div className="p-4">{preview}</div>
          )}
        </div>
      </div>
    </>
  );
}
