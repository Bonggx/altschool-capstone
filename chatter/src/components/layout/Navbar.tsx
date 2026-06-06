import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useNotifications } from "../../hooks/useNotifications";
import Avatar from "../ui/Avatar";
import Button from "../ui/Button";
import SignInPrompt from "../ui/SignInPrompt";

export default function Navbar() {
  const { user, profile, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { unreadNotifications, unreadMessages } = useNotifications();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [promptMessage, setPromptMessage] = useState("Sign in to continue");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setMenuOpen(false);
    await signOut();
    navigate("/");
  };

  // Show sign in prompt for guests trying to access protected features
  function guestClick(message: string) {
    setPromptMessage(message);
    setShowPrompt(true);
  }

  return (
    <>
      <nav className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <Link
              to="/"
              className="text-2xl font-black text-gray-900 hover:text-brand-600 transition-colors"
              style={{ fontFamily: "Playfair Display, serif", letterSpacing: "-0.5px" }}
            >
              Chatter
            </Link>
            <Link to="/" className="hidden sm:flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6" />
              </svg>
              Home
            </Link>
          </div>

          {/* Search */}
          <div className="flex flex-1 max-w-sm">
            <input
              type="text"
              placeholder="Search..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (!user) {
                    guestClick("Sign in to search for people and posts");
                    return;
                  }
                  navigate(`/search?q=${(e.target as HTMLInputElement).value}`);
                }
              }}
              className="w-full px-4 py-1.5 text-sm text-gray-900 placeholder-gray-400 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            />
          </div>

          {/* Right side */}
          <div className="flex items-center gap-1 flex-shrink-0">

            {/* Dark mode toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-500 hover:text-brand-600 hover:bg-brand-50 transition-colors"
            >
              {isDark ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                </svg>
              )}
            </button>

            {/* Notification bell */}
            {user ? (
              <Link to="/notifications" className="relative p-2 rounded-lg hover:bg-brand-50 transition-colors">
                <svg className={`w-5 h-5 ${isDark ? "text-brand-400" : "text-gray-900"}`} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zm0 16a2 2 0 01-2-2h4a2 2 0 01-2 2z" />
                </svg>
                {unreadNotifications > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-0.5 bg-brand-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {unreadNotifications > 9 ? "9+" : unreadNotifications}
                  </span>
                )}
              </Link>
            ) : (
              <button onClick={() => guestClick("Sign in to see your notifications")} className="p-2 rounded-lg hover:bg-brand-50 transition-colors">
                <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zm0 16a2 2 0 01-2-2h4a2 2 0 01-2 2z" />
                </svg>
              </button>
            )}

            {/* Messages envelope */}
            {user ? (
              <Link to="/messages" className="relative p-2 rounded-lg hover:bg-brand-50 transition-colors">
                <svg className={`w-5 h-5 ${isDark ? "text-brand-400" : "text-gray-900"}`} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                {unreadMessages > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-0.5 bg-brand-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {unreadMessages > 9 ? "9+" : unreadMessages}
                  </span>
                )}
              </Link>
            ) : (
              <button onClick={() => guestClick("Sign in to send and receive messages")} className="p-2 rounded-lg hover:bg-brand-50 transition-colors">
                <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </button>
            )}

            {user ? (
              <>
                <Link to="/write" className="ml-1">
                  <Button size="sm" variant="outline">Write</Button>
                </Link>
                <div className="relative ml-1" ref={menuRef}>
                  <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center focus:outline-none">
                    <Avatar src={profile?.avatar_url} name={profile?.full_name} size="sm" />
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl border border-gray-200 shadow-lg py-1 z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900">{profile?.full_name}</p>
                        <p className="text-xs text-gray-500">@{profile?.username}</p>
                      </div>
                      <Link to="/" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Home</Link>
                      <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Dashboard</Link>
                      <Link to={`/profile/${profile?.username}`} onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Profile</Link>
                      <Link to="/notifications" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Notifications</Link>
                      <Link to="/messages" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Messages</Link>
                      <Link to="/write" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Write</Link>
                      <div className="border-t border-gray-100 mt-1 pt-1">
                        <button onClick={handleSignOut} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Sign out</button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/signin"><Button size="sm" variant="ghost">Sign in</Button></Link>
                <Link to="/signup"><Button size="sm">Get started</Button></Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Guest restriction popup */}
      <SignInPrompt
        isOpen={showPrompt}
        onClose={() => setShowPrompt(false)}
        message={promptMessage}
      />
    </>
  );
}
