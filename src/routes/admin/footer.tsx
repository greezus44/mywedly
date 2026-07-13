import { useState, useEffect, useMemo, useCallback } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Heart, Type } from "lucide-react";
import { supabase, Wedding, WeddingContent, ThemeConfig } from "../../lib/supabase";
import { DEFAULT_CONTENT, DEFAULT_THEME } from "../../lib/theme";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { HomePreview } from "../../components/preview/PreviewRenderers";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import { Card, FormField, Toggle, Toast, ErrorState } from "../../components/ui/index";
import { debounce } from "../../lib/utils";

type OutletContext = { wedding: Wedding | null };

export default function FooterPage() {
  const { wedding } = useOutletContext<OutletContext>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [content, setContent] = useState<WeddingContent>(wedding?.draft_content || wedding?.content || DEFAULT_CONTENT);
  const [theme, setTheme] = useState<ThemeConfig>(wedding?.draft_theme || wedding?.theme || DEFAULT_THEME);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [previewKey, setPreviewKey] = useState("0");

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

  const handleSave = useCallback(async () => {
    if (!wedding) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("weddings").update({ draft_content: content }).eq("id", wedding.id);
      if (error) throw error;
      queryClient.setQueryData(["wedding"], (old: Wedding | null) => old ? { ...old, draft_content: content } : old);
      setToast("Footer saved!");
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
          <h1 className="text-xl font-bold text-gray-900">Footer</h1>
          <p className="text-sm text-gray-500">Customize your website footer</p>
        </div>
        <Button onClick={handleSave} loading={saving}>Save Changes</Button>
      </div>

      <SplitEditor
        title="Footer Settings"
        previewKey={previewKey}
        preview={<HomePreview wedding={wedding} theme={theme} content={content} />}
        children={
          <div className="space-y-5">
            <Card className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-gray-400" />
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Footer Visibility</h3>
                    <p className="text-xs text-gray-500">Show or hide the footer</p>
                  </div>
                </div>
                <Toggle checked={content.footer_enabled} onChange={(v) => updateContent({ footer_enabled: v })} />
              </div>
            </Card>

            <Card className="p-4 space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Type className="w-4 h-4 text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-900">Footer Text</h3>
              </div>
              <FormField label="Footer Text" hint="Appears at the bottom of your website">
                <Textarea
                  value={content.footer_text}
                  onChange={(e) => updateContent({ footer_text: e.target.value })}
                  placeholder="e.g. Made with love by John & Jane"
                  className="min-h-[100px]"
                />
              </FormField>
            </Card>

            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500 mb-2">Preview:</p>
              <div className="text-center text-sm text-gray-600 py-4 border-t border-gray-200">
                {content.footer_enabled ? (content.footer_text || "Footer text will appear here") : <span className="text-gray-400 italic">Footer is disabled</span>}
              </div>
            </div>
          </div>
        }
      />

      {toast && <Toast message={toast} type={toast.includes("Failed") ? "error" : "success"} onClose={() => setToast(null)} />}
    </div>
  );
}
