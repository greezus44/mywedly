import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Json } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { LoginPreview } from "../../components/preview/PreviewRenderers";
import { Button } from "../../components/ui/Button";
import { Input, Card } from "../../components/ui";

interface LoginConfig {
  heading?: string;
  subheading?: string;
  placeholder?: string;
  ctaText?: string;
}

export function LoginEditor() {
  const { event, eventId } = useEventContext();
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<LoginConfig>({});

  useEffect(() => {
    setConfig(
      (event.draft_login_config ?? event.login_config ?? {}) as LoginConfig
    );
  }, [event]);

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
    },
  });

  const editor = (
    <div className="p-4 space-y-4">
      <h3 className="text-sm font-semibold text-dash-text">Login Page Settings</h3>
      <Input
        label="Heading"
        type="text"
        value={config.heading ?? ""}
        onChange={(e) => setConfig({ ...config, heading: e.target.value })}
        placeholder="Welcome"
      />
      <Input
        label="Subheading"
        type="text"
        value={config.subheading ?? ""}
        onChange={(e) => setConfig({ ...config, subheading: e.target.value })}
        placeholder="Enter your username to view the invitation"
      />
      <Input
        label="Input placeholder"
        type="text"
        value={config.placeholder ?? ""}
        onChange={(e) => setConfig({ ...config, placeholder: e.target.value })}
        placeholder="Your username"
      />
      <Input
        label="Button text"
        type="text"
        value={config.ctaText ?? ""}
        onChange={(e) => setConfig({ ...config, ctaText: e.target.value })}
        placeholder="View Invitation"
      />

      <div className="flex items-center justify-between pt-2 border-t border-dash-border">
        {saveMutation.isError && (
          <p className="text-sm text-dash-danger">
            {saveMutation.error instanceof Error ? saveMutation.error.message : "Save failed"}
          </p>
        )}
        {saveMutation.isSuccess && (
          <p className="text-sm text-green-600">Saved!</p>
        )}
        <Button
          onClick={() => saveMutation.mutate()}
          loading={saveMutation.isPending}
          className="ml-auto"
        >
          Save changes
        </Button>
      </div>
    </div>
  );

  const preview = (
    <div className="p-4">
      <Card className="overflow-hidden">
        <LoginPreview config={config as unknown as Json} />
      </Card>
    </div>
  );

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-dash-text">Login Editor</h2>
        <p className="text-sm text-dash-muted">
          Customize the login page guests see before viewing your invitation
        </p>
      </div>
      <div className="h-[calc(100vh-220px)] min-h-[500px]">
        <SplitEditor editor={editor} preview={preview} />
      </div>
    </div>
  );
}
