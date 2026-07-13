import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Heart, ArrowRight } from "lucide-react";

export function Landing() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <Heart className="mx-auto h-16 w-16 text-rose-400 mb-6" />
        <h1 className="text-4xl font-bold text-gray-900 mb-3">Wedding Invitation Platform</h1>
        <p className="text-lg text-gray-600 mb-8">Create beautiful, customisable digital wedding invitations with QR codes, RSVP management, and more.</p>
        <div className="flex gap-3 justify-center">
          <Button size="lg" onClick={() => navigate("/host-login")}>Host Login <ArrowRight className="ml-2 h-4 w-4" /></Button>
          <Button size="lg" variant="outline" onClick={() => navigate("/w/demo")}>View Demo</Button>
        </div>
      </div>
    </div>
  );
}
