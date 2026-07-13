import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Edit2, Save, FileText, Send, Eye } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { WebsiteContent } from "@/lib/supabase";
import { useHostWedding } from "@/lib/use-host-wedding";
import { getDraftTheme } from "@/lib/theme";
import type { ThemeConfig } from "@/lib/theme";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Label, Toggle } from "@/components/ui/Input";
import { Card, Badge, Modal, EmptyState, SectionTitle, Toast, Tabs } from "@/components/ui";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { SplitEditor } from "@/components/preview/SplitEditor";
import { ContentSectionPreview } from "@/components/preview/PreviewRenderers";
// ─── Default sections ───
type DefaultSection = { key: string; label: string };

const DEFAULT_SECTIONS: DefaultSection[] = [
  { key: "hero", label: "Hero" },
  { key: "story", label: "Our Story" },
  { key: "schedule", label: "Schedule" },
  { key: "faq", label: "FAQ" },
  { key: "registry", label: "Registry" },
  { key: "accommodation", label: "Accommodation" },
  { key: "travel", label: "Travel" },
  { key: "contact", label: "Contact" },
  { key: "footer", label: "Footer" },
];

const DEFAULT_KEYS = new Set(DEFAULT_SECTIONS.map((s) => s.key));

const labelFor = (section: string): string =>
  DEFAULT_SECTIONS.find((s) => s.key === section)?.label ??
  section.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

// ─── Form state ───
type FormState = {
  title: string;
  body: string;
  imageUrl: string | null;
  isPublished: boolean;
};

const emptyForm: FormState = { title: "", body: "", imageUrl: null, isPublished: false };

