import { Link } from "react-router-dom";

// Collapses to single column on mobile

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-brand-50 border-t border-brand-100 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 mb-10">

          {/* Column 1 = Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-3 group w-fit">
              <span className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-300 to-brand-500 flex items-center justify-center shadow-sm">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                    d="M12 21s-8-5.25-8-11A8 8 0 0112 2a8 8 0 018 10c0 5.75-8 11-8 11z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                    d="M12 11a2 2 0 100-4 2 2 0 000 4z" />
                </svg>
              </span>
              <span className="font-serif text-lg font-bold text-gray-900">
                Care<span className="text-brand-500">finder</span>
              </span>
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
              Helping Nigerians find, export, and share trusted hospital information — faster and easier than ever before.
            </p>
          </div>

          {/* Column 2 = Quick Links */}
          <div>
            <h3 className="font-serif text-sm font-bold text-gray-800 uppercase tracking-widest mb-4">Quick Links</h3>
            <ul className="flex flex-col gap-2.5">
              {[
                { label: "Find Hospitals", to: "/search" },
                { label: "Map View", to: "/map" },
                { label: "Sign In", to: "/signin" },
                { label: "Create Account", to: "/signup" },
              ].map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-gray-500 hover:text-brand-600 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 = About */}
          <div>
            <h3 className="font-serif text-sm font-bold text-gray-800 uppercase tracking-widest mb-4">About</h3>
            <ul className="flex flex-col gap-2.5">
              <li className="flex items-start gap-2 text-sm text-gray-500">
                <svg className="w-4 h-4 text-brand-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Nigeria-wide hospital directory
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-500">
                <svg className="w-4 h-4 text-brand-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Verified by admin curators
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-500">
                <svg className="w-4 h-4 text-brand-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Free CSV export, no sign-in required
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-brand-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
          <p>© {currentYear} Carefinder. Built for Nigerians, by Nigerians.</p>
        </div>
      </div>
    </footer>
  );
}