import React, { useState } from "react";
import { cn } from "../../lib/utils";

export interface SplitEditorProps {
  editor: React.ReactNode;
  preview: React.ReactNode;
  className?: string;
  initialSplit?: number; // percentage for editor width, 0-100
}

export function SplitEditor({ editor, preview, className, initialSplit = 50 }: SplitEditorProps) {
  const [split, setSplit] = useState(initialSplit);
  const [dragging, setDragging] = useState(false);

  function onMouseDown(e: React.MouseEvent) {
    e.preventDefault();
    setDragging(true);

    function onMove(ev: MouseEvent) {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const pct = ((ev.clientX - rect.left) / rect.width) * 100;
      setSplit(Math.max(20, Math.min(80, pct)));
    }
    function onUp() {
      setDragging(false);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    }
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  const containerRef = React.useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className={cn("flex h-full w-full overflow-hidden", className)}>
      <div
        className="overflow-auto scrollbar-thin"
        style={{ width: `${split}%` }}
      >
        {editor}
      </div>
      <div
        onMouseDown={onMouseDown}
        className="w-1 cursor-col-resize bg-dash-border hover:bg-dash-primary transition-colors"
      />
      <div
        className="overflow-auto scrollbar-thin"
        style={{ width: `${100 - split}%` }}
      >
        {preview}
      </div>
    </div>
  );
}
