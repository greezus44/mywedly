import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Save, Send, X, FileText } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { WebsiteContent } from "@/lib/supabase";
import { useHostWedding } from "@/lib/use-host-wedding";
import { getDraftTheme } from "@/lib/theme";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Label, Toggle } from "@/components/ui/Input";
import { Card, Badge, Modal, EmptyState, SectionTitle, Toast } from "@/components/ui";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { SplitEditor } from "@/components/preview/SplitEditor";
import { ContentSectionPreview } from "@/components/preview/PreviewRenderers";

// Default sections that cannot be deleted
const DEFAULT_SECTIONS = [
  "hero", "story", "schedule", "faq", "registry",
  "accommodation", "travel", "contact", "footer",
] as const;

const SECTION_LABELS: Record<string, string> = {
  hero: "Hero",
  story: "Our Story",
  schedule: "Schedule",
  faq: "FAQ",
  registry: "Registry",
  accommodation: "Accommodation",
  travel: "Travel",
  contact: "Contact",
  footer: "Footer",
};

type DraftForm = {
  title: string;
  body: string;
  image_url: string | null;
  is_published: boolean;
};

function emptyDraft(): DraftForm {
  return { title: "", body: "", image_url: null, is_published: false };
}

function toDraftForm(section: WebsiteContent): DraftForm {
  return {
    title: section.draft_title ?? section.title ?? "",
    body: section.draft_body ?? section.body ?? "",
    image_url: section.draft_image_url ?? section.image_url ?? null,
    is_published: section.draft_is_published ?? section.is_published ?? false,
  };
}

function hasDraftChanges(section: WebsiteContent, form: DraftForm): boolean {
  return (
    (section.draft_title ?? null) !== (form.title || null) ||
    (section.draft_body ?? null) !== (form.body || null) ||
    (section.draft_image_url ?? null) !== form.image_url ||
    (section.draft_is_published ?? null) !== form.is_published
  );
}

