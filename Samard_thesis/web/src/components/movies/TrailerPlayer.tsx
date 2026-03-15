import { useState } from "react";
import type { TmdbVideo } from "../../types/tmdb";

interface TrailerPlayerProps {
  videos: TmdbVideo[];
}

export function TrailerPlayer({ videos }: TrailerPlayerProps) {
  const [selectedVideo, setSelectedVideo] = useState<TmdbVideo | null>(null);

  // Filter for YouTube trailers (official trailers preferred)
  const trailers = videos
    .filter((video) => video.site === "YouTube" && video.type === "Trailer")
    .sort((a, b) => (b.official ? 1 : 0) - (a.official ? 1 : 0));

  if (trailers.length === 0) {
    return null;
  }

  // Auto-select first trailer
  const currentVideo = selectedVideo || trailers[0];

  return (
    <div className="space-y-4">
      <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
        <iframe
          className="absolute top-0 left-0 w-full h-full rounded-xl shadow-2xl"
          src={`https://www.youtube.com/embed/${currentVideo.key}?autoplay=0&rel=0`}
          title={currentVideo.name}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      {trailers.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {trailers.map((trailer) => (
            <button
              key={trailer.id}
              onClick={() => setSelectedVideo(trailer)}
              className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                currentVideo.id === trailer.id
                  ? "bg-blue-600 text-white shadow-lg scale-105"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-700"
              }`}
            >
              {trailer.official && (
                <span className="inline-flex items-center mr-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              )}
              {trailer.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

