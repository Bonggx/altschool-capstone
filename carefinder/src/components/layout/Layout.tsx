import { ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";

// Wraps every page with Navbar + Footer

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  // min-h-screen + flex column keeps footer pinned to the bottom
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}