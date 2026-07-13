import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type CustomPage, type ContentBlock, type BlockType, type FaqItem, type TimelineItem, type SocialLink } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Select, Card, FormField, Toggle, Modal } from "../../components/ui";
import { RichTextEditor } from "../../components/ui/RichTextEditor";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { ArrowLeft, Plus, Trash2, GripVertical, ChevronUp, ChevronDown, Type, Image, Columns, Minus, Link, Quote, Clock, MapPin, Video, Mail, Share2, HelpCircle, Calendar, AlertCircle, Save } from "lucide-react";
import { slugify } from "../../lib/theme";

const BLOCK_TYPES: { type: BlockType; label: string; icon: any }[] = [
  { type: "heading", label: "Heading", icon: Type },
  { type: "subheading", label: "Subheading", icon: Type },
  { type: "richtext", label: "Rich Text", icon: Type },
  { type: "image", label: "Image", icon: Image },
  { type: "gallery", label: "Image Gallery", icon: Image },
  { type: "divider", label: "Divider", icon: Minus },
  { type: "button", label: "Button", icon: Link },
  { type: "quote", label: "Quote", icon: Quote },
  { type: "countdown", label: "Countdown", icon: Clock },
  { type: "maps", label: "Google Maps", icon: MapPin },
  { type: "video", label: "Video Embed", icon: Video },
  { type: "contact", label: "Contact Info", icon: Mail },
  { type: "social", label: "Social Links", icon: Share2 },
  { type: "spacer", label: "Spacer", icon: Minus },
  { type: "two-col", label: "Two Columns", icon: Columns },
  { type: "three-col", label: "Three Columns", icon: Columns },
  { type: "faq", label: "FAQ Accordion", icon: HelpCircle },
  { type: "timeline", label: "Timeline", icon: Calendar },
  { type: "callout", label: "Callout Box", icon: AlertCircle },
];

function genId() { return Math.random().toString(36).substring(2, 11); }

