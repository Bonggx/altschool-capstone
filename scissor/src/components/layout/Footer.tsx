import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link to="/" className="text-base font-bold text-gray-900 hover:text-brand-600 transition-colors">
            Scissor
          </Link>
          <p className="text-sm text-gray-500 text-center">
            Paste a long URL, get a short one in under a second.
          </p>
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} Scissor. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
