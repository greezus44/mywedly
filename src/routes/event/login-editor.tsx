import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Json } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { LoginPreview } from "../../components/preview/PreviewRenderers";

interface LoginConfig {
  title?: string;
  subtitle?: string;
  ctaText?: string;
  requireName?: boolean;
  requireEmail?: boolean;
}

export function LoginEditor() {
  const { event, eventId } = useEventContext();
  const queryClient = useQueryClient();

  const existing = (event.draft_login_config ?? event.login_config ?? {}) as LoginConfig;

  const [title, setTitle] = useState(existing.title ?? "");
  const [subtitle, setSubtitle] = useState(existing.subtitle ?? "");
  const [ctaText, setCtaText] = useState(existing.ctaText ?? "Continue");
  const [saved, setSaved] = useState(false);

  const liveConfig: LoginConfig = {
    title,
    subtitle,
    ctaText,
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("user_events")
        .update({ draft_login_config: liveConfig as unknown as Json })
        .eq("id", eventId)
        .select("*")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-dash-text">Login Editor</h1>
          <p className="mt-1 text-sm text-dash-muted">
            Customise the guest login page
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="text-sm text-green-600">✓ Saved</span>}
          <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
            Save Changes
          </Button>
        </div>
      </div>

      <div className="h-[calc(100vh-220px)] min-h-[500px]">
        <SplitEditor
          editor={
            <div className="space-y-4">
              <Input
                label="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Welcome to our wedding"
              />
              <Textarea
                label="Subtitle"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="e.g. Enter your username to access your invitation"
                rows={3}
              />
              <Input
                label="CTA Button Text"
                value={ctaText}
                onChange={(e) => setCtaText(e.target.value)}
                placeholder="Continue"
              />
            </div>
          }
          preview={
            <LoginPreview
              event={event}
              theme={event.draft_theme ?? event.theme}
              coverImage={event.draft_cover_image ?? event.cover_image}
            />
          }
        />
      </div>
    </div>
  );
}
