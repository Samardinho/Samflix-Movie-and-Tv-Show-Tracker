import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useUserEntries } from "../hooks/useUserEntries";
import { Loader } from "../components/common/Loader";
import { EmptyState } from "../components/common/EmptyState";
import { MediaCard } from "../components/movies/MediaCard";
import { StatusBadge } from "../components/movies/StatusBadge";
import { RatingStars } from "../components/movies/RatingStars";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { useState } from "react";
import type { EntryStatus, UserEntry } from "../types/domain";

const statusGroups: EntryStatus[] = ["plan", "watching", "completed", "dropped"];

export function WatchlistPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const statusFilter = searchParams.get("status") as EntryStatus | null;
  const { entries, isLoading, deleteEntry, isDeleting } = useUserEntries();
  const [deleteTarget, setDeleteTarget] = useState<UserEntry | null>(null);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader />
      </div>
    );
  }

  // Filter entries by status if a filter is provided
  const filteredEntries = statusFilter && statusGroups.includes(statusFilter)
    ? entries.filter((e) => e.status === statusFilter)
    : entries;

  if (entries.length === 0) {
    return (
      <div>
        {statusFilter && statusGroups.includes(statusFilter) && (
          <>
            <div className="fixed top-16 sm:top-20 left-0 right-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm">
              <div className="max-w-7xl mx-auto px-4 py-2 sm:py-3">
                <button
                  onClick={() => navigate(-1)}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shadow-md hover:shadow-lg border border-gray-200 dark:border-gray-700 text-sm sm:text-base"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="font-medium">Back</span>
                </button>
              </div>
            </div>
            <div className="h-20 sm:h-24"></div>
          </>
        )}
        <div className="max-w-7xl mx-auto px-4 py-12 sm:py-16">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-blue-600 via-cyan-600 to-emerald-600 bg-clip-text text-transparent">
            My Watchlist
          </h1>
          <EmptyState message="Your watchlist is empty. Start adding movies and TV shows!" />
        </div>
      </div>
    );
  }

  if (statusFilter && statusGroups.includes(statusFilter) && filteredEntries.length === 0) {
    const statusLabels: Record<EntryStatus, string> = {
      plan: "Plan to Watch",
      watching: "Watching",
      completed: "Completed",
      dropped: "Dropped"
    };
    return (
      <div>
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
        <div className="h-24"></div>
        <div className="max-w-7xl mx-auto px-4 py-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-cyan-600 to-emerald-600 bg-clip-text text-transparent">
            {statusLabels[statusFilter]}
          </h1>
          <EmptyState message={`You don't have any items in "${statusLabels[statusFilter]}".`} />
        </div>
      </div>
    );
  }

  const entriesByStatus = statusGroups.reduce(
    (acc, status) => {
      acc[status] = filteredEntries.filter((e) => e.status === status);
      return acc;
    },
    {} as Record<EntryStatus, UserEntry[]>
  );

  const handleDelete = async () => {
    if (deleteTarget) {
      await deleteEntry(deleteTarget.tmdbId);
      setDeleteTarget(null);
    }
  };

  return (
    <div>
      {statusFilter && statusGroups.includes(statusFilter) && (
        <>
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
          <div className="h-24"></div>
        </>
      )}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-12">
        <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-cyan-600 to-emerald-600 bg-clip-text text-transparent">
          {statusFilter && statusGroups.includes(statusFilter)
            ? statusFilter === "plan" && "Plan to Watch"
            || statusFilter === "watching" && "Watching"
            || statusFilter === "completed" && "Completed"
            || statusFilter === "dropped" && "Dropped"
            : "My Watchlist"}
        </h1>
        <div className="flex items-center gap-4">
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Total: <span className="font-bold text-gray-900 dark:text-gray-100">{filteredEntries.length}</span> item{filteredEntries.length !== 1 ? "s" : ""}
            {statusFilter && statusGroups.includes(statusFilter) && (
              <span className="ml-2 text-base">
                ({statusFilter === "plan" && "Plan to Watch"}
                {statusFilter === "watching" && "Watching"}
                {statusFilter === "completed" && "Completed"}
                {statusFilter === "dropped" && "Dropped"})
              </span>
            )}
          </p>
        </div>
      </div>

      {(statusFilter && statusGroups.includes(statusFilter)
        ? [statusFilter]
        : statusGroups
      ).map((status) => {
        const groupEntries = entriesByStatus[status];
        if (groupEntries.length === 0) return null;

        return (
          <div key={status} className="mb-20">
            <div className="flex items-center gap-4 mb-8 pb-4 border-b-2 border-gray-200 dark:border-gray-700">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100">
                {status === "plan" && "Plan to Watch"}
                {status === "watching" && "Watching"}
                {status === "completed" && "Completed"}
                {status === "dropped" && "Dropped"}
              </h2>
              <StatusBadge status={status} />
              <span className="px-4 py-1.5 bg-gradient-to-r from-blue-100 to-emerald-100 dark:from-blue-900/30 dark:to-emerald-900/30 rounded-full text-sm font-bold text-blue-700 dark:text-blue-300">
                {groupEntries.length}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {groupEntries.map((entry) => {
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
                  <div key={entry.id} className="flex flex-col">
                    <MediaCard item={tmdbItem} userStatus={entry.status} />
                    <div className="mt-3 space-y-2">
                      {entry.rating !== null && (
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Your Rating: </span>
                          <div className="overflow-hidden">
                            <RatingStars
                              value={entry.rating}
                              onChange={() => {}}
                              readonly
                              maxRating={10}
                            />
                          </div>
                        </div>
                      )}
                      {entry.mediaType === "tv" && (
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {entry.season && entry.episode && (
                            <span>
                              S{entry.season}E{entry.episode}
                            </span>
                          )}
                        </div>
                      )}
                      <div className="flex gap-2 mt-3">
                        <Link
                          to={`/${entry.mediaType}/${entry.tmdbId}`}
                          className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 dark:from-blue-500 dark:to-emerald-500 dark:hover:from-blue-600 dark:hover:to-emerald-600 text-white text-sm rounded-lg font-semibold text-center transition-all shadow-md hover:shadow-lg"
                        >
                          View Details
                        </Link>
                        <button
                          onClick={() => setDeleteTarget(entry)}
                          disabled={isDeleting}
                          className="px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 dark:from-gray-500 dark:to-gray-600 dark:hover:from-gray-600 dark:hover:to-gray-700 text-white text-sm rounded-lg font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

        <ConfirmDialog
          open={deleteTarget !== null}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          title="Delete Entry"
          message={`Are you sure you want to remove "${deleteTarget?.title}" from your watchlist?`}
          confirmText="Delete"
          cancelText="Cancel"
          confirmVariant="danger"
        />
      </div>
    </div>
  );
}
