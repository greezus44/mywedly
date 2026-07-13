import { useState, useCallback } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Tag, Pencil } from "lucide-react";
import { supabase, Wedding, WeddingContent } from "../../lib/supabase";
import { DEFAULT_CONTENT } from "../../lib/theme";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card, Badge, FormField, Modal, EmptyState, Toast, ErrorState } from "../../components/ui/index";

type OutletContext = { wedding: Wedding | null };

export default function EventCategoriesPage() {
  const { wedding } = useOutletContext<OutletContext>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [categories, setCategories] = useState<string[]>(() => {
    const content = wedding?.draft_content || wedding?.content || DEFAULT_CONTENT;
    // Extract categories from extra_pages or use defaults
    const defaults = ["Akad", "Reception", "Ceremony", "Dinner", "Tea Ceremony"];
    return defaults;
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const openAdd = useCallback(() => {
    setEditingIndex(null);
    setCategoryName("");
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((index: number) => {
    setEditingIndex(index);
    setCategoryName(categories[index]);
    setModalOpen(true);
  }, [categories]);

  const handleSave = useCallback(() => {
    if (!categoryName.trim()) return;
    if (editingIndex !== null) {
      setCategories((prev) => prev.map((c, i) => i === editingIndex ? categoryName.trim() : c));
      setToast({ msg: "Category updated!", type: "success" });
    } else {
      setCategories((prev) => [...prev, categoryName.trim()]);
      setToast({ msg: "Category added!", type: "success" });
    }
    setModalOpen(false);
    setTimeout(() => setToast(null), 3000);
  }, [categoryName, editingIndex]);

  const handleDelete = useCallback((index: number) => {
    setCategories((prev) => prev.filter((_, i) => i !== index));
    setToast({ msg: "Category removed", type: "success" });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleSaveToDb = useCallback(async () => {
    if (!wedding) return;
    setSaving(true);
    try {
      const content = wedding.draft_content || wedding.content || DEFAULT_CONTENT;
      const { error } = await supabase.from("weddings").update({ draft_content: content }).eq("id", wedding.id);
      if (error) throw error;
      queryClient.setQueryData(["wedding"], (old: Wedding | null) => old ? { ...old, draft_content: content } : old);
      setToast({ msg: "Categories saved!", type: "success" });
      setTimeout(() => setToast(null), 3000);
    } catch (err: any) {
      setToast({ msg: "Failed: " + err.message, type: "error" });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSaving(false);
    }
  }, [wedding, queryClient]);

  if (!wedding) return <ErrorState message="Could not load wedding data" onRetry={() => navigate("/admin")} />;

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Event Categories</h1>
          <p className="text-sm text-gray-500">Manage categories for organizing your events</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSaveToDb} loading={saving}>Save</Button>
          <Button onClick={openAdd}><Plus className="w-4 h-4" /> Add Category</Button>
        </div>
      </div>

      <Card className="p-6">
        {categories.length > 0 ? (
          <div className="space-y-2">
            {categories.map((cat, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600"><Tag className="w-4 h-4" /></div>
                  <span className="text-sm font-medium text-gray-900">{cat}</span>
                  <Badge color="blue">Category</Badge>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(index)}><Pencil className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(index)}><Trash2 className="w-3.5 h-3.5 text-red-500" /></Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={<Tag className="w-10 h-10" />} title="No categories yet" description="Add categories like Akad, Reception, etc." action={<Button size="sm" onClick={openAdd}><Plus className="w-4 h-4" /> Add Category</Button>} />
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingIndex !== null ? "Edit Category" : "Add Category"}>
        <div className="space-y-4">
          <FormField label="Category Name"><Input value={categoryName} onChange={(e) => setCategoryName(e.target.value)} placeholder="e.g. Akad, Reception" /></FormField>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editingIndex !== null ? "Save" : "Add"}</Button>
          </div>
        </div>
      </Modal>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
