import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-8xl font-black text-brand-600 mb-4">404</h1>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Page not found</h2>
      <p className="text-gray-500 mb-8 max-w-sm">
        The page you are looking for does not exist or may have been moved.
      </p>
      <Link
        to="/"
        className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        Back to home
      </Link>
    </div>
  );
}
