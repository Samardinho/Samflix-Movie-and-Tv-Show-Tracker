import { Logo } from "../common/Logo";

export function Footer() {
  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 py-12 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <span className="text-sm">© 2025 Samflix</span>
          </div>
          <p className="text-base text-center md:text-right">
            Built by Samard
          </p>
        </div>
      </div>
    </footer>
  );
}

