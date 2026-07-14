import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type Json } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { LoginPreview } from "../../components/preview/PreviewRenderers";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, FormField } from "../../components/ui";

interface LoginConfig {
  heading?: string;
  subheading?: string;
  placeholder?: string;
  buttonText?: string;
  helpText?: string;
}

export function LoginEditor() {
  const { event, eventId } = useEventContext();
  const queryClient = useQueryClient();

  const [loginConfig, setLoginConfig] = useState<LoginConfig>(
    (event.draft_login_config as LoginConfig) ?? {}
  );

  useEffect(() => {
    setLoginConfig((event.draft_login_config as LoginConfig) ?? {});
  }, [event]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_events")
        .update({
          draft_login_config: loginConfig as unknown as Json,
        })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-dash-text">Login Editor</h2>
        <Button
          onClick={() => saveMutation.mutate()}
          loading={saveMutation.isPending}
        >
          Save Changes
        </Button>
      </div>

      {saveMutation.isError && (
        <p className="text-sm text-red-600">
          {saveMutation.error instanceof Error
            ? saveMutation.error.message
            : "Failed to save"}
        </p>
      )}
      {saveMutation.isSuccess && (
        <p className="text-sm text-green-600">Saved successfully!</p>
      )}

      <SplitEditor
        editorRatio={0.5}
        editor={
          <div className="space-y-4">
            <Input
              label="Heading"
              value={loginConfig.heading ?? ""}
              onChange={(e) =>
                setLoginConfig({ ...loginConfig, heading: e.target.value })
              }
              placeholder="Welcome"
            />
            <Textarea
              label="Subheading"
              value={loginConfig.subheading ?? ""}
              onChange={(e) =>
                setLoginConfig({ ...loginConfig, subheading: e.target.value })
              }
              placeholder="Please sign in to view the event"
              rows={3}
            />
            <Input
              label="Placeholder Text"
              value={loginConfig.placeholder ?? ""}
              onChange={(e) =>
                setLoginConfig({ ...loginConfig, placeholder: e.target.value })
              }
              placeholder="Enter your username"
            />
            <Input
              label="Button Text"
              value={loginConfig.buttonText ?? ""}
              onChange={(e) =>
                setLoginConfig({ ...loginConfig, buttonText: e.target.value })
              }
              placeholder="Sign In"
            />
            <Textarea
              label="Help Text"
              value={loginConfig.helpText ?? ""}
              onChange={(e) =>
                setLoginConfig({ ...loginConfig, helpText: e.target.value })
              }
              placeholder="Enter the username from your invitation."
              rows={2}
            />
          </div>
        }
        preview={
          <LoginPreview
            loginConfig={loginConfig as unknown as Json}
            eventName={event.draft_name || event.name}
          />
        }
      />
    </div>
  );
}
