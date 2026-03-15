import { type ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

interface ShellProps {
  children: ReactNode;
}

export function Shell({ children }: ShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 transition-colors">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8 text-gray-900 dark:text-gray-100">
        {children}
      </main>
      <Footer />
    </div>
  );
}

