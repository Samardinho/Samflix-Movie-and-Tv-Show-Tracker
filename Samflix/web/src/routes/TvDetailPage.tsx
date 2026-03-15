import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getTvDetails, getTvVideos } from "../lib/apiClient";
import { Loader } from "../components/common/Loader";
import { ErrorState } from "../components/common/ErrorState";
import { Toast } from "../components/common/Toast";
import { RatingStars } from "../components/movies/RatingStars";
import { ProgressTracker } from "../components/movies/ProgressTracker";
import { TrailerPlayer } from "../components/movies/TrailerPlayer";
import { ReleaseDateBadge } from "../components/movies/ReleaseDateBadge";
import { StreamingProviders } from "../components/movies/StreamingProviders";
import { useUserEntries } from "../hooks/useUserEntries";
import { useAuth } from "../hooks/useAuth";
import { useState } from "react";
import type { EntryStatus } from "../types/domain";

export function TvDetailPage() {
  const { id } = useParams<{ id: string }>();
  const tvId = Number(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { entries, upsertEntry, isUpserting } = useUserEntries();

  const existingEntry = entries.find(
    (e) => e.tmdbId === tvId && e.mediaType === "tv"
  );

  const [status, setStatus] = useState<EntryStatus>(
    existingEntry?.status ?? "plan"
  );
  const [rating, setRating] = useState<number | null>(
    existingEntry?.rating ?? null
  );
  const [season, setSeason] = useState<number | null>(
    existingEntry?.season ?? null
  );
  const [episode, setEpisode] = useState<number | null>(
    existingEntry?.episode ?? null
  );
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const { data: tv, isLoading, error } = useQuery({
    queryKey: ["tv", tvId],
    queryFn: () => getTvDetails(tvId),
    enabled: !isNaN(tvId)
  });

  const { data: videos } = useQuery({
    queryKey: ["tv", tvId, "videos"],
    queryFn: () => getTvVideos(tvId),
    enabled: !isNaN(tvId) && !!tv
  });

  const handleSave = async () => {
    if (!tv || !user) return;
    await upsertEntry({
      tmdbId: tv.id,
      mediaType: "tv",
      title: tv.name,
      posterPath: tv.poster_path,
      status,
      rating,
      season,
      episode
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

  if (error || !tv) {
    return <ErrorState message="Failed to load TV show details." />;
  }

  const posterUrl = tv.poster_path
    ? `https://image.tmdb.org/t/p/w500${tv.poster_path}`
    : "https://via.placeholder.com/500x750?text=No+Poster";

  const backdropUrl = tv.backdrop_path
    ? `https://image.tmdb.org/t/p/original${tv.backdrop_path}`
    : null;

  const firstAirYear = tv.first_air_date
    ? new Date(tv.first_air_date).getFullYear()
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
        <div className="relative h-96 -mx-4 md:-mx-8 lg:-mx-16 mb-8 overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${backdropUrl})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/60 to-black/90" />
          </div>
          <div className="relative h-full flex items-end p-8">
            <div className="max-w-6xl mx-auto w-full">
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-2 drop-shadow-2xl">
                {tv.name}
              </h1>
              {firstAirYear && (
                <p className="text-2xl text-gray-200 drop-shadow-lg">
                  {firstAirYear}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Poster Column */}
          <div className="lg:col-span-4">
            <div className="sticky top-4">
              <img
                src={posterUrl}
                alt={tv.name}
                className="w-full rounded-2xl shadow-2xl"
              />
              {tv.first_air_date && (
                <div className="mt-4">
                  <ReleaseDateBadge date={tv.first_air_date} label="First Aired" />
                </div>
              )}
            </div>
          </div>

          {/* Content Column */}
          <div className="lg:col-span-8 space-y-6">
            {/* Title (if no backdrop) */}
            {!backdropUrl && (
              <div>
                <h1 className="text-4xl md:text-5xl font-bold mb-2">
                  {tv.name}
                  {firstAirYear && (
                    <span className="text-gray-500"> ({firstAirYear})</span>
                  )}
                </h1>
              </div>
            )}

            {/* Stats Bar */}
            <div className="flex flex-wrap items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl">
              {tv.vote_average !== undefined && (
                <div className="flex items-center gap-2">
                  <svg className="w-6 h-6 text-amber-500 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  <div>
                    <div className="text-xl font-bold">
                      {tv.vote_average.toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">TMDb Rating</div>
                  </div>
                </div>
              )}
              {tv.omdbRatings?.imdbRating !== undefined && tv.omdbRatings.imdbRating !== null && (
                <div className="flex items-center gap-2">
                  <svg className="w-6 h-6 text-yellow-500 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  <div>
                    <div className="text-xl font-bold">
                      {tv.omdbRatings.imdbRating.toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">IMDb Rating</div>
                  </div>
                </div>
              )}
              {tv.omdbRatings?.metascore !== undefined && tv.omdbRatings.metascore !== null && (
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-green-600" title="Metascore">M</span>
                  <div>
                    <div className="text-xl font-bold">
                      {tv.omdbRatings.metascore}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Metascore</div>
                  </div>
                </div>
              )}
              {tv.number_of_seasons && (
                <div className="flex items-center gap-2">
                  <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                  </svg>
                  <div>
                    <div className="font-semibold">
                      {tv.number_of_seasons} Season{tv.number_of_seasons !== 1 ? "s" : ""}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Total</div>
                  </div>
                </div>
              )}
              {tv.number_of_episodes && (
                <div className="flex items-center gap-2">
                  <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <div className="font-semibold">
                      {tv.number_of_episodes} Episode{tv.number_of_episodes !== 1 ? "s" : ""}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Total</div>
                  </div>
                </div>
              )}
            </div>

            {/* Genres */}
            {tv.genres && tv.genres.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tv.genres.map((genre) => (
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
                {tv.overview || "No overview available."}
              </p>
            </div>

            {/* Streaming Providers */}
            <StreamingProviders mediaType="tv" mediaId={tvId} title={tv.name} />

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
                <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Track This TV Show</h2>
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
                  <ProgressTracker
                    tvDetails={tv}
                    currentSeason={season}
                    currentEpisode={episode}
                    onSeasonChange={setSeason}
                    onEpisodeChange={setEpisode}
                  />
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
