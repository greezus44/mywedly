import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Json } from "../../lib/supabase";
import { useOutletContext } from "./event-layout";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { LoginPreview } from "../../components/preview/PreviewRenderers";
import { Button } from "../../components/ui/Button";
import { Toggle } from "../../components/ui";

interface LoginConfig {
  passwordEnabled?: boolean;
  password?: string;
  mode?: "open" | "password";
}

export default function LoginEditor() {
  const { event, eventId } = useOutletContext();
  const queryClient = useQueryClient();

  const draftConfig = (event.draft_login_config ?? event.login_config) as LoginConfig;

  const [passwordEnabled, setPasswordEnabled] = useState<boolean>(
    draftConfig?.passwordEnabled ?? false
  );
  const [password, setPassword] = useState<string>(draftConfig?.password ?? "");
  const [savedEvent, setSavedEvent] = useState(event);

  useEffect(() => {
    setSavedEvent(event);
  }, [event]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const config: LoginConfig = {
        passwordEnabled,
        password: passwordEnabled ? password : "",
        mode: passwordEnabled ? "password" : "open",
      };
      const { data, error } = await supabase
        .from("user_events")
        .update({
          draft_login_config: config as unknown as Json,
        })
        .eq("id", eventId)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["user_event", eventId] });
      if (data) setSavedEvent(data as typeof event);
    },
  });

  const previewEvent = {
    ...savedEvent,
    draft_login_config: {
      passwordEnabled,
      password,
      mode: passwordEnabled ? "password" : "open",
    } as unknown as Json,
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-dash-text">Login Editor</h2>
        <Button
          onClick={() => saveMutation.mutate()}
          loading={saveMutation.isPending}
        >
          Save Changes
        </Button>
      </div>

      {saveMutation.isError && (
        <p className="mb-2 text-sm text-dash-danger">
          {saveMutation.error instanceof Error
            ? saveMutation.error.message
            : "Failed to save"}
        </p>
      )}
      {saveMutation.isSuccess && (
        <p className="mb-2 text-sm text-green-600">Changes saved successfully!</p>
      )}

      <div className="flex-1 overflow-hidden rounded-lg border border-dash-border">
        <SplitEditor
          editor={
            <div className="flex flex-col gap-6">
              <div>
                <h3 className="mb-3 text-sm font-semibold text-dash-text">
                  Guest Login Mode
                </h3>
                <div className="flex flex-col gap-3">
                  <label className="flex items-start gap-3 rounded-md border border-dash-border p-3 cursor-pointer hover:bg-dash-bg">
                    <input
                      type="radio"
                      name="loginMode"
                      checked={!passwordEnabled}
                      onChange={() => setPasswordEnabled(false)}
                      className="mt-1"
                    />
                    <div>
                      <p className="text-sm font-medium text-dash-text">
                        Open Access
                      </p>
                      <p className="text-sm text-dash-muted">
                        Guests enter their name to access the website. No password required.
                      </p>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 rounded-md border border-dash-border p-3 cursor-pointer hover:bg-dash-bg">
                    <input
                      type="radio"
                      name="loginMode"
                      checked={passwordEnabled}
                      onChange={() => setPasswordEnabled(true)}
                      className="mt-1"
                    />
                    <div>
                      <p className="text-sm font-medium text-dash-text">
                        Password Protected
                      </p>
                      <p className="text-sm text-dash-muted">
                        Guests must enter a password along with their name to access the website.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {passwordEnabled && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-dash-text">
                    Password
                  </label>
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter a password for guests"
                    className="w-full rounded-md border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:outline-none focus:ring-2 focus:ring-dash-primary"
                  />
                  <p className="mt-1 text-sm text-dash-muted">
                    Share this password with your guests so they can log in.
                  </p>
                </div>
              )}

              <div className="rounded-md border border-dash-border bg-dash-bg p-3">
                <Toggle
                  checked={passwordEnabled}
                  onChange={setPasswordEnabled}
                  label="Password protection enabled"
                />
              </div>
            </div>
          }
          preview={<LoginPreview event={previewEvent} draft />}
          editorRatio={0.4}
        />
      </div>
    </div>
  );
}
