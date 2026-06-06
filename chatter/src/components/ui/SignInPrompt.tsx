import { Link } from "react-router-dom";

interface SignInPromptProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

export default function SignInPrompt({ isOpen, onClose, message = "Sign in to continue" }: SignInPromptProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/20 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden animate-slide-up"
      >
        {/* Pink top bar like iPhone alert */}
        <div className="h-1.5 bg-gradient-to-r from-brand-500 to-brand-700 w-full" />

        <div className="p-6 text-center">
          <div className="w-12 h-12 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>

          <h3 className="text-base font-bold text-gray-900 mb-1">{message}</h3>
          <p className="text-sm text-gray-500 mb-5">
            Join Chatter to like posts, comment, bookmark, follow writers, send messages and more.
          </p>

          <div className="flex flex-col gap-2">
            <Link
              to="/signup"
              onClick={onClose}
              className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Create an account
            </Link>
            <Link
              to="/signin"
              onClick={onClose}
              className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl transition-colors"
            >
              Sign in
            </Link>
          </div>

          <button onClick={onClose} className="mt-3 text-xs text-gray-400 hover:text-gray-600 transition-colors">
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
