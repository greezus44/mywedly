import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Json } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { LoginPreview } from "../../components/preview/PreviewRenderers";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, FormField, Toggle } from "../../components/ui";

interface LoginConfig {
  title?: string;
  subtitle?: string;
  show_guest_login?: boolean;
  guest_login_label?: string;
  background_image?: string | null;
}

const DEFAULT_CONFIG: LoginConfig = {
  title: "",
  subtitle: "Enter your username to access your invitation",
  show_guest_login: true,
  guest_login_label: "View My Invitation",
  background_image: null,
};

export function LoginEditor() {
  const { event, eventId } = useEventContext();
  const queryClient = useQueryClient();

  const existing = (event.draft_login_config as LoginConfig | null) ?? {};
  const merged: LoginConfig = { ...DEFAULT_CONFIG, ...existing };

  const [title, setTitle] = useState(merged.title ?? "");
  const [subtitle, setSubtitle] = useState(merged.subtitle ?? "");
  const [showGuestLogin, setShowGuestLogin] = useState(merged.show_guest_login ?? true);
  const [guestLoginLabel, setGuestLoginLabel] = useState(merged.guest_login_label ?? "View My Invitation");
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    const cfg = (event.draft_login_config as LoginConfig | null) ?? {};
    const m: LoginConfig = { ...DEFAULT_CONFIG, ...cfg };
    setTitle(m.title ?? "");
    setSubtitle(m.subtitle ?? "");
    setShowGuestLogin(m.show_guest_login ?? true);
    setGuestLoginLabel(m.guest_login_label ?? "View My Invitation");
  }, [event]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const config: LoginConfig = {
        title,
        subtitle,
        show_guest_login: showGuestLogin,
        guest_login_label: guestLoginLabel,
        background_image: merged.background_image,
      };
      const { error } = await supabase
        .from("user_events")
        .update({ draft_login_config: config as unknown as Json })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 2000);
    },
  });

  const previewEvent = {
    ...event,
    login_title: title || event.name,
    login_subtitle: subtitle,
  };

  return (
    <SplitEditor
      editor={
        <div className="space-y-6">
          <div>
            <h2 className="mb-4 text-lg font-semibold text-dash-text">Login Page Editor</h2>
            <p className="mb-4 text-sm text-dash-muted">
              Customize the login page that guests see when they visit your invitation website.
            </p>
          </div>

          <FormField label="Login Title">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={event.name}
            />
            <p className="text-xs text-dash-muted">Leave empty to use the event name</p>
          </FormField>

          <FormField label="Subtitle">
            <Textarea
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Enter your username to access your invitation"
              rows={2}
            />
          </FormField>

          <div className="border-t border-dash-border pt-4">
            <Toggle
              checked={showGuestLogin}
              onChange={setShowGuestLogin}
              label="Show guest login form"
            />
          </div>

          {showGuestLogin && (
            <FormField label="Guest Login Button Label">
              <Input
                value={guestLoginLabel}
                onChange={(e) => setGuestLoginLabel(e.target.value)}
                placeholder="View My Invitation"
              />
            </FormField>
          )}

          <div className="flex items-center gap-3 border-t border-dash-border pt-4">
            <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
              Save Changes
            </Button>
            {savedMsg && <span className="text-sm text-green-600">Saved!</span>}
            {saveMutation.isError && (
              <span className="text-sm text-dash-danger">
                {saveMutation.error instanceof Error ? saveMutation.error.message : "Save failed"}
              </span>
            )}
          </div>
        </div>
      }
      preview={
        <div className="p-4">
          <LoginPreview event={previewEvent} />
        </div>
      }
    />
  );
}
