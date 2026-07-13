import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Heart, ArrowRight } from "lucide-react";

export function Landing() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-900 mb-6"><Heart className="h-8 w-8 text-white" /></div>
        <h1 className="text-4xl font-heading font-light text-gray-900 mb-3 tracking-tight">Wedding Invitation Platform</h1>
        <p className="text-lg text-gray-500 mb-8 font-light leading-relaxed">Create beautiful, customisable digital wedding invitations with QR codes, RSVP management, and premium guest experiences.</p>
        <div className="flex gap-3 justify-center">
          <Button size="lg" onClick={() => navigate("/admin-login")}>Admin Login <ArrowRight className="ml-2 h-4 w-4" /></Button>
          <Button size="lg" variant="outline" onClick={() => navigate("/w/demo")}>View Demo</Button>
        </div>
      </div>
    </div>
  );
}
