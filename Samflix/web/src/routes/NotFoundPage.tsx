import { Link } from "react-router-dom";
import { Logo } from "../components/common/Logo";

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4">
      <div className="text-center max-w-2xl mx-auto">
        <div className="mb-8 flex justify-center">
          <Logo size="lg" />
        </div>
        <div className="mb-8">
          <h1 className="text-9xl md:text-[12rem] font-black mb-4 bg-gradient-to-r from-blue-600 via-cyan-600 to-emerald-600 bg-clip-text text-transparent">
            404
          </h1>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-gray-100">
            Page Not Found
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            to="/"
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 dark:from-blue-500 dark:to-emerald-500 dark:hover:from-blue-600 dark:hover:to-emerald-600 text-white rounded-xl font-semibold text-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Go Home
          </Link>
          <Link
            to="/search"
            className="px-8 py-4 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 text-gray-900 dark:text-gray-100 rounded-xl font-semibold text-lg transition-all shadow-md hover:shadow-lg transform hover:scale-105"
          >
            Browse Content
          </Link>
        </div>
      </div>
    </div>
  );
}
