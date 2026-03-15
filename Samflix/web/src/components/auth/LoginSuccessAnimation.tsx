import { useEffect, useState } from "react";

interface LoginSuccessAnimationProps {
  onComplete: () => void;
  title?: string;
  message?: string;
  duration?: number; // Duration in milliseconds before auto-navigation
}

export function LoginSuccessAnimation({ 
  onComplete, 
  title = "Welcome Back!",
  message = "You've successfully signed in",
  duration = 3000
}: LoginSuccessAnimationProps) {
  const [show, setShow] = useState(false);
  const [checkmarkVisible, setCheckmarkVisible] = useState(false);
  const [messageVisible, setMessageVisible] = useState(false);

  useEffect(() => {
    // Trigger animation sequence
    setShow(true);
    
    const timer1 = setTimeout(() => {
      setCheckmarkVisible(true);
    }, 100);

    const timer2 = setTimeout(() => {
      setMessageVisible(true);
    }, 400);

    const timer3 = setTimeout(() => {
      onComplete();
    }, duration);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onComplete]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 md:p-12 max-w-md w-full mx-4 transform transition-all duration-300 scale-95 animate-scale-in">
        {/* Success Checkmark */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            {/* Outer circle */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 via-cyan-500 to-emerald-500 flex items-center justify-center shadow-lg animate-pulse-slow">
              {/* Checkmark SVG */}
              <svg
                className={`w-12 h-12 text-white transition-all duration-500 ${
                  checkmarkVisible
                    ? "opacity-100 scale-100"
                    : "opacity-0 scale-0"
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                  className="animate-draw-checkmark"
                />
              </svg>
            </div>
            {/* Ripple effect */}
            {checkmarkVisible && (
              <>
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 via-cyan-500 to-emerald-500 animate-ripple-1"></div>
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 via-cyan-500 to-emerald-500 animate-ripple-2"></div>
              </>
            )}
          </div>
        </div>

        {/* Success Message */}
        <div
          className={`text-center transition-all duration-500 ${
            messageVisible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4"
          }`}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-blue-600 via-cyan-600 to-emerald-600 bg-clip-text text-transparent">
            {title}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            {message}
          </p>
        </div>

        {/* Loading dots */}
        <div className="flex justify-center gap-2 mt-8">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "0ms" }}></div>
          <div className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: "150ms" }}></div>
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: "300ms" }}></div>
        </div>
      </div>
    </div>
  );
}

