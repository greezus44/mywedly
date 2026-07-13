import { useState, useEffect, useMemo, useCallback } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Menu, Link2 } from "lucide-react";
import { supabase, Wedding, WeddingContent, ThemeConfig, NavItem } from "../../lib/supabase";
import { DEFAULT_CONTENT, DEFAULT_THEME } from "../../lib/theme";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { HomePreview } from "../../components/preview/PreviewRenderers";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card, FormField, Toggle, EmptyState, Toast, ErrorState } from "../../components/ui/index";
import { debounce, generateToken } from "../../lib/utils";

type OutletContext = { wedding: Wedding | null };

export default function NavigationPage() {
  const { wedding } = useOutletContext<OutletContext>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [content, setContent] = useState<WeddingContent>(wedding?.draft_content || wedding?.content || DEFAULT_CONTENT);
  const [theme, setTheme] = useState<ThemeConfig>(wedding?.draft_theme || wedding?.theme || DEFAULT_THEME);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [previewKey, setPreviewKey] = useState("0");

  const navItems = content.navigation || [];

  useEffect(() => {
    if (wedding) {
      setContent(wedding.draft_content || wedding.content || DEFAULT_CONTENT);
      setTheme(wedding.draft_theme || wedding.theme || DEFAULT_THEME);
    }
  }, [wedding?.id]);

  const debouncedPreviewUpdate = useMemo(() => debounce(() => setPreviewKey((k) => String(Number(k) + 1)), 150), []);
  const updateContent = useCallback((patch: Partial<WeddingContent>) => {
    setContent((prev) => ({ ...prev, ...patch }));
    debouncedPreviewUpdate();
  }, [debouncedPreviewUpdate]);

  const addNavItem = useCallback(() => {
    const newItem: NavItem = { id: generateToken(), label: "", url: "", enabled: true };
    updateContent({ navigation: [...navItems, newItem] });
  }, [navItems, updateContent]);

  const updateNavItem = useCallback((id: string, patch: Partial<NavItem>) => {
    updateContent({ navigation: navItems.map((item) => item.id === id ? { ...item, ...patch } : item) });
  }, [navItems, updateContent]);

  const removeNavItem = useCallback((id: string) => {
    updateContent({ navigation: navItems.filter((item) => item.id !== id) });
  }, [navItems, updateContent]);

  const moveItem = useCallback((id: string, direction: -1 | 1) => {
    const index = navItems.findIndex((item) => item.id === id);
    if (index < 0) return;
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= navItems.length) return;
    const newItems = [...navItems];
    [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];
    updateContent({ navigation: newItems });
  }, [navItems, updateContent]);

  const handleSave = useCallback(async () => {
    if (!wedding) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("weddings").update({ draft_content: content }).eq("id", wedding.id);
      if (error) throw error;
      queryClient.setQueryData(["wedding"], (old: Wedding | null) => old ? { ...old, draft_content: content } : old);
      setToast("Navigation saved!");
      setTimeout(() => setToast(null), 3000);
    } catch (err: any) {
      setToast("Failed: " + err.message);
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSaving(false);
    }
  }, [wedding, content, queryClient]);

  if (!wedding) return <ErrorState message="Could not load wedding data" onRetry={() => navigate("/admin")} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Navigation</h1>
          <p className="text-sm text-gray-500">Manage your website navigation menu</p>
        </div>
        <Button onClick={handleSave} loading={saving}>Save Changes</Button>
      </div>

      <SplitEditor
        title="Navigation"
        previewKey={previewKey}
        preview={<HomePreview wedding={wedding} theme={theme} content={content} />}
        children={
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Menu Items ({navItems.length})</h3>
              <Button variant="outline" size="sm" onClick={addNavItem}><Plus className="w-3.5 h-3.5" /> Add Item</Button>
            </div>

            {navItems.length === 0 ? (
              <EmptyState icon={<Menu className="w-10 h-10" />} title="No navigation items" description="Add menu items to your navigation" action={<Button size="sm" onClick={addNavItem}><Plus className="w-4 h-4" /> Add Item</Button>} />
            ) : (
              <div className="space-y-3">
                {navItems.map((item, index) => (
                  <Card key={item.id} className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-400 w-6">{index + 1}.</span>
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <Input value={item.label} onChange={(e) => updateNavItem(item.id, { label: e.target.value })} placeholder="Label" />
                        <Input value={item.url} onChange={(e) => updateNavItem(item.id, { url: e.target.value })} placeholder="/page or #section" />
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => moveItem(item.id, -1)} disabled={index === 0}>↑</Button>
                      <Button variant="ghost" size="sm" onClick={() => moveItem(item.id, 1)} disabled={index === navItems.length - 1}>↓</Button>
                      <Button variant="ghost" size="sm" onClick={() => removeNavItem(item.id)}><Trash2 className="w-3.5 h-3.5 text-red-500" /></Button>
                    </div>
                    <div className="flex items-center gap-2 ml-8">
                      <Toggle checked={item.enabled} onChange={(v) => updateNavItem(item.id, { enabled: v })} label="Visible" />
                      <Link2 className="w-3.5 h-3.5 text-gray-300" />
                      <span className="text-xs text-gray-400">{item.url || "No URL"}</span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        }
      />

      {toast && <Toast message={toast} type={toast.includes("Failed") ? "error" : "success"} onClose={() => setToast(null)} />}
    </div>
  );
}
