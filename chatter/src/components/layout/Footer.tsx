import { Link } from "react-router-dom";

// Footer to be displayed at the bottom of every page
export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link
            to="/"
            className="text-lg font-black text-gray-900 hover:text-brand-600 transition-colors"
          >
            Chatter
          </Link>
          <p className="text-sm text-gray-500 text-center">
            A publishing platform for writers and readers.
          </p>
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} Chatter. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
