import { useParams, useOutletContext, Link } from "react-router-dom";
import {
  MapPin,
  Clock,
  CalendarDays,
  Phone,
  Mail,
  Navigation,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";
import { type UserEvent } from "../../lib/supabase";
import { formatDate, formatTime } from "../../lib/utils";

export type Lang = "en" | "id";

export default function RustyContact() {
  const { slug } = useParams<{ slug: string }>();
  const { event } = useOutletContext<{ event: UserEvent }>();

  const eventSlug = slug || event.slug || event.id;

  // Build a maps query from venue + address
  const mapQuery = [event.venue, event.address].filter(Boolean).join(", ");
  const mapUrl = mapQuery
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`
    : null;

  return (
    <div className="min-h-screen bg-[#F5ECD7] text-[#3D3528] font-sans">
      {/* Nav */}
      <nav className="sticky top-0 z-20 bg-[#F5ECD7]/95 backdrop-blur-sm border-b border-[#D4C695]">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            to={`/${eventSlug}/home`}
            className="font-heading text-xl tracking-wide"
            style={{ color: "#B8962E" }}
          >
            {event?.name || "Our Wedding"}
          </Link>
          <Link
            to={`/${eventSlug}/home`}
            className="flex items-center gap-1 text-xs uppercase tracking-[0.15em] hover:opacity-70"
            style={{ color: "#3D3528" }}
          >
            <ArrowLeft className="w-3 h-3" /> Back
          </Link>
        </div>
      </nav>

      {/* Header */}
      <section className="max-w-2xl mx-auto px-6 pt-16 pb-8 text-center animate-fade-in-up">
        <MapPin className="w-10 h-10 mx-auto mb-4" style={{ color: "#B8962E" }} />
        <p
          className="font-heading italic text-sm uppercase tracking-[0.3em] mb-2"
          style={{ color: "#B8962E" }}
        >
          Find Us
        </p>
        <h1 className="font-heading text-4xl sm:text-5xl tracking-wide mb-3">
          Venue &amp; Contact
        </h1>
        <GoldDivider />
      </section>

      {/* Event summary */}
      <section className="max-w-2xl mx-auto px-6 pb-8">
        <div
          className="flex flex-col items-center gap-5 px-8 py-10 text-center"
          style={{ border: "1px solid #D4C695", backgroundColor: "#FAF3E0" }}
        >
          {event.event_date && (
            <InfoRow
              icon={<CalendarDays className="w-5 h-5" />}
              label="Date"
              value={formatDate(event.event_date)}
            />
          )}
          {event.event_time && (
            <InfoRow
              icon={<Clock className="w-5 h-5" />}
              label="Time"
              value={formatTime(event.event_time)}
            />
          )}
          {event.venue && (
            <InfoRow
              icon={<MapPin className="w-5 h-5" />}
              label="Venue"
              value={event.venue}
            />
          )}
          {event.address && (
            <InfoRow
              icon={<Navigation className="w-5 h-5" />}
              label="Address"
              value={event.address}
            />
          )}
        </div>
      </section>

      {/* Map placeholder */}
      {mapUrl && (
        <section className="max-w-2xl mx-auto px-6 pb-8">
          <div
            className="relative w-full h-64 flex items-center justify-center overflow-hidden"
            style={{ border: "1px solid #D4C695", backgroundColor: "#FAF3E0" }}
          >
            {/* Stylized map placeholder */}
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  "linear-gradient(#D4C695 1px, transparent 1px), linear-gradient(90deg, #D4C695 1px, transparent 1px)",
                backgroundSize: "40px 40px",
              }}
              aria-hidden
            />
            <div className="relative z-10 flex flex-col items-center gap-3">
              <div
                className="flex items-center justify-center w-14 h-14 rounded-full"
                style={{ backgroundColor: "#B8962E" }}
              >
                <MapPin className="w-7 h-7" style={{ color: "#FAF3E0" }} />
              </div>
              <p className="text-sm font-medium" style={{ color: "#3D3528" }}>
                {event.venue || "Venue Location"}
              </p>
              {event.address && (
                <p className="text-xs max-w-xs text-center" style={{ color: "#8B7355" }}>
                  {event.address}
                </p>
              )}
            </div>
          </div>
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex items-center justify-center gap-2 text-xs uppercase tracking-[0.2em] transition-colors hover:opacity-70"
            style={{ color: "#B8962E" }}
          >
            <ExternalLink className="w-3 h-3" />
            Open in Google Maps
          </a>
        </section>
      )}

      {/* Contact info */}
      <section className="max-w-2xl mx-auto px-6 pb-16">
        <div className="text-center mb-8">
          <p
            className="font-heading italic text-sm uppercase tracking-[0.3em] mb-2"
            style={{ color: "#B8962E" }}
          >
            Get in Touch
          </p>
          <h2 className="font-heading text-3xl tracking-wide">Contact</h2>
        </div>
        <GoldDivider />
        <div
          className="flex flex-col items-center gap-5 px-8 py-10 text-center"
          style={{ border: "1px solid #D4C695", backgroundColor: "#FAF3E0" }}
        >
          <p className="text-sm max-w-md" style={{ color: "#8B7355" }}>
            Have questions about the event? Need directions or special
            arrangements? We're here to help.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4 mt-2">
            <ContactPill
              icon={<Phone className="w-4 h-4" />}
              label="Call Us"
              href="tel:+10000000000"
            />
            <ContactPill
              icon={<Mail className="w-4 h-4" />}
              label="Email Us"
              href="mailto:hello@example.com"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#D4C695] bg-[#FAF3E0]">
        <div className="max-w-2xl mx-auto px-6 py-8 text-center">
          <p
            className="font-heading text-lg tracking-wide mb-1"
            style={{ color: "#B8962E" }}
          >
            {event?.name || "Our Wedding"}
          </p>
          <p className="text-xs" style={{ color: "#8B7355" }}>
            We can't wait to celebrate with you.
          </p>
        </div>
      </footer>
    </div>
  );
}

function GoldDivider() {
  return (
    <div className="flex items-center justify-center gap-3 my-6" aria-hidden>
      <span className="block h-px w-16" style={{ backgroundColor: "#B8962E" }} />
      <span className="text-lg" style={{ color: "#B8962E" }}>❦</span>
      <span className="block h-px w-16" style={{ backgroundColor: "#B8962E" }} />
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="flex items-center gap-2 text-xs uppercase tracking-[0.2em]"
        style={{ color: "#B8962E" }}
      >
        {icon}
        {label}
      </div>
      <p className="text-base text-center max-w-md">{value}</p>
    </div>
  );
}

function ContactPill({
  icon,
  label,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-2 px-6 py-3 text-xs uppercase tracking-[0.2em] transition-all hover:opacity-80"
      style={{
        border: "1px solid #B8962E",
        backgroundColor: "transparent",
        color: "#B8962E",
      }}
    >
      {icon}
      {label}
    </a>
  );
}