// ─── Component ───
export function AdminContent() {
  const { wedding, loading } = useHostWedding();
  const theme: ThemeConfig = useMemo(() => getDraftTheme(wedding), [wedding]);

  const [sections, setSections] = useState<WebsiteContent[]>([]);
  const [fetching, setFetching] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "published" | "draft">("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newSectionKey, setNewSectionKey] = useState("");
  const [newSectionLabel, setNewSectionLabel] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<WebsiteContent | null>(null);

  const weddingId = wedding?.id ?? "";

  // ─── Load sections ───
  const loadSections = useCallback(async () => {
    if (!weddingId) { setSections([]); setFetching(false); return; }
    setFetching(true);
    const { data, error } = await supabase
      .from("website_content")
      .select("*")
      .eq("wedding_id", weddingId)
      .order("sort_order", { ascending: true });
    if (!error && data) setSections(data as WebsiteContent[]);
    setFetching(false);
  }, [weddingId]);

  useEffect(() => { if (weddingId) loadSections(); }, [weddingId, loadSections]);

  // ─── Merge defaults with DB rows ───
  // Default sections always appear even if no DB row exists.
  const merged = useMemo(() => {
    const byKey = new Map<string, WebsiteContent>();
    for (const row of sections) byKey.set(row.section, row);
    const list: { row: WebsiteContent | null; section: string; isDefault: boolean; label: string }[] = [];
    for (const def of DEFAULT_SECTIONS) {
      list.push({ row: byKey.get(def.key) ?? null, section: def.key, isDefault: true, label: def.label });
      byKey.delete(def.key);
    }
    // Custom sections (any DB row whose section is not a default)
    for (const row of sections) {
      if (!DEFAULT_KEYS.has(row.section)) {
        list.push({ row, section: row.section, isDefault: false, label: labelFor(row.section) });
      }
    }
    return list;
  }, [sections]);

  const filtered = useMemo(() => {
    if (activeTab === "published") return merged.filter((m) => m.row?.is_published);
    if (activeTab === "draft") return merged.filter((m) => m.row && (m.row.draft_title !== null || m.row.draft_body !== null || m.row.draft_image_url !== null || m.row.draft_is_published !== null));
    return merged;
  }, [merged, activeTab]);

  // ─── Editing helpers ───
  const editingEntry = useMemo(
    () => merged.find((m) => (m.row?.id ?? `__default_${m.section}`) === editingId) ?? null,
    [merged, editingId]
  );

  const startEdit = (entry: { row: WebsiteContent | null; section: string; label: string }) => {
    const id = entry.row?.id ?? `__default_${entry.section}`;
    // Seed form from draft fields if present, else from published fields, else empty
    const row = entry.row;
    setForm({
      title: row?.draft_title ?? row?.title ?? "",
      body: row?.draft_body ?? row?.body ?? "",
      imageUrl: row?.draft_image_url ?? row?.image_url ?? null,
      isPublished: row?.draft_is_published ?? row?.is_published ?? false,
    });
    setEditingId(id);
  };

  const cancelEdit = () => { setEditingId(null); setForm(emptyForm); };

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ─── Persist draft ───
  const saveDraft = async () => {
    if (!weddingId || !editingEntry) return;
    setSaving(true);
    const payload = {
      wedding_id: weddingId,
      section: editingEntry.section,
      draft_title: form.title || null,
      draft_body: form.body || null,
      draft_image_url: form.imageUrl,
      draft_is_published: form.isPublished,
    };
    let error: { message: string } | null = null;
    if (editingEntry.row?.id) {
      ({ error } = await supabase.from("website_content").update({
        draft_title: payload.draft_title,
        draft_body: payload.draft_body,
        draft_image_url: payload.draft_image_url,
        draft_is_published: payload.draft_is_published,
      }).eq("id", editingEntry.row.id));
    } else {
      // Create the row with draft fields; published fields empty
      const sortMax = sections.reduce((mx, s) => Math.max(mx, s.sort_order), -1);
      ({ error } = await supabase.from("website_content").insert({
        wedding_id: weddingId,
        section: editingEntry.section,
        sort_order: sortMax + 1,
        title: null, body: null, image_url: null, is_published: false,
        draft_title: payload.draft_title,
        draft_body: payload.draft_body,
        draft_image_url: payload.draft_image_url,
        draft_is_published: payload.draft_is_published,
      }).select().single());
    }
    setSaving(false);
    if (error) { showToast(`Save failed: ${error.message}`, "error"); return; }
    showToast("Draft saved");
    await loadSections();
  };

  // ─── Publish: copy draft -> published, clear draft ───
  const publish = async () => {
    if (!weddingId || !editingEntry) return;
    setSaving(true);
    let error: { message: string } | null = null;
    if (editingEntry.row?.id) {
      ({ error } = await supabase.from("website_content").update({
        title: form.title || null,
        body: form.body || null,
        image_url: form.imageUrl,
        is_published: form.isPublished,
        draft_title: null,
        draft_body: null,
        draft_image_url: null,
        draft_is_published: null,
      }).eq("id", editingEntry.row.id));
    } else {
      const sortMax = sections.reduce((mx, s) => Math.max(mx, s.sort_order), -1);
      ({ error } = await supabase.from("website_content").insert({
        wedding_id: weddingId,
        section: editingEntry.section,
        sort_order: sortMax + 1,
        title: form.title || null,
        body: form.body || null,
        image_url: form.imageUrl,
        is_published: form.isPublished,
        draft_title: null, draft_body: null, draft_image_url: null, draft_is_published: null,
      }).select().single());
    }
    setSaving(false);
    if (error) { showToast(`Publish failed: ${error.message}`, "error"); return; }
    showToast("Section published");
    await loadSections();
    cancelEdit();
  };

  // ─── Create custom section ───
  const createCustomSection = async () => {
    if (!weddingId) return;
    const key = newSectionKey.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_").replace(/^_+|_+$/g, "");
    if (!key) { showToast("Enter a section key", "error"); return; }
    if (DEFAULT_KEYS.has(key) || sections.some((s) => s.section === key)) {
      showToast("Section key already exists", "error"); return;
    }
    setSaving(true);
    const sortMax = sections.reduce((mx, s) => Math.max(mx, s.sort_order), -1);
    const { error } = await supabase.from("website_content").insert({
      wedding_id: weddingId,
      section: key,
      sort_order: sortMax + 1,
      title: newSectionLabel.trim() || null,
      body: null, image_url: null, is_published: false,
      draft_title: null, draft_body: null, draft_image_url: null, draft_is_published: null,
    }).select().single();
    setSaving(false);
    if (error) { showToast(`Create failed: ${error.message}`, "error"); return; }
    setNewSectionKey(""); setNewSectionLabel(""); setCreateOpen(false);
    showToast("Custom section created");
    await loadSections();
  };

  // ─── Delete custom section ───
  const deleteSection = async (row: WebsiteContent) => {
    if (!weddingId || !row.id) return;
    const { error } = await supabase.from("website_content").delete().eq("id", row.id);
    if (error) { showToast(`Delete failed: ${error.message}`, "error"); return; }
    showToast("Section deleted");
    setDeleteTarget(null);
    await loadSections();
  };

  // ─── Render ───
  if (loading || fetching) {
    return (
      <div className="flex items-center justify-center py-24 text-sepia">
        <div className="animate-pulse">Loading content…</div>
      </div>
    );
  }

  if (!wedding) {
    return <EmptyState title="No wedding found" description="Create a wedding to manage content." />;
  }

  // ─── Editing view ───
  if (editingEntry) {
    const sectionLabel = editingEntry.label;
    const hasDraftChanges = editingEntry.row
      ? (editingEntry.row.draft_title !== null || editingEntry.row.draft_body !== null || editingEntry.row.draft_image_url !== null || editingEntry.row.draft_is_published !== null)
      : false;

    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={cancelEdit}
              className="text-sepia hover:text-onyx text-sm flex items-center gap-1.5 transition-colors"
            >
              ← Back to sections
            </button>
            <span className="text-sepia/30">/</span>
            <h1 className="text-xl font-serif text-onyx">{sectionLabel}</h1>
            {editingEntry.isDefault ? (
              <Badge variant="info">Default</Badge>
            ) : (
              <Badge>Custom</Badge>
            )}
          </div>
        </div>

        <SplitEditor
          editor={
            <div className="space-y-5">
              <Card className="p-5 space-y-5">
                <div>
                  <Label>Section Title</Label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Our Love Story"
                  />
                </div>
                <div>
                  <Label>Body</Label>
                  <Textarea
                    rows={8}
                    value={form.body}
                    onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                    placeholder="Write the section content…"
                  />
                </div>
                <div>
                  <Label>Image</Label>
                  <ImageUpload
                    weddingId={weddingId}
                    value={form.imageUrl}
                    onChange={(url) => setForm((f) => ({ ...f, imageUrl: url }))}
                  />
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-sand">
                  <div>
                    <Label>Published</Label>
                    <p className="text-xs text-sepia/60 -mt-1">Toggle to include on the live site.</p>
                  </div>
                  <Toggle
                    checked={form.isPublished}
                    onChange={(v) => setForm((f) => ({ ...f, isPublished: v }))}
                    label={form.isPublished ? "Visible" : "Hidden"}
                  />
                </div>
              </Card>

              <div className="flex items-center gap-2 text-xs text-sepia/70">
                <FileText className="w-3.5 h-3.5" />
                {hasDraftChanges
                  ? "Unsaved draft changes — Save Draft or Publish to apply."
                  : editingEntry.row?.id
                    ? "No draft changes. Edits will create a draft."
                    : "No saved content yet for this section."}
              </div>
            </div>
          }
          preview={
            <ContentSectionPreview
              title={form.title}
              body={form.body}
              imageUrl={form.imageUrl}
              theme={theme}
              sectionLabel={sectionLabel}
            />
          }
          actions={
            <>
              <Button variant="outline" onClick={cancelEdit}>Cancel</Button>
              <Button variant="secondary" onClick={saveDraft} disabled={saving}>
                <Save className="w-4 h-4" /> Save Draft
              </Button>
              <Button onClick={publish} disabled={saving}>
                <Send className="w-4 h-4" /> Publish
              </Button>
            </>
          }
        />

        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    );
  }

  // ─── List view ───
  return (
    <div>
      <SectionTitle
        title="Content"
        subtitle="Edit the sections that appear on your wedding website."
        action={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4" /> New Section
          </Button>
        }
      />

      <Tabs
        tabs={[
          { key: "all", label: "All" },
          { key: "published", label: "Published" },
          { key: "draft", label: "Drafts" },
        ]}
        active={activeTab}
        onChange={(k) => setActiveTab(k as "all" | "published" | "draft")}
      />

      {filtered.length === 0 ? (
        <EmptyState
          title="No sections here"
          description="Try a different tab or create a new custom section."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((entry) => {
            const row = entry.row;
            const published = row?.is_published ?? false;
            const hasDraft = row
              ? (row.draft_title !== null || row.draft_body !== null || row.draft_image_url !== null || row.draft_is_published !== null)
              : false;
            const previewTitle = row?.draft_title ?? row?.title ?? "";
            const previewBody = row?.draft_body ?? row?.body ?? "";

            return (
              <Card key={entry.section} className="p-5 flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0">
                    <h3 className="font-serif text-lg text-onyx truncate">{entry.label}</h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      {entry.isDefault ? (
                        <Badge variant="info">Default</Badge>
                      ) : (
                        <Badge>Custom</Badge>
                      )}
                      {published ? (
                        <Badge variant="success">Published</Badge>
                      ) : row ? (
                        <Badge variant="warning">Unpublished</Badge>
                      ) : (
                        <Badge variant="default">Empty</Badge>
                      )}
                      {hasDraft && <Badge variant="warning">Draft</Badge>}
                    </div>
                  </div>
                </div>

                <p className="text-sm text-sepia/70 line-clamp-3 flex-1 whitespace-pre-line min-h-[3.75rem]">
                  {previewBody || (previewTitle ? "" : "No content yet. Click edit to add.")}
                </p>

                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-sand">
                  <Button size="sm" variant="outline" onClick={() => startEdit(entry)}>
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => startEdit(entry)}
                  >
                    <Eye className="w-3.5 h-3.5" /> Preview
                  </Button>
                  {!entry.isDefault && row && (
                    <button
                      onClick={() => setDeleteTarget(row)}
                      className="ml-auto text-sepia/50 hover:text-red-600 transition-colors p-1.5 rounded-lg hover:bg-red-50"
                      title="Delete section"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ─── Create custom section modal ─── */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Custom Section">
        <div className="space-y-4">
          <div>
            <Label>Display Label</Label>
            <Input
              value={newSectionLabel}
              onChange={(e) => setNewSectionLabel(e.target.value)}
              placeholder="e.g. Dress Code"
            />
          </div>
          <div>
            <Label>Section Key</Label>
            <Input
              value={newSectionKey}
              onChange={(e) => setNewSectionKey(e.target.value)}
              placeholder="e.g. dress_code"
            />
            <p className="text-xs text-sepia/60 mt-1.5">
              Lowercase letters, numbers, and underscores. Must be unique.
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={createCustomSection} disabled={saving}>
              <Plus className="w-4 h-4" /> Create
            </Button>
          </div>
        </div>
      </Modal>

      {/* ─── Delete confirmation modal ─── */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Section">
        <div className="space-y-4">
          <p className="text-sm text-sepia">
            Are you sure you want to delete the{" "}
            <span className="font-medium text-onyx">{labelFor(deleteTarget?.section ?? "")}</span> section?
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => deleteTarget && deleteSection(deleteTarget)}>
              <Trash2 className="w-4 h-4" /> Delete
            </Button>
          </div>
        </div>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default AdminContent;
