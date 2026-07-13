import { useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import type { UserEvent } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { themeToEventCssVars } from "../../lib/theme";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Toast, type ToastType } from "../../components/ui";

export default function GuestLoginPage() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const navigate = useNavigate();
  const { signIn } = useGuestAuth();
  const [name, setName] = useState("");
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const config = event.login_config ?? {};
  const cssVars = themeToEventCssVars(event.theme);

  const bgStyle: React.CSSProperties = {};
  if (config.bgImage) {
    bgStyle.backgroundImage = `url(${config.bgImage})`;
    bgStyle.backgroundSize = "cover";
    bgStyle.backgroundPosition = "center";
  } else if (config.bgColor) {
    bgStyle.backgroundColor = config.bgColor;
  }

  const overlayStyle: React.CSSProperties = {};
  if (config.overlayColor) {
    overlayStyle.backgroundColor = config.overlayColor;
    overlayStyle.opacity = config.overlayOpacity ?? 0.25;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setToast({ message: "Please enter your name", type: "error" });
      return;
    }
    signIn(name.trim(), event.id);
    navigate("home");
  };

  return (
    <div
      className="event-themed relative flex min-h-screen flex-col items-center justify-center px-6 py-16 text-center"
      style={cssVars}
    >
      <div className="absolute inset-0" style={bgStyle} />
      <div className="absolute inset-0" style={overlayStyle} />

      <div className="relative z-10 flex w-full max-w-xs flex-col items-center">
        {config.logo && (
          <img
            src={config.logo}
            alt="Logo"
            style={{ width: config.logoWidth ?? 120 }}
            className="mb-6"
          />
        )}

        {config.heading && (
          <h2
            className="font-heading text-3xl md:text-4xl"
            style={{ color: config.textColor ?? "inherit" }}
          >
            {config.heading}
          </h2>
        )}

        {config.subheading && (
          <p
            className="font-body mt-2 text-sm"
            style={{ color: config.textColor ?? "inherit" }}
          >
            {config.subheading}
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-6 w-full">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={config.inputPlaceholder ?? "Enter your name"}
            className="bg-white/90"
            autoFocus
          />
          <Button
            type="submit"
            className="mt-4 w-full"
            style={{
              backgroundColor: config.buttonColor ?? "var(--event-primary)",
              color: "#ffffff",
              borderRadius: "var(--event-button-radius)",
            }}
          >
            {config.buttonText ?? "Enter"}
          </Button>
        </form>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
