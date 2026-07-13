import { useEffect, useRef, useState } from "react";
import { Eye, X, Smartphone, Monitor } from "lucide-react";

type Props = {
  slug: string;
  page?: "cover" | "invitation" | "info" | "events";
};

export function WebsitePreview({ slug, page = "cover" }: Props) {
  const [origin, setOrigin] = useState("");
  const [mobile, setMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => { setOrigin(window.location.origin); }, []);
  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const previewUrl = page === "cover" ? `${origin}/w/${slug}` : `${origin}/w/${slug}/${page}`;
  const iframe = <iframe ref={iframeRef} src={previewUrl} title="Preview" className="w-full h-full border-0" sandbox="allow-scripts allow-same-origin" />;

  if (mobile) {
    return (
      <>
        <button onClick={() => setMobileOpen(true)} className="fixed bottom-6 right-6 z-50 bg-onyx text-parchment px-4 py-3 text-xs uppercase tracking-widest shadow-lg flex items-center gap-2 hover:bg-ink">
          <Eye className="w-4 h-4" /> Preview
        </button>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 bg-onyx/80 flex flex-col">
            <div className="flex justify-between items-center p-4 bg-parchment border-b border-onyx/10">
              <span className="text-xs uppercase tracking-widest text-onyx">Live Preview</span>
              <button onClick={() => setMobileOpen(false)} className="text-onyx/60 hover:text-onyx"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 bg-white">{iframe}</div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="sticky top-6 self-start">
      <div className="border border-onyx/10 bg-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b border-onyx/10 bg-mist/30">
          <span className="text-[10px] uppercase tracking-widest text-onyx/50 flex items-center gap-1.5"><Eye className="w-3 h-3" /> Live Preview</span>
          <div className="flex gap-1">
            <button onClick={() => setMobile(false)} className={`p-1 ${!mobile ? "text-onyx" : "text-onyx/30"}`}><Monitor className="w-3.5 h-3.5" /></button>
            <button onClick={() => setMobile(true)} className={`p-1 ${mobile ? "text-onyx" : "text-onyx/30"}`}><Smartphone className="w-3.5 h-3.5" /></button>
          </div>
        </div>
        <div className="bg-white" style={{ height: "640px", maxWidth: mobile ? "390px" : "100%", margin: mobile ? "0 auto" : undefined }}>{iframe}</div>
      </div>
      <p className="text-[10px] text-onyx/30 text-center mt-2 uppercase tracking-widest">Updates instantly — no save needed</p>
    </div>
  );
}
