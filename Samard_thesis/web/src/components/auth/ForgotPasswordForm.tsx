import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const { resetPassword, loading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }

    try {
      await resetPassword(email.trim());
      setSuccess(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to send reset email";
      setError(errorMessage);
      console.error("Password reset error:", err);
    }
  };

  // Check if emulators are active
  const isEmulatorsActive = import.meta.env.DEV && import.meta.env.VITE_USE_EMULATORS !== "false";

  if (success) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-2 border-emerald-200 dark:border-emerald-800 rounded-2xl p-8 text-center">
          <div className="mb-4">
            <svg className="w-16 h-16 mx-auto text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-emerald-800 dark:text-emerald-200 mb-3">
            Password Reset Email Sent!
          </h3>
          
          {isEmulatorsActive ? (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mt-6 text-left">
              <p className="text-blue-800 dark:text-blue-200 font-semibold mb-3 text-sm">
                Development Mode (Emulators)
              </p>
              <p className="text-blue-700 dark:text-blue-300 text-sm mb-4">
                Since you're using Firebase emulators, the email wasn't actually sent. To get your password reset link:
              </p>
              <ul className="list-disc list-inside text-blue-700 dark:text-blue-300 text-sm space-y-2">
                <li>Open the <a href="http://127.0.0.1:4000/auth" target="_blank" rel="noopener noreferrer" className="underline font-semibold">Emulator UI</a></li>
                <li>Go to Authentication tab</li>
                <li>Find the user with email: <span className="font-mono">{email}</span></li>
                <li>Click on the user, then click "Password reset link"</li>
                <li>Copy and open the link in your browser</li>
              </ul>
              <p className="mt-4 text-blue-700 dark:text-blue-300 text-sm">
                To send real emails, set <code className="font-mono bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">VITE_USE_EMULATORS=false</code> in <code className="font-mono bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">web/.env</code> and restart your dev server.
              </p>
            </div>
          ) : (
            <>
              <p className="text-emerald-700 dark:text-emerald-300 text-base mb-2">
                Check your email for a password reset link. If you don't see it, check your spam folder.
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                The link will expire in 1 hour.
              </p>
            </>
          )}
        </div>
        <div className="text-center">
          <Link
            to="/login"
            className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 dark:from-blue-500 dark:to-emerald-500 dark:hover:from-blue-600 dark:hover:to-emerald-600 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <p className="text-gray-600 dark:text-gray-400 mb-4 text-center">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>
      <div>
        <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="your.email@example.com"
          className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all"
        />
      </div>
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <p className="text-red-600 dark:text-red-400 text-sm font-medium">{error}</p>
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 dark:from-blue-500 dark:to-emerald-500 dark:hover:from-blue-600 dark:hover:to-emerald-600 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Sending..." : "Send Reset Link"}
      </button>
      <div className="text-center">
        <Link
          to="/login"
          className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline underline-offset-4 transition-colors"
        >
          Back to Login
        </Link>
      </div>
    </form>
  );
}
