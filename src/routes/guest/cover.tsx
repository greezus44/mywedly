import { useParams, useOutletContext, useNavigate } from "react-router-dom";
import { type UserEvent } from "../../lib/supabase";
import { useEffect } from "react";

type Ctx = { event: UserEvent };
export default function GuestCoverPage() {
  const { event } = useOutletContext<Ctx>();
  const navigate = useNavigate();
  const { slug } = useParams();
  const config = event.cover_config || {};

  useEffect(() => { const t = setTimeout(() => navigate(`/e/${slug}/login`), 5000); return () => clearTimeout(t); }, []);

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden" style={{ background: config.bgColor || "#1a1a1a" }}>
      {config.bgImage && <img src={config.bgImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />}
      <div className="relative z-10 text-center px-6 max-w-2xl animate-fade-in-up">
        {config.logo && <img src={config.logo} alt="Logo" style={{ width: config.logoWidth ? `${config.logoWidth}px` : "120px" }} className="mx-auto mb-6 object-contain" />}
        {config.customText && <p className="text-sm italic mb-4 opacity-80 font-script">{config.customText}</p>}
        <h1 className="font-heading text-5xl md:text-7xl leading-tight" style={{ color: config.textColor || "#fff" }}>{event.name}</h1>
        {config.showDate && event.event_date && <p className="text-sm uppercase tracking-[0.3em] mt-6" style={{ color: config.textColor || "#fff", opacity: 0.7 }}>{new Date(event.event_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>}
        {event.venue && <p className="mt-6 text-sm" style={{ color: config.textColor || "#fff", opacity: 0.6 }}>{event.venue}</p>}
        <button onClick={() => navigate(`/e/${slug}/login`)} className="mt-10 px-8 py-3 border text-sm font-medium hover:bg-white/10 transition-all rounded-full animate-fade-in" style={{ borderColor: config.textColor || "#fff", color: config.textColor || "#fff" }}>{config.buttonText || "Enter"}</button>
      </div>
    </div>
  );
}
