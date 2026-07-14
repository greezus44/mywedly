import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase, type UserEvent, type Json } from "../../lib/supabase";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { LoginPreview } from "../../components/preview/PreviewRenderers";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";

interface LoginConfig {
  title: string;
  subtitle: string;
  helperText: string;
  requireName: boolean;
}

const DEFAULT_CONFIG: LoginConfig = {
  title: "Welcome",
  subtitle: "Please sign in with your email to view the invitation",
  helperText: "",
  requireName: false,
};

function parseConfig(json: Json | null | undefined): LoginConfig {
  if (!json || typeof json !== "object" || Array.isArray(json)) return DEFAULT_CONFIG;
  const obj = json as Record<string, unknown>;
  return {
    title: typeof obj.title === "string" ? obj.title : DEFAULT_CONFIG.title,
    subtitle: typeof obj.subtitle === "string" ? obj.subtitle : DEFAULT_CONFIG.subtitle,
    helperText: typeof obj.helperText === "string" ? obj.helperText : DEFAULT_CONFIG.helperText,
    requireName: typeof obj.requireName === "boolean" ? obj.requireName : DEFAULT_CONFIG.requireName,
  };
}

export function LoginEditor() {
  const { event, eventId } = useOutletContext<{ event: UserEvent; eventId: string }>();
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<LoginConfig>(parseConfig(event.draft_login_config));
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    setConfig(parseConfig(event.draft_login_config));
  }, [event.draft_login_config]);

  const saveMutation = useMutation({
    mutationFn: async () => {
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
    name: event.draft_name,
    event_type: event.draft_event_type,
    content: {
      loginTitle: config.title,
      loginSubtitle: config.subtitle,
    } as unknown as Json,
  };

  return (
    <SplitEditor
      editor={
        <div className="p-5 space-y-5">
          <h2 className="text-lg font-semibold text-dash-text">Login Editor</h2>
          <p className="text-sm text-dash-muted">
            Customize what guests see on the login page before they access your invitation.
          </p>

          <Input
            label="Title"
            value={config.title}
            onChange={(e) => setConfig({ ...config, title: e.target.value })}
            placeholder="Welcome"
          />
          <Textarea
            label="Subtitle"
            value={config.subtitle}
            onChange={(e) => setConfig({ ...config, subtitle: e.target.value })}
            placeholder="Please sign in with your email to view the invitation"
          />
          <Textarea
            label="Helper Text"
            value={config.helperText}
            onChange={(e) => setConfig({ ...config, helperText: e.target.value })}
            placeholder="Additional instructions for your guests"
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="requireName"
              checked={config.requireName}
              onChange={(e) => setConfig({ ...config, requireName: e.target.checked })}
              className="rounded border-dash-border"
            />
            <label htmlFor="requireName" className="text-sm text-dash-text">
              Require guest name in addition to email
            </label>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
              Save Changes
            </Button>
            {saveMutation.isError && (
              <span className="text-sm text-dash-danger">
                {saveMutation.error instanceof Error ? saveMutation.error.message : "Save failed"}
              </span>
            )}
            {savedMsg && <span className="text-sm text-green-600">Saved!</span>}
          </div>
        </div>
      }
      preview={<LoginPreview event={previewEvent} />}
    />
  );
}
