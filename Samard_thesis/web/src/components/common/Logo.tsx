import { Link } from "react-router-dom";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

export function Logo({ className = "", showText = true, size = "md" }: LogoProps) {
  const sizeClasses = {
    sm: "text-xl",
    md: "text-2xl md:text-3xl",
    lg: "text-4xl md:text-5xl"
  };

  const iconSizes = {
    sm: "w-8 h-8",
    md: "w-10 h-10 md:w-12 md:h-12",
    lg: "w-14 h-14 md:w-16 md:h-16"
  };

  return (
    <Link to="/" className={`flex items-center gap-3 ${className}`}>
      {/* Logo Icon with S */}
      <div className="relative group">
        {/* Glow effect */}
        <div className={`absolute inset-0 ${iconSizes[size]} bg-gradient-to-br from-blue-500 to-emerald-600 rounded-2xl transform rotate-6 opacity-60 blur-md group-hover:opacity-80 transition-opacity`}></div>
        
        {/* Main logo container */}
        <div className={`relative ${iconSizes[size]} bg-gradient-to-br from-blue-600 via-cyan-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-xl transform -rotate-3 group-hover:rotate-0 transition-all duration-300 group-hover:scale-105`}>
          {/* S Letter - Elegant and bold */}
          <svg
            className={`${size === 'sm' ? 'w-5 h-5' : size === 'lg' ? 'w-10 h-10 md:w-12 md:h-12' : 'w-7 h-7 md:w-8 md:h-8'} text-white`}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Upper curve */}
            <path
              d="M25 30 C25 20, 35 15, 50 15 C65 15, 75 20, 75 30 C75 35, 70 38, 65 40 C60 42, 55 43, 50 45"
              stroke="white"
              strokeWidth="10"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            {/* Middle connecting line */}
            <path
              d="M50 45 L50 55"
              stroke="white"
              strokeWidth="10"
              strokeLinecap="round"
            />
            {/* Lower curve */}
            <path
              d="M50 55 C55 57, 60 58, 65 60 C70 62, 75 65, 75 70 C75 80, 65 85, 50 85 C35 85, 25 80, 25 70 C25 65, 30 62, 35 60 C40 58, 45 57, 50 55"
              stroke="white"
              strokeWidth="10"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </div>
        
        {/* Subtle shine effect */}
        <div className={`absolute top-1 left-1 ${size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} bg-white/40 rounded-full blur-sm`}></div>
      </div>
      
      {/* Logo Text */}
      {showText && (
        <span className={`font-black ${sizeClasses[size]} bg-gradient-to-r from-blue-600 via-cyan-600 to-emerald-600 bg-clip-text text-transparent tracking-tight`}>
          Samflix
        </span>
      )}
    </Link>
  );
}
