import type { TmdbTvDetails } from "../../types/tmdb";

interface ProgressTrackerProps {
  tvDetails: TmdbTvDetails;
  currentSeason: number | null;
  currentEpisode: number | null;
  onSeasonChange: (season: number) => void;
  onEpisodeChange: (episode: number) => void;
}

export function ProgressTracker({
  tvDetails,
  currentSeason,
  currentEpisode,
  onSeasonChange,
  onEpisodeChange
}: ProgressTrackerProps) {
  const seasons = Array.from(
    { length: tvDetails.number_of_seasons ?? 1 },
    (_, i) => i + 1
  );

  const episodes = currentSeason
    ? Array.from(
        { length: tvDetails.number_of_episodes ?? 0 },
        (_, i) => i + 1
      )
    : [];

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Season</label>
        <select
          value={currentSeason ?? ""}
          onChange={(e) => onSeasonChange(Number(e.target.value))}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
        >
          <option value="">Select season</option>
          {seasons.map((season) => (
            <option key={season} value={season}>
              Season {season}
            </option>
          ))}
        </select>
      </div>
      {currentSeason && (
        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Episode</label>
          <select
            value={currentEpisode ?? ""}
            onChange={(e) => onEpisodeChange(Number(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
          >
            <option value="">Select episode</option>
            {episodes.map((episode) => (
              <option key={episode} value={episode}>
                Episode {episode}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

