import React from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type LoginConfig } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, FormField, Card, Toggle } from "../../components/ui";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { LoginPreview } from "../../components/preview/PreviewRenderers";

export default function LoginEditor() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();
  const cfg = event.draft_login_config || event.login_config || {};

  const saveMutation = useMutation({
    mutationFn: async (newCfg: LoginConfig) => {
      const { error } = await supabase.from("user_events").update({ draft_login_config: newCfg }).eq("id", event.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["event", event.id] }),
    onError: (err: any) => alert("Failed to save: " + (err.message || "Unknown error")),
  });

  const [local, setLocal] = React.useState<LoginConfig>(cfg);
  React.useEffect(() => setLocal(cfg), [JSON.stringify(cfg)]);
  const update = (patch: Partial<LoginConfig>) => setLocal((prev) => ({ ...prev, ...patch }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-dash-text">Login Page</h2>
        <Button onClick={() => saveMutation.mutate(local)} loading={saveMutation.isPending}>Save Changes</Button>
      </div>
      <SplitEditor preview={<LoginPreview event={{ ...event, draft_login_config: local } as UserEvent} />}>
        <Card className="p-4 space-y-4">
          <FormField label="Heading">
            <Input value={local.heading || ""} onChange={(e) => update({ heading: e.target.value })} />
          </FormField>
          <FormField label="Subheading">
            <Textarea value={local.subheading || ""} onChange={(e) => update({ subheading: e.target.value })} rows={2} />
          </FormField>
          <FormField label="Background Image">
            <ImageUpload value={local.background_image || null} onChange={(url) => update({ background_image: url })} eventId={event.id} />
          </FormField>
          <FormField label="Logo Image">
            <ImageUpload value={local.logo_image || null} onChange={(url) => update({ logo_image: url })} eventId={event.id} aspectRatio="1/1" />
          </FormField>
          <div className="flex items-center gap-3">
            <Toggle checked={local.require_password || false} onChange={(v) => update({ require_password: v })} label="Require Password" />
          </div>
          {local.require_password && (
            <FormField label="Password">
              <Input type="password" value={local.password || ""} onChange={(e) => update({ password: e.target.value })} />
            </FormField>
          )}
        </Card>
      </SplitEditor>
    </div>
  );
}
