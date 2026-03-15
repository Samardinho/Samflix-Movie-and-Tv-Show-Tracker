export type TmdbMediaType = "movie" | "tv" | "person";

export interface TmdbSearchResultItem {
  id: number;
  media_type: TmdbMediaType;
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string | null;
  vote_average?: number;
}

export interface TmdbSearchResponse {
  page: number;
  results: TmdbSearchResultItem[];
  total_pages: number;
  total_results: number;
}

export interface OmdbRatings {
  imdbRating?: number | null;
  imdbVotes?: string | null;
  metascore?: number | null;
}

export interface TmdbMovieDetails {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  release_date?: string;
  genres?: { id: number; name: string }[];
  runtime?: number | null;
  vote_average?: number;
  backdrop_path?: string | null;
  omdbRatings?: OmdbRatings | null;
}

export interface TmdbTvDetails {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  first_air_date?: string;
  genres?: { id: number; name: string }[];
  episode_run_time?: number[];
  vote_average?: number;
  number_of_seasons?: number;
  number_of_episodes?: number;
  backdrop_path?: string | null;
  omdbRatings?: OmdbRatings | null;
}

export interface TmdbVideo {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
}

export interface TmdbVideosResponse {
  id: number;
  results: TmdbVideo[];
}

export interface TmdbTrendingItem {
  id: number;
  media_type: "movie" | "tv";
  title?: string;
  name?: string;
  overview?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
}

export interface TmdbTrendingResponse {
  page: number;
  results: TmdbTrendingItem[];
  total_pages: number;
  total_results: number;
}

export interface TmdbWatchProvider {
  display_priority: number;
  logo_path: string;
  provider_id: number;
  provider_name: string;
}

export interface TmdbWatchProviders {
  link?: string;
  flatrate?: TmdbWatchProvider[];
  rent?: TmdbWatchProvider[];
  buy?: TmdbWatchProvider[];
  ads?: TmdbWatchProvider[];
  free?: TmdbWatchProvider[];
}

export interface TmdbWatchProvidersResponse {
  id: number;
  results: {
    [countryCode: string]: TmdbWatchProviders;
  };
}


