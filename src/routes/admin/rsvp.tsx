import { useState, useEffect, useMemo, useCallback } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { supabase, Wedding, WeddingContent, ThemeConfig, RsvpQuestion } from "../../lib/supabase";
import { DEFAULT_CONTENT, DEFAULT_THEME } from "../../lib/theme";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { RsvpPreview } from "../../components/preview/PreviewRenderers";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Select } from "../../components/ui/Input";
import { Card, FormField, Toggle, Toast, ErrorState } from "../../components/ui/index";
import { debounce, generateToken } from "../../lib/utils";

type OutletContext = { wedding: Wedding | null };

export default function RsvpPage() {
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

  const addQuestion = useCallback(() => {
    const newQ: RsvpQuestion = { id: generateToken(), text: "", type: "text", options: [], required: false };
    updateContent({ rsvp_questions: [...(content.rsvp_questions || []), newQ] });
  }, [content.rsvp_questions, updateContent]);

  const updateQuestion = useCallback((id: string, patch: Partial<RsvpQuestion>) => {
    updateContent({ rsvp_questions: (content.rsvp_questions || []).map((q) => q.id === id ? { ...q, ...patch } : q) });
  }, [content.rsvp_questions, updateContent]);

  const removeQuestion = useCallback((id: string) => {
    updateContent({ rsvp_questions: (content.rsvp_questions || []).filter((q) => q.id !== id) });
  }, [content.rsvp_questions, updateContent]);

  const handleSave = useCallback(async () => {
    if (!wedding) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("weddings").update({ draft_content: content }).eq("id", wedding.id);
      if (error) throw error;
      queryClient.setQueryData(["wedding"], (old: Wedding | null) => old ? { ...old, draft_content: content } : old);
      setToast("RSVP settings saved!");
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
          <h1 className="text-xl font-bold text-gray-900">RSVP Settings</h1>
          <p className="text-sm text-gray-500">Configure your RSVP form and questions</p>
        </div>
        <Button onClick={handleSave} loading={saving}>Save Changes</Button>
      </div>

      <SplitEditor
        title="RSVP Settings"
        previewKey={previewKey}
        preview={<RsvpPreview theme={theme} content={content} />}
        children={
          <div className="space-y-5">
            <FormField label="RSVP Title"><Input value={content.rsvp_title} onChange={(e) => updateContent({ rsvp_title: e.target.value })} placeholder="RSVP" /></FormField>
            <FormField label="RSVP Description"><Textarea value={content.rsvp_description} onChange={(e) => updateContent({ rsvp_description: e.target.value })} placeholder="Description text..." /></FormField>

            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">Custom Questions</h3>
                <Button variant="outline" size="sm" onClick={addQuestion}><Plus className="w-3.5 h-3.5" /> Add Question</Button>
              </div>
              <div className="space-y-3">
                {(content.rsvp_questions || []).map((q) => (
                  <Card key={q.id} className="p-4 space-y-3">
                    <div className="flex items-start gap-2">
                      <GripVertical className="w-4 h-4 text-gray-300 mt-2" />
                      <div className="flex-1 space-y-3">
                        <Input value={q.text} onChange={(e) => updateQuestion(q.id, { text: e.target.value })} placeholder="Question text" />
                        <div className="grid grid-cols-2 gap-2">
                          <Select value={q.type} onChange={(e) => updateQuestion(q.id, { type: e.target.value as RsvpQuestion["type"] })}>
                            <option value="text">Text</option>
                            <option value="radio">Radio</option>
                            <option value="checkbox">Checkbox</option>
                            <option value="select">Select</option>
                          </Select>
                          <div className="flex items-center justify-center">
                            <Toggle checked={q.required} onChange={(v) => updateQuestion(q.id, { required: v })} label="Required" />
                          </div>
                        </div>
                        {(q.type === "radio" || q.type === "checkbox" || q.type === "select") && (
                          <Input
                            value={q.options.join(", ")}
                            onChange={(e) => updateQuestion(q.id, { options: e.target.value.split(",").map((o) => o.trim()).filter(Boolean) })}
                            placeholder="Option 1, Option 2, Option 3"
                          />
                        )}
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => removeQuestion(q.id)}><Trash2 className="w-3.5 h-3.5 text-red-500" /></Button>
                    </div>
                  </Card>
                ))}
                {(content.rsvp_questions || []).length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">No custom questions yet. Add one to collect more info.</p>
                )}
              </div>
            </div>
          </div>
        }
      />

      {toast && <Toast message={toast} type={toast.includes("Failed") ? "error" : "success"} onClose={() => setToast(null)} />}
    </div>
  );
}
