"use client";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ShareBackground } from "@/components/mv/ShareCard";
import { listSaved, toggleSaved, updateSavedBackground, type SavedItem } from "@/lib/client/saved-store";
import type { Passage, Tradition } from "@/lib/scripture";

import { apiFetch } from "./client";
import { toReflection } from "./mapping";
import type { FeedbackReason, HistoryDto, ReflectionDto, SubmitDto, UserDto } from "./types";

const HISTORY_PAGE = 20;

export const queryKeys = {
  me: ["me"] as const,
  history: ["history"] as const,
  reflection: (id: number) => ["reflection", id] as const,
  saved: ["saved"] as const,
};

/** Submit a reflection. Matching runs in the background; poll with useReflection. */
export function useCreateReflection() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ text, tradition }: { text: string; tradition: Tradition }) =>
      apiFetch<SubmitDto>("api/v1/recommendations", { method: "POST", json: { text, religion: tradition } }),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.history }),
  });
}

/** One reflection, polled every second until it completes or fails. */
export function useReflection(id: number | null) {
  return useQuery({
    queryKey: queryKeys.reflection(id ?? -1),
    queryFn: () => apiFetch<ReflectionDto>(`api/v1/reflections/${id}`),
    enabled: id !== null,
    select: toReflection,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "pending" || status === "processing" ? 1000 : false;
    },
  });
}

/** Private history, newest first, loaded a page at a time. */
export function useHistory() {
  return useInfiniteQuery({
    queryKey: queryKeys.history,
    queryFn: ({ pageParam }) =>
      apiFetch<HistoryDto>(`api/v1/reflections/history?limit=${HISTORY_PAGE}&offset=${pageParam}`),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.items.length < last.limit ? undefined : last.offset + last.limit),
    select: (data) => data.pages.flatMap((page) => page.items).map(toReflection),
  });
}

/** "This helped" / "Not quite", with an optional reason, for one shown passage. */
export function useFeedback(reflectionId: number) {
  return useMutation({
    mutationFn: ({
      passageId,
      helped,
      reason,
    }: {
      passageId: string;
      helped: boolean;
      reason?: FeedbackReason;
    }) =>
      apiFetch(`api/v1/reflections/${reflectionId}/feedback`, {
        method: "POST",
        json: { canonical_id: passageId, helpful: helped, note: reason },
      }),
  });
}

export function useMe() {
  return useQuery({ queryKey: queryKeys.me, queryFn: () => apiFetch<UserDto>("auth/me") });
}

export function useSetDefaultTradition() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (tradition: Tradition) =>
      apiFetch<UserDto>("auth/me/preferences", { method: "PATCH", json: { preferred_religion: tradition } }),
    onSuccess: (user) => client.setQueryData(queryKeys.me, user),
  });
}

/** Saved passages. Kept in this browser until the backend can store them. */
export function useSaved() {
  return useQuery({ queryKey: queryKeys.saved, queryFn: listSaved, staleTime: Infinity });
}

export function useToggleSave() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (item: { passage: Passage; background: ShareBackground; reflectionId: number | null }) =>
      toggleSaved(item),
    onSuccess: (items: SavedItem[]) => client.setQueryData(queryKeys.saved, items),
  });
}

export function useUpdateSavedBackground() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ passageId, background }: { passageId: string; background: ShareBackground }) =>
      updateSavedBackground(passageId, background),
    onSuccess: (items: SavedItem[]) => client.setQueryData(queryKeys.saved, items),
  });
}
