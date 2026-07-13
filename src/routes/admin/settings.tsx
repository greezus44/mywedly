import { useEffect, useState } from "react";
import { Save, Calendar, MapPin, Heart, Image as ImageIcon, Link as LinkIcon, Eye } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Wedding } from "@/lib/supabase";
import { useHostWedding } from "@/lib/use-host-wedding";
import { formatDate } from "@/lib/utils";
import { Card, SectionTitle, EmptyState } from "@/components/ui";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Label } from "@/components/ui/Input";
import { ImageUpload } from "@/components/ui/ImageUpload";

export function AdminSettings() {
  const { wedding, loading } = useHostWedding();

  const [coupleNameOne, setCoupleNameOne] = useState("");
  const [coupleNameTwo, setCoupleNameTwo] = useState("");
  const [weddingDate, setWeddingDate] = useState("");
  const [location, setLocation] = useState("");
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null);
  const [story, setStory] = useState("");
  const [hashtag, setHashtag] = useState("");
  const [isPublished, setIsPublished] = useState(false);

  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Hydrate form from the loaded wedding.
  useEffect(() => {
    if (!wedding) return;
    setCoupleNameOne(wedding.couple_name_one ?? "");
    setCoupleNameTwo(wedding.couple_name_two ?? "");
    setWeddingDate(wedding.wedding_date ? wedding.wedding_date.slice(0, 10) : "");
    setLocation(wedding.location ?? "");
    setHeroImageUrl(wedding.hero_image_url ?? null);
    setStory(wedding.story ?? "");
    setHashtag(wedding.hashtag ?? "");
    setIsPublished(wedding.is_published ?? false);
  }, [wedding]);

  if (loading) {
    return <div className="flex items-center justify-center py-24 text-sepia">Loading…</div>;
  }

  if (!wedding) {
    return (
      <EmptyState
        title="No wedding found"
        description="Create a wedding to manage its settings."
      />
    );
  }

  const guestUrl = `${window.location.origin}/w/${wedding.slug}`;

  const handleSave = async () => {
    setError(null);
    setSaving(true);
    const { error: updateError } = await supabase
      .from("weddings")
      .update({
        couple_name_one: coupleNameOne,
        couple_name_two: coupleNameTwo,
        wedding_date: weddingDate || null,
        location: location || null,
        hero_image_url: heroImageUrl,
        story: story || null,
        hashtag: hashtag || null,
        is_published: isPublished,
        updated_at: new Date().toISOString(),
      })
      .eq("id", wedding.id);

    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setSavedAt(new Date());
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(guestUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard may be unavailable; ignore silently.
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <SectionTitle
        title="Settings"
        subtitle="Manage your wedding details and public site"
      />

      {/* Wedding details */}
      <Card>
        <div className="flex items-center gap-2 mb-6">
          <Heart className="w-4 h-4 text-sepia" />
          <h2 className="font-serif text-lg text-onyx">Wedding Details</h2>
        </div>

        <div className="space-y-5">
          {/* Couple names */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Partner One</Label>
              <Input
                value={coupleNameOne}
                onChange={(e) => setCoupleNameOne(e.target.value)}
                placeholder="First partner"
              />
            </div>
            <div>
              <Label>Partner Two</Label>
              <Input
                value={coupleNameTwo}
                onChange={(e) => setCoupleNameTwo(e.target.value)}
                placeholder="Second partner"
              />
            </div>
          </div>

          {/* Date + location */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Wedding Date
                </span>
              </Label>
              <Input
                type="date"
                value={weddingDate}
                onChange={(e) => setWeddingDate(e.target.value)}
              />
              {weddingDate && (
                <p className="text-xs text-sepia/60 mt-1.5">{formatDate(weddingDate)}</p>
              )}
            </div>
            <div>
              <Label>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  Location
                </span>
              </Label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Venue, city"
              />
            </div>
          </div>

          {/* Hero image */}
          <div>
            <Label>
              <span className="inline-flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5" />
                Hero Image
              </span>
            </Label>
            <ImageUpload
              weddingId={wedding.id}
              value={heroImageUrl}
              onChange={setHeroImageUrl}
            />
          </div>

          {/* Story */}
          <div>
            <Label>Our Story</Label>
            <Textarea
              value={story}
              onChange={(e) => setStory(e.target.value)}
              rows={5}
              placeholder="Share the story of how you met…"
            />
          </div>

          {/* Hashtag */}
          <div>
            <Label>Hashtag</Label>
            <Input
              value={hashtag}
              onChange={(e) => setHashtag(e.target.value)}
              placeholder="#OurWedding"
            />
          </div>
        </div>
      </Card>

      {/* Publishing + public URL */}
      <Card>
        <div className="flex items-center gap-2 mb-6">
          <Eye className="w-4 h-4 text-sepia" />
          <h2 className="font-serif text-lg text-onyx">Publishing</h2>
        </div>

        {/* Publish toggle */}
        <div className="flex items-start justify-between gap-4 py-2">
          <div>
            <p className="text-sm font-medium text-onyx">Publish wedding site</p>
            <p className="text-xs text-sepia/70 mt-0.5">
              When published, your guests can view the wedding site at the URL below.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isPublished}
            onClick={() => setIsPublished((v) => !v)}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
              isPublished ? "bg-sepia" : "bg-sand"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                isPublished ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        <div className="mt-6 border-t border-sand pt-6">
          <Label>
            <span className="inline-flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5" />
              Public Guest URL
            </span>
          </Label>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input readOnly value={guestUrl} className="font-mono text-xs" />
            <div className="flex gap-2">
              <Button variant="outline" size="md" onClick={handleCopyLink}>
                {copied ? "Copied!" : "Copy"}
              </Button>
              <a href={`/w/${wedding.slug}`} target="_blank" rel="noreferrer">
                <Button variant="secondary" size="md">
                  <Eye className="w-4 h-4" />
                  View
                </Button>
              </a>
            </div>
          </div>
          <p className="text-xs text-sepia/60 mt-2">
            Share this link with your guests so they can RSVP and view details.
          </p>
        </div>
      </Card>

      {/* Save bar */}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs text-sepia/60">
          {savedAt ? `Last saved ${formatDate(savedAt.toISOString())}` : "Unsaved changes"}
        </p>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4" />
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </div>
  );
}

export default AdminSettings;
