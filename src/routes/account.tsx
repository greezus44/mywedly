import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, Lock, Mail, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { supabase } from "../lib/supabase";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card, FormField, Toast, ErrorState } from "../components/ui/index";

export default function AccountPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        navigate("/login");
        return;
      }
      setEmail(user.email || "");
    });
  }, [navigate]);

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    queryClient.clear();
    navigate("/login");
  }, [navigate, queryClient]);

  const handleChangePassword = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      if (!currentPassword || !newPassword || !confirmPassword) {
        setError("Please fill in all password fields");
        return;
      }
      if (newPassword !== confirmPassword) {
        setError("New passwords do not match");
        return;
      }
      if (newPassword.length < 6) {
        setError("New password must be at least 6 characters");
        return;
      }

      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.email) throw new Error("No user session");

        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: currentPassword,
        });
        if (signInError) throw new Error("Current password is incorrect");

        const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
        if (updateError) throw updateError;

        showToast("Password updated successfully");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } catch (err: any) {
        setError(err.message || "Failed to update password");
      } finally {
        setLoading(false);
      }
    },
    [currentPassword, newPassword, confirmPassword]
  );

  if (error && !email) return <ErrorState message={error} onRetry={() => navigate("/login")} />;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="px-4 lg:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/dashboard")} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center text-white text-xs font-bold">E</div>
            <span className="font-semibold text-gray-900 text-sm">Event Studio</span>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 lg:px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Account</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your account settings</p>
        </div>

        <Card className="p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">Profile</h3>
          <FormField label="Email">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-700">{email || "—"}</span>
            </div>
          </FormField>
          <p className="text-xs text-gray-500">Your email address is used for signing in and cannot be changed here.</p>
        </Card>

        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-900">Change Password</h3>
          </div>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <FormField label="Current Password">
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </FormField>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="New Password">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
              </FormField>
              <FormField label="Confirm New Password">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </FormField>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end">
              <Button type="submit" loading={loading}>
                Update Password
              </Button>
            </div>
          </form>
        </Card>

        <Card className="p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">Session</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Sign Out</p>
              <p className="text-xs text-gray-500">Sign out of your account on this device</p>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="w-4 h-4" /> Sign Out
            </Button>
          </div>
        </Card>
      </div>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
