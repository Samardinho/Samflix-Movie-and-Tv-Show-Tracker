import axios, { AxiosInstance } from "axios";
import * as functions from "firebase-functions";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

// Load environment variables from .env file in functions directory
// Try multiple possible paths to find .env file
const possiblePaths = [
  path.join(__dirname, "../.env"),           // From compiled lib/ directory
  path.join(process.cwd(), "functions/.env"), // From project root
  path.join(process.cwd(), ".env"),          // In functions directory when cwd is functions/
  ".env"                                      // Current directory
];

for (const envPath of possiblePaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export interface TmdbSearchResult {
  page: number;
  results: unknown[];
  total_pages: number;
  total_results: number;
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
}

function getApiKey(): string {
  const envKey = process.env.TMDB_API_KEY;
  if (envKey) return envKey;

  // Fallback for Firebase Functions runtime config:
  // firebase functions:config:set tmdb.key="YOUR_TMDB_API_KEY"
  let configKey: string | undefined;
  try {
    const cfg = functions.config();
    configKey = cfg?.tmdb?.key;
  } catch {
    configKey = undefined;
  }

  if (!envKey && !configKey) {
    throw new Error("TMDB_API_KEY is not configured");
  }
  return envKey ?? (configKey as string);
}

function createClient(): AxiosInstance {
  const apiKey = getApiKey();
  return axios.create({
    baseURL: TMDB_BASE_URL,
    params: {
      api_key: apiKey,
      language: "en-US"
    }
  });
}

// Lazy initialization - create client when needed, not at module load time
let client: AxiosInstance | null = null;

function getClient(): AxiosInstance {
  if (!client) {
    client = createClient();
  }
  return client;
}

export async function searchMulti(query: string): Promise<TmdbSearchResult> {
  const clientInstance = getClient();
  const response = await clientInstance.get<TmdbSearchResult>("/search/multi", {
    params: { query }
  });
  return response.data;
}

export async function getMovieDetails(id: string | number): Promise<TmdbMovieDetails> {
  const clientInstance = getClient();
  const response = await clientInstance.get<TmdbMovieDetails>(`/movie/${id}`);
  return response.data;
}

export async function getTvDetails(id: string | number): Promise<TmdbTvDetails> {
  const clientInstance = getClient();
  const response = await clientInstance.get<TmdbTvDetails>(`/tv/${id}`);
  return response.data;
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

export async function getMovieVideos(id: string | number): Promise<TmdbVideosResponse> {
  const clientInstance = getClient();
  const response = await clientInstance.get<TmdbVideosResponse>(`/movie/${id}/videos`);
  return response.data;
}

export async function getTvVideos(id: string | number): Promise<TmdbVideosResponse> {
  const clientInstance = getClient();
  const response = await clientInstance.get<TmdbVideosResponse>(`/tv/${id}/videos`);
  return response.data;
}

export interface TmdbTrendingResult {
  page: number;
  results: Array<{
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
  }>;
  total_pages: number;
  total_results: number;
}

export async function getTrendingMovies(): Promise<TmdbTrendingResult> {
  const clientInstance = getClient();
  const response = await clientInstance.get<TmdbTrendingResult>("/trending/movie/day");
  return response.data;
}

export async function getTrendingTv(): Promise<TmdbTrendingResult> {
  const clientInstance = getClient();
  const response = await clientInstance.get<TmdbTrendingResult>("/trending/tv/day");
  return response.data;
}

export async function getPopularMovies(): Promise<TmdbTrendingResult> {
  const clientInstance = getClient();
  const response = await clientInstance.get<any>("/movie/popular");
  // Add media_type to each result since popular endpoint doesn't include it
  const data = response.data;
  data.results = data.results.map((item: any) => ({
    ...item,
    media_type: "movie" as const
  }));
  return data;
}

export async function getPopularTv(): Promise<TmdbTrendingResult> {
  const clientInstance = getClient();
  const response = await clientInstance.get<any>("/tv/popular");
  // Add media_type to each result since popular endpoint doesn't include it
  const data = response.data;
  data.results = data.results.map((item: any) => ({
    ...item,
    media_type: "tv" as const
  }));
  return data;
}

export async function getTopRatedMovies(): Promise<TmdbTrendingResult> {
  const clientInstance = getClient();
  const response = await clientInstance.get<any>("/movie/top_rated");
  // Add media_type to each result since top_rated endpoint doesn't include it
  const data = response.data;
  data.results = data.results.map((item: any) => ({
    ...item,
    media_type: "movie" as const
  }));
  return data;
}

export async function getTopRatedTv(): Promise<TmdbTrendingResult> {
  const clientInstance = getClient();
  const response = await clientInstance.get<any>("/tv/top_rated");
  // Add media_type to each result since top_rated endpoint doesn't include it
  const data = response.data;
  data.results = data.results.map((item: any) => ({
    ...item,
    media_type: "tv" as const
  }));
  return data;
}

export interface TmdbExternalIds {
  imdb_id?: string | null;
  facebook_id?: string | null;
  instagram_id?: string | null;
  twitter_id?: string | null;
  wikidata_id?: string | null;
}

export async function getMovieExternalIds(id: string | number): Promise<TmdbExternalIds> {
  const clientInstance = getClient();
  const response = await clientInstance.get<TmdbExternalIds>(`/movie/${id}/external_ids`);
  return response.data;
}

export async function getTvExternalIds(id: string | number): Promise<TmdbExternalIds> {
  const clientInstance = getClient();
  const response = await clientInstance.get<TmdbExternalIds>(`/tv/${id}/external_ids`);
  return response.data;
}

export interface TmdbCastMember {
  id: number;
  name: string;
  character?: string;
  order?: number;
  profile_path?: string | null;
}

export interface TmdbCrewMember {
  id: number;
  name: string;
  job?: string;
  department?: string;
  profile_path?: string | null;
}

export interface TmdbCredits {
  id: number;
  cast: TmdbCastMember[];
  crew: TmdbCrewMember[];
}

export async function getMovieCredits(id: string | number): Promise<TmdbCredits> {
  const clientInstance = getClient();
  const response = await clientInstance.get<TmdbCredits>(`/movie/${id}/credits`);
  return response.data;
}

export async function getTvCredits(id: string | number): Promise<TmdbCredits> {
  const clientInstance = getClient();
  const response = await clientInstance.get<TmdbCredits>(`/tv/${id}/credits`);
  return response.data;
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

export async function getMovieWatchProviders(id: string | number): Promise<TmdbWatchProvidersResponse> {
  const clientInstance = getClient();
  try {
    const response = await clientInstance.get<TmdbWatchProvidersResponse>(`/movie/${id}/watch/providers`);
    return response.data;
  } catch (error: any) {
    console.error(`Error fetching watch providers for movie ${id}:`, error.response?.data || error.message);
    throw error;
  }
}

export async function getTvWatchProviders(id: string | number): Promise<TmdbWatchProvidersResponse> {
  const clientInstance = getClient();
  try {
    const response = await clientInstance.get<TmdbWatchProvidersResponse>(`/tv/${id}/watch/providers`);
    return response.data;
  } catch (error: any) {
    console.error(`Error fetching watch providers for TV ${id}:`, error.response?.data || error.message);
    throw error;
  }
}


