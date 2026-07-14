import React from "react";

export type Block =
  | { type: "heading"; content: string }
  | { type: "text"; content: string }
  | { type: "image"; content: string }
  | { type: "spacer" }
  | { type: "divider" };

export function BlockRenderer({ block }: { block: Block }) {
  switch (block.type) {
    case "heading": {
      if (typeof block.content !== "string") return null;
      return (
        <h2
          className="text-2xl font-semibold text-[var(--event-text)] mb-4"
          style={{ fontFamily: "var(--event-heading-font)" }}
          dangerouslySetInnerHTML={{ __html: block.content }}
        />
      );
    }
    case "text": {
      if (typeof block.content !== "string") return null;
      return (
        <div
          className="prose prose-sm max-w-none text-[var(--event-text)] mb-4"
          dangerouslySetInnerHTML={{ __html: block.content }}
        />
      );
    }
    case "image": {
      if (typeof block.content !== "string") return null;
      return (
        <div className="mb-4">
          <img src={block.content} alt="" className="w-full rounded-lg" />
        </div>
      );
    }
    case "spacer": {
      return <div className="h-6" />;
    }
    case "divider": {
      return <hr className="border-[var(--event-border)] my-4" />;
    }
    default:
      return null;
  }
}
