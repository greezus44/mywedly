import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { slugify } from "../../lib/utils";

interface CustomPage {
  id: string;
  title: string;
  slug: string;
  blocks: unknown[];
}

export function PagesPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const qc = useQueryClient();
  const [pages, setPages] = useState<CustomPage[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: event } = useQuery({
    queryKey: ["event", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_events").select("*").eq("id", eventId!).single();
      if (error) throw error;
      return data as UserEvent;
    },
    enabled: !!eventId,
  });

  useEffect(() => {
    if (event) {
      const content = (event.draft_content ?? event.content ?? {}) as Record<string, unknown>;
      setPages((content.pages as unknown as CustomPage[]) || []);
    }
  }, [event]);

  const persist = async (next: CustomPage[]) => {
    if (!event) return;
    setSaving(true);
    const content = {
      ...((event.draft_content ?? event.content ?? {}) as Record<string, unknown>),
      pages: next,
    };
    const { error } = await supabase
      .from("user_events")
      .update({ draft_content: content })
      .eq("id", event.id);
    setSaving(false);
    if (!error) {
      setPages(next);
      qc.invalidateQueries({ queryKey: ["event", eventId] });
    }
  };

  const addPage = () => {
    const id = `page-${Date.now()}`;
    const page: CustomPage = { id, title: newTitle, slug: slugify(newTitle) || id, blocks: [] };
    void persist([...pages, page]);
    setNewTitle("");
    setShowForm(false);
  };

  const deletePage = (id: string) => {
    void persist(pages.filter((p) => p.id !== id));
  };

  if (!event) return <div>Loading…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-1">Pages</h2>
          <p className="text-sm text-gray-500">Create custom pages for your event.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "Add Page"}
        </Button>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-end gap-3">
          <div className="flex-1">
            <Input
              label="Page Title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Travel & Accommodation"
            />
          </div>
          <Button onClick={addPage} disabled={!newTitle.trim() || saving}>Add</Button>
        </div>
      )}

      {pages.length > 0 ? (
        <div className="space-y-2">
          {pages.map((page) => (
            <div key={page.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-800">{page.title}</p>
                <p className="text-xs text-gray-400">/{page.slug}</p>
              </div>
              <div className="flex items-center gap-2">
                <Link to={`pages/${page.id}`}>
                  <Button variant="outline" size="sm">Edit</Button>
                </Link>
                <button
                  onClick={() => { if (confirm("Delete this page?")) deletePage(page.id); }}
                  className="text-xs text-red-500 hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">No custom pages yet. Add one to get started.</p>
      )}

      {saving && <p className="text-xs text-gray-400">Saving…</p>}
    </div>
  );
}
