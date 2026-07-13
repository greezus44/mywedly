import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmail, signUpWithEmail, signInWithGoogle, useHostSession } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

export function HostLogin() {
  const navigate = useNavigate();
  const { session } = useHostSession();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (session) {
    navigate("/admin");
    return null;
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fn = mode === "signin" ? signInWithEmail : signUpWithEmail;
    const { error } = await fn(email, password);
    setLoading(false);
    if (error) setError(error.message);
    else navigate("/admin");
  };

  const google = async () => {
    setError(null);
    const { error } = await signInWithGoogle();
    if (error) setError(error.message);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-mist px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-center text-3xl font-serif text-onyx mb-2">Wedding Studio</h1>
        <p className="text-center text-sepia text-sm mb-8">Host dashboard login</p>
        <button onClick={google} className="w-full flex items-center justify-center gap-3 border border-sand bg-white py-3 text-sm text-onyx rounded-md hover:bg-mist transition-colors mb-4">
          <GoogleIcon />
          Continue with Google
        </button>
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-sand" />
          <span className="text-xs text-sepia/60 uppercase tracking-widest">or</span>
          <div className="flex-1 h-px bg-sand" />
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
          </div>
          <div>
            <Label>Password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Please wait…" : mode === "signin" ? "Sign In" : "Sign Up"}
          </Button>
        </form>
        <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="w-full text-center text-sepia text-sm mt-4 hover:text-onyx">
          {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
