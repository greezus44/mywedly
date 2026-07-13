import React from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type LoginConfig } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Toggle, FormField } from "../../components/ui";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { LoginPreview } from "../../components/preview/PreviewRenderers";

export default function LoginEditor() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();
  const cfg = event.draft_login_config || event.login_config || {};
  const [heading, setHeading] = React.useState(cfg.heading || "Sign In");
  const [subheading, setSubheading] = React.useState(cfg.subheading || "Enter your name to access the invitation");
  const [bgImage, setBgImage] = React.useState<string | null>(cfg.background_image || null);
  const [logoImage, setLogoImage] = React.useState<string | null>(cfg.logo_image || null);
  const [requirePassword, setRequirePassword] = React.useState(cfg.require_password || false);
  const [password, setPassword] = React.useState(cfg.password || "");

  const saveMutation = useMutation({
    mutationFn: async () => {
      const loginConfig: LoginConfig = { heading, subheading, background_image: bgImage, logo_image: logoImage, require_password: requirePassword, password: requirePassword ? password : "" };
      const { error } = await supabase.from("user_events").update({ draft_login_config: loginConfig }).eq("id", event.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["event", event.id] }),
    onError: (err: any) => alert("Failed to save: " + (err.message || "Unknown error")),
  });

  const previewEvent = { ...event, draft_login_config: { heading, subheading, background_image: bgImage, logo_image: logoImage, require_password: requirePassword, password } };

  return (
    <div>
      <h2 className="text-xl font-semibold text-dash-text mb-6">Login Page</h2>
      <SplitEditor preview={<LoginPreview event={previewEvent} />}>
        <div className="space-y-4">
          <FormField label="Heading"><Input value={heading} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHeading(e.target.value)} /></FormField>
          <FormField label="Subheading"><Textarea value={subheading} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSubheading(e.target.value)} rows={2} /></FormField>
          <FormField label="Background Image"><ImageUpload value={bgImage} onChange={setBgImage} eventId={event.id} /></FormField>
          <FormField label="Logo Image"><ImageUpload value={logoImage} onChange={setLogoImage} eventId={event.id} aspectRatio="1/1" /></FormField>
          <Toggle checked={requirePassword} onChange={setRequirePassword} label="Require Password" />
          {requirePassword && <FormField label="Password"><Input type="text" value={password} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)} placeholder="Access password" /></FormField>}
          <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>Save Changes</Button>
        </div>
      </SplitEditor>
    </div>
  );
}
