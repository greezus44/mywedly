import { useState, useEffect, useCallback } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase, Wedding } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import { FormField, Toast, ErrorState, Card } from "../../components/ui/index";
import { DatePicker, TimePicker } from "../../components/ui/DatePicker";

type OutletContext = { wedding: Wedding | null };

export default function SettingsPage() {
  const { wedding } = useOutletContext<OutletContext>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState(wedding?.draft_title || wedding?.title || "");
  const [groomName, setGroomName] = useState(wedding?.draft_groom_name || wedding?.groom_name || "");
  const [brideName, setBrideName] = useState(wedding?.draft_bride_name || wedding?.bride_name || "");
  const [groomParents, setGroomParents] = useState(wedding?.draft_groom_parents || wedding?.groom_parents || "");
  const [brideParents, setBrideParents] = useState(wedding?.draft_bride_parents || wedding?.bride_parents || "");
  const [weddingDate, setWeddingDate] = useState<string | null>(wedding?.draft_wedding_date || wedding?.wedding_date || null);
  const [weddingTime, setWeddingTime] = useState<string | null>(wedding?.draft_wedding_time || wedding?.wedding_time || null);
  const [venue, setVenue] = useState(wedding?.draft_venue || wedding?.venue || "");
  const [address, setAddress] = useState(wedding?.draft_address || wedding?.address || "");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (wedding) {
      setTitle(wedding.draft_title || wedding.title || "");
      setGroomName(wedding.draft_groom_name || wedding.groom_name || "");
      setBrideName(wedding.draft_bride_name || wedding.bride_name || "");
      setGroomParents(wedding.draft_groom_parents || wedding.groom_parents || "");
      setBrideParents(wedding.draft_bride_parents || wedding.bride_parents || "");
      setWeddingDate(wedding.draft_wedding_date || wedding.wedding_date || null);
      setWeddingTime(wedding.draft_wedding_time || wedding.wedding_time || null);
      setVenue(wedding.draft_venue || wedding.venue || "");
      setAddress(wedding.draft_address || wedding.address || "");
    }
  }, [wedding?.id]);

  const handleSave = useCallback(async () => {
    if (!wedding) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("weddings").update({
        draft_title: title, draft_groom_name: groomName, draft_bride_name: brideName,
        draft_groom_parents: groomParents, draft_bride_parents: brideParents,
        draft_wedding_date: weddingDate, draft_wedding_time: weddingTime,
        draft_venue: venue, draft_address: address,
      }).eq("id", wedding.id);
      if (error) throw error;
      queryClient.setQueryData(["wedding"], (old: Wedding | null) => old ? {
        ...old, draft_title: title, draft_groom_name: groomName, draft_bride_name: brideName,
        draft_groom_parents: groomParents, draft_bride_parents: brideParents,
        draft_wedding_date: weddingDate, draft_wedding_time: weddingTime,
        draft_venue: venue, draft_address: address,
      } : old);
      setToast("Settings saved!");
      setTimeout(() => setToast(null), 3000);
    } catch (err: any) {
      setToast("Failed: " + err.message);
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSaving(false);
    }
  }, [wedding, title, groomName, brideName, groomParents, brideParents, weddingDate, weddingTime, venue, address, queryClient]);

  if (!wedding) return <ErrorState message="Could not load wedding data" onRetry={() => navigate("/admin")} />;

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">General Settings</h1>
          <p className="text-sm text-gray-500">Basic wedding information</p>
        </div>
        <Button onClick={handleSave} loading={saving}>Save Changes</Button>
      </div>

      <Card className="p-6 space-y-5">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">Wedding Title</h3>
          <FormField label="Title"><Input value={title} onChange={(e) => setTitle(e.target.value)} /></FormField>
        </div>

        <div className="space-y-3 border-t border-gray-200 pt-4">
          <h3 className="text-sm font-semibold text-gray-900">Couple</h3>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Groom Name"><Input value={groomName} onChange={(e) => setGroomName(e.target.value)} /></FormField>
            <FormField label="Bride Name"><Input value={brideName} onChange={(e) => setBrideName(e.target.value)} /></FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Groom Parents"><Input value={groomParents} onChange={(e) => setGroomParents(e.target.value)} placeholder="e.g. Mr & Mrs Smith" /></FormField>
            <FormField label="Bride Parents"><Input value={brideParents} onChange={(e) => setBrideParents(e.target.value)} placeholder="e.g. Mr & Mrs Jones" /></FormField>
          </div>
        </div>

        <div className="space-y-3 border-t border-gray-200 pt-4">
          <h3 className="text-sm font-semibold text-gray-900">Date & Time</h3>
          <div className="grid grid-cols-2 gap-3">
            <DatePicker value={weddingDate} onChange={setWeddingDate} label="Wedding Date" />
            <TimePicker value={weddingTime} onChange={setWeddingTime} label="Wedding Time" />
          </div>
        </div>

        <div className="space-y-3 border-t border-gray-200 pt-4">
          <h3 className="text-sm font-semibold text-gray-900">Venue</h3>
          <FormField label="Venue Name"><Input value={venue} onChange={(e) => setVenue(e.target.value)} /></FormField>
          <FormField label="Address"><Textarea value={address} onChange={(e) => setAddress(e.target.value)} /></FormField>
        </div>
      </Card>

      {toast && <Toast message={toast} type={toast.includes("Failed") ? "error" : "success"} onClose={() => setToast(null)} />}
    </div>
  );
}
