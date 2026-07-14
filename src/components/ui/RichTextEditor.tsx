import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { cn } from "../../lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  className?: string;
  placeholder?: string;
}

type Command =
  | "bold"
  | "italic"
  | "underline"
  | "strikeThrough"
  | "insertUnorderedList"
  | "insertOrderedList"
  | "formatBlock-h1"
  | "formatBlock-h2"
  | "formatBlock-h3"
  | "formatBlock-p"
  | "formatBlock-blockquote"
  | "createLink"
  | "insertImage";

const ToolbarButton = ({
  onClick,
  active,
  children,
  title,
}: {
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
  title: string;
}) => (
  <button
    type="button"
    title={title}
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    className={cn(
      "flex h-8 w-8 items-center justify-center rounded text-sm hover:bg-muted/20",
      active && "bg-primary/15 text-primary"
    )}
  >
    {children}
  </button>
);

export function RichTextEditor({
  value,
  onChange,
  className,
  placeholder,
}: RichTextEditorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (ref.current && !focused && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || "";
    }
  }, [value, focused]);

  const exec = useCallback((command: Command, arg?: string) => {
    if (command.startsWith("formatBlock-")) {
      const block = command.split("-")[1];
      document.execCommand("formatBlock", false, block);
    } else if (command === "createLink") {
      const url = window.prompt("Enter URL");
      if (url) document.execCommand("createLink", false, url);
    } else if (command === "insertImage") {
      const url = window.prompt("Enter image URL");
      if (url) document.execCommand("insertImage", false, url);
    } else {
      document.execCommand(command, false, arg);
    }
    if (ref.current) onChange(ref.current.innerHTML);
  }, [onChange]);

  const handleInput = useCallback(() => {
    if (ref.current) onChange(ref.current.innerHTML);
  }, [onChange]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "b") {
      e.preventDefault();
      exec("bold");
    }
    if ((e.metaKey || e.ctrlKey) && e.key === "i") {
      e.preventDefault();
      exec("italic");
    }
  }, [exec]);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-md border border-border bg-surface",
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-surface-alt px-2 py-1">
        <ToolbarButton title="Bold" onClick={() => exec("bold")}>
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton title="Italic" onClick={() => exec("italic")}>
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton title="Underline" onClick={() => exec("underline")}>
          <u>U</u>
        </ToolbarButton>
        <ToolbarButton title="Strikethrough" onClick={() => exec("strikeThrough")}>
          <s>S</s>
        </ToolbarButton>
        <div className="mx-1 h-5 w-px bg-border" />
        <ToolbarButton title="Heading 1" onClick={() => exec("formatBlock-h1")}>
          H1
        </ToolbarButton>
        <ToolbarButton title="Heading 2" onClick={() => exec("formatBlock-h2")}>
          H2
        </ToolbarButton>
        <ToolbarButton title="Heading 3" onClick={() => exec("formatBlock-h3")}>
          H3
        </ToolbarButton>
        <ToolbarButton title="Paragraph" onClick={() => exec("formatBlock-p")}>
          P
        </ToolbarButton>
        <ToolbarButton title="Quote" onClick={() => exec("formatBlock-blockquote")}>
          “
        </ToolbarButton>
        <div className="mx-1 h-5 w-px bg-border" />
        <ToolbarButton title="Bullet list" onClick={() => exec("insertUnorderedList")}>
          •
        </ToolbarButton>
        <ToolbarButton title="Numbered list" onClick={() => exec("insertOrderedList")}>
          1.
        </ToolbarButton>
        <div className="mx-1 h-5 w-px bg-border" />
        <ToolbarButton title="Link" onClick={() => exec("createLink")}>
          🔗
        </ToolbarButton>
        <ToolbarButton title="Image" onClick={() => exec("insertImage")}>
          🖼
        </ToolbarButton>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        data-placeholder={placeholder}
        className={cn(
          "rich-text-editor min-h-[120px] px-3 py-2 text-sm text-foreground focus:outline-none",
          "[&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-muted"
        )}
      />
    </div>
  );
}
