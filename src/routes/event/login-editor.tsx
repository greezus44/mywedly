import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type Json } from "../../lib/supabase";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { LoginPreview } from "../../components/preview/PreviewRenderers";
import { Input, Select } from "../../components/ui/Input";
import { Toggle } from "../../components/ui";
import { Button } from "../../components/ui/Button";

interface LoginConfig {
  heading?: string;
  subtitle?: string;
  placeholder?: string;
  buttonText?: string;
  requireName?: boolean;
  requireCode?: boolean;
  passwordMode?: "name" | "code" | "name+code" | "open";
}

const defaultConfig: LoginConfig = {
  heading: "Enter your invite code",
  subtitle: "Please enter the code from your invitation",
  placeholder: "Enter code",
  buttonText: "Continue",
  requireName: true,
  requireCode: true,
  passwordMode: "name+code",
};

export default function LoginEditor() {
  const { event, eventId } = useOutletContext<{ event: UserEvent; eventId: string }>();
  const queryClient = useQueryClient();

  const config = (event.draft_login_config ?? event.login_config ?? defaultConfig) as LoginConfig;

  const [heading, setHeading] = useState(config.heading ?? defaultConfig.heading!);
  const [subtitle, setSubtitle] = useState(config.subtitle ?? defaultConfig.subtitle!);
  const [placeholder, setPlaceholder] = useState(config.placeholder ?? defaultConfig.placeholder!);
  const [buttonText, setButtonText] = useState(config.buttonText ?? defaultConfig.buttonText!);
  const [passwordMode, setPasswordMode] = useState<LoginConfig["passwordMode"]>(
    config.passwordMode ?? "name+code"
  );
  const [saved, setSaved] = useState(false);

  const requireName = passwordMode === "name" || passwordMode === "name+code";
  const requireCode = passwordMode === "code" || passwordMode === "name+code";

  const saveMutation = useMutation({
    mutationFn: async () => {
      const newConfig: LoginConfig = {
        heading,
        subtitle,
        placeholder,
        buttonText,
        requireName,
        requireCode,
        passwordMode,
      };
      const { error } = await supabase
        .from("user_events")
        .update({ draft_login_config: newConfig as unknown as Json })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const previewEvent: Partial<UserEvent> = {
    ...event,
    login_config: {
      heading,
      subtitle,
      placeholder,
      buttonText,
      requireName,
      requireCode,
    },
  };

  return (
    <div className="mx-auto max-w-7xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-dash-text">Login Editor</h2>
        <div className="flex items-center gap-2">
          {saved && <span className="text-sm text-green-600">Saved!</span>}
          <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
            Save Changes
          </Button>
        </div>
      </div>

      <div className="h-[calc(100vh-200px)]">
        <SplitEditor
          editor={
            <div className="space-y-4">
              <Input
                label="Heading"
                value={heading}
                onChange={(e) => setHeading(e.target.value)}
              />
              <Input
                label="Subtitle"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
              />
              <Select
                label="Login Mode"
                value={passwordMode}
                onChange={(e) => setPasswordMode(e.target.value as LoginConfig["passwordMode"])}
              >
                <option value="open">Open (no login required)</option>
                <option value="name">Name only</option>
                <option value="code">Code only</option>
                <option value="name+code">Name + Code</option>
              </Select>
              {requireCode && (
                <Input
                  label="Code Placeholder"
                  value={placeholder}
                  onChange={(e) => setPlaceholder(e.target.value)}
                />
              )}
              <Input
                label="Button Text"
                value={buttonText}
                onChange={(e) => setButtonText(e.target.value)}
              />
              {saveMutation.isError && (
                <p className="text-sm text-red-600">
                  {saveMutation.error instanceof Error ? saveMutation.error.message : "Save failed."}
                </p>
              )}
            </div>
          }
          preview={<LoginPreview event={previewEvent} />}
        />
      </div>
    </div>
  );
}
