import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: any | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string, fullName: string) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signInWithGitHub: () => Promise<any>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  // Start with loading: false so pages render immediately
  // Auth state will update silently in the background
  const [loading, setLoading] = useState(false);

  async function fetchProfile(currentUser: User) {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();

      if (data) {
        setProfile(data);
      } else {
        // Create a profile automatically if one doesn't exist yet
        const username =
          currentUser.user_metadata?.user_name ||
          currentUser.user_metadata?.preferred_username ||
          currentUser.email?.split("@")[0] ||
          "user" + Date.now();

        const fullName =
          currentUser.user_metadata?.full_name ||
          currentUser.user_metadata?.name ||
          username;

        const { data: newProfile } = await supabase
          .from("profiles")
          .upsert({
            id: currentUser.id,
            username,
            full_name: fullName,
            avatar_url: currentUser.user_metadata?.avatar_url || null,
          })
          .select()
          .single();

        if (newProfile) setProfile(newProfile);
      }
    } catch (err) {
      console.error("Profile fetch error:", err);
    }
  }

  async function refreshProfile() {
    if (user) await fetchProfile(user);
  }

  useEffect(() => {
    // Listen for auth state changes in the background
    // This fires immediately with the current session if one exists
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user);
        } else {
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function signUp(email: string, password: string, username: string, fullName: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, username } },
    });
    if (error) throw error;
    if (data.user) {
      await supabase.from("profiles").upsert({
        id: data.user.id,
        username,
        full_name: fullName,
      });
    }
    return data;
  }

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async function signInWithGitHub() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: window.location.origin },
    });
    if (error) throw error;
  }

  async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.origin },
  });
  if (error) throw error;
}

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  }

  return (
    <AuthContext.Provider value={{
      user, session, profile, loading,
      signUp, signIn, signInWithGitHub, signOut, refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
