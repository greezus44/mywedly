export type BlockType =
  | "heading"
  | "paragraph"
  | "image"
  | "spacer"
  | "divider"
  | "gallery"
  | "video"
  | "button"
  | "columns"
  | "list"
  | "quote"
  | "countdown"
  | "map"
  | "rsvp-form"
  | "guest-list"
  | "schedule"
  | "venue"
  | "faq";

export interface BlockContent {
  id: string;
  type: BlockType;
  data: Record<string, unknown>;
}

interface BlockTypeDefinition {
  type: BlockType;
  label: string;
  defaultData: Record<string, unknown>;
}

export const BLOCK_TYPES: BlockTypeDefinition[] = [
  { type: "heading", label: "Heading", defaultData: { text: "New Heading", level: 2 } },
  { type: "paragraph", label: "Paragraph", defaultData: { html: "<p>Your text here</p>" } },
  { type: "image", label: "Image", defaultData: { url: null, alt: "", caption: "" } },
  { type: "spacer", label: "Spacer", defaultData: { height: 40 } },
  { type: "divider", label: "Divider", defaultData: { style: "solid" } },
  { type: "gallery", label: "Gallery", defaultData: { images: [] } },
  { type: "video", label: "Video", defaultData: { url: "" } },
  { type: "button", label: "Button", defaultData: { label: "Click here", url: "" } },
  { type: "columns", label: "Columns", defaultData: { columns: [{ html: "" }, { html: "" }] } },
  { type: "list", label: "List", defaultData: { items: [], ordered: false } },
  { type: "quote", label: "Quote", defaultData: { text: "", attribution: "" } },
  { type: "countdown", label: "Countdown", defaultData: { targetDate: "" } },
  { type: "map", label: "Map", defaultData: { address: "" } },
  { type: "rsvp-form", label: "RSVP Form", defaultData: {} },
  { type: "guest-list", label: "Guest List", defaultData: {} },
  { type: "schedule", label: "Schedule", defaultData: {} },
  { type: "venue", label: "Venue", defaultData: { name: "", address: "" } },
  { type: "faq", label: "FAQ", defaultData: { question: "", answer: "" } },
];

export function createBlock(type: BlockType): BlockContent {
  const def = BLOCK_TYPES.find((bt) => bt.type === type);
  return {
    id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    data: { ...(def?.defaultData ?? {}) },
  };
}
