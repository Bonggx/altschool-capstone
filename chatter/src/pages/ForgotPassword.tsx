import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  // Tracks whether the reset email was successfully sent
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Supabase sends a magic link to the email address
    // The redirectTo tells Supabase where to send the user after they click the link
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }

    setLoading(false);
  };

  // Shows a success screen after the email is sent
  if (sent) {
    return (
      <main className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h2>
          <p className="text-gray-500 mb-6">
            We sent a password reset link to <strong>{email}</strong>. Click the link to set a new password.
          </p>
          <Link to="/signin">
            <Button variant="secondary">Back to sign in</Button>
          </Link>
        </div>
      </main>
    );
  }

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
          <h1 className="text-xl font-bold text-gray-900 mt-4 mb-1">Forgot your password?</h1>
          <p className="text-gray-500 text-sm">Enter your email and we will send you a reset link.</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Email input */}
            <Input
              label="Email address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            {/* Error message if Supabase returns one */}
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" loading={loading} className="w-full">
              Send reset link
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            Remember your password?{" "}
            <Link to="/signin" className="text-brand-600 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
