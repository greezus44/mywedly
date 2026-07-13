import { useState, useEffect, useCallback } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { User, Mail, Lock, Trash2, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { supabase, Wedding } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card, FormField, Modal, Toast, ErrorState } from "../../components/ui/index";

type OutletContext = { wedding: Wedding | null };

export default function AccountPage() {
  const { wedding } = useOutletContext<OutletContext>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [userEmail, setUserEmail] = useState<string>("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserEmail(user.email || "");
    })();
  }, []);

  const handleChangePassword = useCallback(async () => {
    if (!newPassword || newPassword.length < 6) {
      setToast({ msg: "Password must be at least 6 characters", type: "error" });
      setTimeout(() => setToast(null), 3000);
      return;
    }
    if (newPassword !== confirmPassword) {
      setToast({ msg: "Passwords do not match", type: "error" });
      setTimeout(() => setToast(null), 3000);
      return;
    }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setToast({ msg: "Password changed successfully!", type: "success" });
      setTimeout(() => setToast(null), 3000);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setToast({ msg: "Failed: " + err.message, type: "error" });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setChangingPassword(false);
    }
  }, [newPassword, confirmPassword]);

  const handleDeleteAccount = useCallback(async () => {
    if (deleteConfirm !== "DELETE") return;
    setDeleting(true);
    try {
      if (wedding) {
        await supabase.from("weddings").delete().eq("id", wedding.id);
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.auth.signOut();
      }
      queryClient.clear();
      navigate("/");
    } catch (err: any) {
      setToast({ msg: "Failed: " + err.message, type: "error" });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setDeleting(false);
    }
  }, [wedding, deleteConfirm, queryClient, navigate]);

  if (!wedding) return <ErrorState message="Could not load wedding data" onRetry={() => navigate("/admin")} />;

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Account Settings</h1>
        <p className="text-sm text-gray-500">Manage your account and security</p>
      </div>

      {/* Profile */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600"><User className="w-5 h-5" /></div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Profile</h3>
            <p className="text-xs text-gray-500">Your account information</p>
          </div>
        </div>
        <div className="space-y-3">
          <FormField label="Email Address">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-400" />
              <Input value={userEmail} readOnly disabled className="bg-gray-50" />
            </div>
          </FormField>
        </div>
      </Card>

      {/* Change Password */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600"><Lock className="w-5 h-5" /></div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Change Password</h3>
            <p className="text-xs text-gray-500">Update your account password</p>
          </div>
        </div>
        <div className="space-y-3">
          <FormField label="New Password">
            <div className="relative">
              <Input type={showPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" className="pr-10" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </FormField>
          <FormField label="Confirm Password">
            <Input type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" />
          </FormField>
          <Button onClick={handleChangePassword} loading={changingPassword} disabled={!newPassword || !confirmPassword}>
            <Lock className="w-4 h-4" /> Change Password
          </Button>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="p-6 border-red-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-red-600"><AlertTriangle className="w-5 h-5" /></div>
          <div>
            <h3 className="text-sm font-semibold text-red-900">Danger Zone</h3>
            <p className="text-xs text-red-500">Irreversible actions</p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-4 p-4 border border-red-200 rounded-lg bg-red-50">
          <div>
            <p className="text-sm font-medium text-gray-900">Delete Account</p>
            <p className="text-xs text-gray-500">Permanently delete your account and all wedding data</p>
          </div>
          <Button variant="danger" size="sm" onClick={() => setDeleteModalOpen(true)}><Trash2 className="w-4 h-4" /> Delete</Button>
        </div>
      </Card>

      {/* Delete Modal */}
      <Modal open={deleteModalOpen} onClose={() => { setDeleteModalOpen(false); setDeleteConfirm(""); }} title="Delete Account" size="sm">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">This will permanently delete your account, wedding website, and all associated data. This action cannot be undone.</p>
          </div>
          <FormField label='Type "DELETE" to confirm'>
            <Input value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} placeholder="DELETE" />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setDeleteModalOpen(false); setDeleteConfirm(""); }}>Cancel</Button>
            <Button variant="danger" onClick={handleDeleteAccount} loading={deleting} disabled={deleteConfirm !== "DELETE"}><Trash2 className="w-4 h-4" /> Delete Forever</Button>
          </div>
        </div>
      </Modal>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
