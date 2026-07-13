import { Link } from "react-router-dom";
import { useWedding } from "@/lib/use-wedding";
import { styleWithGlobal } from "@/lib/text-styles";
import { PreserveText } from "@/components/guest/PreserveText";
import type { WeddingContent } from "@/lib/supabase";

export function GuestInvitation() {
  const slug = location.pathname.split("/")[2];
  const { wedding, loading, error } = useWedding(slug);
  if (loading) return <div className="min-h-screen flex items-center justify-center text-sepia">Loading…</div>;
  if (error || !wedding) return <div className="min-h-screen flex items-center justify-center text-red-600">{error ?? "Not found"}</div>;
  const content = (wedding.content ?? {}) as WeddingContent;
  const parents = (content.parents as string) ?? "";
  const invitationText = (content.invitation_text as string) ?? "Together with their families, we invite you to celebrate our wedding.";
  const closingText = (content.closing_text as string) ?? "We look forward to sharing this special day with you.";
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 py-16 bg-parchment">
      <div className="max-w-lg">
        {parents && <p className="mb-8" style={styleWithGlobal(content, "invitation_parents")}><PreserveText>{parents}</PreserveText></p>}
        <p className="mb-10 max-w-lg mx-auto" style={styleWithGlobal(content, "invitation_text")}><PreserveText>{invitationText}</PreserveText></p>
        <h2 className="text-4xl md:text-5xl font-script text-onyx mb-10">{wedding.couple_name_one} & {wedding.couple_name_two}</h2>
        <p className="my-10 max-w-lg mx-auto" style={styleWithGlobal(content, "invitation_closing")}><PreserveText>{closingText}</PreserveText></p>
        <Link to={`/w/${slug}/info`} className="inline-block border-2 border-sepia/70 rounded-md px-8 py-3 text-sepia text-xs uppercase tracking-widest hover:bg-sepia hover:text-parchment transition-colors">Continue</Link>
      </div>
    </div>
  );
}