export function AdminContent() {
  const { wedding, loading } = useHostWedding();
  const theme = getDraftTheme(wedding);

  const [sections, setSections] = useState<WebsiteContent[]>([]);
  const [fetching, setFetching] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<DraftForm>(emptyDraft());
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newSectionKey, setNewSectionKey] = useState("");
  const [newSectionLabel, setNewSectionLabel] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<WebsiteContent | null>(null);

  const weddingId = wedding?.id ?? null;

  const fetchSections = useCallback(async () => {
    if (!weddingId) return;
    setFetching(true);
    const { data, error } = await supabase
      .from("website_content")
      .select("*")
      .eq("wedding_id", weddingId)
      .order("sort_order", { ascending: true });
    if (!error && data) setSections(data as WebsiteContent[]);
    setFetching(false);
  }, [weddingId]);

  useEffect(() => {
    if (weddingId) fetchSections();
  }, [weddingId, fetchSections]);

  // Ensure all default sections exist
  useEffect(() => {
    if (!weddingId || fetching) return;
    const existing = new Set(sections.map((s) => s.section));
    const missing = DEFAULT_SECTIONS.filter((s) => !existing.has(s));
    if (missing.length === 0) return;
    (async () => {
      const maxSort = sections.reduce((max, s) => Math.max(max, s.sort_order), -1);
      const rows = missing.map((section, i) => ({
        wedding_id: weddingId,
        section,
        title: SECTION_LABELS[section] ?? section,
        body: "",
        image_url: null,
        sort_order: maxSort + 1 + i,
        is_published: false,
      }));
      const { data, error } = await supabase
        .from("website_content")
        .insert(rows)
        .select("*");
      if (!error && data) {
        setSections((prev) => [...prev, ...(data as WebsiteContent[])].sort((a, b) => a.sort_order - b.sort_order));
      }
    })();
  }, [weddingId, fetching, sections]);

  const startEdit = (section: WebsiteContent) => {
    setEditingId(section.id);
    setForm(toDraftForm(section));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyDraft());
  };

  const saveDraft = async (section: WebsiteContent) => {
    setSaving(true);
    const { error } = await supabase
      .from("website_content")
      .update({
        draft_title: form.title || null,
        draft_body: form.body || null,
        draft_image_url: form.image_url,
        draft_is_published: form.is_published,
      })
      .eq("id", section.id);
    setSaving(false);
    if (error) {
      setToast({ message: "Failed to save draft", type: "error" });
    } else {
      setToast({ message: "Draft saved", type: "success" });
      await fetchSections();
    }
  };

  const publish = async (section: WebsiteContent) => {
    setSaving(true);
    const { error } = await supabase
      .from("website_content")
      .update({
        title: form.title || null,
        body: form.body || null,
        image_url: form.image_url,
        is_published: form.is_published,
        draft_title: null,
        draft_body: null,
        draft_image_url: null,
        draft_is_published: null,
      })
      .eq("id", section.id);
    setSaving(false);
    if (error) {
      setToast({ message: "Failed to publish", type: "error" });
    } else {
      setToast({ message: "Section published", type: "success" });
      await fetchSections();
      cancelEdit();
    }
  };

  const createSection = async () => {
    if (!weddingId || !newSectionKey.trim() || !newSectionLabel.trim()) return;
    const key = newSectionKey.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-");
    if (sections.some((s) => s.section === key)) {
      setToast({ message: "Section key already exists", type: "error" });
      return;
    }
    const maxSort = sections.reduce((max, s) => Math.max(max, s.sort_order), -1);
    const { data, error } = await supabase
      .from("website_content")
      .insert({
        wedding_id: weddingId,
        section: key,
        title: newSectionLabel.trim(),
        body: "",
        image_url: null,
        sort_order: maxSort + 1,
        is_published: false,
      })
      .select("*")
      .single();
    if (error) {
      setToast({ message: "Failed to create section", type: "error" });
    } else {
      setToast({ message: "Section created", type: "success" });
      setShowCreate(false);
      setNewSectionKey("");
      setNewSectionLabel("");
      await fetchSections();
    }
  };

  const deleteSection = async (section: WebsiteContent) => {
    const { error } = await supabase.from("website_content").delete().eq("id", section.id);
    setDeleteTarget(null);
    if (error) {
      setToast({ message: "Failed to delete section", type: "error" });
    } else {
      setToast({ message: "Section deleted", type: "success" });
      if (editingId === section.id) cancelEdit();
      await fetchSections();
    }
  };

  if (loading || fetching) {
    return <div className="flex items-center justify-center py-24 text-sepia">Loading content…</div>;
  }

  if (!wedding) {
    return <EmptyState title="No wedding found" description="Create a wedding to manage content." />;
  }

  const editingSection = editingId ? sections.find((s) => s.id === editingId) ?? null : null;

  return (
    <div>
      <SectionTitle
        title="Content Sections"
        subtitle="Edit the text and images that appear on your wedding website."
        action={
          <Button onClick={() => setShowCreate(true)} variant="outline" size="md">
            <Plus className="w-4 h-4" /> New Section
          </Button>
        }
      />

      {/* ─── Editing mode: SplitEditor ─── */}
      {editingSection ? (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-sepia" />
              <h2 className="text-lg font-serif text-onyx">
                {SECTION_LABELS[editingSection.section] ?? editingSection.section}
              </h2>
              {editingSection.is_published ? (
                <Badge variant="success">Published</Badge>
              ) : (
                <Badge variant="default">Unpublished</Badge>
              )}
              {hasDraftChanges(editingSection, form) && (
                <Badge variant="warning">Unsaved</Badge>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={cancelEdit}>
              <X className="w-4 h-4" /> Close
            </Button>
          </div>

          <SplitEditor
            previewLabel="Section Preview"
            draftData={{ theme }}
            actions={
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => saveDraft(editingSection)} disabled={saving}>
                  <Save className="w-4 h-4" /> Save Draft
                </Button>
                <Button variant="primary" size="sm" onClick={() => publish(editingSection)} disabled={saving}>
                  <Send className="w-4 h-4" /> Publish
                </Button>
              </div>
            }
            editor={
              <div className="space-y-5">
                <div>
                  <Label>Section Title</Label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="Section heading"
                  />
                </div>
                <div>
                  <Label>Body</Label>
                  <Textarea
                    value={form.body}
                    onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                    placeholder="Write the section content…"
                    rows={10}
                  />
                </div>
                <div>
                  <Label>Image</Label>
                  <ImageUpload
                    weddingId={wedding.id}
                    value={form.image_url}
                    onChange={(url) => setForm((f) => ({ ...f, image_url: url }))}
                    label="Section image"
                  />
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-sand">
                  <Label className="mb-0">Published</Label>
                  <Toggle
                    checked={form.is_published}
                    onChange={(v) => setForm((f) => ({ ...f, is_published: v }))}
                    label={form.is_published ? "Visible to guests" : "Hidden from guests"}
                  />
                </div>
              </div>
            }
            preview={
              <ContentSectionPreview
                title={form.title || null}
                body={form.body || null}
                imageUrl={form.image_url}
                theme={theme}
                sectionLabel={SECTION_LABELS[editingSection.section]}
              />
            }
          />
        </Card>
      ) : (
        /* ─── List mode: section cards ─── */
        <>
          {sections.length === 0 ? (
            <EmptyState
              title="No content sections"
              description="Default sections will appear here, or create a custom one."
              action={
                <Button onClick={() => setShowCreate(true)}>
                  <Plus className="w-4 h-4" /> New Section
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sections.map((section) => {
                const isDefault = (DEFAULT_SECTIONS as readonly string[]).includes(section.section);
                const displayTitle = section.draft_title ?? section.title ?? SECTION_LABELS[section.section] ?? section.section;
                const displayBody = section.draft_body ?? section.body ?? "";
                const displayImage = section.draft_image_url ?? section.image_url ?? null;
                const hasDraft =
                  section.draft_title !== null ||
                  section.draft_body !== null ||
                  section.draft_image_url !== null ||
                  section.draft_is_published !== null;
                const draftPublished = section.draft_is_published ?? section.is_published;

                return (
                  <Card key={section.id} className="p-5 flex flex-col">
                    <div className="flex items-start justify-between mb-3">
                      <div className="min-w-0">
                        <h3 className="font-serif text-base text-onyx truncate">{displayTitle || SECTION_LABELS[section.section] || section.section}</h3>
                        <p className="text-xs text-sepia/60 uppercase tracking-wider mt-0.5">
                          {SECTION_LABELS[section.section] ?? section.section}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        {section.is_published ? (
                          <Badge variant="success">Published</Badge>
                        ) : (
                          <Badge variant="default">Unpublished</Badge>
                        )}
                        {hasDraft && <Badge variant="warning">Draft</Badge>}
                      </div>
                    </div>

                    {displayImage && (
                      <div className="mb-3 -mx-1">
                        <img src={displayImage} alt="" className="w-full h-28 object-cover rounded-lg" />
                      </div>
                    )}

                    <p className="text-sm text-sepia/70 line-clamp-3 flex-1">
                      {displayBody || "No content yet."}
                    </p>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-sand">
                      <span className="text-xs text-sepia/50">
                        {draftPublished ? "Visible" : "Hidden"}
                      </span>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => startEdit(section)}>
                          <Pencil className="w-3.5 h-3.5" /> Edit
                        </Button>
                        {!isDefault && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteTarget(section)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ─── Create section modal ─── */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Content Section">
        <div className="space-y-4">
          <div>
            <Label>Section Label</Label>
            <Input
              value={newSectionLabel}
              onChange={(e) => setNewSectionLabel(e.target.value)}
              placeholder="e.g. Honeymoon Fund"
            />
          </div>
          <div>
            <Label>Section Key</Label>
            <Input
              value={newSectionKey}
              onChange={(e) => setNewSectionKey(e.target.value)}
              placeholder="e.g. honeymoon-fund"
            />
            <p className="text-xs text-sepia/50 mt-1">A unique identifier (lowercase, hyphens).</p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={createSection} disabled={!newSectionKey.trim() || !newSectionLabel.trim()}>
              <Plus className="w-4 h-4" /> Create
            </Button>
          </div>
        </div>
      </Modal>

      {/* ─── Delete confirm modal ─── */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Section">
        <p className="text-sm text-sepia mb-6">
          Are you sure you want to delete{" "}
          <span className="font-medium text-onyx">
            {deleteTarget?.draft_title ?? deleteTarget?.title ?? deleteTarget?.section}
          </span>
          ? This cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => deleteTarget && deleteSection(deleteTarget)}>
            <Trash2 className="w-4 h-4" /> Delete
          </Button>
        </div>
      </Modal>

      {/* ─── Toast ─── */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
