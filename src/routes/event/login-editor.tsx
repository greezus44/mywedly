import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type Json } from "../../lib/supabase";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { LoginPreview } from "../../components/preview/PreviewRenderers";
import { Toggle, Button, Card } from "../../components/ui";

interface LoginConfig {
  mode?: "open" | "password";
  password?: string;
  helperText?: string;
}

export default function LoginEditor() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();

  const [config, setConfig] = useState<LoginConfig>(() => {
    const cfg = event.draft_login_config ?? event.login_config;
    return (cfg as LoginConfig) ?? { mode: "open" };
  });
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    const cfg = event.draft_login_config ?? event.login_config;
    setConfig((cfg as LoginConfig) ?? { mode: "open" });
  }, [event]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_events")
        .update({
          draft_login_config: config as unknown as Json,
        })
        .eq("id", event.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_events", event.id] });
      setSavedMsg("Saved successfully");
      setTimeout(() => setSavedMsg(null), 3000);
    },
  });

  const previewEvent = {
    ...event,
    draft_login_config: config as unknown as Json,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dash-text">Login Page</h2>
          <p className="text-sm text-dash-muted">Configure how guests access your website.</p>
        </div>
        <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
          Save Changes
        </Button>
      </div>
      {saveMutation.isError && (
        <p className="text-sm text-dash-danger">
          {saveMutation.error instanceof Error ? saveMutation.error.message : "Failed to save"}
        </p>
      )}
      {savedMsg && <p className="text-sm text-green-600">{savedMsg}</p>}

      <SplitEditor
        editor={
          <Card className="space-y-4">
            <div className="flex flex-col gap-3">
              <label className="text-sm font-medium text-dash-text">Access Mode</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, mode: "open" })}
                  className={
                    "flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-colors " +
                    (config.mode !== "password"
                      ? "border-dash-primary bg-dash-primary/5 text-dash-primary"
                      : "border-dash-border bg-dash-surface text-dash-text hover:bg-dash-bg")
                  }
                >
                  Open Access
                </button>
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, mode: "password" })}
                  className={
                    "flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-colors " +
                    (config.mode === "password"
                      ? "border-dash-primary bg-dash-primary/5 text-dash-primary"
                      : "border-dash-border bg-dash-surface text-dash-text hover:bg-dash-bg")
                  }
                >
                  Password Protected
                </button>
              </div>
              <p className="text-xs text-dash-muted">
                {config.mode === "password"
                  ? "Guests will need a password to access the website."
                  : "Guests can access the website freely by entering their name."}
              </p>
            </div>

            {config.mode === "password" && (
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-dash-text">Password</label>
                <input
                  type="text"
                  value={config.password ?? ""}
                  onChange={(e) => setConfig({ ...config, password: e.target.value })}
                  placeholder="Enter access password"
                  className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:border-dash-primary focus:outline-none focus:ring-1 focus:ring-dash-primary"
                />
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-dash-text">Helper Text</label>
              <input
                type="text"
                value={config.helperText ?? ""}
                onChange={(e) => setConfig({ ...config, helperText: e.target.value })}
                placeholder="e.g. Please enter your full name to find your invitation"
                className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:border-dash-primary focus:outline-none focus:ring-1 focus:ring-dash-primary"
              />
            </div>

            <div className="flex items-center gap-2">
              <Toggle
                checked={config.mode === "password"}
                onChange={(checked) =>
                  setConfig({ ...config, mode: checked ? "password" : "open" })
                }
                label="Require password"
              />
            </div>
          </Card>
        }
        preview={<LoginPreview event={previewEvent} />}
      />
    </div>
  );
}
