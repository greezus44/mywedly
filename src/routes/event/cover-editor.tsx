import React from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type CoverConfig } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, FormField } from "../../components/ui";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { DatePicker } from "../../components/ui/DatePicker";
import { TimePicker } from "../../components/ui/TimePicker";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { CoverPreview } from "../../components/preview/PreviewRenderers";

export default function CoverEditor() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();
  const cfg = event.draft_cover_config || event.cover_config || {};
  const [title, setTitle] = React.useState(cfg.title || "");
  const [subtitle, setSubtitle] = React.useState(cfg.subtitle || "");
  const [coverImage, setCoverImage] = React.useState<string | null>(cfg.cover_image || null);
  const [date, setDate] = React.useState<string | null>(cfg.date || event.draft_event_date || event.event_date || null);
  const [time, setTime] = React.useState<string | null>(cfg.time || event.draft_event_time || event.event_time || null);
  const [venue, setVenue] = React.useState(cfg.venue || event.draft_venue || event.venue || "");
  const [logoImage, setLogoImage] = React.useState<string | null>(cfg.logo_image || null);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const coverConfig: CoverConfig = { title, subtitle, cover_image: coverImage, date, time, venue, logo_image: logoImage };
      const { error } = await supabase.from("user_events").update({ draft_cover_config: coverConfig, draft_cover_image: coverImage, draft_event_date: date, draft_event_time: time, draft_venue: venue }).eq("id", event.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["event", event.id] }),
    onError: (err: any) => alert("Failed to save: " + (err.message || "Unknown error")),
  });

  const previewEvent = { ...event, draft_cover_config: { title, subtitle, cover_image: coverImage, date, time, venue, logo_image: logoImage } };

  return (
    <div>
      <h2 className="text-xl font-semibold text-dash-text mb-6">Cover Page</h2>
      <SplitEditor preview={<CoverPreview event={previewEvent} />}>
        <div className="space-y-4">
          <FormField label="Title"><Input value={title} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)} placeholder="Event title" /></FormField>
          <FormField label="Subtitle"><Textarea value={subtitle} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSubtitle(e.target.value)} rows={2} placeholder="Tagline or subtitle" /></FormField>
          <FormField label="Cover Image"><ImageUpload value={coverImage} onChange={setCoverImage} eventId={event.id} /></FormField>
          <FormField label="Logo Image"><ImageUpload value={logoImage} onChange={setLogoImage} eventId={event.id} aspectRatio="1/1" /></FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Date"><DatePicker value={date} onChange={(d) => setDate(d)} /></FormField>
            <FormField label="Time"><TimePicker value={time} onChange={(t) => setTime(t)} /></FormField>
          </div>
          <FormField label="Venue"><Input value={venue} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVenue(e.target.value)} placeholder="Venue name" /></FormField>
          <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>Save Changes</Button>
        </div>
      </SplitEditor>
    </div>
  );
}
