import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";
import Button from "../ui/Button";

export default function Navbar() {
  const { user, profile, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  function closeMenu() { setMenuOpen(false); }

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate("/");
    closeMenu();
  }

  function isActive(path: string) { return location.pathname === path; }

  const navLinkClass = (path: string) =>
    `text-sm font-medium transition-colors duration-150 ${
      isActive(path)
        ? "text-brand-600 border-b-2 border-brand-400 pb-0.5"
        : "text-gray-600 hover:text-brand-600"
    }`;

  // Get initials from full name or email
  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? "?";

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-brand-100 shadow-sm">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" onClick={closeMenu} className="flex items-center gap-2 group">
          <span className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-300 to-brand-500 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                d="M12 21s-8-5.25-8-11A8 8 0 0112 2a8 8 0 018 10c0 5.75-8 11-8 11z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                d="M12 11a2 2 0 100-4 2 2 0 000 4z" />
            </svg>
          </span>
          <span className="font-serif text-xl font-bold text-gray-900 tracking-tight">
            Care<span className="text-brand-500">finder</span>
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-7">
          <Link to="/search" className={navLinkClass("/search")}>Find Hospitals</Link>
          <Link to="/map" className={navLinkClass("/map")}>Map View</Link>
          {isAdmin && (
            <Link to="/admin" className={navLinkClass("/admin")}>
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Admin
              </span>
            </Link>
          )}
        </div>

        {/* Desktop auth controls */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <Link to="/profile" className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 hover:bg-brand-100 transition-colors">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-300 to-brand-500 flex items-center justify-center text-white text-xs font-bold">
                  {initials}
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {profile?.full_name?.split(" ")[0] ?? "Account"}
                </span>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>Sign out</Button>
            </div>
          ) : (
            <>
              <Link to="/signin"><Button variant="ghost" size="sm">Sign in</Button></Link>
              <Link to="/signup"><Button variant="primary" size="sm">Get started</Button></Link>
            </>
          )}
        </div>

        {/* Mobile right side — avatar + hamburger */}
        <div className="md:hidden flex items-center gap-2">
          {/* Avatar initial — only shown when signed in */}
          {user && (
            <Link to="/profile" onClick={closeMenu}>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-300 to-brand-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                {initials}
              </div>
            </Link>
          )}

          {/* Hamburger */}
          <button
            className="p-2 rounded-lg hover:bg-brand-50 transition-colors text-gray-600"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden border-t border-brand-100 bg-white px-4 py-4 flex flex-col gap-4 shadow-md">
          <Link to="/search" onClick={closeMenu} className="text-sm font-medium text-gray-700 hover:text-brand-600">Find Hospitals</Link>
          <Link to="/map" onClick={closeMenu} className="text-sm font-medium text-gray-700 hover:text-brand-600">Map View</Link>
          {isAdmin && (
            <Link to="/admin" onClick={closeMenu} className="text-sm font-semibold text-brand-600">Admin Dashboard</Link>
          )}
          <div className="border-t border-brand-100 pt-3 flex flex-col gap-2">
            {user ? (
              <>
                <p className="text-sm text-gray-500">
                  Signed in as <strong>{profile?.full_name ?? user.email}</strong>
                </p>
                <Link to="/profile" onClick={closeMenu} className="text-sm font-medium text-brand-600 hover:text-brand-800">
                  My Profile
                </Link>
                <Button variant="secondary" size="sm" onClick={handleSignOut} className="w-full">
                  Sign out
                </Button>
              </>
            ) : (
              <>
                <Link to="/signin" onClick={closeMenu}><Button variant="secondary" size="sm" className="w-full">Sign in</Button></Link>
                <Link to="/signup" onClick={closeMenu}><Button variant="primary" size="sm" className="w-full">Get started</Button></Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
