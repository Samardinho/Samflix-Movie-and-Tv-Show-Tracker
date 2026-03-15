export type MediaType = "movie" | "tv";

export type EntryStatus = "plan" | "watching" | "completed" | "dropped";

export interface UserEntryBase {
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  posterPath: string | null;
  status: EntryStatus;
  rating: number | null;
  season: number | null;
  episode: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserEntry extends UserEntryBase {
  id: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  createdAt: string | null;
  profilePictureUrl?: string | null;
}


