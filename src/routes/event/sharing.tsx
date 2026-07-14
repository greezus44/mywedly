import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import type { UserEvent } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card, FormField, Badge } from "../../components/ui";
import { slugify, isValidSlug } from "../../lib/theme";

export function SharingPage() {
  const { event, eventId } = useOutletContext<{ event: UserEvent; eventId: string }>();
  const queryClient = useQueryClient();

  const [slug, setSlug] = useState(event.draft_slug || "");
  const [slugError, setSlugError] = useState<string | null>(null);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const saveMutation = useMutation({
    mutationFn: async () => {
      const cleanSlug = slugify(slug);
      if (!isValidSlug(cleanSlug)) {
        throw new Error("Invalid slug. Use lowercase letters, numbers, and hyphens (2-80 chars).");
      }
      const { error } = await supabase
        .from("user_events")
        .update({ draft_slug: cleanSlug })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-event", eventId] });
      setSlugError(null);
    },
    onError: (err: Error) => {
      setSlugError(err.message);
    },
  });

  const cleanSlug = slugify(slug);
  const slugValid = isValidSlug(cleanSlug);
  const fullUrl = `${baseUrl}/${cleanSlug}`;

  const copyUrl = () => {
    navigator.clipboard?.writeText(fullUrl).catch(() => {});
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-dash-text">Sharing</h2>
        <p className="mt-1 text-sm text-dash-muted">
          Configure your website URL and share your invitation.
        </p>
      </div>

      {/* URL Section */}
      <Card className="p-6 mb-6">
        <h3 className="text-sm font-semibold text-dash-text mb-4">Website URL</h3>
        <FormField
          label="URL Slug"
          error={slugError ?? (slug && !slugValid ? "Invalid slug format" : undefined)}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm text-dash-muted whitespace-nowrap">{baseUrl}/</span>
            <Input
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugError(null);
              }}
              placeholder="my-wedding"
              className="flex-1"
            />
          </div>
        </FormField>

        <div className="mt-3 flex items-center gap-2">
          {slugValid ? (
            <Badge variant="success">Valid URL</Badge>
          ) : slug ? (
            <Badge variant="warning">Invalid format</Badge>
          ) : null}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <Button
            onClick={() => saveMutation.mutate()}
            loading={saveMutation.isPending}
            disabled={!slugValid || slug === event.draft_slug}
          >
            Save URL
          </Button>
          {saveMutation.isSuccess && (
            <span className="text-sm text-green-600">URL saved!</span>
          )}
          <Button variant="secondary" onClick={copyUrl} disabled={!slugValid}>
            Copy URL
          </Button>
        </div>
      </Card>

      {/* Share Link */}
      {event.is_published && event.slug && (
        <Card className="p-6 mb-6">
          <h3 className="text-sm font-semibold text-dash-text mb-3">Published Link</h3>
          <div className="rounded-lg border border-dash-border bg-dash-bg p-3">
            <p className="text-sm text-dash-text font-mono break-all">
              {baseUrl}/{event.slug}
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="mt-3"
            onClick={() => navigator.clipboard?.writeText(`${baseUrl}/${event.slug}`).catch(() => {})}
          >
            Copy Published URL
          </Button>
        </Card>
      )}

      {/* Info */}
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-dash-text mb-3">How Sharing Works</h3>
        <ul className="space-y-2 text-sm text-dash-muted">
          <li>• Your draft URL is used when you publish your website.</li>
          <li>• Guests can access the website using the published URL.</li>
          <li>• Each guest receives a unique link with their personal invitation token.</li>
          <li>• Use the Guests tab to manage individual guest access.</li>
        </ul>
      </Card>
    </div>
  );
}
