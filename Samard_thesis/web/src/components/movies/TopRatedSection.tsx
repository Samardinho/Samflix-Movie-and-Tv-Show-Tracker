import { useQuery } from "@tanstack/react-query";
import { getTopRatedMovies, getTopRatedTv } from "../../lib/apiClient";
import { MediaCard } from "./MediaCard";
import { Loader } from "../common/Loader";
import { ErrorState } from "../common/ErrorState";
import { useUserEntries } from "../../hooks/useUserEntries";
import { useAuth } from "../../hooks/useAuth";

interface TopRatedSectionProps {
  title: string;
  type: "movies" | "tv";
}

export function TopRatedSection({ title, type }: TopRatedSectionProps) {
  const { user } = useAuth();
  const { entries } = useUserEntries();

  const { data, isLoading, error } = useQuery({
    queryKey: ["top-rated", type],
    queryFn: () => (type === "movies" ? getTopRatedMovies() : getTopRatedTv()),
    staleTime: 1000 * 60 * 60 * 24 // Cache for 24 hours (top-rated doesn't change as often)
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
    return <ErrorState message="Failed to load top-rated content." />;
  }

  if (!data || !data.results || data.results.length === 0) {
    return (
      <section className="mb-12">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {title}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Top-rated {type === "movies" ? "movies" : "TV shows"}
          </p>
        </div>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No content available at the moment.
        </div>
      </section>
    );
  }

  // Filter to only show movies or TV based on type
  // Also handle cases where media_type might be missing (add it if needed)
  const expectedType = type === "movies" ? "movie" : "tv";
  const filteredResults = data.results
    .map((item) => ({
      ...item,
      media_type: item.media_type || expectedType
    }))
    .filter((item) => item.media_type === expectedType);

  if (filteredResults.length === 0) {
    return (
      <section className="mb-12">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {title}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Top-rated {type === "movies" ? "movies" : "TV shows"}
          </p>
        </div>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No {type === "movies" ? "movies" : "TV shows"} found.
        </div>
      </section>
    );
  }

  // Take first 12 items for top-rated (more than trending)
  const displayResults = filteredResults.slice(0, 12);

  return (
    <section className="mb-12">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {title}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Top-rated {type === "movies" ? "movies" : "TV shows"}
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
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




