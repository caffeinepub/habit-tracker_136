import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Habit, HabitLog, UserProfile } from "../backend.d";
import { useActor } from "./useActor";

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const query = useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const queryClient = useQueryClient();
  const { actor } = useActor();
  return useMutation({
    mutationFn: (profile: UserProfile) => {
      if (!actor) throw new Error("Actor not available");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

export function useGetHabits(enabled: boolean) {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery<Habit[]>({
    queryKey: ["habits"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getHabits();
    },
    enabled: enabled && !!actor && !actorFetching,
    retry: false,
  });
}

export function useAddHabit() {
  const queryClient = useQueryClient();
  const { actor } = useActor();
  return useMutation({
    mutationFn: ({ name, color }: { name: string; color: string }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addHabit(name, color);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
    },
  });
}

export function useRemoveHabit() {
  const queryClient = useQueryClient();
  const { actor } = useActor();
  return useMutation({
    mutationFn: (habitId: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.removeHabit(habitId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      queryClient.invalidateQueries({ queryKey: ["logs"] });
    },
  });
}

export function useGetLogs(
  startDate: string,
  endDate: string,
  enabled: boolean,
) {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery<HabitLog[]>({
    queryKey: ["logs", startDate, endDate],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getLogs(startDate, endDate);
    },
    enabled: enabled && !!actor && !actorFetching && !!startDate && !!endDate,
    retry: false,
  });
}

export function useLogHabit() {
  const queryClient = useQueryClient();
  const { actor } = useActor();
  return useMutation({
    mutationFn: ({
      habitId,
      date,
      done,
      timeNote,
    }: {
      habitId: string;
      date: string;
      done: boolean;
      timeNote: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.logHabit(habitId, date, done, timeNote);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["logs"] });
    },
  });
}

export function useGenerateShareToken() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: () => {
      if (!actor) throw new Error("Actor not available");
      return actor.generateShareToken();
    },
  });
}

export function useGetSharedTracker(token: string) {
  const { actor } = useActor();
  return useQuery({
    queryKey: ["sharedTracker", token],
    queryFn: () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getSharedTracker(token);
    },
    enabled: !!token && !!actor,
    retry: false,
  });
}