export default function PageBuilder() {
  const { eventId, pageId } = useParams<{ eventId: string; pageId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showAddBlock, setShowAddBlock] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const { data: page, isLoading } = useQuery({
    queryKey: ["custom-page", pageId],
    queryFn: async () => {
      const { data, error } = await supabase.from("custom_pages").select("*").eq("id", pageId).single();
      if (error) throw error;
      return data as CustomPage;
    },
    enabled: !!pageId,
  });

  const saveMutation = useMutation({
    mutationFn: async (blocks: ContentBlock[]) => {
      const { error } = await supabase.from("custom_pages").update({ blocks, updated_at: new Date().toISOString() }).eq("id", pageId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["custom-page", pageId] }),
    onError: (err: any) => alert("Failed to save: " + (err.message || "Unknown error")),
  });

  const updatePageMetaMutation = useMutation({
    mutationFn: async (updates: Partial<CustomPage>) => {
      const { error } = await supabase.from("custom_pages").update({ ...updates, updated_at: new Date().toISOString() }).eq("id", pageId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["custom-page", pageId] }),
    onError: (err: any) => alert("Failed to save: " + (err.message || "Unknown error")),
  });

  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [title, setTitle] = useState("");
  const [navLabel, setNavLabel] = useState("");
  const [slug, setSlug] = useState("");
  const [icon, setIcon] = useState("");
  const [showInNav, setShowInNav] = useState(true);
  const [isFooter, setIsFooter] = useState(false);

  React.useEffect(() => {
    if (page) {
      setBlocks(page.blocks || []);
      setTitle(page.title);
      setNavLabel(page.nav_label);
      setSlug(page.slug);
      setIcon(page.icon || "");
      setShowInNav(page.show_in_nav);
      setIsFooter(page.is_footer);
    }
  }, [page]);

  const addBlock = (type: BlockType) => {
    let defaultData: Record<string, any> = {};
    if (type === "heading") defaultData.text = "";
    if (type === "subheading") defaultData.text = "";
    if (type === "richtext") defaultData.html = "";
    if (type === "image") defaultData.url = null;
    if (type === "gallery") defaultData.images = [];
    if (type === "button") defaultData = { label: "", url: "" };
    if (type === "quote") defaultData = { text: "", author: "" };
    if (type === "countdown") defaultData = { date: "" };
    if (type === "maps") defaultData = { address: "", query: "" };
    if (type === "video") defaultData = { url: "" };
    if (type === "contact") defaultData = { email: "", phone: "", address: "" };
    if (type === "social") defaultData = { links: [] as SocialLink[] };
    if (type === "spacer") defaultData = { height: 40 };
    if (type === "two-col") defaultData = { left: "", right: "" };
    if (type === "three-col") defaultData = { col1: "", col2: "", col3: "" };
    if (type === "faq") defaultData = { items: [] as FaqItem[] };
    if (type === "timeline") defaultData = { items: [] as TimelineItem[] };
    if (type === "callout") defaultData = { text: "", variant: "info" };
    setBlocks([...blocks, { id: genId(), type, data: defaultData }]);
    setShowAddBlock(false);
  };

  const updateBlock = (id: string, data: Record<string, any>) => {
    setBlocks(blocks.map((b) => b.id === id ? { ...b, data: { ...b.data, ...data } } : b));
  };

  const removeBlock = (id: string) => {
    setBlocks(blocks.filter((b) => b.id !== id));
  };

  const moveBlock = (index: number, dir: "up" | "down") => {
    const newBlocks = [...blocks];
    const target = dir === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= newBlocks.length) return;
    [newBlocks[index], newBlocks[target]] = [newBlocks[target], newBlocks[index]];
    setBlocks(newBlocks);
  };

  const handleDragStart = (index: number) => setDragIndex(index);
  const handleDragOver = (e: React.DragEvent, index: number) => { e.preventDefault(); };
  const handleDrop = (index: number) => {
    if (dragIndex === null || dragIndex === index) return;
    const newBlocks = [...blocks];
    const [moved] = newBlocks.splice(dragIndex, 1);
    newBlocks.splice(index, 0, moved);
    setBlocks(newBlocks);
    setDragIndex(null);
  };

  const handleSaveAll = () => {
    saveMutation.mutate(blocks);
    updatePageMetaMutation.mutate({ title, nav_label: navLabel, slug: slugify(slug), icon: icon || null, show_in_nav: showInNav, is_footer: isFooter });
  };

  if (isLoading) return <div className="text-center py-12 text-dash-muted">Loading...</div>;
  if (!page) return <div className="text-center py-12 text-red-600">Page not found</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/event/${eventId}/pages`)} className="text-dash-muted hover:text-dash-text"><ArrowLeft className="w-5 h-5" /></button>
          <h2 className="text-xl font-semibold text-dash-text">Edit Page: {page.title}</h2>
        </div>
        <Button onClick={handleSaveAll} loading={saveMutation.isPending || updatePageMetaMutation.isPending}><Save className="w-4 h-4" /> Save All</Button>
      </div>

      <Card className="p-4 mb-6 space-y-4">
        <h3 className="text-sm font-medium text-dash-muted uppercase">Page Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Page Title"><Input value={title} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)} /></FormField>
          <FormField label="Navigation Label"><Input value={navLabel} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNavLabel(e.target.value)} /></FormField>
          <FormField label="URL Slug"><Input value={slug} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSlug(slugify(e.target.value))} /></FormField>
          <FormField label="Icon (optional)"><Input value={icon} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIcon(e.target.value)} placeholder="lucide icon name" /></FormField>
        </div>
        <div className="flex items-center gap-6">
          <Toggle checked={showInNav} onChange={setShowInNav} label="Show in Navigation" />
          <Toggle checked={isFooter} onChange={setIsFooter} label="Use as Footer" />
        </div>
      </Card>

      <div className="space-y-3 mb-4">
        {blocks.map((block, index) => (
          <div
            key={block.id}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={() => handleDrop(index)}
            className="border border-dash-border rounded-lg bg-white p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-dash-muted cursor-grab" />
                <span className="text-sm font-medium text-dash-text">{BLOCK_TYPES.find((b) => b.type === block.type)?.label || block.type}</span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => moveBlock(index, "up")} disabled={index === 0} className="p-1 text-dash-muted hover:text-dash-text disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
                <button onClick={() => moveBlock(index, "down")} disabled={index === blocks.length - 1} className="p-1 text-dash-muted hover:text-dash-text disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
                <button onClick={() => removeBlock(block.id)} className="p-1 text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            <BlockEditor block={block} onChange={(data) => updateBlock(block.id, data)} eventId={eventId!} />
          </div>
        ))}
      </div>

      {blocks.length === 0 && (
        <div className="text-center py-12 text-dash-muted border-2 border-dashed border-dash-border rounded-lg">
          <p className="mb-2">No content blocks yet</p>
          <p className="text-sm">Add your first block to start building this page</p>
        </div>
      )}

      <Button onClick={() => setShowAddBlock(true)} variant="secondary" className="w-full"><Plus className="w-4 h-4" /> Add Block</Button>

      <Modal open={showAddBlock} onClose={() => setShowAddBlock(false)} title="Add Content Block" size="lg">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {BLOCK_TYPES.map((bt) => (
            <button
              key={bt.type}
              onClick={() => addBlock(bt.type)}
              className="flex flex-col items-center gap-2 p-4 border border-dash-border rounded-lg hover:border-dash-primary hover:bg-dash-primary-light transition-colors"
            >
              <bt.icon className="w-6 h-6 text-dash-primary" />
              <span className="text-sm text-dash-text">{bt.label}</span>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}

function BlockEditor({ block, onChange, eventId }: { block: ContentBlock; onChange: (data: Record<string, any>) => void; eventId: string }) {
  const d = block.data;
  switch (block.type) {
    case "heading":
      return <Input value={d.text || ""} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ text: e.target.value })} placeholder="Heading text" />;
    case "subheading":
      return <Input value={d.text || ""} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ text: e.target.value })} placeholder="Subheading text" />;
    case "richtext":
      return <RichTextEditor value={d.html || ""} onChange={(html) => onChange({ html })} placeholder="Write content..." minHeight={120} />;
    case "image":
      return <ImageUpload value={d.url || null} onChange={(url) => onChange({ url })} eventId={eventId} />;
    case "gallery":
      return (
        <div className="space-y-2">
          {(d.images || []).map((img: string, i: number) => (
            <div key={i} className="flex items-center gap-2">
              <img src={img} alt="" className="w-16 h-16 object-cover rounded" />
              <button onClick={() => onChange({ images: (d.images || []).filter((_: string, idx: number) => idx !== i) })} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
          <ImageUpload value={null} onChange={(url) => { if (url) onChange({ images: [...(d.images || []), url] }); }} eventId={eventId} aspectRatio="4/3" />
        </div>
      );
    case "divider":
      return <p className="text-sm text-dash-muted">A horizontal divider line will appear here.</p>;
    case "button":
      return (
        <div className="grid grid-cols-2 gap-3">
          <Input value={d.label || ""} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ label: e.target.value })} placeholder="Button label" />
          <Input value={d.url || ""} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ url: e.target.value })} placeholder="Button URL" />
        </div>
      );
    case "quote":
      return (
        <div className="space-y-2">
          <Textarea value={d.text || ""} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange({ text: e.target.value })} placeholder="Quote text" rows={2} />
          <Input value={d.author || ""} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ author: e.target.value })} placeholder="Author (optional)" />
        </div>
      );
    case "countdown":
      return <Input type="date" value={d.date || ""} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ date: e.target.value })} placeholder="Target date" />;
    case "maps":
      return (
        <div className="space-y-2">
          <Input value={d.address || ""} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ address: e.target.value })} placeholder="Address" />
          <Input value={d.query || ""} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ query: e.target.value })} placeholder="Map search query (optional)" />
        </div>
      );
    case "video":
      return <Input value={d.url || ""} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ url: e.target.value })} placeholder="YouTube or Vimeo URL" />;
    case "contact":
      return (
        <div className="space-y-2">
          <Input value={d.email || ""} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ email: e.target.value })} placeholder="Email" />
          <Input value={d.phone || ""} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ phone: e.target.value })} placeholder="Phone" />
          <Input value={d.address || ""} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ address: e.target.value })} placeholder="Address" />
        </div>
      );
    case "social":
      return (
        <div className="space-y-2">
          {(d.links || []).map((link: SocialLink, i: number) => (
            <div key={i} className="flex gap-2">
              <Input value={link.label} onChange={(e: React.ChangeEvent<HTMLInputElement>) => { const links = [...(d.links || [])]; links[i] = { ...link, label: e.target.value }; onChange({ links }); }} placeholder="Label" />
              <Input value={link.url} onChange={(e: React.ChangeEvent<HTMLInputElement>) => { const links = [...(d.links || [])]; links[i] = { ...link, url: e.target.value }; onChange({ links }); }} placeholder="URL" />
              <button onClick={() => onChange({ links: (d.links || []).filter((_: SocialLink, idx: number) => idx !== i) })} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
          <Button variant="secondary" size="sm" onClick={() => onChange({ links: [...(d.links || []), { label: "", url: "" }] })}><Plus className="w-3 h-3" /> Add Link</Button>
        </div>
      );
    case "spacer":
      return (
        <div>
          <label className="block text-sm font-medium text-dash-text mb-1">Height: {d.height || 40}px</label>
          <input type="range" value={d.height || 40} min={10} max={200} step={10} onChange={(e) => onChange({ height: Number(e.target.value) })} className="w-full" />
        </div>
      );
    case "two-col":
      return (
        <div className="grid grid-cols-2 gap-3">
          <Textarea value={d.left || ""} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange({ left: e.target.value })} placeholder="Left column" rows={3} />
          <Textarea value={d.right || ""} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange({ right: e.target.value })} placeholder="Right column" rows={3} />
        </div>
      );
    case "three-col":
      return (
        <div className="grid grid-cols-3 gap-3">
          <Textarea value={d.col1 || ""} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange({ col1: e.target.value })} placeholder="Column 1" rows={3} />
          <Textarea value={d.col2 || ""} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange({ col2: e.target.value })} placeholder="Column 2" rows={3} />
          <Textarea value={d.col3 || ""} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange({ col3: e.target.value })} placeholder="Column 3" rows={3} />
        </div>
      );
    case "faq":
      return (
        <div className="space-y-2">
          {(d.items || []).map((item: FaqItem, i: number) => (
            <div key={i} className="space-y-1 p-2 border border-dash-border rounded">
              <Input value={item.question} onChange={(e: React.ChangeEvent<HTMLInputElement>) => { const items = [...(d.items || [])]; items[i] = { ...item, question: e.target.value }; onChange({ items }); }} placeholder="Question" />
              <Textarea value={item.answer} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => { const items = [...(d.items || [])]; items[i] = { ...item, answer: e.target.value }; onChange({ items }); }} placeholder="Answer" rows={2} />
              <button onClick={() => onChange({ items: (d.items || []).filter((_: FaqItem, idx: number) => idx !== i) })} className="text-red-500 text-sm"><Trash2 className="w-3 h-3 inline" /> Remove</button>
            </div>
          ))}
          <Button variant="secondary" size="sm" onClick={() => onChange({ items: [...(d.items || []), { question: "", answer: "" }] })}><Plus className="w-3 h-3" /> Add FAQ</Button>
        </div>
      );
    case "timeline":
      return (
        <div className="space-y-2">
          {(d.items || []).map((item: TimelineItem, i: number) => (
            <div key={i} className="space-y-1 p-2 border border-dash-border rounded">
              <Input value={item.time} onChange={(e: React.ChangeEvent<HTMLInputElement>) => { const items = [...(d.items || [])]; items[i] = { ...item, time: e.target.value }; onChange({ items }); }} placeholder="Time" />
              <Input value={item.title} onChange={(e: React.ChangeEvent<HTMLInputElement>) => { const items = [...(d.items || [])]; items[i] = { ...item, title: e.target.value }; onChange({ items }); }} placeholder="Title" />
              <Textarea value={item.description} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => { const items = [...(d.items || [])]; items[i] = { ...item, description: e.target.value }; onChange({ items }); }} placeholder="Description" rows={2} />
              <button onClick={() => onChange({ items: (d.items || []).filter((_: TimelineItem, idx: number) => idx !== i) })} className="text-red-500 text-sm"><Trash2 className="w-3 h-3 inline" /> Remove</button>
            </div>
          ))}
          <Button variant="secondary" size="sm" onClick={() => onChange({ items: [...(d.items || []), { time: "", title: "", description: "" }] })}><Plus className="w-3 h-3" /> Add Item</Button>
        </div>
      );
    case "callout":
      return (
        <div className="space-y-2">
          <Textarea value={d.text || ""} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange({ text: e.target.value })} placeholder="Callout text" rows={2} />
          <Select value={d.variant || "info"} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange({ variant: e.target.value })}>
            <option value="info">Info</option><option value="success">Success</option><option value="warning">Warning</option><option value="danger">Danger</option>
          </Select>
        </div>
      );
    default:
      return <p className="text-sm text-dash-muted">Unknown block type</p>;
  }
}
