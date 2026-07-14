import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import type { UserEvent, Json } from "../../lib/supabase";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { LoginPreview } from "../../components/preview/PreviewRenderers";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import { FormField } from "../../components/ui";

interface LoginConfig {
  message: string;
  placeholder: string;
  buttonText: string;
}

function parseLoginConfig(json: Json | null | undefined): LoginConfig {
  if (!json || typeof json !== "object") return { message: "", placeholder: "", buttonText: "" };
  const obj = json as Record<string, unknown>;
  return {
    message: (obj.message as string) ?? "",
    placeholder: (obj.placeholder as string) ?? "",
    buttonText: (obj.buttonText as string) ?? "",
  };
}

export function LoginEditor() {
  const { event, eventId } = useOutletContext<{ event: UserEvent; eventId: string }>();
  const queryClient = useQueryClient();

  const [config, setConfig] = useState<LoginConfig>(parseLoginConfig(event.draft_login_config));

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
      queryClient.invalidateQueries({ queryKey: ["user-event", eventId] });
    },
  });

  const editor = (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold text-dash-text">Login Page</h2>
      <p className="text-sm text-dash-muted">
        Configure the message guests see before entering your website.
      </p>

      <FormField label="Login Message" >
        <Textarea
          value={config.message}
          onChange={(e) => setConfig((prev) => ({ ...prev, message: e.target.value }))}
          placeholder="Please enter your email to view your invitation"
          rows={3}
        />
      </FormField>

      <FormField label="Email Placeholder">
        <Input
          value={config.placeholder}
          onChange={(e) => setConfig((prev) => ({ ...prev, placeholder: e.target.value }))}
          placeholder="your@email.com"
        />
      </FormField>

      <FormField label="Button Text">
        <Input
          value={config.buttonText}
          onChange={(e) => setConfig((prev) => ({ ...prev, buttonText: e.target.value }))}
          placeholder="View Invitation"
        />
      </FormField>

      <div className="flex items-center gap-3 pt-2">
        <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
          Save Changes
        </Button>
        {saveMutation.isError && (
          <span className="text-sm text-dash-danger">
            {saveMutation.error instanceof Error ? saveMutation.error.message : "Save failed"}
          </span>
        )}
        {saveMutation.isSuccess && (
          <span className="text-sm text-green-600">Saved!</span>
        )}
      </div>
    </div>
  );

  const preview = (
    <div className="p-4">
      <LoginPreview
        eventName={event.draft_name || event.name}
        loginMessage={config.message || "Please enter your email to view your invitation"}
      />
    </div>
  );

  return (
    <div className="h-[calc(100vh-140px)]">
      <SplitEditor editor={editor} preview={preview} editorRatio={0.4} />
    </div>
  );
}
