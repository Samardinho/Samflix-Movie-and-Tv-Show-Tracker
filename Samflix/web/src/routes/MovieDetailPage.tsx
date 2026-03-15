import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getMovieDetails, getMovieVideos } from "../lib/apiClient";
import { Loader } from "../components/common/Loader";
import { ErrorState } from "../components/common/ErrorState";
import { Toast } from "../components/common/Toast";
import { RatingStars } from "../components/movies/RatingStars";
import { TrailerPlayer } from "../components/movies/TrailerPlayer";
import { ReleaseDateBadge } from "../components/movies/ReleaseDateBadge";
import { StreamingProviders } from "../components/movies/StreamingProviders";
import { useUserEntries } from "../hooks/useUserEntries";
import { useAuth } from "../hooks/useAuth";
import { useState } from "react";
import type { EntryStatus } from "../types/domain";

export function MovieDetailPage() {
  const { id } = useParams<{ id: string }>();
  const movieId = Number(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { entries, upsertEntry, isUpserting } = useUserEntries();

  const existingEntry = entries.find(
    (e) => e.tmdbId === movieId && e.mediaType === "movie"
  );

  const [status, setStatus] = useState<EntryStatus>(
    existingEntry?.status ?? "plan"
  );
  const [rating, setRating] = useState<number | null>(
    existingEntry?.rating ?? null
  );
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const { data: movie, isLoading, error } = useQuery({
    queryKey: ["movie", movieId],
    queryFn: () => getMovieDetails(movieId),
    enabled: !isNaN(movieId)
  });

  const { data: videos } = useQuery({
    queryKey: ["movie", movieId, "videos"],
    queryFn: () => getMovieVideos(movieId),
    enabled: !isNaN(movieId) && !!movie
  });

  const handleSave = async () => {
    if (!movie || !user) return;
    await upsertEntry({
      tmdbId: movie.id,
      mediaType: "movie",
      title: movie.title,
      posterPath: movie.poster_path,
      status,
      rating
    });
    
    // Show appropriate success message
    if (rating !== null) {
      setToastMessage("Rating recorded and Added to Watchlist");
    } else {
      setToastMessage("Added to watchlist");
    }
    setShowToast(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader />
      </div>
    );
  }

  if (error || !movie) {
    return <ErrorState message="Failed to load movie details." />;
  }

  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : "https://via.placeholder.com/500x750?text=No+Poster";

  const backdropUrl = movie.backdrop_path
    ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
    : null;

  const releaseYear = movie.release_date
    ? new Date(movie.release_date).getFullYear()
    : null;

  return (
    <div className="min-h-screen">
      {/* Back Button - Fixed */}
      <div className="fixed top-20 left-0 right-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shadow-md hover:shadow-lg border border-gray-200 dark:border-gray-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">Back</span>
          </button>
        </div>
      </div>
      {/* Spacer to prevent content from going under the fixed button */}
      <div className="h-24"></div>

      {/* Hero Section with Backdrop */}
      {backdropUrl && (
        <div className="relative h-64 sm:h-80 md:h-96 -mx-4 md:-mx-8 lg:-mx-16 mb-6 md:mb-8 overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${backdropUrl})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/60 to-black/90" />
          </div>
          <div className="relative h-full flex items-end p-4 sm:p-6 md:p-8">
            <div className="max-w-6xl mx-auto w-full">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-2 drop-shadow-2xl">
                {movie.title}
              </h1>
              {releaseYear && (
                <p className="text-lg sm:text-xl md:text-2xl text-gray-200 drop-shadow-lg">
                  {releaseYear}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
          {/* Poster Column */}
          <div className="lg:col-span-4">
            <div className="sticky top-4">
              <img
                src={posterUrl}
                alt={movie.title}
                className="w-full rounded-2xl shadow-2xl"
              />
              {movie.release_date && (
                <div className="mt-4">
                  <ReleaseDateBadge date={movie.release_date} />
                </div>
              )}
            </div>
          </div>

          {/* Content Column */}
          <div className="lg:col-span-8 space-y-6">
            {/* Title (if no backdrop) */}
            {!backdropUrl && (
              <div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2">
                  {movie.title}
                  {releaseYear && (
                    <span className="text-gray-500"> ({releaseYear})</span>
                  )}
                </h1>
              </div>
            )}

            {/* Stats Bar */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl">
              {movie.vote_average !== undefined && (
                <div className="flex items-center gap-2">
                  <svg className="w-6 h-6 text-amber-500 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  <div>
                    <div className="text-xl font-bold">
                      {movie.vote_average.toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">TMDb Rating</div>
                  </div>
                </div>
              )}
              {movie.omdbRatings?.imdbRating !== undefined && movie.omdbRatings.imdbRating !== null && (
                <div className="flex items-center gap-2">
                  <svg className="w-6 h-6 text-yellow-500 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  <div>
                    <div className="text-xl font-bold">
                      {movie.omdbRatings.imdbRating.toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">IMDb Rating</div>
                  </div>
                </div>
              )}
              {movie.omdbRatings?.metascore !== undefined && movie.omdbRatings.metascore !== null && (
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-green-600" title="Metascore">M</span>
                  <div>
                    <div className="text-xl font-bold">
                      {movie.omdbRatings.metascore}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Metascore</div>
                  </div>
                </div>
              )}
              {movie.runtime && (
                <div className="flex items-center gap-2">
                  <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <div className="font-semibold">{movie.runtime} min</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Runtime</div>
                  </div>
                </div>
              )}
            </div>

            {/* Genres */}
            {movie.genres && movie.genres.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {movie.genres.map((genre) => (
                  <span
                    key={genre.id}
                    className="px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-semibold hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>
            )}

            {/* Overview */}
            <div>
              <h2 className="text-2xl font-bold mb-3 text-gray-900 dark:text-gray-100">Overview</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg">
                {movie.overview || "No overview available."}
              </p>
            </div>

            {/* Streaming Providers */}
            <StreamingProviders mediaType="movie" mediaId={movieId} title={movie.title} />

            {/* Trailer Section */}
            {videos && videos.results.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Trailers</h2>
                <TrailerPlayer videos={videos.results} />
              </div>
            )}

            {/* Track Section */}
            {user && (
              <div className="bg-gradient-to-br from-blue-50 to-emerald-50 dark:from-blue-900/20 dark:to-emerald-900/20 p-6 rounded-2xl shadow-lg border border-blue-100 dark:border-blue-800">
                <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Track This Movie</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                      Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as EntryStatus)}
                      className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all"
                    >
                      <option value="plan">Plan to Watch</option>
                      <option value="watching">Watching</option>
                      <option value="completed">Completed</option>
                      <option value="dropped">Dropped</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700">
                      Your Rating
                    </label>
                    <RatingStars
                      value={rating}
                      onChange={setRating}
                      maxRating={10}
                    />
                  </div>
                  <button
                    onClick={handleSave}
                    disabled={isUpserting}
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 dark:from-blue-500 dark:to-emerald-500 dark:hover:from-blue-600 dark:hover:to-emerald-600 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUpserting ? "Saving..." : "Save to Watchlist"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Toast
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
}
