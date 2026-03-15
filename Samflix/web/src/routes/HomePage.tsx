import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { TrendingSection } from "../components/movies/TrendingSection";
import { RecentlyAddedSection } from "../components/movies/RecentlyAddedSection";
import { Logo } from "../components/common/Logo";
import { useState } from "react";

export function HomePage() {
  const { user } = useAuth();
  const [videoError, setVideoError] = useState(false);

  // Video source - you can replace this with your own video
  const videoSource = "/hero-video.mp4";

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section with Video Background */}
      <div className="relative h-[60vh] sm:h-[70vh] md:h-[80vh] flex items-center justify-center overflow-hidden rounded-[2rem] sm:rounded-[3rem] md:rounded-[4rem] lg:rounded-[5rem]" style={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
        {/* Video Background */}
        <div className="absolute inset-0 z-0 rounded-[3rem] md:rounded-[4rem] lg:rounded-[5rem] overflow-hidden">
          {!videoError ? (
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
              onError={() => setVideoError(true)}
            >
              <source src={videoSource} type="video/mp4" />
              <source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" type="video/mp4" />
            </video>
          ) : null}
          
          {/* Fallback animated gradient background */}
          <div className={`absolute inset-0 ${videoError ? 'opacity-100' : 'opacity-0'} transition-opacity duration-1000 rounded-[3rem] md:rounded-[4rem] lg:rounded-[5rem] overflow-hidden`}>
            <div className="w-full h-full bg-gradient-to-br from-slate-900 via-blue-900 to-emerald-900 relative overflow-hidden rounded-[3rem] md:rounded-[4rem] lg:rounded-[5rem]">
              {/* Animated gradient orbs */}
              <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>
          </div>
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/85 z-10"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/50 z-10"></div>
          
          {/* Animated light effects */}
          <div className="absolute inset-0 z-10">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-20 text-center px-4 max-w-5xl mx-auto">
          {/* Logo */}
          <div className="mb-8 flex justify-center animate-fade-in">
            <Logo size="lg" className="text-white" />
          </div>

          {/* Main Title */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black mb-4 sm:mb-6 text-white drop-shadow-2xl animate-fade-in">
            <span className="relative inline-block">
              <span className="absolute inset-0 blur-3xl bg-blue-500/40 animate-pulse"></span>
              <span className="relative bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                Samflix
              </span>
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl md:text-2xl lg:text-4xl text-white/95 mb-3 sm:mb-4 max-w-4xl mx-auto leading-relaxed font-light drop-shadow-lg animate-fade-in px-2">
            Unlimited movies, TV shows, and more.
          </p>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/80 mb-8 sm:mb-12 max-w-3xl mx-auto drop-shadow-md px-2">
            Discover, track, and rate your favorites.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 sm:gap-6 justify-center mb-6 sm:mb-8 animate-fade-in px-4">
            <Link
              to="/search"
              className="group relative px-6 sm:px-8 md:px-12 py-4 sm:py-5 md:py-6 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white rounded-xl font-bold text-base sm:text-lg md:text-xl lg:text-2xl transition-all duration-300 shadow-2xl hover:shadow-blue-500/50 transform hover:scale-105 hover:-translate-y-1"
            >
              <span className="relative z-10 flex items-center gap-2 sm:gap-3">
                Get Started
                <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </Link>

            {user ? (
              <Link
                to="/watchlist"
                className="group px-6 sm:px-8 md:px-12 py-4 sm:py-5 md:py-6 bg-white/10 hover:bg-white/20 backdrop-blur-md border-2 border-white/30 text-white rounded-xl font-bold text-base sm:text-lg md:text-xl lg:text-2xl transition-all duration-300 shadow-2xl transform hover:scale-105 hover:-translate-y-1"
              >
                <span className="flex items-center gap-2 sm:gap-3">
                  My Watchlist
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </span>
              </Link>
            ) : (
              <Link
                to="/register"
                className="group px-6 sm:px-8 md:px-12 py-4 sm:py-5 md:py-6 bg-white/10 hover:bg-white/20 backdrop-blur-md border-2 border-white/30 text-white rounded-xl font-bold text-base sm:text-lg md:text-xl lg:text-2xl transition-all duration-300 shadow-2xl transform hover:scale-105 hover:-translate-y-1"
              >
                <span className="flex items-center gap-2 sm:gap-3">
                  Sign Up
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </span>
              </Link>
            )}
          </div>

          {!user && (
            <p className="text-lg md:text-xl text-white/90 animate-fade-in">
              Already have an account?{" "}
              <Link 
                to="/login" 
                className="font-bold text-white hover:text-blue-300 underline underline-offset-4 transition-colors"
              >
                Sign In
              </Link>
            </p>
          )}
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 animate-bounce">
          <svg className="w-8 h-8 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>

      {/* Content Sections */}
      <div className="max-w-7xl mx-auto px-4 py-20 bg-white dark:bg-gray-900">
        {/* Recently Added Section - Only show if user is logged in */}
        {user && (
          <div className="mb-20">
            <RecentlyAddedSection />
          </div>
        )}

        {/* Trending Content Section */}
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-cyan-600 to-emerald-600 bg-clip-text text-transparent">
            What's Trending Now
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Discover the hottest movies and TV shows everyone's talking about
          </p>
        </div>

        <div className="space-y-20">
          <TrendingSection
            title="Trending Movies"
            type="movies"
            linkTo="/search?trending=movies"
          />
          <TrendingSection
            title="Trending TV Shows"
            type="tv"
            linkTo="/search?trending=tv"
          />
        </div>
      </div>
    </div>
  );
}
