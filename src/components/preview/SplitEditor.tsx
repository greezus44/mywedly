import React from "react";

export function SplitEditor({ preview, children }: { preview: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>{children}</div>
      <div>
        <div className="flex gap-2 mb-3 justify-center">
          <span className="text-xs text-dash-muted">Desktop</span>
        </div>
        <div className="border border-dash-border rounded-lg overflow-hidden bg-white" style={{ minHeight: 400 }}>
          {preview}
        </div>
      </div>
    </div>
  );
}
