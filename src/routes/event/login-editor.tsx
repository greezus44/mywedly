import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Json } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { LoginPreview, type LoginConfig } from "../../components/preview/PreviewRenderers";
import { TypographyControls } from "../../components/ui/TypographyControls";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import type { TypographyStyle } from "../../lib/typography";

export function LoginEditor() {
  const { event, eventId } = useEventContext();
  const queryClient = useQueryClient();

  const initial = (event.draft_login_config ?? {}) as LoginConfig;

  const [heading, setHeading] = useState<TypographyStyle>(
    (initial.heading ?? {}) as TypographyStyle
  );
  const [placeholder, setPlaceholder] = useState(initial.placeholder ?? "Your username");
  const [buttonText, setButtonText] = useState(initial.buttonText ?? "Enter");
  const [helperText, setHelperText] = useState(initial.helperText ?? "");

  const loginConfig: LoginConfig = {
    heading,
    placeholder,
    buttonText,
    helperText,
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("events")
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

  const editor = (
    <div className="space-y-6 p-4">
      <TypographyControls
        label="Login Heading"
        value={heading}
        onChange={setHeading}
        showText
      />

      <div className="space-y-4 rounded-lg border border-dash-border bg-dash-surface p-4">
        <h3 className="text-sm font-semibold text-dash-text">Login Form</h3>
        <Input
          label="Input placeholder"
          type="text"
          value={placeholder}
          onChange={(e) => setPlaceholder(e.target.value)}
          placeholder="Your username"
        />
        <Input
          label="Button text"
          type="text"
          value={buttonText}
          onChange={(e) => setButtonText(e.target.value)}
          placeholder="Enter"
        />
        <Input
          label="Helper text (optional)"
          type="text"
          value={helperText}
          onChange={(e) => setHelperText(e.target.value)}
          placeholder="Enter your username to access the website"
        />
      </div>

      <Button
        onClick={() => saveMutation.mutate()}
        loading={saveMutation.isPending}
        disabled={saveMutation.isPending}
        className="w-full"
      >
        Save Changes
      </Button>
      {saveMutation.isSuccess && (
        <p className="text-sm text-green-600">Saved successfully!</p>
      )}
      {saveMutation.isError && (
        <p className="text-sm text-dash-danger">
          {saveMutation.error instanceof Error ? saveMutation.error.message : "Save failed."}
        </p>
      )}
    </div>
  );

  const preview = (
    <div className="bg-dash-bg p-4">
      <div className="overflow-hidden rounded-lg border border-dash-border shadow-sm">
        <LoginPreview
          event={event}
          loginConfig={loginConfig as unknown as Json}
          theme={event.draft_theme}
        />
      </div>
    </div>
  );

  return (
    <div className="h-[calc(100vh-10rem)]">
      <SplitEditor editor={editor} preview={preview} />
    </div>
  );
}
