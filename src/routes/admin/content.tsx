import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { WebsiteContent } from "@/lib/supabase";
import { useHostWedding } from "@/lib/use-host-wedding";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Label } from "@/components/ui/Input";
import { Card, Badge, Modal, EmptyState, SectionTitle } from "@/components/ui";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { Plus, Trash2, Edit2, Save, FileText, Image } from "lucide-react";

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

/** The canonical default sections. These cannot be deleted. */
const DEFAULT_SECTIONS: { value: string; label: string; sortOrder: number }[] = [
  { value: "hero", label: "Hero", sortOrder: 0 },
  { value: "story", label: "Our Story", sortOrder: 1 },
  { value: "schedule", label: "Schedule", sortOrder: 2 },
  { value: "faq", label: "FAQ", sortOrder: 3 },
  { value: "registry", label: "Registry", sortOrder: 4 },
  { value: "accommodation", label: "Accommodation", sortOrder: 5 },
  { value: "travel", label: "Travel", sortOrder: 6 },
  { value: "contact", label: "Contact", sortOrder: 7 },
  { value: "footer", label: "Footer", sortOrder: 8 },
];

const DEFAULT_SECTION_KEYS = new Set(DEFAULT_SECTIONS.map((s) => s.value));

/** Map a section key to its human-readable label, falling back to a title-cased version. */
function sectionLabel(section: string): string {
  const found = DEFAULT_SECTIONS.find((s) => s.value === section);
  if (found) return found.label;
  return section
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** A short icon per default section to give the cards a little character. */
const SECTION_ICONS: Record<string, typeof FileText> = {
  hero: Image,
  story: FileText,
  schedule: FileText,
  faq: FileText,
  registry: FileText,
  accommodation: FileText,
  travel: FileText,
  contact: FileText,
  footer: FileText,
};

/* ------------------------------------------------------------------ */
/* Form types                                                          */
/* ------------------------------------------------------------------ */

type FormState = {
  section: string;
  title: string;
  body: string;
  image_url: string | null;
  is_published: boolean;
};

const EMPTY_FORM: FormState = {
  section: "",
  title: "",
  body: "",
  image_url: null,
  is_published: true,
};

function contentToForm(c: WebsiteContent): FormState {
  return {
    section: c.section,
    title: c.title ?? "",
    body: c.body ?? "",
    image_url: c.image_url,
    is_published: c.is_published,
  };
}

function formToRow(form: FormState) {
  return {
    section: form.section.trim().toLowerCase().replace(/\s+/g, "_"),
    title: form.title.trim() || null,
    body: form.body.trim() || null,
    image_url: form.image_url,
    is_published: form.is_published,
  };
}

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */

export function AdminContent() {
  const { wedding } = useHostWedding();
  const weddingId = wedding?.id;

  const [items, setItems] = useState<WebsiteContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form modal (create + edit share the same modal)
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<WebsiteContent | null>(null);

  /* ---------------------------------------------------------------- */
  /* Data fetching                                                    */
  /* ---------------------------------------------------------------- */

  const fetchContent = useCallback(async () => {
    if (!weddingId) return;
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("website_content")
      .select("*")
      .eq("wedding_id", weddingId)
      .order("sort_order", { ascending: true });
    if (error) {
      setError(error.message);
    } else {
      setItems((data ?? []) as WebsiteContent[]);
    }
    setLoading(false);
  }, [weddingId]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  /* ---------------------------------------------------------------- */
  /* Derived: merge defaults with DB rows                              */
  /* ---------------------------------------------------------------- */

  /**
   * Build the full list of sections to display. Default sections always
   * appear (even if no row exists yet — shown as an "empty" placeholder so
   * the host can initialize it). Custom sections from the DB are appended
   * after the defaults, sorted by sort_order.
   */
  const sections = useMemo(() => {
    const byKey = new Map<string, WebsiteContent>();
    for (const it of items) byKey.set(it.section, it);

    const result: { key: string; label: string; row: WebsiteContent | null; isDefault: boolean }[] = [];

    // Defaults first, in their canonical order.
    for (const def of DEFAULT_SECTIONS) {
      result.push({
        key: def.value,
        label: def.label,
        row: byKey.get(def.value) ?? null,
        isDefault: true,
      });
      byKey.delete(def.value);
    }

    // Any remaining rows are custom sections — sort them by sort_order.
    const customs = Array.from(byKey.values()).sort(
      (a, b) => a.sort_order - b.sort_order
    );
    for (const c of customs) {
      result.push({
        key: c.section,
        label: sectionLabel(c.section),
        row: c,
        isDefault: false,
      });
    }

    return result;
  }, [items]);

  /* ---------------------------------------------------------------- */
  /* Form helpers                                                     */
  /* ---------------------------------------------------------------- */

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, is_published: true });
    setFormOpen(true);
  };

  const openEdit = (row: WebsiteContent) => {
    setEditingId(row.id);
    setForm(contentToForm(row));
    setFormOpen(true);
  };

  /** Initialize a default section that has no row yet — opens the form prefilled. */
  const openInitialize = (key: string, label: string) => {
    setEditingId(null);
    setForm({
      section: key,
      title: label,
      body: "",
      image_url: null,
      is_published: true,
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  /* ---------------------------------------------------------------- */
  /* CRUD: Save (create or update)                                    */
  /* ---------------------------------------------------------------- */

  const handleSave = async () => {
    if (!weddingId) return;
    if (!form.section.trim()) {
      setError("Section key is required.");
      return;
    }

    setBusy(true);
    setError(null);

    const row = formToRow(form);

    if (editingId) {
      const { data, error } = await supabase
        .from("website_content")
        .update(row)
        .eq("id", editingId)
        .select()
        .single();
      setBusy(false);
      if (error) {
        setError(error.message);
        return;
      }
      setItems((prev) => prev.map((c) => (c.id === editingId ? (data as WebsiteContent) : c)));
      closeForm();
    } else {
      // Determine sort_order: defaults use their canonical index, customs go last.
      const defaultIndex = DEFAULT_SECTIONS.findIndex((s) => s.value === row.section);
      const sortOrder =
        defaultIndex >= 0
          ? DEFAULT_SECTIONS[defaultIndex].sortOrder
          : items.length + DEFAULT_SECTIONS.length;

      const { data, error } = await supabase
        .from("website_content")
        .insert({
          ...row,
          wedding_id: weddingId,
          sort_order: sortOrder,
        })
        .select()
        .single();
      setBusy(false);
      if (error) {
        setError(error.message);
        return;
      }
      setItems((prev) => [...prev, data as WebsiteContent]);
      closeForm();
    }
  };

  /* ---------------------------------------------------------------- */
  /* CRUD: Delete                                                      */
  /* ---------------------------------------------------------------- */

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    setError(null);
    const { error } = await supabase
      .from("website_content")
      .delete()
      .eq("id", deleteTarget.id);
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setItems((prev) => prev.filter((c) => c.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  /* ---------------------------------------------------------------- */
  /* Render                                                           */
  /* ---------------------------------------------------------------- */

  if (!weddingId) {
    return <div className="text-sepia text-sm">Loading wedding…</div>;
  }

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Website Content"
        subtitle="Edit the text, images, and visibility of each section on your wedding website."
        action={
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4" />
            New Section
          </Button>
        }
      />

      {error && (
        <div className="rounded-md border border-rose/40 bg-rose/10 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* ---------------------------------------------------------- */}
      {/* Content section cards                                      */}
      {/* ---------------------------------------------------------- */}
      {loading ? (
        <div className="text-sepia text-sm">Loading content…</div>
      ) : sections.length === 0 ? (
        <Card>
          <EmptyState
            title="No content yet"
            description="Your default website sections will appear here. Create a new section to add custom content."
            action={
              <Button onClick={openCreate}>
                <Plus className="w-4 h-4" />
                New Section
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map(({ key, label, row, isDefault }) => {
            const Icon = SECTION_ICONS[key] ?? FileText;
            const published = row?.is_published ?? false;
            return (
              <Card
                key={key}
                className="group relative flex flex-col transition-shadow hover:shadow-md"
              >
                {/* Header: icon + label + badges */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sepia/10 text-sepia">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-serif text-lg text-onyx leading-tight">{label}</h3>
                      <p className="text-xs text-sepia/50 mt-0.5 font-mono">{key}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    {row ? (
                      <Badge variant={published ? "success" : "default"}>
                        {published ? "Published" : "Draft"}
                      </Badge>
                    ) : (
                      <Badge variant="warning">Not set up</Badge>
                    )}
                    {!isDefault && <Badge variant="info">Custom</Badge>}
                  </div>
                </div>

                {/* Body */}
                <div className="mt-4 flex-1">
                  {row ? (
                    <>
                      {row.title && (
                        <p className="text-sm font-medium text-onyx line-clamp-1">{row.title}</p>
                      )}
                      {row.body ? (
                        <p className="mt-1 text-sm text-sepia/70 line-clamp-3 whitespace-pre-line">
                          {row.body}
                        </p>
                      ) : (
                        !row.title && (
                          <p className="text-sm text-sepia/40 italic">No content yet.</p>
                        )
                      )}
                      {row.image_url && (
                        <div className="mt-3 overflow-hidden rounded-md border border-sand">
                          <img
                            src={row.image_url}
                            alt={row.title ?? label}
                            className="h-24 w-full object-cover"
                          />
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-sepia/50">
                      This default section hasn't been configured yet.
                    </p>
                  )}
                </div>

                {/* Action buttons */}
                <div className="mt-4 flex items-center gap-1 border-t border-sand pt-3">
                  {row ? (
                    <button
                      className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-sepia transition-colors hover:bg-sepia/10 hover:text-onyx"
                      onClick={() => openEdit(row)}
                      title="Edit section"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Edit
                    </button>
                  ) : (
                    <button
                      className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-sepia transition-colors hover:bg-sepia/10 hover:text-onyx"
                      onClick={() => openInitialize(key, label)}
                      title="Set up section"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Set up
                    </button>
                  )}

                  {/* Delete — only custom sections */}
                  {!isDefault && row && (
                    <div className="ml-auto flex items-center gap-1">
                      <button
                        className="rounded-md p-1.5 text-sepia/60 transition-colors hover:bg-red-50 hover:text-red-600"
                        onClick={() => setDeleteTarget(row)}
                        title="Delete section"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ---------------------------------------------------------- */}
      {/* Create / Edit modal                                        */}
      {/* ---------------------------------------------------------- */}
      <Modal
        open={formOpen}
        onClose={closeForm}
        title={editingId ? "Edit Section" : "New Section"}
        className="max-w-2xl"
      >
        <div className="space-y-4">
          {/* Section key */}
          <div>
            <Label>Section Key *</Label>
            <Input
              autoFocus={!editingId}
              value={form.section}
              onChange={(e) => setField("section", e.target.value)}
              placeholder="e.g. hero, story, faq, or a custom key"
              disabled={!!editingId}
            />
            <p className="mt-1 text-xs text-sepia/50">
              A unique identifier for this section. Use lowercase with underscores for custom sections.
            </p>
          </div>

          {/* Title */}
          <div>
            <Label>Title</Label>
            <Input
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              placeholder="e.g. Our Love Story"
            />
          </div>

          {/* Body */}
          <div>
            <Label>Body</Label>
            <Textarea
              rows={6}
              value={form.body}
              onChange={(e) => setField("body", e.target.value)}
              placeholder="The main text content for this section. Line breaks are preserved."
            />
          </div>

          {/* Image */}
          <div>
            <Label>Section Image</Label>
            <ImageUpload
              weddingId={weddingId}
              value={form.image_url}
              onChange={(url) => setField("image_url", url)}
            />
          </div>

          {/* Published toggle */}
          <div className="flex items-center justify-between rounded-md border border-sand bg-mist/40 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-onyx">Published</p>
              <p className="text-xs text-sepia/60">When on, this section is visible on your website.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.is_published}
              onClick={() => setField("is_published", !form.is_published)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${
                form.is_published ? "bg-green-500" : "bg-sand"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${
                  form.is_published ? "translate-x-5" : "translate-x-0.5"
                } mt-0.5`}
              />
            </button>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={closeForm}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={busy || !form.section.trim()}>
              {busy ? (
                "Saving…"
              ) : editingId ? (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Create Section
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ---------------------------------------------------------- */}
      {/* Delete confirm modal                                       */}
      {/* ---------------------------------------------------------- */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Section"
      >
        <div className="space-y-4">
          <p className="text-sm text-sepia">
            Are you sure you want to delete the{" "}
            <span className="font-medium text-onyx">
              "{deleteTarget ? sectionLabel(deleteTarget.section) : ""}"
            </span>{" "}
            section?
          </p>
          <div className="rounded-md border border-sand bg-mist px-4 py-3 text-xs text-sepia/80">
            <p className="flex items-center gap-2">
              <Trash2 className="w-3.5 h-3.5 shrink-0" />
              This action cannot be undone. The section content will be permanently removed.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={busy}>
              {busy ? "Deleting…" : "Delete Section"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default AdminContent;
