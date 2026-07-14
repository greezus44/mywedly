import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type Json } from "../../lib/supabase";
import { cn } from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { LoginPreview } from "../../components/preview/PreviewRenderers";

interface LoginConfig {
  passwordMode?: "none" | "optional" | "required";
  password?: string;
}

function jsonToLoginConfig(json: Json | null | undefined): LoginConfig {
  if (!json || typeof json !== "object") return { passwordMode: "none" };
  return json as LoginConfig;
}

const MODE_OPTIONS: { value: LoginConfig["passwordMode"]; label: string; desc: string }[] = [
  { value: "none", label: "No password", desc: "Guests can enter freely" },
  { value: "optional", label: "Optional", desc: "Password shown but not required" },
  { value: "required", label: "Required", desc: "Guests must enter a password" },
];

export default function LoginEditor() {
  const { event, eventId } = useOutletContext<{ event: UserEvent; eventId: string }>();
  const queryClient = useQueryClient();

  const config = jsonToLoginConfig(event.draft_login_config ?? event.login_config);
  const [passwordMode, setPasswordMode] = useState<LoginConfig["passwordMode"]>(
    config.passwordMode ?? "none"
  );
  const [password, setPassword] = useState<string>(config.password ?? "");

  useEffect(() => {
    const c = jsonToLoginConfig(event.draft_login_config ?? event.login_config);
    setPasswordMode(c.passwordMode ?? "none");
    setPassword(c.password ?? "");
  }, [event]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const newConfig: LoginConfig = { passwordMode, password: password || undefined };
      const { error } = await supabase
        .from("user_events")
        .update({ draft_login_config: newConfig as unknown as Json })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    },
  });

  return (
    <div className="flex h-[calc(100vh-180px)] flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Login Editor</h2>
          <p className="text-sm text-muted">
            Configure how guests access your website.
          </p>
        </div>
        <Button
          onClick={() => saveMutation.mutate()}
          loading={saveMutation.isPending}
        >
          Save Changes
        </Button>
      </div>

      {saveMutation.isError && (
        <p className="text-sm text-danger">
          {saveMutation.error instanceof Error
            ? saveMutation.error.message
            : "Failed to save"}
        </p>
      )}
      {saveMutation.isSuccess && (
        <p className="text-sm text-success">Saved successfully!</p>
      )}

      <SplitEditor
        editor={
          <div className="flex flex-col gap-4 p-4">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-foreground">
                Password Mode
              </span>
              {MODE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPasswordMode(opt.value)}
                  className={cn(
                    "flex flex-col items-start rounded-md border p-3 text-left transition-colors",
                    passwordMode === opt.value
                      ? "border-primary bg-primary/5"
                      : "border-border bg-surface hover:border-primary/50"
                  )}
                >
                  <span className="text-sm font-medium text-foreground">
                    {opt.label}
                  </span>
                  <span className="text-xs text-muted">{opt.desc}</span>
                </button>
              ))}
            </div>
            {passwordMode !== "none" && (
              <div>
                <label className="text-sm font-medium text-foreground">
                  Password
                </label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter a password"
                  className="mt-1.5 h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            )}
          </div>
        }
        preview={<LoginPreview event={event} />}
      />
    </div>
  );
}
