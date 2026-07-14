import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Json } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { LoginPreview } from "../../components/preview/PreviewRenderers";
import { Button } from "../../components/ui/Button";
import { Card, Input, Textarea } from "../../components/ui";

interface LoginConfig {
  heading?: string;
  body?: string;
  ctaText?: string;
}

export function LoginEditor() {
  const { event, eventId } = useEventContext();
  const queryClient = useQueryClient();

  const [loginConfig, setLoginConfig] = useState<LoginConfig>(
    (event.draft_login_config ?? {}) as LoginConfig,
  );

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_events")
        .update({
          draft_login_config: loginConfig as unknown as Json,
          updated_at: new Date().toISOString(),
        })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    },
  });

  const editor = (
    <div className="space-y-6">
      <Card>
        <h3 className="text-sm font-medium text-dash-text mb-4">Login Page Settings</h3>
        <div className="space-y-4">
          <Input
            label="Heading"
            value={loginConfig.heading ?? ""}
            onChange={(e) =>
              setLoginConfig((prev) => ({ ...prev, heading: e.target.value }))
            }
            placeholder="Enter Your Username"
          />
          <Textarea
            label="Body Text"
            value={loginConfig.body ?? ""}
            onChange={(e) =>
              setLoginConfig((prev) => ({ ...prev, body: e.target.value }))
            }
            placeholder="Enter the username from your invitation to access the event details."
          />
          <Input
            label="Button Text"
            value={loginConfig.ctaText ?? ""}
            onChange={(e) =>
              setLoginConfig((prev) => ({ ...prev, ctaText: e.target.value }))
            }
            placeholder="Sign In"
          />
        </div>
      </Card>

      <div className="space-y-2">
        {saveMutation.isError && (
          <p className="text-sm text-dash-danger">
            Error: {(saveMutation.error as Error)?.message}
          </p>
        )}
        {saveMutation.isSuccess && (
          <p className="text-sm text-green-600">Changes saved successfully!</p>
        )}
        <Button
          onClick={() => saveMutation.mutate()}
          loading={saveMutation.isPending}
          className="w-full"
        >
          Save Changes
        </Button>
      </div>
    </div>
  );

  const preview = <LoginPreview event={event} />;

  return (
    <div className="h-[calc(100vh-8rem)]">
      <SplitEditor editor={editor} preview={preview} previewClassName="overflow-hidden" />
    </div>
  );
}
