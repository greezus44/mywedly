import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Json } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { LoginPreview } from "../../components/preview/PreviewRenderers";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, FormField } from "../../components/ui";

interface LoginConfig {
  heading: string;
  subtitle: string;
  usernamePlaceholder: string;
  buttonText: string;
}

function parseLoginConfig(raw: Json | null | undefined): LoginConfig {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {
      heading: "Welcome",
      subtitle: "Please sign in to view the invitation",
      usernamePlaceholder: "Enter your username",
      buttonText: "Enter",
    };
  }
  const obj = raw as Record<string, unknown>;
  return {
    heading: typeof obj.heading === "string" ? obj.heading : "Welcome",
    subtitle: typeof obj.subtitle === "string" ? obj.subtitle : "Please sign in to view the invitation",
    usernamePlaceholder: typeof obj.usernamePlaceholder === "string" ? obj.usernamePlaceholder : "Enter your username",
    buttonText: typeof obj.buttonText === "string" ? obj.buttonText : "Enter",
  };
}

export const LoginEditor: React.FC = () => {
  const { event, eventId } = useEventContext();
  const queryClient = useQueryClient();

  const [config, setConfig] = useState<LoginConfig>(() => parseLoginConfig(event.draft_login_config));
  const [saved, setSaved] = useState(false);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_events")
        .update({
          draft_login_config: config as unknown as Json,
        })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const handleSave = () => {
    saveMutation.mutate();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dash-text">Login Editor</h2>
          <p className="text-sm text-dash-muted">Customize the guest login page.</p>
        </div>
        <Button onClick={handleSave} loading={saveMutation.isPending} disabled={saveMutation.isPending}>
          {saved ? "Saved!" : "Save Changes"}
        </Button>
      </div>

      {saveMutation.isError && (
        <p className="text-sm text-dash-danger">
          Error: {saveMutation.error instanceof Error ? saveMutation.error.message : "Save failed"}
        </p>
      )}

      <SplitEditor
        editor={
          <div className="space-y-4">
            <FormField label="Heading">
              <Input
                value={config.heading}
                onChange={(e) => setConfig((prev) => ({ ...prev, heading: e.target.value }))}
                placeholder="Welcome"
              />
            </FormField>
            <FormField label="Subtitle">
              <Textarea
                value={config.subtitle}
                onChange={(e) => setConfig((prev) => ({ ...prev, subtitle: e.target.value }))}
                placeholder="Please sign in to view the invitation"
              />
            </FormField>
            <FormField label="Username placeholder">
              <Input
                value={config.usernamePlaceholder}
                onChange={(e) => setConfig((prev) => ({ ...prev, usernamePlaceholder: e.target.value }))}
                placeholder="Enter your username"
              />
            </FormField>
            <FormField label="Button text">
              <Input
                value={config.buttonText}
                onChange={(e) => setConfig((prev) => ({ ...prev, buttonText: e.target.value }))}
                placeholder="Enter"
              />
            </FormField>
          </div>
        }
        preview={
          <div className="p-4">
            <LoginPreview
              loginConfig={config}
              eventName={event.draft_name}
              coverImage={event.draft_cover_image}
            />
          </div>
        }
        editorRatio={0.45}
      />
    </div>
  );
};
