import { Link } from "react-router-dom";
import Button from "../components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <p className="text-6xl font-serif font-bold text-brand-300 mb-4">404</p>
      <h1 className="text-2xl font-serif font-bold text-gray-900 mb-2">Page not found</h1>
      <p className="text-gray-500 text-sm mb-6">The page you're looking for doesn't exist.</p>
      <Link to="/"><Button>Back to home</Button></Link>
    </div>
  );
}
