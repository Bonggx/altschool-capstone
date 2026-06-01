import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic client-side validation before hitting Supabase
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    // Make sure both fields match before submitting
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    // updateUser updates the currently authenticated user's password
    // Supabase handles the session from the magic link automatically
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
    } else {
      // Password updated successfully — send the user to sign in
      navigate("/signin");
    }

    setLoading(false);
  };

  return (
    <main className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Page header */}
        <div className="text-center mb-8">
          <Link
            to="/"
            className="text-2xl font-black text-gray-900 hover:text-brand-600"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            Chatter
          </Link>
          <h1 className="text-xl font-bold text-gray-900 mt-4 mb-1">Set a new password</h1>
          <p className="text-gray-500 text-sm">Choose a strong password for your account.</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* New password field */}
            <Input
              label="New password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              hint="At least 8 characters"
              required
            />

            {/* Confirmation field — must match the field above */}
            <Input
              label="Confirm new password"
              type="password"
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />

            {/* Error message */}
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" loading={loading} className="w-full">
              Update password
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
