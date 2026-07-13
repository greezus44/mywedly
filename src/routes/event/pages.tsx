import React, { useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type CustomPage } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input, Modal, Card, EmptyState, Badge, FormField, Toggle } from "../../components/ui";
import { Plus, FileText, Trash2, Edit2, Copy, Eye, Search, Globe, EyeOff } from "lucide-react";
import { slugify, isValidSlug } from "../../lib/theme";
import { formatDateShort } from "../../lib/utils";

export default function PagesEditor() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newNavLabel, setNewNavLabel] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newIcon, setNewIcon] = useState("");
  const [newShowInNav, setNewShowInNav] = useState(true);
  const [newIsFooter, setNewIsFooter] = useState(false);

  const { data: pages, isLoading } = useQuery({
    queryKey: ["custom-pages", event.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("custom_pages").select("*").eq("event_id", event.id).order("sort_order", { ascending: true });
      if (error) throw error;
      return data as CustomPage[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.from("custom_pages").insert({
        event_id: event.id, title: newTitle, nav_label: newNavLabel || newTitle,
        slug: newSlug || slugify(newTitle), icon: newIcon || null,
        show_in_nav: newShowInNav, is_footer: newIsFooter, blocks: [], sort_order: pages?.length || 0,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["custom-pages", event.id] });
      setShowCreate(false);
      setNewTitle(""); setNewNavLabel(""); setNewSlug(""); setNewIcon(""); setNewShowInNav(true); setNewIsFooter(false);
      navigate(`/event/${event.id}/pages/${data.id}`);
    },
    onError: (err: any) => alert("Failed to create page: " + (err.message || "Unknown error")),
  });

  const duplicateMutation = useMutation({
    mutationFn: async (page: CustomPage) => {
      const { data, error } = await supabase.from("custom_pages").insert({
        event_id: event.id, title: page.title + " (Copy)", nav_label: page.nav_label + " (Copy)",
        slug: slugify(page.title + "-copy"), icon: page.icon, show_in_nav: page.show_in_nav,
        is_published: false, blocks: page.blocks, sort_order: (pages?.length || 0),
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["custom-pages", event.id] }),
    onError: (err: any) => alert("Failed to duplicate page: " + (err.message || "Unknown error")),
  });

  const togglePublishMutation = useMutation({
    mutationFn: async (page: CustomPage) => {
      const { error } = await supabase.from("custom_pages").update({ is_published: !page.is_published, updated_at: new Date().toISOString() }).eq("id", page.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["custom-pages", event.id] }),
    onError: (err: any) => alert("Failed to update: " + (err.message || "Unknown error")),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("custom_pages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["custom-pages", event.id] }),
    onError: (err: any) => alert("Failed to delete: " + (err.message || "Unknown error")),
  });

  const filtered = pages?.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.slug.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-dash-text">Custom Pages</h2>
        <Button onClick={() => setShowCreate(true)}><Plus className="w-4 h-4" /> New Page</Button>
      </div>
      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dash-muted" />
        <Input placeholder="Search pages..." value={search} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)} className="pl-10" />
      </div>
      {isLoading ? (
        <div className="text-center py-12 text-dash-muted">Loading...</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<FileText className="w-12 h-12" />} title="No custom pages yet" description="Create additional pages like About Us, Accommodation, FAQ, Travel Info, and more." action={<Button onClick={() => setShowCreate(true)}><Plus className="w-4 h-4" /> New Page</Button>} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dash-border text-left text-sm text-dash-muted">
                <th className="py-2 px-3 font-medium">Page Title</th>
                <th className="py-2 px-3 font-medium">URL</th>
                <th className="py-2 px-3 font-medium">Status</th>
                <th className="py-2 px-3 font-medium">Navigation</th>
                <th className="py-2 px-3 font-medium">Updated</th>
                <th className="py-2 px-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((page) => (
                <tr key={page.id} className="border-b border-dash-border hover:bg-slate-50">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      {page.is_footer && <Badge variant="info">Footer</Badge>}
                      <span className="font-medium text-dash-text">{page.title}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-sm text-dash-muted">/{page.slug}</td>
                  <td className="py-3 px-3"><Badge variant={page.is_published ? "success" : "default"}>{page.is_published ? "Published" : "Draft"}</Badge></td>
                  <td className="py-3 px-3">
                    {page.show_in_nav ? (<span className="inline-flex items-center gap-1 text-sm text-dash-muted"><Eye className="w-3 h-3" /> Visible</span>) : (<span className="inline-flex items-center gap-1 text-sm text-dash-muted"><EyeOff className="w-3 h-3" /> Hidden</span>)}
                  </td>
                  <td className="py-3 px-3 text-sm text-dash-muted">{formatDateShort(page.updated_at)}</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => navigate(`/event/${event.id}/pages/${page.id}`)} className="p-1.5 text-dash-muted hover:text-dash-primary rounded hover:bg-slate-100" title="Edit"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => duplicateMutation.mutate(page)} className="p-1.5 text-dash-muted hover:text-dash-primary rounded hover:bg-slate-100" title="Duplicate"><Copy className="w-4 h-4" /></button>
                      {event.is_published && page.is_published && (<a href={`/e/${event.slug}/p/${page.slug}`} target="_blank" rel="noopener" className="p-1.5 text-dash-muted hover:text-dash-primary rounded hover:bg-slate-100" title="Preview"><Globe className="w-4 h-4" /></a>)}
                      <button onClick={() => togglePublishMutation.mutate(page)} className="p-1.5 text-dash-muted hover:text-dash-primary rounded hover:bg-slate-100" title={page.is_published ? "Unpublish" : "Publish"}>{page.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                      <button onClick={() => { if (confirm("Delete this page?")) deleteMutation.mutate(page.id); }} className="p-1.5 text-red-500 hover:text-red-700 rounded hover:bg-red-50" title="Delete"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create New Page">
        <div className="space-y-4">
          <FormField label="Page Title"><Input value={newTitle} onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setNewTitle(e.target.value); if (!newSlug) setNewSlug(slugify(e.target.value)); if (!newNavLabel) setNewNavLabel(e.target.value); }} placeholder="e.g. Accommodation" /></FormField>
          <FormField label="Navigation Label" hint="Short label shown in the guest navigation"><Input value={newNavLabel} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewNavLabel(e.target.value)} placeholder="e.g. Stay" /></FormField>
          <FormField label="URL Slug" hint="Letters, numbers, and hyphens only"><Input value={newSlug} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewSlug(slugify(e.target.value))} placeholder="e.g. accommodation" /></FormField>
          <FormField label="Icon (optional)" hint="Lucide icon name, e.g. 'bed', 'map-pin', 'calendar'"><Input value={newIcon} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewIcon(e.target.value)} placeholder="e.g. bed" /></FormField>
          <div className="flex items-center gap-6">
            <Toggle checked={newShowInNav} onChange={setNewShowInNav} label="Show in Navigation" />
            <Toggle checked={newIsFooter} onChange={setNewIsFooter} label="Use as Footer" />
          </div>
          <Button onClick={() => createMutation.mutate()} loading={createMutation.isPending} disabled={!newTitle.trim()} className="w-full">Create Page</Button>
        </div>
      </Modal>
    </div>
  );
}
