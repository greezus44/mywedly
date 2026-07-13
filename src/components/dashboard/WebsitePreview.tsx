import { useEffect, useRef, useState } from "react";
import { Eye, X, Smartphone, Monitor } from "lucide-react";

type Props = {
  slug: string;
  /** Which guest-facing page to preview */
  page?: "cover" | "invitation" | "info" | "events";
  /** Custom page slug if previewing a custom page */
  customPageSlug?: string;
};

export function WebsitePreview({ slug, page = "cover", customPageSlug }: Props) {
  const [origin, setOrigin] = useState("");
  const [showMobile, setShowMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const previewUrl = customPageSlug
    ? `${origin}/w/${slug}/p/${customPageSlug}`
    : page === "cover"
      ? `${origin}/w/${slug}`
      : `${origin}/w/${slug}/${page}`;

  // Detect mobile viewport
  useEffect(() => {
    const check = () => {
      if (window.innerWidth < 1024) setShowMobile(true);
      else setShowMobile(false);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const iframe = (
    <iframe
      ref={iframeRef}
      src={previewUrl}
      title="Website preview"
      className="w-full h-full border-0"
      sandbox="allow-scripts allow-same-origin"
    />
  );

  // Mobile: toggleable drawer
  if (showMobile) {
    return (
      <>
        <button
          onClick={() => setMobileOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-onyx text-parchment px-4 py-3 text-xs uppercase tracking-widest shadow-lg flex items-center gap-2 hover:bg-ink"
        >
          <Eye className="w-4 h-4" /> Preview
        </button>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 bg-onyx/80 flex flex-col">
            <div className="flex justify-between items-center p-4 bg-parchment border-b border-onyx/10">
              <span className="text-xs uppercase tracking-widest text-onyx">Live Preview</span>
              <button onClick={() => setMobileOpen(false)} className="text-onyx/60 hover:text-onyx">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 bg-white">{iframe}</div>
          </div>
        )}
      </>
    );
  }

  // Desktop: sticky panel
  return (
    <div className="sticky top-6 self-start">
      <div className="border border-onyx/10 bg-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b border-onyx/10 bg-mist/30">
          <span className="text-[10px] uppercase tracking-widest text-onyx/50 flex items-center gap-1.5">
            <Eye className="w-3 h-3" /> Live Preview
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setShowMobile(false)}
              className={`p-1 ${!showMobile ? "text-onyx" : "text-onyx/30"}`}
              aria-label="Desktop view"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setShowMobile(true)}
              className={`p-1 ${showMobile ? "text-onyx" : "text-onyx/30"}`}
              aria-label="Mobile view"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <div
          className="bg-white"
          style={{
            height: showMobile ? "640px" : "640px",
            maxWidth: showMobile ? "390px" : "100%",
            margin: showMobile ? "0 auto" : undefined,
          }}
        >
          {iframe}
        </div>
      </div>
      <p className="text-[10px] text-onyx/30 text-center mt-2 uppercase tracking-widest">
        Updates instantly — no save needed
      </p>
    </div>
  );
}
