import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { LoginPreview } from "../../components/preview/PreviewRenderers";
import { Input, Textarea, Toggle } from "../../components/ui";
import { Button } from "../../components/ui/Button";

type LoginConfig = {
  heading?: string;
  body?: string;
  buttonLabel?: string;
  fields?: ("name" | "code")[];
  requirePassword?: boolean;
};

function parseConfig(json: unknown): LoginConfig {
  if (!json || typeof json !== "object") return {};
  return (json as Record<string, unknown>) as LoginConfig;
}

export default function LoginEditor() {
  const { event, eventId } = useEventContext();
  const queryClient = useQueryClient();

  const existing = parseConfig(event.draft_login_config ?? event.login_config);
  const [heading, setHeading] = useState(existing.heading ?? "Welcome");
  const [body, setBody] = useState(existing.body ?? "Please enter your name to continue.");
  const [buttonLabel, setButtonLabel] = useState(existing.buttonLabel ?? "Enter");
  const [requireName, setRequireName] = useState(
    existing.fields?.includes("name") ?? true
  );
  const [requireCode, setRequireCode] = useState(
    existing.fields?.includes("code") ?? false
  );
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const fields: ("name" | "code")[] = [];
      if (requireName) fields.push("name");
      if (requireCode) fields.push("code");
      const config: LoginConfig = { heading, body, buttonLabel, fields };
      const { error } = await supabase
        .from("user_events")
        .update({
          draft_login_config: config,
          updated_at: new Date().toISOString(),
        })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setSavedMsg("Saved successfully!");
      setTimeout(() => setSavedMsg(null), 3000);
    },
  });

  const previewEvent = {
    ...event,
    login_config: {
      heading,
      body,
      buttonLabel,
      fields: [
        ...(requireName ? ["name"] : []),
        ...(requireCode ? ["code"] : []),
      ] as ("name" | "code")[],
    },
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-dash-text">Login Editor</h1>
          <p className="text-sm text-dash-muted">Customize how guests log in to your website.</p>
        </div>
        <div className="flex items-center gap-3">
          {savedMsg && <span className="text-sm text-green-600">{savedMsg}</span>}
          <Button
            loading={saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
          >
            Save Changes
          </Button>
        </div>
      </div>

      {saveMutation.isError && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-dash-danger">
          {saveMutation.error?.message}
        </p>
      )}

      <SplitEditor
        editor={
          <div className="flex flex-col gap-4">
            <Input
              label="Heading"
              value={heading}
              onChange={(e) => setHeading(e.target.value)}
              placeholder="Welcome"
            />
            <Textarea
              label="Body Text"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Please enter your name to continue."
            />
            <Input
              label="Button Label"
              value={buttonLabel}
              onChange={(e) => setButtonLabel(e.target.value)}
              placeholder="Enter"
            />

            <div className="flex flex-col gap-3 rounded-md border border-dash-border bg-dash-bg p-4">
              <h3 className="text-sm font-semibold text-dash-text">Login Fields</h3>
              <Toggle
                checked={requireName}
                onChange={setRequireName}
                label="Require guest name"
              />
              <Toggle
                checked={requireCode}
                onChange={setRequireCode}
                label="Require access code"
              />
            </div>
          </div>
        }
        preview={<LoginPreview event={previewEvent} />}
      />
    </div>
  );
}
