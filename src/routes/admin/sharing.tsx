import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Wedding, type Guest, type GuestToken, type SharingEvent } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Label, Toggle, ColorInput } from "../../components/ui/Input";
import { Card, Badge, Modal, EmptyState, Toast } from "../../components/ui/index";
import { ImageUpload, FormField } from "../../components/ui/ImageUpload";
import { generateQRDataURL, downloadQRPNG, downloadQRSVG, downloadQRHighRes, downloadAllGuestQRsAsZip, downloadAllGuestQRsAsPDF, copyToClipboard, getShareUrl } from "../../lib/qr";
import { generateToken, cn } from "../../lib/utils";
import { formatDate } from "../../lib/utils";
import {
  QrCode, Download, Copy, Share2, MessageCircle, Send, Mail, Smartphone,
  Globe, Link2, RefreshCw, Users, BarChart3, Eye,
  MousePointerClick, CheckCircle2, Monitor, Tablet,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Sharing page                                                       */
/* ------------------------------------------------------------------ */

export function SharingPage() {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [websiteQR, setWebsiteQR] = useState<string | null>(null);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile" | "whatsapp" | "email">("desktop");
  const [selectedGuestIds, setSelectedGuestIds] = useState<Set<string>>(new Set());
  const [ogOpen, setOgOpen] = useState(false);
  const [ogForm, setOgForm] = useState({
    ogTitle: "",
    ogDescription: "",
    ogImageUrl: "" as string | null,
    customDomain: "" as string | null,
  });

  /* ---------------- wedding ---------------- */
  const { data: wedding, isLoading: wLoading, error: wError } = useQuery<Wedding>({
    queryKey: ["wedding"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("weddings")
        .select("*")
        .eq("created_by", user.user.id)
        .single();
      if (error) throw error;
      return data as Wedding;
    },
  });

  const websiteUrl = wedding ? `${window.location.origin}/w/${wedding.slug}` : "";
  const sharingConfig = wedding?.sharing_config || {};

  /* ---------------- guests ---------------- */
  const { data: guests = [], isLoading: gLoading } = useQuery<Guest[]>({
    queryKey: ["guests", wedding?.id],
    queryFn: async () => {
      if (!wedding) return [];
      const { data } = await supabase
        .from("guests")
        .select("*")
        .eq("wedding_id", wedding.id)
        .order("created_at", { ascending: false });
      return (data || []) as Guest[];
    },
    enabled: !!wedding,
  });

  /* ---------------- guest tokens ---------------- */
  const { data: tokens = [], isLoading: tLoading } = useQuery<GuestToken[]>({
    queryKey: ["guest-tokens", wedding?.id],
    queryFn: async () => {
      if (!wedding) return [];
      const { data } = await supabase
        .from("guest_tokens")
        .select("*")
        .eq("wedding_id", wedding.id);
      return (data || []) as GuestToken[];
    },
    enabled: !!wedding,
  });

  /* ---------------- generate website QR ---------------- */
  useEffect(() => {
    if (!websiteUrl) return;
    let active = true;
    generateQRDataURL(websiteUrl, { width: 256 })
      .then((url) => { if (active) setWebsiteQR(url); })
      .catch(() => {});
    return () => { active = false; };
  }, [websiteUrl]);

  /* ---------------- init OG form when wedding loads ---------------- */
  useEffect(() => {
    if (!wedding) return;
    setOgForm({
      ogTitle: sharingConfig.ogTitle || `${wedding.couple_name_one} & ${wedding.couple_name_two}`,
      ogDescription: sharingConfig.ogDescription || `You're invited to ${wedding.couple_name_one} & ${wedding.couple_name_two}'s wedding`,
      ogImageUrl: sharingConfig.ogImageUrl ?? wedding.hero_image_url ?? null,
      customDomain: sharingConfig.customDomain ?? null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wedding?.id]);

  /* ---------------- mutations ---------------- */
  const updateWeddingMutation = useMutation({
    mutationFn: async (patch: Record<string, unknown>) => {
      if (!wedding) throw new Error("No wedding");
      const { error } = await supabase.from("weddings").update(patch).eq("id", wedding.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wedding"] });
    },
  });

  const updateSharingConfig = (patch: Partial<typeof sharingConfig>) => {
    if (!wedding) return;
    const next = { ...sharingConfig, ...patch };
    updateWeddingMutation.mutate(
      { sharing_config: next },
      {
        onSuccess: () => setToast({ message: "Sharing settings saved", type: "success" }),
        onError: () => setToast({ message: "Failed to save settings", type: "error" }),
      },
    );
  };

  const regenerateQrTokenMutation = useMutation({
    mutationFn: async () => {
      if (!wedding) throw new Error("No wedding");
      const token = generateToken();
      const { error } = await supabase.from("weddings").update({ qr_token: token }).eq("id", wedding.id);
      if (error) throw error;
      return token;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wedding"] });
      setToast({ message: "QR token regenerated", type: "success" });
    },
    onError: () => setToast({ message: "Failed to regenerate token", type: "error" }),
  });

  const generateAllTokensMutation = useMutation({
    mutationFn: async () => {
      if (!wedding) return;
      const existing = new Map(tokens.map((t) => [t.guest_id, t]));
      const toInsert: Array<{
        guest_id: string;
        wedding_id: string;
        token: string;
        bypass_login: boolean;
      }> = [];
      for (const g of guests) {
        if (existing.has(g.id)) continue;
        toInsert.push({
          guest_id: g.id,
          wedding_id: wedding.id,
          token: generateToken(),
          bypass_login: !!sharingConfig.qrBypassLogin,
        });
      }
      if (toInsert.length > 0) {
        const { error } = await supabase.from("guest_tokens").insert(toInsert);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest-tokens", wedding?.id] });
      setToast({ message: "Guest tokens generated", type: "success" });
    },
    onError: () => setToast({ message: "Failed to generate tokens", type: "error" }),
  });

  const trackEvent = async (source: string) => {
    if (!wedding) return;
    try {
      await supabase.from("sharing_events").insert({
        wedding_id: wedding.id,
        event_type: "link_click",
        source,
        device_type: null,
        metadata: {},
      });
      queryClient.invalidateQueries({ queryKey: ["sharing-events", wedding.id] });
    } catch {
      /* non-blocking */
    }
  };

  /* ---------------- helpers ---------------- */
  const tokenForGuest = (guestId: string) => tokens.find((t) => t.guest_id === guestId);

  const guestUrl = (token: string) =>
    wedding ? `${window.location.origin}/w/${wedding.slug}?t=${token}` : "";

  const invitationMessage = () => {
    if (!wedding) return "";
    if (sharingConfig.invitationMessage) return sharingConfig.invitationMessage;
    const date = wedding.wedding_date ? formatDate(wedding.wedding_date) : "TBD";
    return `You're invited to ${wedding.couple_name_one} & ${wedding.couple_name_two}'s wedding on ${date}. View invitation: ${websiteUrl}`;
  };

  const toggleGuest = (id: string) => {
    setSelectedGuestIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedGuestIds.size === guests.length) setSelectedGuestIds(new Set());
    else setSelectedGuestIds(new Set(guests.map((g) => g.id)));
  };

  const handleShare = (platform: string) => {
    const msg = invitationMessage();
    const url = getShareUrl(platform, websiteUrl, msg);
    window.open(url, "_blank", "noopener,noreferrer,width=600,height=500");
    trackEvent(platform);
  };

  const handleCopyLink = async () => {
    try {
      await copyToClipboard(websiteUrl);
      setToast({ message: "Link copied to clipboard", type: "success" });
      trackEvent("copy");
    } catch {
      setToast({ message: "Failed to copy link", type: "error" });
    }
  };

  const handleCopyInvitation = async () => {
    try {
      await copyToClipboard(invitationMessage());
      setToast({ message: "Invitation message copied", type: "success" });
    } catch {
      setToast({ message: "Failed to copy", type: "error" });
    }
  };

  const handleDownloadWebsiteQR = async (kind: "png" | "svg" | "highres") => {
    if (!websiteUrl) return;
    try {
      if (kind === "png") await downloadQRPNG(websiteUrl, "wedding-qr.png");
      else if (kind === "svg") await downloadQRSVG(websiteUrl, "wedding-qr.svg");
      else await downloadQRHighRes(websiteUrl, "wedding-qr-hires.png", 1024);
      setToast({ message: "QR downloaded", type: "success" });
    } catch {
      setToast({ message: "Failed to download QR", type: "error" });
    }
  };

  const handleDownloadAllZip = async () => {
    const items = guests
      .map((g) => {
        const tk = tokenForGuest(g.id);
        return tk ? { guestName: g.full_name, token: tk.token } : null;
      })
      .filter((x): x is { guestName: string; token: string } => x !== null);
    if (items.length === 0) {
      setToast({ message: "No guest tokens found. Generate tokens first.", type: "error" });
      return;
    }
    try {
      await downloadAllGuestQRsAsZip(items, "guest-qr-codes.zip", guestUrl);
      setToast({ message: "ZIP downloaded", type: "success" });
    } catch {
      setToast({ message: "Failed to download ZIP", type: "error" });
    }
  };

  const handleDownloadAllPdf = async () => {
    const items = guests
      .map((g) => {
        const tk = tokenForGuest(g.id);
        return tk ? { guestName: g.full_name, token: tk.token } : null;
      })
      .filter((x): x is { guestName: string; token: string } => x !== null);
    if (items.length === 0) {
      setToast({ message: "No guest tokens found. Generate tokens first.", type: "error" });
      return;
    }
    try {
      await downloadAllGuestQRsAsPDF(items, "guest-qr-codes.pdf", guestUrl);
      setToast({ message: "PDF downloaded", type: "success" });
    } catch {
      setToast({ message: "Failed to download PDF", type: "error" });
    }
  };

  const handleDownloadIndividualQR = async (guest: Guest) => {
    const tk = tokenForGuest(guest.id);
    if (!tk) {
      setToast({ message: "No token for this guest", type: "error" });
      return;
    }
    try {
      await downloadQRPNG(guestUrl(tk.token), `${guest.full_name.replace(/\s+/g, "_")}_qr.png`);
      setToast({ message: "QR downloaded", type: "success" });
    } catch {
      setToast({ message: "Failed to download QR", type: "error" });
    }
  };

  const handleSendEmailInvitations = () => {
    const selected = guests.filter((g) => selectedGuestIds.has(g.id) && g.email);
    if (selected.length === 0) {
      setToast({ message: "Select guests with email addresses", type: "error" });
      return;
    }
    const subject = `${wedding?.couple_name_one} & ${wedding?.couple_name_two}'s Wedding Invitation`;
    const body = `${invitationMessage()}`;
    const bcc = selected.map((g) => g.email).join(",");
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}&bcc=${encodeURIComponent(bcc)}`;
    trackEvent("email");
  };

  const handleWhatsAppInvitations = () => {
    const selected = guests.filter((g) => selectedGuestIds.has(g.id) && g.phone);
    if (selected.length === 0) {
      setToast({ message: "Select guests with phone numbers", type: "error" });
      return;
    }
    const msg = invitationMessage();
    // Open WhatsApp with the message; individual sending requires manual per-guest action.
    window.open(getShareUrl("whatsapp", websiteUrl, msg), "_blank", "noopener,noreferrer");
    trackEvent("whatsapp");
  };

  const handleSaveOg = () => {
    updateSharingConfig({
      ogTitle: ogForm.ogTitle,
      ogDescription: ogForm.ogDescription,
      ogImageUrl: ogForm.ogImageUrl,
      customDomain: ogForm.customDomain,
    });
    setOgOpen(false);
  };

  const handleDownloadAsset = (asset: "websiteQR" | "invitationCard" | "coverImage" | "socialImage") => {
    if (!wedding) return;
    try {
      if (asset === "websiteQR") {
        handleDownloadWebsiteQR("png");
        return;
      }
      let url: string | null = null;
      let filename = "asset.png";
      if (asset === "coverImage") {
        url = wedding.hero_image_url;
        filename = "cover-image.png";
      } else if (asset === "socialImage") {
        url = sharingConfig.ogImageUrl ?? wedding.hero_image_url;
        filename = "social-sharing-image.png";
      } else if (asset === "invitationCard") {
        url = sharingConfig.ogImageUrl ?? wedding.hero_image_url;
        filename = "invitation-card.png";
      }
      if (!url) {
        setToast({ message: "No image available to download", type: "error" });
        return;
      }
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      setToast({ message: "Asset downloaded", type: "success" });
    } catch {
      setToast({ message: "Failed to download asset", type: "error" });
    }
  };

  /* ---------------- loading / error ---------------- */
  if (wLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full p-8">
          <p className="font-ui text-sm text-gray-500">Loading sharing settings...</p>
        </div>
      </AdminLayout>
    );
  }

  if (wError || !wedding) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full p-8">
          <p className="font-ui text-sm text-red-500">Unable to load wedding data.</p>
        </div>
      </AdminLayout>
    );
  }

  /* ---------------- share platforms ---------------- */
  const SHARE_PLATFORMS: {
    key: string;
    label: string;
    icon: typeof Share2;
    color: string;
  }[] = [
    { key: "whatsapp", label: "WhatsApp", icon: MessageCircle, color: "text-green-600" },
    { key: "telegram", label: "Telegram", icon: Send, color: "text-sky-500" },
    { key: "facebook", label: "Facebook", icon: Globe, color: "text-blue-600" },
    { key: "messenger", label: "Messenger", icon: MessageCircle, color: "text-blue-500" },
    { key: "twitter", label: "X (Twitter)", icon: Globe, color: "text-gray-900" },
    { key: "instagram", label: "Instagram", icon: Share2, color: "text-pink-500" },
    { key: "email", label: "Email", icon: Mail, color: "text-gray-600" },
    { key: "sms", label: "SMS", icon: Smartphone, color: "text-indigo-600" },
  ];

  const previewDevices = [
    { key: "desktop" as const, label: "Desktop", icon: Monitor },
    { key: "mobile" as const, label: "Mobile", icon: Smartphone },
    { key: "whatsapp" as const, label: "WhatsApp", icon: MessageCircle },
    { key: "email" as const, label: "Email", icon: Mail },
  ];

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 overflow-y-auto">
        {/* header */}
        <div className="mb-6">
          <h1 className="font-ui text-xl font-bold text-gray-900">Sharing</h1>
          <p className="font-ui text-sm text-gray-500 mt-1">
            Share your wedding website via QR codes, social media, and personalised guest invitations.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* ============ Website QR Code ============ */}
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <QrCode size={18} className="text-indigo-600" />
              <h3 className="font-ui text-sm font-semibold text-gray-900">Website QR Code</h3>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-shrink-0">
                {websiteQR ? (
                  <img src={websiteQR} alt="Website QR" className="w-40 h-40 rounded-lg border border-gray-200" />
                ) : (
                  <div className="w-40 h-40 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center">
                    <QrCode size={32} className="text-gray-300" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 space-y-3">
                <div>
                  <p className="font-ui text-xs font-medium text-gray-500 mb-1">Website URL</p>
                  <div className="flex items-center gap-2">
                    <p className="font-ui text-xs text-gray-700 truncate flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                      {websiteUrl}
                    </p>
                    <button
                      onClick={handleCopyLink}
                      className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Copy link"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleDownloadWebsiteQR("png")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white font-ui text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <Download size={12} /> PNG
                  </button>
                  <button
                    onClick={() => handleDownloadWebsiteQR("svg")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 font-ui text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Download size={12} /> SVG
                  </button>
                  <button
                    onClick={() => handleDownloadWebsiteQR("highres")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 font-ui text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Download size={12} /> High-Res
                  </button>
                  <button
                    onClick={() => regenerateQrTokenMutation.mutate()}
                    disabled={regenerateQrTokenMutation.isPending}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 font-ui text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    title="Regenerate QR token"
                  >
                    <RefreshCw size={12} className={cn(regenerateQrTokenMutation.isPending && "animate-spin")} /> Regenerate
                  </button>
                </div>
                {wedding.qr_token && (
                  <p className="font-ui text-xs text-gray-400">Token: <span className="font-mono">{wedding.qr_token.slice(0, 12)}…</span></p>
                )}
              </div>
            </div>
          </Card>

          {/* ============ One-Click Sharing ============ */}
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Share2 size={18} className="text-indigo-600" />
              <h3 className="font-ui text-sm font-semibold text-gray-900">One-Click Sharing</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SHARE_PLATFORMS.map((p) => {
                const Icon = p.icon;
                return (
                  <button
                    key={p.key}
                    onClick={() => p.key === "instagram" ? handleCopyLink() : handleShare(p.key)}
                    className="flex flex-col items-center gap-2 p-3 bg-white border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50/50 transition-all"
                  >
                    <Icon size={20} className={p.color} />
                    <span className="font-ui text-xs font-medium text-gray-700">{p.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="font-ui text-xs font-medium text-gray-500 mb-2">Direct Link</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg font-ui text-xs text-gray-700 truncate">
                  {websiteUrl}
                </div>
                <button
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-700 font-ui text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Link2 size={12} /> Copy
                </button>
              </div>
            </div>
          </Card>

          {/* ============ Guest QR Codes ============ */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <QrCode size={18} className="text-indigo-600" />
                <h3 className="font-ui text-sm font-semibold text-gray-900">Guest QR Codes</h3>
              </div>
              <Badge variant="default">{tokens.length} tokens</Badge>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-ui text-sm font-medium text-gray-900">Enable personalised guest QR codes</p>
                  <p className="font-ui text-xs text-gray-500 mt-0.5">Each guest gets a unique token in their link</p>
                </div>
                <Toggle
                  checked={!!sharingConfig.enableGuestQr}
                  onChange={(v) => updateSharingConfig({ enableGuestQr: v })}
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-ui text-sm font-medium text-gray-900">Bypass login with QR token</p>
                  <p className="font-ui text-xs text-gray-500 mt-0.5">Guests skip sign-in when using their QR link</p>
                </div>
                <Toggle
                  checked={!!sharingConfig.qrBypassLogin}
                  onChange={(v) => updateSharingConfig({ qrBypassLogin: v })}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => generateAllTokensMutation.mutate()}
                disabled={generateAllTokensMutation.isPending || gLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white font-ui text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw size={12} className={cn(generateAllTokensMutation.isPending && "animate-spin")} /> Generate Tokens
              </button>
              <button
                onClick={handleDownloadAllZip}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 font-ui text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Download size={12} /> All as ZIP
              </button>
              <button
                onClick={handleDownloadAllPdf}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 font-ui text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Download size={12} /> All as PDF
              </button>
            </div>

            {gLoading || tLoading ? (
              <p className="font-ui text-xs text-gray-500">Loading guests...</p>
            ) : guests.length === 0 ? (
              <p className="font-ui text-xs text-gray-400">No guests yet. Add guests first.</p>
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-2 -mx-1 px-1">
                {guests.map((g) => {
                  const tk = tokenForGuest(g.id);
                  return (
                    <div key={g.id} className="flex items-center justify-between p-2.5 bg-white border border-gray-100 rounded-lg">
                      <div className="min-w-0 flex-1">
                        <p className="font-ui text-xs font-medium text-gray-900 truncate">{g.full_name}</p>
                        <p className="font-ui text-xs text-gray-400 truncate">
                          {tk ? guestUrl(tk.token) : "No token — generate first"}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDownloadIndividualQR(g)}
                        disabled={!tk}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-40"
                        title="Download QR"
                      >
                        <Download size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* ============ Open Graph Settings ============ */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Eye size={18} className="text-indigo-600" />
                <h3 className="font-ui text-sm font-semibold text-gray-900">Open Graph Settings</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setOgOpen(true)}>Edit</Button>
            </div>
            <div className="space-y-3">
              <div>
                <p className="font-ui text-xs font-medium text-gray-500">OG Title</p>
                <p className="font-ui text-sm text-gray-900 mt-0.5">
                  {sharingConfig.ogTitle || `${wedding.couple_name_one} & ${wedding.couple_name_two}`}
                </p>
              </div>
              <div>
                <p className="font-ui text-xs font-medium text-gray-500">OG Description</p>
                <p className="font-ui text-sm text-gray-900 mt-0.5">
                  {sharingConfig.ogDescription || `You're invited to ${wedding.couple_name_one} & ${wedding.couple_name_two}'s wedding`}
                </p>
              </div>
              <div>
                <p className="font-ui text-xs font-medium text-gray-500">Custom Domain</p>
                <p className="font-ui text-sm text-gray-900 mt-0.5">
                  {sharingConfig.customDomain || "Not set"}
                </p>
              </div>
              {(sharingConfig.ogImageUrl || wedding.hero_image_url) && (
                <div>
                  <p className="font-ui text-xs font-medium text-gray-500 mb-1">OG Image</p>
                  <img
                    src={sharingConfig.ogImageUrl || wedding.hero_image_url || ""}
                    alt="OG preview"
                    className="w-full h-32 object-cover rounded-lg border border-gray-200"
                  />
                </div>
              )}
            </div>
          </Card>

          {/* ============ Guest Invitations ============ */}
          <Card className="p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-indigo-600" />
                <h3 className="font-ui text-sm font-semibold text-gray-900">Guest Invitations</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-ui text-xs text-gray-500">
                  {selectedGuestIds.size} of {guests.length} selected
                </span>
                <button
                  onClick={toggleAll}
                  className="px-2.5 py-1 text-xs font-ui text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                >
                  {selectedGuestIds.size === guests.length ? "Clear all" : "Select all"}
                </button>
              </div>
            </div>

            {/* invitation message preview */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="font-ui text-xs font-medium text-gray-500 mb-1">Invitation Message</p>
              <p className="font-ui text-sm text-gray-700 whitespace-pre-wrap">{invitationMessage()}</p>
            </div>

            {/* actions */}
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={handleSendEmailInvitations}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white font-ui text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Mail size={12} /> Send Email
              </button>
              <button
                onClick={handleWhatsAppInvitations}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 font-ui text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                <MessageCircle size={12} /> WhatsApp Share
              </button>
              <button
                onClick={handleCopyInvitation}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 font-ui text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Copy size={12} /> Copy Message
              </button>
            </div>

            {/* guest list */}
            {gLoading ? (
              <p className="font-ui text-xs text-gray-500">Loading guests...</p>
            ) : guests.length === 0 ? (
              <EmptyState
                icon={<Users size={36} />}
                title="No guests yet"
                description="Add guests to send personalised invitations."
              />
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-1.5 -mx-1 px-1">
                {guests.map((g) => {
                  const selected = selectedGuestIds.has(g.id);
                  return (
                    <label
                      key={g.id}
                      className={cn(
                        "flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors",
                        selected ? "border-indigo-300 bg-indigo-50/50" : "border-gray-100 bg-white hover:bg-gray-50",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleGuest(g.id)}
                        className="w-4 h-4 accent-indigo-600 rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-ui text-xs font-medium text-gray-900 truncate">{g.full_name}</p>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                          {g.email && <span className="font-ui text-xs text-gray-400 truncate">{g.email}</span>}
                          {g.phone && <span className="font-ui text-xs text-gray-400 truncate">{g.phone}</span>}
                          {g.group_label && <span className="font-ui text-xs text-gray-400">{g.group_label}</span>}
                        </div>
                      </div>
                      {!g.email && !g.phone && (
                        <Badge variant="warning">No contact</Badge>
                      )}
                    </label>
                  );
                })}
              </div>
            )}
          </Card>

          {/* ============ Share Preview ============ */}
          <Card className="p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Eye size={18} className="text-indigo-600" />
                <h3 className="font-ui text-sm font-semibold text-gray-900">Share Preview</h3>
              </div>
              <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
                {previewDevices.map((d) => {
                  const Icon = d.icon;
                  return (
                    <button
                      key={d.key}
                      onClick={() => setPreviewDevice(d.key)}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-ui text-xs font-medium transition-colors",
                        previewDevice === d.key
                          ? "bg-white text-indigo-600 shadow-sm"
                          : "text-gray-500 hover:text-gray-700",
                      )}
                    >
                      <Icon size={12} /> {d.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* preview area */}
            <div className="flex justify-center">
              {previewDevice === "desktop" && (
                <div className="w-full max-w-2xl">
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                    <div className="flex items-center gap-1.5 px-4 py-2 bg-gray-50 border-b border-gray-100">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                      <div className="flex-1 ml-3 px-3 py-1 bg-white border border-gray-200 rounded-md font-ui text-xs text-gray-400 truncate">
                        {websiteUrl}
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="flex items-start gap-4">
                        {(sharingConfig.ogImageUrl || wedding.hero_image_url) && (
                          <img
                            src={sharingConfig.ogImageUrl || wedding.hero_image_url || ""}
                            alt=""
                            className="w-32 h-32 object-cover rounded-lg border border-gray-200 flex-shrink-0"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="font-ui text-xs text-gray-400 uppercase tracking-wider">{websiteUrl}</p>
                          <h4 className="font-ui text-sm font-semibold text-gray-900 mt-1">
                            {sharingConfig.ogTitle || `${wedding.couple_name_one} & ${wedding.couple_name_two}`}
                          </h4>
                          <p className="font-ui text-xs text-gray-500 mt-1 line-clamp-2">
                            {sharingConfig.ogDescription || `You're invited to ${wedding.couple_name_one} & ${wedding.couple_name_two}'s wedding`}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {previewDevice === "mobile" && (
                <div className="w-64">
                  <div className="bg-white border-4 border-gray-800 rounded-[2rem] overflow-hidden shadow-lg">
                    <div className="h-5 bg-gray-800 flex items-center justify-center">
                      <div className="w-16 h-1 bg-gray-600 rounded-full" />
                    </div>
                    <div className="p-3">
                      {(sharingConfig.ogImageUrl || wedding.hero_image_url) && (
                        <img
                          src={sharingConfig.ogImageUrl || wedding.hero_image_url || ""}
                          alt=""
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      )}
                      <p className="font-ui text-xs text-gray-400 mt-2">{websiteUrl}</p>
                      <h4 className="font-ui text-sm font-semibold text-gray-900 mt-1">
                        {sharingConfig.ogTitle || `${wedding.couple_name_one} & ${wedding.couple_name_two}`}
                      </h4>
                      <p className="font-ui text-xs text-gray-500 mt-1 line-clamp-3">
                        {sharingConfig.ogDescription || `You're invited to ${wedding.couple_name_one} & ${wedding.couple_name_two}'s wedding`}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {previewDevice === "whatsapp" && (
                <div className="w-full max-w-md bg-[#e5ddd5] rounded-lg p-4">
                  <div className="bg-white rounded-lg shadow-sm p-3 max-w-[85%]">
                    <div className="flex items-start gap-2">
                      {(sharingConfig.ogImageUrl || wedding.hero_image_url) && (
                        <img
                          src={sharingConfig.ogImageUrl || wedding.hero_image_url || ""}
                          alt=""
                          className="w-20 h-20 object-cover rounded flex-shrink-0"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="font-ui text-xs text-indigo-600 truncate">{websiteUrl}</p>
                        <p className="font-ui text-sm font-medium text-gray-900 mt-0.5">
                          {sharingConfig.ogTitle || `${wedding.couple_name_one} & ${wedding.couple_name_two}`}
                        </p>
                        <p className="font-ui text-xs text-gray-500 line-clamp-2">
                          {sharingConfig.ogDescription || `You're invited to ${wedding.couple_name_one} & ${wedding.couple_name_two}'s wedding`}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <p className="font-ui text-xs text-gray-700">{invitationMessage()}</p>
                    </div>
                  </div>
                </div>
              )}

              {previewDevice === "email" && (
                <div className="w-full max-w-md">
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                    <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                      <p className="font-ui text-xs font-medium text-gray-700">
                        Subject: {wedding.couple_name_one} & {wedding.couple_name_two}'s Wedding Invitation
                      </p>
                    </div>
                    <div className="p-4">
                      {(sharingConfig.ogImageUrl || wedding.hero_image_url) && (
                        <img
                          src={sharingConfig.ogImageUrl || wedding.hero_image_url || ""}
                          alt=""
                          className="w-full h-40 object-cover rounded-lg mb-3"
                        />
                      )}
                      <h4 className="font-ui text-base font-semibold text-gray-900 mb-2">
                        {sharingConfig.ogTitle || `${wedding.couple_name_one} & ${wedding.couple_name_two}`}
                      </h4>
                      <p className="font-ui text-sm text-gray-600 whitespace-pre-wrap">
                        {invitationMessage()}
                      </p>
                      <div className="mt-4">
                        <button className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white font-ui text-xs font-medium rounded-lg">
                          View Invitation
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* ============ Downloadable Assets ============ */}
          <Card className="p-5 lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Download size={18} className="text-indigo-600" />
              <h3 className="font-ui text-sm font-semibold text-gray-900">Downloadable Assets</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                onClick={() => handleDownloadAsset("websiteQR")}
                className="flex flex-col items-center gap-2 p-4 bg-white border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50/50 transition-all"
              >
                <QrCode size={24} className="text-indigo-600" />
                <span className="font-ui text-xs font-medium text-gray-700">Website QR</span>
              </button>
              <button
                onClick={() => handleDownloadAsset("invitationCard")}
                className="flex flex-col items-center gap-2 p-4 bg-white border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50/50 transition-all"
              >
                <Mail size={24} className="text-indigo-600" />
                <span className="font-ui text-xs font-medium text-gray-700">Invitation Card</span>
              </button>
              <button
                onClick={() => handleDownloadAsset("coverImage")}
                className="flex flex-col items-center gap-2 p-4 bg-white border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50/50 transition-all"
              >
                <Eye size={24} className="text-indigo-600" />
                <span className="font-ui text-xs font-medium text-gray-700">Cover Image</span>
              </button>
              <button
                onClick={() => handleDownloadAsset("socialImage")}
                className="flex flex-col items-center gap-2 p-4 bg-white border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50/50 transition-all"
              >
                <Share2 size={24} className="text-indigo-600" />
                <span className="font-ui text-xs font-medium text-gray-700">Social Image</span>
              </button>
            </div>
          </Card>
        </div>
      </div>

      {/* ============ OG Settings Modal ============ */}
      <Modal open={ogOpen} onClose={() => setOgOpen(false)} title="Open Graph Settings" maxWidth="max-w-lg">
        <div className="space-y-4">
          <FormField label="OG Title" hint="Title shown when sharing on social media">
            <Input
              value={ogForm.ogTitle}
              onChange={(e) => setOgForm((p) => ({ ...p, ogTitle: e.target.value }))}
              placeholder={`${wedding.couple_name_one} & ${wedding.couple_name_two}`}
            />
          </FormField>
          <FormField label="OG Description" hint="Description shown in link previews">
            <Textarea
              value={ogForm.ogDescription}
              onChange={(e) => setOgForm((p) => ({ ...p, ogDescription: e.target.value }))}
              placeholder="You're invited to our wedding..."
              className="min-h-[80px]"
            />
          </FormField>
          <FormField label="OG Image" hint="Image shown in link previews (1200×630 recommended)">
            <ImageUpload
              value={ogForm.ogImageUrl}
              onChange={(url) => setOgForm((p) => ({ ...p, ogImageUrl: url }))}
              bucket="wedding-images"
            />
          </FormField>
          <FormField label="Custom Domain" hint="e.g. wedding.example.com">
            <Input
              value={ogForm.customDomain || ""}
              onChange={(e) => setOgForm((p) => ({ ...p, customDomain: e.target.value || null }))}
              placeholder="wedding.example.com"
            />
          </FormField>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setOgOpen(false)}>Cancel</Button>
            <button
              onClick={handleSaveOg}
              disabled={updateWeddingMutation.isPending}
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-indigo-600 text-white font-ui text-xs font-medium uppercase tracking-wider rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              Save Settings
            </button>
          </div>
        </div>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}
