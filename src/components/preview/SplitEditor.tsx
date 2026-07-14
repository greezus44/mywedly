import { useState, type ReactNode } from "react";
import { cn } from "../../lib/utils";

export interface SplitEditorProps {
  editor: ReactNode;
  preview: ReactNode;
  className?: string;
  editorClassName?: string;
  previewClassName?: string;
}

export function SplitEditor({
  editor,
  preview,
  className,
  editorClassName,
  previewClassName,
}: SplitEditorProps) {
  const [mobileTab, setMobileTab] = useState<"editor" | "preview">("editor");

  return (
    <div className={cn("flex h-full flex-col lg:flex-row", className)}>
      {/* Mobile tab switcher */}
      <div className="flex border-b border-dash-border lg:hidden">
        <button
          type="button"
          onClick={() => setMobileTab("editor")}
          className={cn(
            "flex-1 px-4 py-2 text-sm font-medium transition-colors",
            mobileTab === "editor"
              ? "border-b-2 border-dash-primary text-dash-primary"
              : "text-dash-muted hover:text-dash-text"
          )}
        >
          ✏️ Editor
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("preview")}
          className={cn(
            "flex-1 px-4 py-2 text-sm font-medium transition-colors",
            mobileTab === "preview"
              ? "border-b-2 border-dash-primary text-dash-primary"
              : "text-dash-muted hover:text-dash-text"
          )}
        >
          👁️ Preview
        </button>
      </div>

      {/* Editor panel */}
      <div
        className={cn(
          "overflow-auto border-dash-border p-4 lg:w-1/2 lg:border-r",
          mobileTab !== "editor" && "hidden lg:block",
          editorClassName
        )}
      >
        {editor}
      </div>

      {/* Preview panel */}
      <div
        className={cn(
          "overflow-auto bg-dash-bg p-4 lg:w-1/2",
          mobileTab !== "preview" && "hidden lg:block",
          previewClassName
        )}
      >
        {preview}
      </div>
    </div>
  );
}

export default SplitEditor;
