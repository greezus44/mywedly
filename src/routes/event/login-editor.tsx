import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type Json } from "../../lib/supabase";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { LoginPreview } from "../../components/preview/PreviewRenderers";
import { Toggle, Input, FormField } from "../../components/ui";
import { Button } from "../../components/ui/Button";

type PasswordMode = "none" | "shared" | "per_guest";

interface LoginConfig {
  passwordMode?: PasswordMode;
  password?: string;
  [key: string]: any;
}

const MODE_OPTIONS: { value: PasswordMode; label: string; description: string }[] = [
  { value: "none", label: "No password", description: "Guests only need their username to log in." },
  { value: "shared", label: "Shared password", description: "All guests use the same password." },
  { value: "per_guest", label: "Per-guest password", description: "Each guest has their own password." },
];

export default function LoginEditor() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();

  const currentConfig = (event.draft_login_config ?? event.login_config ?? {}) as LoginConfig;

  const [loginConfig, setLoginConfig] = useState<LoginConfig>({
    passwordMode: currentConfig.passwordMode || "none",
    password: currentConfig.password || "",
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("user_events")
        .update({ draft_login_config: loginConfig as Json })
        .eq("id", event.id)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_events", event.id] });
    },
    onError: () => {},
  });

  const previewEvent: Partial<UserEvent> = {
    ...event,
    login_config: loginConfig as Json,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dash-text">Login Editor</h2>
          <p className="mt-1 text-sm text-dash-muted">Configure how guests authenticate to your website.</p>
        </div>
        <Button loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
          Save Changes
        </Button>
      </div>

      {saveMutation.isError && (
        <div className="rounded-md border border-dash-danger/30 bg-red-50 px-4 py-3 text-sm text-dash-danger">
          Failed to save. Please try again.
        </div>
      )}
      {saveMutation.isSuccess && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Changes saved successfully.
        </div>
      )}

      <SplitEditor
        editor={
          <div className="space-y-6">
            <FormField label="Password Mode" hint="Choose how guests authenticate.">
              <div className="space-y-3">
                {MODE_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex cursor-pointer items-start gap-3 rounded-lg border border-dash-border p-4 transition-colors hover:bg-dash-bg"
                  >
                    <input
                      type="radio"
                      name="passwordMode"
                      value={opt.value}
                      checked={loginConfig.passwordMode === opt.value}
                      onChange={() => setLoginConfig({ ...loginConfig, passwordMode: opt.value })}
                      className="mt-1 h-4 w-4 accent-dash-primary"
                    />
                    <div>
                      <div className="text-sm font-medium text-dash-text">{opt.label}</div>
                      <div className="text-xs text-dash-muted">{opt.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </FormField>

            {loginConfig.passwordMode === "shared" && (
              <Input
                label="Shared Password"
                type="text"
                value={loginConfig.password || ""}
                onChange={(e) => setLoginConfig({ ...loginConfig, password: e.target.value })}
                placeholder="Enter shared password"
              />
            )}

            <div className="flex items-center justify-between rounded-lg border border-dash-border p-4">
              <div>
                <div className="text-sm font-medium text-dash-text">Require login</div>
                <div className="text-xs text-dash-muted">When enabled, guests must log in to view the website.</div>
              </div>
              <Toggle
                checked={loginConfig.requireLogin ?? true}
                onChange={(checked) => setLoginConfig({ ...loginConfig, requireLogin: checked })}
              />
            </div>
          </div>
        }
        preview={<LoginPreview event={previewEvent} />}
      />
    </div>
  );
}
