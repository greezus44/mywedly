import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type Json } from "../../lib/supabase";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { LoginPreview } from "../../components/preview/PreviewRenderers";
import type { LoginConfig } from "../../components/preview/PreviewRenderers";
import { TypographyControls } from "../../components/ui/TypographyControls";
import { Button, Input } from "../../components/ui";
import type { TypographyStyle } from "../../lib/typography";

function toLoginConfig(raw: Json): LoginConfig {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return raw as LoginConfig;
}

export function LoginEditor() {
  const { event, eventId } = useOutletContext<{ event: UserEvent; eventId: string }>();
  const queryClient = useQueryClient();

  const [config, setConfig] = useState<LoginConfig>(() =>
    toLoginConfig(event.draft_login_config ?? event.login_config),
  );
  const [saved, setSaved] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_events")
        .update({ draft_login_config: config as Json })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const editor = (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-dash-text">Sign-In Page</h2>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-dash-text uppercase tracking-wide">Heading</h3>
        <TypographyControls
          value={(config.heading as TypographyStyle) ?? {}}
          onChange={(v) => setConfig((c) => ({ ...c, heading: v }))}
          showText
        />
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-dash-text uppercase tracking-wide">Subheading</h3>
        <TypographyControls
          value={(config.subheading as TypographyStyle) ?? {}}
          onChange={(v) => setConfig((c) => ({ ...c, subheading: v }))}
          showText
        />
      </section>

      <Input
        label="Input Placeholder"
        value={config.placeholder ?? ""}
        onChange={(e) => setConfig((c) => ({ ...c, placeholder: e.target.value }))}
        placeholder="Enter your username"
      />

      <Input
        label="Button Label"
        value={config.buttonLabel ?? ""}
        onChange={(e) => setConfig((c) => ({ ...c, buttonLabel: e.target.value }))}
        placeholder="Sign In"
      />

      <Button
        onClick={() => mutation.mutate()}
        loading={mutation.isPending}
        className="w-full"
      >
        {saved ? "Saved!" : "Save changes"}
      </Button>
    </div>
  );

  const preview = (
    <div className="w-full max-w-sm rounded-xl overflow-hidden border border-dash-border shadow-lg" style={{ minHeight: 400, backgroundColor: "var(--event-bg)" }}>
      <LoginPreview config={config} />
    </div>
  );

  return <SplitEditor editor={editor} preview={preview} />;
}
