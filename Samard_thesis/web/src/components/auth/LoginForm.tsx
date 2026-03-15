import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { LoginSuccessAnimation } from "./LoginSuccessAnimation";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Basic validation
    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }
    if (!password) {
      setError("Please enter your password");
      return;
    }

    try {
      await login(email.trim(), password);
      // Show success animation before navigating
      setShowSuccessAnimation(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to login";
      setError(errorMessage);
      console.error("Login error:", err);
    }
  };

  const handleAnimationComplete = () => {
    navigate("/search");
  };

  return (
    <>
      {showSuccessAnimation && (
        <LoginSuccessAnimation 
          onComplete={handleAnimationComplete}
          duration={2000}
        />
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="your.email@example.com"
            className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Enter your password"
            className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all"
          />
        </div>
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <p className="text-red-600 dark:text-red-400 text-sm font-medium">{error}</p>
          </div>
        )}
        <div className="text-right">
          <Link
            to="/forgot-password"
            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline underline-offset-4 transition-colors"
          >
            Forgot password?
          </Link>
        </div>
        <button
          type="submit"
          disabled={loading || showSuccessAnimation}
          className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 dark:from-blue-500 dark:to-emerald-500 dark:hover:from-blue-600 dark:hover:to-emerald-600 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Logging in..." : "Sign In"}
        </button>
      </form>
    </>
  );
}

