import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useOutletContext } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase, type UserEvent, type LoginConfig } from "../../lib/supabase";
import {
  Button,
  FormField,
  Input,
  Textarea,
  ImageUpload,
  ColorInput,
  RangeInput,
  Toast,
} from "../../components/ui";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { LoginPreview } from "../../components/preview/PreviewRenderers";

export default function LoginEditorPage() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const [config, setConfig] = useState<LoginConfig>(
    event.draft_login_config || {
      heading: `Welcome to ${event.draft_name || event.name || "Our Event"}`,
      subheading: "Please enter your name to continue",
      inputPlaceholder: "Your full name",
      buttonText: "Continue",
      bgColor: "#1a1a2e",
      textColor: "#ffffff",
      buttonColor: "#ffffff",
      bgImage: null,
      logo: null,
      logoWidth: 100,
    }
  );

  useEffect(() => {
    setConfig(
      event.draft_login_config || {
        heading: `Welcome to ${event.draft_name || event.name || "Our Event"}`,
        subheading: "Please enter your name to continue",
        inputPlaceholder: "Your full name",
        buttonText: "Continue",
        bgColor: "#1a1a2e",
        textColor: "#ffffff",
        buttonColor: "#ffffff",
        bgImage: null,
        logo: null,
        logoWidth: 100,
      }
    );
  }, [event]);

  const previewEvent: UserEvent = {
    ...event,
    draft_login_config: config,
  };

  const updateConfig = (patch: Partial<LoginConfig>) => {
    setConfig((prev) => ({ ...prev, ...patch }));
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_events")
        .update({ draft_login_config: config })
        .eq("id", event.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", event.id] });
      setToast({ message: "Login page saved", type: "success" });
    },
    onError: (err: Error) => {
      setToast({ message: err.message, type: "error" });
    },
  });

  return (
    <div className="h-full p-4">
      <SplitEditor preview={<LoginPreview event={previewEvent} />}>
        <div className="flex flex-col gap-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
            Login Page Editor
          </h2>

          <FormField label="Heading">
            <Input
              value={config.heading || ""}
              onChange={(e) => updateConfig({ heading: e.target.value })}
              placeholder="Welcome to our event"
            />
          </FormField>

          <FormField label="Subheading">
            <Textarea
              value={config.subheading || ""}
              onChange={(e) => updateConfig({ subheading: e.target.value })}
              placeholder="Please enter your name to continue"
              rows={2}
            />
          </FormField>

          <FormField label="Input Placeholder">
            <Input
              value={config.inputPlaceholder || ""}
              onChange={(e) => updateConfig({ inputPlaceholder: e.target.value })}
              placeholder="Your full name"
            />
          </FormField>

          <FormField label="Button Text">
            <Input
              value={config.buttonText || ""}
              onChange={(e) => updateConfig({ buttonText: e.target.value })}
              placeholder="Continue"
            />
          </FormField>

          <hr className="border-gray-100" />

          <h3 className="text-sm font-semibold text-gray-700">Design</h3>

          <ImageUpload
            value={config.bgImage || null}
            onChange={(url) => updateConfig({ bgImage: url })}
            eventId={event.id}
            label="Background Image"
            aspectRatio="16/9"
          />

          <ImageUpload
            value={config.logo || null}
            onChange={(url) => updateConfig({ logo: url })}
            eventId={event.id}
            label="Logo"
            aspectRatio="auto"
          />

          {config.logo && (
            <RangeInput
              value={config.logoWidth || 100}
              onChange={(v) => updateConfig({ logoWidth: v })}
              min={40}
              max={300}
              step={10}
              label="Logo Width"
            />
          )}

          <div className="grid grid-cols-2 gap-4">
            <ColorInput
              value={config.bgColor || "#1a1a2e"}
              onChange={(v) => updateConfig({ bgColor: v })}
              label="Background Color"
            />
            <ColorInput
              value={config.textColor || "#ffffff"}
              onChange={(v) => updateConfig({ textColor: v })}
              label="Text Color"
            />
          </div>

          <ColorInput
            value={config.buttonColor || "#ffffff"}
            onChange={(v) => updateConfig({ buttonColor: v })}
            label="Button Color"
          />

          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </SplitEditor>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
