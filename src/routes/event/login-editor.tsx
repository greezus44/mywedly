import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { supabase, type UserEvent, type LoginConfig } from "../../lib/supabase";
import { Input } from "../../components/ui/Input";
import { FormField, useToast } from "../../components/ui";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { LoginPreview } from "../../components/preview/PreviewRenderers";

export default function LoginEditorPage() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [cfg, setCfg] = useState<LoginConfig>(event.draft_login_config ?? event.login_config ?? {});

  useEffect(() => {
    setCfg(event.draft_login_config ?? event.login_config ?? {});
  }, [event]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_events")
        .update({ draft_login_config: cfg })
        .eq("id", event.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", event.id] });
      toast("Login page saved", "success");
    },
    onError: (err: Error) => toast(err.message, "error"),
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      saveMutation.mutate();
    }, 1500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg]);

  const previewEvent = {
    ...event,
    draft_login_config: cfg,
  } as UserEvent;

  return (
    <SplitEditor preview={<LoginPreview event={previewEvent} />}>
      <h3 className="text-sm font-semibold text-gray-900">Login page</h3>
      <FormField label="Heading">
        <Input
          value={cfg.heading || ""}
          onChange={(e) => setCfg((c) => ({ ...c, heading: e.target.value }))}
          placeholder="Welcome"
        />
      </FormField>
      <FormField label="Subheading">
        <Input
          value={cfg.subheading || ""}
          onChange={(e) => setCfg((c) => ({ ...c, subheading: e.target.value }))}
          placeholder="Please enter your name to continue"
        />
      </FormField>
      <FormField label="Input placeholder">
        <Input
          value={cfg.inputPlaceholder || ""}
          onChange={(e) => setCfg((c) => ({ ...c, inputPlaceholder: e.target.value }))}
          placeholder="Your full name"
        />
      </FormField>
      <FormField label="Button text">
        <Input
          value={cfg.buttonText || ""}
          onChange={(e) => setCfg((c) => ({ ...c, buttonText: e.target.value }))}
          placeholder="Continue"
        />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Background color">
          <Input
            type="color"
            value={cfg.bgColor || "#fafafa"}
            onChange={(e) => setCfg((c) => ({ ...c, bgColor: e.target.value }))}
            className="h-10"
          />
        </FormField>
        <FormField label="Text color">
          <Input
            type="color"
            value={cfg.textColor || "#1a1a1a"}
            onChange={(e) => setCfg((c) => ({ ...c, textColor: e.target.value }))}
            className="h-10"
          />
        </FormField>
      </div>
      <FormField label="Button color">
        <Input
          type="color"
          value={cfg.buttonColor || "#1a1a1a"}
          onChange={(e) => setCfg((c) => ({ ...c, buttonColor: e.target.value }))}
          className="h-10"
        />
      </FormField>
      <FormField label="Background image">
        <ImageUpload
          value={cfg.bgImage || ""}
          onChange={(url) => setCfg((c) => ({ ...c, bgImage: url }))}
          eventId={event.id}
          aspectRatio="16 / 9"
        />
      </FormField>
      <FormField label="Logo">
        <ImageUpload
          value={cfg.logo || ""}
          onChange={(url) => setCfg((c) => ({ ...c, logo: url }))}
          eventId={event.id}
          aspectRatio="4 / 1"
        />
      </FormField>

      {saveMutation.isPending && (
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Loader2 className="h-3 w-3 animate-spin" />
          Saving...
        </div>
      )}
    </SplitEditor>
  );
}
