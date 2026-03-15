import { MediaCard } from "./MediaCard";
import { Loader } from "../common/Loader";
import { EmptyState } from "../common/EmptyState";
import { useUserEntries } from "../../hooks/useUserEntries";
import { Link } from "react-router-dom";

export function RecentlyAddedSection() {
  const { entries, isLoading } = useUserEntries();

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader />
      </div>
    );
  }

  if (!entries || entries.length === 0) {
    return null;
  }

  // Get the 8 most recently added items (entries are already sorted by createdAt desc)
  const recentlyAdded = entries.slice(0, 8);

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Recently Added
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Your latest additions to the watchlist
          </p>
        </div>
        <Link
          to="/watchlist"
          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold flex items-center gap-2 transition-colors"
        >
          View All
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-4 md:gap-6">
        {recentlyAdded.map((entry) => {
          const tmdbItem = {
            id: entry.tmdbId,
            media_type: entry.mediaType,
            title: entry.mediaType === "movie" ? entry.title : undefined,
            name: entry.mediaType === "tv" ? entry.title : undefined,
            poster_path: entry.posterPath,
            vote_average: undefined,
            overview: undefined
          };

          return (
            <MediaCard
              key={`${entry.mediaType}-${entry.tmdbId}`}
              item={tmdbItem}
              userStatus={entry.status}
            />
          );
        })}
      </div>
    </section>
  );
}



