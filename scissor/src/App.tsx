import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Redirect from "./pages/Redirect";
import NotFound from "./pages/NotFound";

const convexUrl = import.meta.env.VITE_CONVEX_URL as string;
const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string;
const convex = new ConvexReactClient(convexUrl);

export default function App() {
  return (
    <ClerkProvider publishableKey={clerkKey}>
      <ConvexProvider client={convex}>
        <BrowserRouter>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <div className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/:slug" element={<Redirect />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
            <Footer />
          </div>
        </BrowserRouter>
      </ConvexProvider>
    </ClerkProvider>
  );
}
