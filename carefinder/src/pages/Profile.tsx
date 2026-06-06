import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { supabase, getStorageUrl } from "../lib/supabase";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

export default function Profile() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();

  const [fullName, setFullName] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) navigate("/signin");
  }, [user]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
      setAvatarPreview(profile.avatar_url ?? null);
    }
  }, [profile]);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    setError(null);
    setSuccess(false);

    let avatarUrl = profile?.avatar_url ?? null;

    if (avatarFile) {
      const ext = avatarFile.name.split(".").pop();
      const path = `avatars/${user.id}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("carefinder")
        .upload(path, avatarFile, { upsert: true });
      if (!uploadError) avatarUrl = getStorageUrl("carefinder", path);
      else {
        setError("Failed to upload photo. Please try again.");
        setSaving(false);
        return;
      }
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ full_name: fullName, avatar_url: avatarUrl })
      .eq("id", user.id);

    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess(true);
      setAvatarFile(null);
      await refreshProfile();
    }

    setSaving(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate("/");
  }

  if (!user) return null;

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-serif text-3xl font-bold text-gray-900 mb-8">Your Profile</h1>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 flex flex-col gap-6">

        <div className="flex items-center gap-5">
          <div className="relative">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Avatar"
                className="w-16 h-16 rounded-full object-cover border-2 border-brand-200"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-300 to-brand-500 flex items-center justify-center text-white text-xl font-bold">
                {fullName?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase()}
              </div>
            )}
          </div>
          <label className="cursor-pointer text-sm font-medium text-brand-600 hover:text-brand-800 transition-colors">
            Change photo
            <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
          </label>
        </div>

        <Input
          label="Full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <p className="text-sm text-gray-400 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
            {user.email}
          </p>
        </div>

        {/* Show admin badge if user is admin */}
        {profile?.role === "admin" && (
          <div className="flex items-center gap-2 px-3 py-2 bg-brand-50 border border-brand-200 rounded-xl">
            <svg className="w-4 h-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className="text-sm font-medium text-brand-600">Admin account</span>
          </div>
        )}

        {success && (
          <p className="text-sm text-green-600 bg-green-50 border border-green-100 rounded-xl px-3 py-2">
            Profile updated successfully.
          </p>
        )}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex justify-between items-center pt-2">
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            Sign out
          </Button>
          <Button loading={saving} onClick={handleSave}>
            Save changes
          </Button>
        </div>
      </div>
    </div>
  );
}
