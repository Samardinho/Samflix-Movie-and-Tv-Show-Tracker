import { Link } from "react-router-dom";
import type { TmdbSearchResultItem } from "../../types/tmdb";
import { StatusBadge } from "./StatusBadge";

interface MediaCardProps {
  item: TmdbSearchResultItem;
  userStatus?: "plan" | "watching" | "completed" | "dropped" | null;
  onAddToWatchlist?: () => void;
  showAddButton?: boolean;
}

export function MediaCard({
  item,
  userStatus,
  onAddToWatchlist,
  showAddButton = false
}: MediaCardProps) {
  const title = item.title ?? item.name ?? "Unknown";
  const mediaType = item.media_type === "movie" ? "movie" : "tv";
  const posterUrl = item.poster_path
    ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
    : "https://via.placeholder.com/500x750?text=No+Poster";

  return (
    <div className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-gray-900/50 overflow-hidden hover:shadow-2xl dark:hover:shadow-gray-900 transition-all duration-300 transform hover:-translate-y-2 flex flex-col h-full">
      <Link to={`/${mediaType}/${item.id}`} className="block relative overflow-hidden flex-shrink-0">
        <img
          src={posterUrl}
          alt={title}
          className="w-full h-96 object-cover transition-transform duration-300 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        {item.vote_average !== undefined && (
          <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            {item.vote_average.toFixed(1)}
          </div>
        )}
      </Link>
      <div className="p-5 flex flex-col">
        <div className="flex items-start justify-between mb-3">
          <Link
            to={`/${mediaType}/${item.id}`}
            className="font-bold text-lg hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-2 text-gray-900 dark:text-gray-100 flex-1"
          >
            {title}
          </Link>
          {userStatus && <StatusBadge status={userStatus} />}
        </div>
        <div className="flex items-center justify-between mb-3">
          <span className="px-3 py-1 bg-gradient-to-r from-blue-100 to-emerald-100 dark:from-blue-900/30 dark:to-emerald-900/30 rounded-full capitalize text-xs font-semibold text-blue-800 dark:text-blue-300">
            {mediaType}
          </span>
        </div>
        {item.overview ? (
          <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3 leading-relaxed min-h-[4.5rem]">
            {item.overview}
          </p>
        ) : (
          <div className="min-h-[4.5rem]"></div>
        )}
        {showAddButton && onAddToWatchlist && (
          <button
            onClick={onAddToWatchlist}
            className="mt-4 w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 dark:from-blue-500 dark:to-emerald-500 dark:hover:from-blue-600 dark:hover:to-emerald-600 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
          >
            Add to Watchlist
          </button>
        )}
      </div>
    </div>
  );
}

