import { useQuery } from "@tanstack/react-query";
import { getTrendingMovies, getTrendingTv } from "../../lib/apiClient";
import { MediaCard } from "./MediaCard";
import { Loader } from "../common/Loader";
import { ErrorState } from "../common/ErrorState";
import { useUserEntries } from "../../hooks/useUserEntries";
import { useAuth } from "../../hooks/useAuth";
import { Link } from "react-router-dom";

interface TrendingSectionProps {
  title: string;
  type: "movies" | "tv";
  linkTo: string;
}

export function TrendingSection({ title, type, linkTo }: TrendingSectionProps) {
  const { user } = useAuth();
  const { entries } = useUserEntries();

  const { data, isLoading, error } = useQuery({
    queryKey: ["trending", type],
    queryFn: () => (type === "movies" ? getTrendingMovies() : getTrendingTv()),
    staleTime: 1000 * 60 * 60 // Cache for 1 hour
  });

  const getUserStatus = (tmdbId: number, mediaType: "movie" | "tv") => {
    const entry = entries.find(
      (e) => e.tmdbId === tmdbId && e.mediaType === mediaType
    );
    return entry?.status ?? null;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader />
      </div>
    );
  }

  if (error) {
    return <ErrorState message="Failed to load trending content." />;
  }

  if (!data || data.results.length === 0) {
    return null;
  }

  // Filter to only show movies or TV based on type
  const expectedType = type === "movies" ? "movie" : "tv";
  const filteredResults = data.results.filter(
    (item) => item.media_type === expectedType
  );

  if (filteredResults.length === 0) {
    return null;
  }

  // Take first 8 items
  const displayResults = filteredResults.slice(0, 8);

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {title}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            What's trending right now
          </p>
        </div>
        <Link
          to={linkTo}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold flex items-center gap-2 transition-colors"
        >
          View All
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-4 md:gap-6">
        {displayResults.map((item) => {
          const tmdbItem = {
            id: item.id,
            media_type: item.media_type,
            title: item.title,
            name: item.name,
            poster_path: item.poster_path,
            vote_average: item.vote_average,
            overview: item.overview
          };

          return (
            <MediaCard
              key={`${item.media_type}-${item.id}`}
              item={tmdbItem}
              userStatus={
                item.media_type === "movie" || item.media_type === "tv"
                  ? getUserStatus(item.id, item.media_type)
                  : null
              }
            />
          );
        })}
      </div>
    </section>
  );
}

