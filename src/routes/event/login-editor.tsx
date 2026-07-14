import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Json } from "../../lib/supabase";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { LoginPreview, type LoginConfig } from "../../components/preview/PreviewRenderers";
import { TypographyControls } from "../../components/ui/TypographyControls";
import { Button } from "../../components/ui/Button";
import { Card, Input, LoadingSpinner } from "../../components/ui";
import type { TypographyStyle } from "../../lib/typography";
import type { EventContextValue } from "./event-layout";

const DEFAULT_LOGIN: LoginConfig = {
  heading: { text: "Welcome", fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, align: "center", color: "#78350f" },
  subheading: { text: "Please sign in to continue", fontFamily: "'EB Garamond', serif", fontSize: 16, fontWeight: 400, align: "center", color: "#92400e" },
  buttonText: "Sign In",
  placeholder: "Enter your username",
};

export function LoginEditor() {
  const { event, eventId } = useOutletContext<EventContextValue>();
  const queryClient = useQueryClient();

  const [loginConfig, setLoginConfig] = useState<LoginConfig>(DEFAULT_LOGIN);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!loaded) {
      const draft = (event.draft_login_config ?? event.login_config) as LoginConfig | null;
      if (draft) setLoginConfig({ ...DEFAULT_LOGIN, ...draft });
      setLoaded(true);
    }
  }, [event, loaded]);

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

  function update<K extends keyof LoginConfig>(key: K, val: LoginConfig[K]) {
    setLoginConfig((prev) => ({ ...prev, [key]: val }));
  }

  if (!loaded) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-dash-text">Login Page Editor</h2>
        <Button
          onClick={() => saveMutation.mutate()}
          loading={saveMutation.isPending}
          disabled={saveMutation.isPending}
        >
          Save Changes
        </Button>
      </div>

      {saveMutation.isError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-dash-danger">
          {saveMutation.error?.message ?? "Failed to save"}
        </div>
      )}
      {saveMutation.isSuccess && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Saved successfully!
        </div>
      )}

      <div className="h-[calc(100vh-280px)] min-h-[500px]">
        <SplitEditor
          editorRatio={0.45}
          editor={
            <div className="space-y-6">
              <Card className="p-4">
                <TypographyControls
                  label="Heading"
                  value={(loginConfig.heading ?? {}) as TypographyStyle}
                  onChange={(v) => update("heading", v)}
                />
              </Card>

              <Card className="p-4">
                <TypographyControls
                  label="Subheading"
                  value={(loginConfig.subheading ?? {}) as TypographyStyle}
                  onChange={(v) => update("subheading", v)}
                />
              </Card>

              <Card className="p-4 space-y-3">
                <h3 className="text-sm font-semibold text-dash-text">Login Form</h3>
                <Input
                  label="Button Text"
                  value={loginConfig.buttonText ?? "Sign In"}
                  onChange={(e) => update("buttonText", e.target.value)}
                />
                <Input
                  label="Placeholder Text"
                  value={loginConfig.placeholder ?? "Enter your username"}
                  onChange={(e) => update("placeholder", e.target.value)}
                />
              </Card>
            </div>
          }
          preview={
            <div className="p-4">
              <LoginPreview
                event={event}
                theme={event.draft_theme ?? event.theme}
                loginConfig={loginConfig}
              />
            </div>
          }
        />
      </div>
    </div>
  );
}

export default LoginEditor;
