import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { FormField, ErrorState, Toast } from "../components/ui/index";
import { ArrowLeft, LogOut, Mail, Lock } from "lucide-react";

export default function Account() {
  const navigate = useNavigate();

  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data, error }) => {
      if (error || !data.user) {
        setError("Could not load user data");
        setLoading(false);
        return;
      }
      setEmail(data.user.email || "");
      setLoading(false);
    });
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) { setToast({ message: "Password must be at least 6 characters", type: "error" }); return; }
    if (newPassword !== confirmPassword) { setToast({ message: "Passwords do not match", type: "error" }); return; }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setToast({ message: "Password updated", type: "success" });
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setToast({ message: "Failed: " + err.message, type: "error" });
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) return <div className="max-w-2xl mx-auto py-12"><div className="animate-pulse bg-gray-100 rounded-xl h-64" /></div>;
  if (error) return <ErrorState message={error} onRetry={() => navigate("/dashboard")} />;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>

      <div>
        <h1 className="text-xl font-bold text-gray-900">Account</h1>
        <p className="text-sm text-gray-500">Manage your account settings</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900">Profile</h3>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <Mail className="w-5 h-5 text-gray-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Email</p>
            <p className="text-sm font-medium text-gray-900">{email}</p>
          </div>
        </div>
        <Button variant="secondary" onClick={handleSignOut}><LogOut className="w-4 h-4" /> Sign Out</Button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900">Change Password</h3>
        </div>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <FormField label="New Password">
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" required />
          </FormField>
          <FormField label="Confirm Password">
            <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter new password" required />
          </FormField>
          <Button type="submit" loading={changingPassword}>Update Password</Button>
        </form>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
