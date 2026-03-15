import { ForgotPasswordForm } from "../components/auth/ForgotPasswordForm";
import { Logo } from "../components/common/Logo";

export function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <Logo size="lg" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-blue-600 via-cyan-600 to-emerald-600 bg-clip-text text-transparent">
            Reset Password
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            We'll help you get back into your account
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700">
          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  );
}
