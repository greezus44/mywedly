import { useState, useEffect, useMemo, useCallback } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase, Wedding, WeddingContent } from "../../lib/supabase";
import { DEFAULT_CONTENT, DEFAULT_THEME } from "../../lib/theme";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { HomePreview } from "../../components/preview/PreviewRenderers";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import { FormField, ImageUpload, Toast, ErrorState } from "../../components/ui/index";
import { DatePicker, TimePicker } from "../../components/ui/DatePicker";
import { debounce } from "../../lib/utils";

type OutletContext = { wedding: Wedding | null };

export default function ContentEditor() {
  const { wedding } = useOutletContext<OutletContext>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [content, setContent] = useState<WeddingContent>(wedding?.draft_content || wedding?.content || DEFAULT_CONTENT);
  const [theme, setTheme] = useState(wedding?.draft_theme || wedding?.theme || DEFAULT_THEME);
  const [weddingDate, setWeddingDate] = useState<string | null>(wedding?.draft_wedding_date || wedding?.wedding_date || null);
  const [weddingTime, setWeddingTime] = useState<string | null>(wedding?.draft_wedding_time || wedding?.wedding_time || null);
  const [venue, setVenue] = useState(wedding?.draft_venue || wedding?.venue || "");
  const [address, setAddress] = useState(wedding?.draft_address || wedding?.address || "");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [previewKey, setPreviewKey] = useState("0");

  useEffect(() => {
    if (wedding) {
      setContent(wedding.draft_content || wedding.content || DEFAULT_CONTENT);
      setTheme(wedding.draft_theme || wedding.theme || DEFAULT_THEME);
      setWeddingDate(wedding.draft_wedding_date || wedding.wedding_date || null);
      setWeddingTime(wedding.draft_wedding_time || wedding.wedding_time || null);
      setVenue(wedding.draft_venue || wedding.venue || "");
      setAddress(wedding.draft_address || wedding.address || "");
    }
  }, [wedding?.id]);

  const debouncedPreviewUpdate = useMemo(() => debounce(() => setPreviewKey(k => String(Number(k) + 1)), 150), []);
  const updateContent = useCallback((patch: Partial<WeddingContent>) => { setContent(prev => ({ ...prev, ...patch })); debouncedPreviewUpdate(); }, [debouncedPreviewUpdate]);

  const handleSave = useCallback(async () => {
    if (!wedding) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("weddings").update({
        draft_content: content,
        draft_wedding_date: weddingDate,
        draft_wedding_time: weddingTime,
        draft_venue: venue,
        draft_address: address,
      }).eq("id", wedding.id);
      if (error) throw error;
      queryClient.setQueryData(["wedding"], (old: Wedding | null) => old ? { ...old, draft_content: content, draft_wedding_date: weddingDate, draft_wedding_time: weddingTime, draft_venue: venue, draft_address: address } : old);
      setToast("Home page saved!");
      setTimeout(() => setToast(null), 3000);
    } catch (err: any) {
      setToast("Failed: " + err.message);
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSaving(false);
    }
  }, [wedding, content, weddingDate, weddingTime, venue, address, queryClient]);

  if (!wedding) return <ErrorState message="Could not load wedding data" onRetry={() => navigate("/admin")} />;
  const previewWedding = { ...wedding, draft_content: content, draft_theme: theme, draft_wedding_date: weddingDate, draft_wedding_time: weddingTime, draft_venue: venue, draft_address: address };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Home Page</h1>
          <p className="text-sm text-gray-500">Your wedding details and love story</p>
        </div>
        <Button onClick={handleSave} loading={saving}>Save Changes</Button>
      </div>

      <SplitEditor title="Home Page Content" previewKey={previewKey} preview={<HomePreview wedding={previewWedding} theme={theme} content={content} />} children={
        <div className="space-y-5">
          {/* Wedding Details */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">Wedding Details</h3>
            <DatePicker value={weddingDate} onChange={setWeddingDate} label="Wedding Date" />
            <TimePicker value={weddingTime} onChange={setWeddingTime} label="Wedding Time" />
            <FormField label="Venue"><Input value={venue} onChange={(e) => { setVenue(e.target.value); debouncedPreviewUpdate(); }} /></FormField>
            <FormField label="Address"><Textarea value={address} onChange={(e) => { setAddress(e.target.value); debouncedPreviewUpdate(); }} /></FormField>
          </div>

          {/* Our Story */}
          <div className="space-y-3 border-t border-gray-200 pt-4">
            <h3 className="text-sm font-semibold text-gray-900">Our Story</h3>
            <FormField label="Story"><Textarea value={content.story} onChange={(e) => updateContent({ story: e.target.value })} placeholder="Tell your love story..." className="min-h-[120px]" /></FormField>
            <FormField label="Story Image"><ImageUpload value={content.story_image} onChange={(v) => updateContent({ story_image: v })} /></FormField>
          </div>
        </div>
      } />

      {toast && <Toast message={toast} type={toast.includes("Failed") ? "error" : "success"} onClose={() => setToast(null)} />}
    </div>
  );
}
