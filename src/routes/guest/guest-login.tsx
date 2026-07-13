import { useParams, useOutletContext, useNavigate } from "react-router-dom";
import { type UserEvent } from "../../lib/supabase";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { useGuestAuth } from "../../lib/guest-auth";
import { useState } from "react";

type Ctx = { event: UserEvent };
export default function GuestLoginPage() {
  const { event } = useOutletContext<Ctx>();
  const { slug } = useParams();
  const navigate = useNavigate();
  const { signIn } = useGuestAuth();
  const [name, setName] = useState("");
  const config = event.login_config || {};
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Please enter your name"); return; }
    signIn(name.trim(), event.id);
    navigate(`/e/${slug}/home`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: config.bgColor || "#1a1a1a" }}>
      <div className="w-full max-w-sm text-center">
        {config.bgImage && <img src={config.bgImage} alt="" className="w-full h-48 object-cover rounded-lg mb-8 opacity-80" />}
        {config.logo && <img src={config.logo} alt="Logo" style={{ width: config.logoWidth ? `${config.logoWidth}px` : "100px" }} className="mx-auto mb-6 object-contain" />}
        <h1 className="font-heading text-3xl mb-2" style={{ color: config.textColor || "#fff" }}>{config.heading || "Welcome"}</h1>
        <p className="text-sm mb-8" style={{ color: config.textColor || "#fff", opacity: 0.7 }}>{config.subheading || "Please enter your name to continue"}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input value={name} onChange={(e) => { setName(e.target.value); setError(null); }} placeholder={config.inputPlaceholder || "Your name"} className="text-center" style={{ background: "rgba(255,255,255,0.1)", borderColor: "rgba(255,255,255,0.2)", color: config.textColor || "#fff" }} />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button type="submit" className="w-full">{config.buttonText || "Continue"}</Button>
        </form>
      </div>
    </div>
  );
}
