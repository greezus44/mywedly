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
  type: BlockType;
  text?: string;
  url?: string;
  href?: string;
  height?: number;
  author?: string;
  targetDate?: string;
  address?: string;
  items?: string[];
  images?: string[];
  columns?: BlockContent[][];
  faqs?: { question: string; answer: string }[];
  heading?: string;
}

export const BLOCK_TYPES: { type: BlockType; label: string }[] = [
  { type: "heading", label: "Heading" },
  { type: "paragraph", label: "Paragraph" },
  { type: "image", label: "Image" },
  { type: "spacer", label: "Spacer" },
  { type: "divider", label: "Divider" },
  { type: "gallery", label: "Gallery" },
  { type: "video", label: "Video" },
  { type: "button", label: "Button" },
  { type: "columns", label: "Columns" },
  { type: "list", label: "List" },
  { type: "quote", label: "Quote" },
  { type: "countdown", label: "Countdown" },
  { type: "map", label: "Map" },
  { type: "rsvp-form", label: "RSVP Form" },
  { type: "guest-list", label: "Guest List" },
  { type: "schedule", label: "Schedule" },
  { type: "venue", label: "Venue" },
  { type: "faq", label: "FAQ" },
];

export function createBlock(type: BlockType): BlockContent {
  const defaults: Record<BlockType, Partial<BlockContent>> = {
    heading: { text: "New Heading" },
    paragraph: { text: "New paragraph text" },
    image: { url: "" },
    spacer: { height: 40 },
    divider: {},
    gallery: { images: [] },
    video: { url: "" },
    button: { text: "Click here", href: "#" },
    columns: { columns: [[], []] },
    list: { items: ["Item 1", "Item 2"] },
    quote: { text: "A beautiful quote", author: "" },
    countdown: { targetDate: "" },
    map: { address: "" },
    "rsvp-form": {},
    "guest-list": {},
    schedule: {},
    venue: { heading: "Venue", text: "", address: "" },
    faq: { faqs: [{ question: "Question?", answer: "Answer." }] },
  };
  return { type, ...defaults[type] } as BlockContent;
}
