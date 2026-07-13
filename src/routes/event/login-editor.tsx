import React, { useEffect, useState, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { Input } from "../../components/ui/Input";
import { Toggle, FormField, LoadingSpinner } from "../../components/ui";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { LoginPreview } from "../../components/preview/PreviewRenderers";
import { cn } from "../../lib/utils";

type PasswordMode = "none" | "shared" | "per_guest";
type LoginConfig = { passwordMode: PasswordMode; sharedPassword?: string };

const MODE_OPTIONS: { value: PasswordMode; label: string; description: string }[] = [
  { value: "none", label: "No Password", description: "Guests enter with just their username" },
  { value: "shared", label: "Shared Password", description: "All guests use the same password" },
  { value: "per_guest", label: "Per-Guest Password", description: "Each guest has an individual password" },
];

export default function LoginEditor() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<LoginConfig>({ passwordMode: "none" });
  const [saved, setSaved] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const cfg = (event.draft_login_config ?? event.login_config ?? {}) as LoginConfig;
    setConfig({ passwordMode: cfg.passwordMode ?? "none", sharedPassword: cfg.sharedPassword ?? "" });
  }, [event.id]);

  const saveMutation = useMutation({
    mutationFn: async (payload: LoginConfig) => {
      const { error } = await supabase
        .from("user_events")
        .update({ draft_login_config: payload })
        .eq("id", event.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", event.id] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveMutation.mutate(config);
    }, 800);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  const previewEvent: Partial<UserEvent> = { ...event, login_config: config };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-dash-text">Login Editor</h2>
        {saved && <span className="text-sm text-green-600">✓ Saved</span>}
        {saveMutation.isPending && <LoadingSpinner className="h-4 w-4" />}
      </div>
      <SplitEditor
        editor={
          <div className="space-y-4">
            <FormField label="Password Protection">
              <div className="space-y-2">
                {MODE_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                      config.passwordMode === opt.value
                        ? "border-dash-primary bg-dash-primary/5"
                        : "border-dash-border hover:border-dash-primary/30",
                    )}
                  >
                    <input
                      type="radio"
                      name="passwordMode"
                      checked={config.passwordMode === opt.value}
                      onChange={() => setConfig((c) => ({ ...c, passwordMode: opt.value }))}
                      className="mt-1 accent-dash-primary"
                    />
                    <div>
                      <div className="text-sm font-medium text-dash-text">{opt.label}</div>
                      <div className="text-xs text-dash-muted">{opt.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </FormField>
            {config.passwordMode === "shared" && (
              <Input
                label="Shared Password"
                type="text"
                value={config.sharedPassword ?? ""}
                onChange={(e) => setConfig((c) => ({ ...c, sharedPassword: e.target.value }))}
                placeholder="Enter a shared password"
              />
            )}
            {config.passwordMode === "per_guest" && (
              <p className="text-sm text-dash-muted bg-dash-bg rounded-lg p-3">
                Each guest will be assigned an individual password when you add them to the guest list.
              </p>
            )}
          </div>
        }
        preview={<LoginPreview event={previewEvent} />}
      />
    </div>
  );
}
