import { useParams, useOutletContext, Link } from "react-router-dom";
import { type UserEvent } from "../../lib/supabase";
import { RichTextContent } from "../../lib/sanitize";
import { getCountdown, formatDate } from "../../lib/utils";
import { Calendar, MapPin, Clock } from "lucide-react";

type Ctx = { event: UserEvent };
export default function GuestHomePage() {
  const { event } = useOutletContext<Ctx>();
  const { slug } = useParams();
  const content = event.content || {};
  const countdown = event.event_date ? getCountdown(event.event_date) : null;

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        {content.rich_title ? <RichTextContent html={content.rich_title} className="font-heading text-4xl md:text-5xl mb-4" /> : <h1 className="font-heading text-4xl md:text-5xl mb-4">{event.name}</h1>}
        {content.rich_subtitle && <RichTextContent html={content.rich_subtitle} className="text-lg mb-8 opacity-80" />}
        {countdown && !countdown.isPast && (
          <div className="grid grid-cols-4 gap-4 my-12">
            {[{ label: "Days", value: countdown.days }, { label: "Hours", value: countdown.hours }, { label: "Minutes", value: countdown.minutes }, { label: "Seconds", value: countdown.seconds }].map((t) => (
              <div key={t.label} className="text-center"><p className="font-heading text-3xl">{t.value}</p><p className="text-xs uppercase tracking-wider opacity-60 mt-1">{t.label}</p></div>
            ))}
          </div>
        )}
        {content.rich_body && <RichTextContent html={content.rich_body} className="prose prose-sm max-w-none mt-8 text-left" />}
        {event.event_date && (
          <div className="mt-12 space-y-2 text-sm">
            <div className="flex items-center justify-center gap-2"><Calendar className="w-4 h-4 opacity-60" />{formatDate(event.event_date)}</div>
            {event.event_time && <div className="flex items-center justify-center gap-2"><Clock className="w-4 h-4 opacity-60" />{event.event_time}</div>}
            {event.venue && <div className="flex items-center justify-center gap-2"><MapPin className="w-4 h-4 opacity-60" />{event.venue}</div>}
          </div>
        )}
        <div className="mt-12 flex flex-wrap gap-4 justify-center">
          <Link to={`/e/${slug}/rsvp`} className="px-8 py-3 bg-current text-inverted rounded-full text-sm font-medium hover:opacity-90 transition-opacity">RSVP Now</Link>
          <Link to={`/e/${slug}/wishes`} className="px-8 py-3 border border-current rounded-full text-sm font-medium hover:opacity-80 transition-opacity">Leave a Wish</Link>
        </div>
      </div>
    </div>
  );
}
