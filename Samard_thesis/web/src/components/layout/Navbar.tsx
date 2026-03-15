import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { ThemeToggle } from "../common/ThemeToggle";
import { Logo } from "../common/Logo";
import { useState } from "react";

export function Navbar() {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Logo size="md" className="hover:opacity-80 transition-opacity" />
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle />
            <Link
              to="/"
              className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Home
            </Link>
            <Link
              to="/search"
              className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Search
            </Link>
            {user ? (
              <>
                <Link
                  to="/assistant"
                  className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Assistant
                </Link>
                <Link
                  to="/watchlist"
                  className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Watchlist
                </Link>
                <Link
                  to="/profile"
                  className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Profile
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg transition-all font-medium shadow-md hover:shadow-lg"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 text-white rounded-lg transition-all font-medium shadow-md hover:shadow-lg"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex flex-col gap-2">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Home
              </Link>
              <Link
                to="/search"
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Search
              </Link>
              {user ? (
                <>
                  <Link
                    to="/assistant"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    Assistant
                  </Link>
                  <Link
                    to="/watchlist"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    Watchlist
                  </Link>
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    Profile
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg transition-all font-medium shadow-md hover:shadow-lg text-center"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 text-white rounded-lg transition-all font-medium shadow-md hover:shadow-lg text-center"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
