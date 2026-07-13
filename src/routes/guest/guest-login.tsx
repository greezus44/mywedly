import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOutletContext } from "react-router-dom";
import { supabase, type UserEvent, type SubEvent, type ScheduleItem } from "../../lib/supabase";
import { cn } from "../../lib/utils";
import { useGuestAuth } from "../../lib/guest-auth";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { ArrowRight, User } from "lucide-react";

interface OutletContext {
  event: UserEvent;
  subEvents: SubEvent[];
  schedule: ScheduleItem[];
}

export default function GuestLogin() {
  const navigate = useNavigate();
  const { event } = useOutletContext<OutletContext>();
  const { signIn } = useGuestAuth();
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loginConfig = event.login_config || {};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Please enter your name to continue.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      signIn(trimmed, event.id);
      navigate(`./home`);
    } catch (err) {
      setError("Something went wrong. Please try again.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const bgColor = loginConfig.bgColor || "var(--color-bg)";
  const textColor = loginConfig.textColor || "var(--color-text)";
  const heading = loginConfig.heading || "Welcome";
  const subheading = loginConfig.subheading || "Please enter your name to continue";
  const placeholder = loginConfig.inputPlaceholder || "Your full name";
  const buttonText = loginConfig.buttonText || "Continue";

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="font-heading text-4xl md:text-5xl tracking-tight">{heading}</h1>
          <p className="mt-4 text-sm opacity-70">{subheading}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={placeholder}
              autoFocus
              className={cn("pl-11 py-3 text-base")}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button
            type="submit"
            size="lg"
            loading={submitting}
            className="w-full justify-center"
          >
            {buttonText} <ArrowRight className="w-4 h-4" />
          </Button>
        </form>

        <p className="mt-8 text-center text-xs opacity-50">
          {event.name}
        </p>
      </div>
    </div>
  );
}
