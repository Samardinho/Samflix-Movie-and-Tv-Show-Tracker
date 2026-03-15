import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useNavigate } from "react-router-dom";
import { searchMulti, getPopularMovies, getPopularTv, getTrendingMovies, getTrendingTv } from "../lib/apiClient";
import { SearchBar } from "../components/common/SearchBar";
import { MediaCard } from "../components/movies/MediaCard";
import { Loader } from "../components/common/Loader";
import { ErrorState } from "../components/common/ErrorState";
import { EmptyState } from "../components/common/EmptyState";
import { PopularSection } from "../components/movies/PopularSection";
import { TrendingSection } from "../components/movies/TrendingSection";
import { TopRatedSection } from "../components/movies/TopRatedSection";
import { useUserEntries } from "../hooks/useUserEntries";
import { useAuth } from "../hooks/useAuth";

export function SearchPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get("q") || "";
  const [searchQuery, setSearchQuery] = useState(urlQuery);
  const [isRandomPicking, setIsRandomPicking] = useState(false);
  const { user } = useAuth();
  const { entries } = useUserEntries();

  // Sync URL query param with state
  useEffect(() => {
    if (urlQuery && urlQuery !== searchQuery) {
      setSearchQuery(urlQuery);
    }
  }, [urlQuery]);

  // Update URL when search query changes
  useEffect(() => {
    if (searchQuery.trim()) {
      setSearchParams({ q: searchQuery.trim() }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  }, [searchQuery, setSearchParams]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["search", searchQuery],
    queryFn: () => {
      console.log("Searching for:", searchQuery);
      return searchMulti(searchQuery);
    },
    enabled: searchQuery.trim().length > 0,
    retry: 1,
    staleTime: 30000
  });

  const getUserStatus = (tmdbId: number, mediaType: "movie" | "tv") => {
    const entry = entries.find(
      (e) => e.tmdbId === tmdbId && e.mediaType === mediaType
    );
    return entry?.status ?? null;
  };

  const handleRandomPick = async () => {
    setIsRandomPicking(true);
    try {
      // Fetch popular and trending content from multiple sources
      const [popularMovies, popularTv, trendingMovies, trendingTv] = await Promise.all([
        getPopularMovies(),
        getPopularTv(),
        getTrendingMovies(),
        getTrendingTv()
      ]);

      // Combine all results - ensure media_type is set correctly
      const allItems = [
        ...(popularMovies.results || []).map(item => ({ ...item, media_type: "movie" as const })),
        ...(popularTv.results || []).map(item => ({ ...item, media_type: "tv" as const })),
        ...(trendingMovies.results || []).map(item => ({ 
          ...item, 
          media_type: (item.media_type || "movie") as "movie" | "tv" 
        })),
        ...(trendingTv.results || []).map(item => ({ 
          ...item, 
          media_type: (item.media_type || "tv") as "movie" | "tv" 
        }))
      ];

      // Filter to only include movies and TV shows with valid IDs and poster paths
      const validItems = allItems.filter(
        item => item.id && 
        (item.media_type === "movie" || item.media_type === "tv") &&
        item.poster_path // Only include items with posters for better UX
      );

      if (validItems.length === 0) {
        alert("No content available for random pick. Please try again later.");
        return;
      }

      // Randomly select one item
      const randomIndex = Math.floor(Math.random() * validItems.length);
      const randomItem = validItems[randomIndex];

      // Navigate to the detail page
      if (randomItem.media_type === "movie") {
        navigate(`/movie/${randomItem.id}`);
      } else {
        navigate(`/tv/${randomItem.id}`);
      }
    } catch (error) {
      console.error("Random pick error:", error);
      alert("Failed to get a random recommendation. Please try again.");
    } finally {
      setIsRandomPicking(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50/30 to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-800">
      {/* Modern Hero Section with Glassmorphism */}
      <div className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-cyan-600 to-emerald-600">
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}
          ></div>
          
          {/* Animated Orbs */}
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-400/30 rounded-full blur-[100px] animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-emerald-400/30 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-400/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        {/* Content */}
        <div className="relative z-10 w-full max-w-6xl mx-auto px-4 py-12 sm:py-16 md:py-20">
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black text-white mb-4 sm:mb-6 drop-shadow-2xl tracking-tight">
              <span className="bg-gradient-to-r from-white via-blue-100 to-cyan-100 bg-clip-text text-transparent">
                Search
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/90 mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed font-light px-2">
              Discover your next favorite movie or TV show from millions of titles
            </p>

            {/* Modern Search Bar with Glassmorphism */}
            <div className="max-w-4xl mx-auto">
              <div className="relative">
                <div className="absolute inset-0 bg-white/20 backdrop-blur-xl rounded-3xl blur-xl"></div>
                <div className="relative bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-2 shadow-2xl">
                  <SearchBar 
                    onSearch={setSearchQuery} 
                    placeholder="Search movies, TV shows, actors, directors..."
                    onRandomPick={handleRandomPick}
                    isRandomPicking={isRandomPicking}
                  />
                </div>
              </div>
              {!searchQuery && (
                <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm">
                  <button
                    onClick={() => {
                      document.getElementById('trending-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white/80 font-medium hover:bg-white/20 hover:text-white transition-all duration-200 cursor-pointer"
                  >
                    Trending Now
                  </button>
                  <button
                    onClick={() => {
                      document.getElementById('popular-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white/80 font-medium hover:bg-white/20 hover:text-white transition-all duration-200 cursor-pointer"
                  >
                    Popular Movies
                  </button>
                  <button
                    onClick={() => {
                      document.getElementById('top-rated-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white/80 font-medium hover:bg-white/20 hover:text-white transition-all duration-200 cursor-pointer"
                  >
                    Top Rated
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg className="w-full h-24 fill-white dark:fill-gray-900" viewBox="0 0 1440 120" preserveAspectRatio="none">
            <path d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,58.7C960,64,1056,64,1152,58.7C1248,53,1344,43,1392,37.3L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"></path>
          </svg>
        </div>
      </div>

      {/* Search Results Section */}
      {searchQuery.trim().length > 0 && (
        <div className="max-w-7xl mx-auto px-4 py-16">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-32">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-2xl animate-pulse"></div>
                <Loader />
              </div>
              <p className="mt-6 text-lg text-gray-600 dark:text-gray-400 font-medium">Searching...</p>
            </div>
          )}

          {error && (
            <div className="py-16">
              <ErrorState 
                message={
                  error instanceof Error 
                    ? error.message 
                    : "Failed to search. Please try again."
                } 
              />
            </div>
          )}

          {!isLoading && !error && data && (
            <>
              {data.results.length === 0 ? (
                <div className="py-24">
                  <EmptyState message="No results found. Try a different search term." />
                </div>
              ) : (
                <>
                  <div className="mb-12">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b-2 border-gray-200 dark:border-gray-700">
                      <div>
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                          Search Results
                        </h2>
                        <p className="text-lg text-gray-600 dark:text-gray-400">
                          Found <span className="font-bold text-blue-600 dark:text-blue-400">{data.total_results.toLocaleString()}</span> result{data.total_results !== 1 ? "s" : ""} for 
                          <span className="font-semibold text-gray-900 dark:text-gray-100"> "{searchQuery}"</span>
                        </p>
                      </div>
                      <div className="px-4 py-2 bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-xl border border-blue-200 dark:border-blue-800">
                        <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                          {data.results.filter((item) => item.media_type === "movie" || item.media_type === "tv").length} items shown
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                    {data.results
                      .filter((item) => item.media_type === "movie" || item.media_type === "tv")
                      .map((item) => (
                        <MediaCard
                          key={`${item.media_type}-${item.id}`}
                          item={item}
                          userStatus={
                            item.media_type === "movie" || item.media_type === "tv"
                              ? getUserStatus(item.id, item.media_type)
                              : null
                          }
                        />
                      ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* Popular Content Section - Always Visible */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        {searchQuery.trim().length === 0 && (
          <div className="text-center mb-16">
            <div className="inline-block mb-6">
              <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-cyan-600 to-emerald-600 bg-clip-text text-transparent">
                Popular Content
              </h2>
            </div>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Explore all-time popular movies and TV shows curated for you
            </p>
          </div>
        )}

        {searchQuery.trim().length > 0 && (
          <div className="text-center mb-16 pt-12 border-t-2 border-gray-200 dark:border-gray-700">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-cyan-600 to-emerald-600 bg-clip-text text-transparent">
              You Might Also Like
            </h2>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400">
              Popular content you might enjoy
            </p>
          </div>
        )}

        <div className="space-y-24">
          <div id="popular-section">
            <PopularSection
              title="Popular Movies"
              type="movies"
            />
          </div>
          <PopularSection
            title="Popular TV Shows"
            type="tv"
          />
          <div id="trending-section">
            <TrendingSection
              title="Trending Movies"
              type="movies"
              linkTo="/"
            />
          </div>
          <TrendingSection
            title="Trending TV Shows"
            type="tv"
            linkTo="/"
          />
          <div id="top-rated-section">
            <TopRatedSection
              title="Top Rated Movies"
              type="movies"
            />
          </div>
          <TopRatedSection
            title="Top Rated TV Shows"
            type="tv"
          />
        </div>
      </div>
    </div>
  );
}
