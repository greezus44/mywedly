import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { supabase, type UserEvent, type LoginConfig } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import {
  Card,
  FormField,
  Toast,
  type ToastType,
} from "../../components/ui";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { LoginPreview } from "../../components/preview/PreviewRenderers";

export default function LoginEditorPage() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const config: LoginConfig = event.draft_login_config ?? event.login_config ?? {};
  const [heading, setHeading] = useState<string>(config.heading ?? "Welcome");
  const [subheading, setSubheading] = useState<string>(
    config.subheading ?? "Please enter your name to continue",
  );
  const [inputPlaceholder, setInputPlaceholder] = useState<string>(
    config.inputPlaceholder ?? "Your full name",
  );
  const [buttonText, setButtonText] = useState<string>(config.buttonText ?? "Enter");
  const [bgColor, setBgColor] = useState<string>(config.bgColor ?? "#faf6ef");
  const [textColor, setTextColor] = useState<string>(config.textColor ?? "#3d2b1f");
  const [buttonColor, setButtonColor] = useState<string>(config.buttonColor ?? "#c9a961");
  const [bgImage, setBgImage] = useState<string | null>(config.bgImage ?? null);
  const [logo, setLogo] = useState<string | null>(config.logo ?? null);
  const [logoWidth, setLogoWidth] = useState<number>(config.logoWidth ?? 120);

  const updateMutation = useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      const { error } = await supabase
        .from("user_events")
        .update(updates)
        .eq("id", event.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", event.id] });
      setToast({ message: "Saved!", type: "success" });
    },
    onError: (err: Error) => {
      setToast({ message: err.message, type: "error" });
    },
  });

  const handleSave = () => {
    const newConfig: LoginConfig = {
      ...config,
      heading,
      subheading,
      inputPlaceholder,
      buttonText,
      bgColor,
      textColor,
      buttonColor,
      bgImage,
      logo,
      logoWidth,
    };
    updateMutation.mutate({ draft_login_config: newConfig });
  };

  const previewEvent: UserEvent = {
    ...event,
    draft_login_config: {
      ...config,
      heading,
      subheading,
      inputPlaceholder,
      buttonText,
      bgColor,
      textColor,
      buttonColor,
      bgImage,
      logo,
      logoWidth,
    },
  };

  return (
    <div className="h-full overflow-y-auto p-4">
      <SplitEditor preview={<LoginPreview event={previewEvent} />}>
        <div className="space-y-6 p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-xl font-bold text-gray-900">
              Login Page
            </h2>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </div>

          <Card className="space-y-4 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
              Text Content
            </h3>
            <FormField label="Heading">
              <Input value={heading} onChange={(e) => setHeading(e.target.value)} />
            </FormField>
            <FormField label="Subheading">
              <Textarea
                value={subheading}
                onChange={(e) => setSubheading(e.target.value)}
                rows={2}
              />
            </FormField>
            <FormField label="Input placeholder">
              <Input
                value={inputPlaceholder}
                onChange={(e) => setInputPlaceholder(e.target.value)}
              />
            </FormField>
            <FormField label="Button text">
              <Input value={buttonText} onChange={(e) => setButtonText(e.target.value)} />
            </FormField>
          </Card>

          <Card className="space-y-4 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
              Colors
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Background color">
                <Input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="h-10 p-1"
                />
              </FormField>
              <FormField label="Text color">
                <Input
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="h-10 p-1"
                />
              </FormField>
            </div>
            <FormField label="Button color">
              <Input
                type="color"
                value={buttonColor}
                onChange={(e) => setButtonColor(e.target.value)}
                className="h-10 p-1"
              />
            </FormField>
          </Card>

          <Card className="space-y-4 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
              Background Image
            </h3>
            <ImageUpload
              value={bgImage}
              onChange={setBgImage}
              eventId={event.id}
              aspectRatio="16/9"
            />
          </Card>

          <Card className="space-y-4 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
              Logo
            </h3>
            <ImageUpload
              value={logo}
              onChange={setLogo}
              eventId={event.id}
              aspectRatio="1/1"
            />
            <FormField label={`Logo width: ${logoWidth}px`}>
              <input
                type="range"
                min={40}
                max={300}
                value={logoWidth}
                onChange={(e) => setLogoWidth(Number(e.target.value))}
                className="w-full accent-gray-900"
              />
            </FormField>
          </Card>
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
