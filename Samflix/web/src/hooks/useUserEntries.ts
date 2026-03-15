import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc
} from "firebase/firestore";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { db } from "../lib/firebase";
import type { EntryStatus, MediaType, UserEntry } from "../types/domain";
import { useAuth } from "./useAuth";

interface UpsertEntryInput {
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  posterPath: string | null;
  status?: EntryStatus;
  rating?: number | null;
  season?: number | null;
  episode?: number | null;
}

export function useUserEntries() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const uid = user?.uid;

  const entriesQuery = useQuery({
    queryKey: ["entries", uid],
    enabled: Boolean(uid),
    queryFn: async (): Promise<UserEntry[]> => {
      if (!uid) return [];
      const entriesCol = collection(db, "users", uid, "entries");
      const q = query(entriesCol, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          tmdbId: data.tmdbId,
          mediaType: data.mediaType,
          title: data.title,
          posterPath: data.posterPath ?? null,
          status: data.status,
          rating: data.rating ?? null,
          season: data.season ?? null,
          episode: data.episode ?? null,
          createdAt: data.createdAt?.toDate?.().toISOString?.() ?? "",
          updatedAt: data.updatedAt?.toDate?.().toISOString?.() ?? ""
        } as UserEntry;
      });
    }
  });

  const upsertMutation = useMutation({
    mutationFn: async (input: UpsertEntryInput): Promise<void> => {
      if (!uid) throw new Error("Not authenticated");
      const entryRef = doc(db, "users", uid, "entries", String(input.tmdbId));
      const payload = {
        tmdbId: input.tmdbId,
        mediaType: input.mediaType,
        title: input.title,
        posterPath: input.posterPath ?? null,
        status: input.status ?? "plan",
        rating: input.rating ?? null,
        season: input.season ?? null,
        episode: input.episode ?? null,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      };
      await setDoc(entryRef, payload, { merge: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entries", uid] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (tmdbId: number): Promise<void> => {
      if (!uid) throw new Error("Not authenticated");
      const entryRef = doc(db, "users", uid, "entries", String(tmdbId));
      await deleteDoc(entryRef);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entries", uid] });
    }
  });

  return {
    entries: entriesQuery.data ?? [],
    isLoading: entriesQuery.isLoading,
    error: entriesQuery.error,
    upsertEntry: upsertMutation.mutateAsync,
    deleteEntry: deleteMutation.mutateAsync,
    isUpserting: upsertMutation.isPending,
    isDeleting: deleteMutation.isPending
  };
}


