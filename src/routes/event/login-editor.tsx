import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Json } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { LoginPreview } from "../../components/preview/PreviewRenderers";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

interface LoginField {
  text: string;
  align?: string;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
}

interface LoginConfig {
  heading?: LoginField;
  subheading?: LoginField;
  inputLabel?: LoginField;
  buttonText?: LoginField;
}

function toField(value: unknown): LoginField {
  if (typeof value === "string") return { text: value };
  if (value && typeof value === "object") return value as LoginField;
  return { text: "" };
}

export function LoginEditor() {
  const { event, eventId } = useEventContext();
  const queryClient = useQueryClient();

  const initial = (event.draft_login_config ?? event.login_config) as LoginConfig | null;

  const [config, setConfig] = useState<LoginConfig>({
    heading: initial?.heading,
    subheading: initial?.subheading,
    inputLabel: initial?.inputLabel,
    buttonText: initial?.buttonText,
  });

  useEffect(() => {
    setConfig({
      heading: initial?.heading,
      subheading: initial?.subheading,
      inputLabel: initial?.inputLabel,
      buttonText: initial?.buttonText,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.updated_at]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_events")
        .update({
          draft_login_config: config as unknown as Json,
          updated_at: new Date().toISOString(),
        })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    },
  });

  const updateField = (key: keyof LoginConfig, patch: Partial<LoginField>) => {
    setConfig((prev) => ({
      ...prev,
      [key]: { ...toField(prev[key]), ...patch },
    }));
  };

  const renderField = (key: keyof LoginConfig, label: string, placeholder: string) => {
    const field = toField(config[key]);
    return (
      <Input
        key={key}
        label={label}
        type="text"
        value={field.text}
        onChange={(e) => updateField(key, { text: e.target.value })}
        placeholder={placeholder}
      />
    );
  };

  return (
    <SplitEditor
      editor={
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-dash-text">Login Page Editor</h2>
          <p className="text-sm text-dash-muted">
            Customize the text shown on the guest login page.
          </p>

          {renderField("heading", "Heading", "Welcome")}
          {renderField("subheading", "Subheading", "Please sign in to view the event")}
          {renderField("inputLabel", "Input Label", "Enter your username")}
          {renderField("buttonText", "Button Text", "Sign In")}

          <Button
            onClick={() => saveMutation.mutate()}
            loading={saveMutation.isPending}
            className="w-full"
          >
            Save Changes
          </Button>
          {saveMutation.isError && (
            <p className="text-sm text-dash-danger">
              {saveMutation.error instanceof Error ? saveMutation.error.message : "Save failed"}
            </p>
          )}
          {saveMutation.isSuccess && (
            <p className="text-sm text-green-600">Saved successfully!</p>
          )}
        </div>
      }
      preview={
        <div className="event-themed min-h-[500px]">
          <LoginPreview
            loginConfig={config as unknown as Json}
            eventName={event.draft_name || event.name}
          />
        </div>
      }
    />
  );
}
