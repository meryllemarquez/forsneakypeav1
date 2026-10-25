import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { memoryService } from '../services/memoryService';
import { dateService } from '../services/dateService';
import { loveBoardService } from '../services/loveBoardService';
import { menuService } from '../services/menuService';
import { notificationService } from '../services/notificationService';
import { profileService } from '../services/profileService';
import { homeService } from '../services/homeService';
import api from '../api/axiosConfig';
import { queryKeys } from './queryKeys';

const SECOND = 1000;

// ---- Memories -------------------------------------------------------------------------
export function useFolders(includeArchived = false) {
  return useQuery({
    queryKey: queryKeys.folders(includeArchived),
    queryFn: async () => (await memoryService.getFolders(includeArchived)) || [],
    staleTime: 45 * SECOND,
  });
}

export function useCalendarMonth(year, month) {
  return useQuery({
    queryKey: queryKeys.calendar(year, month),
    queryFn: async () => (await memoryService.getCalendarMonth(year, month)) || [],
    staleTime: 45 * SECOND,
    // Keep showing the previous month while the next one loads.
    placeholderData: keepPreviousData,
  });
}

// ---- Dates ----------------------------------------------------------------------------
export function useDates(includeArchived = true) {
  return useQuery({
    queryKey: queryKeys.dates(includeArchived),
    queryFn: async () => (await dateService.getDates({ includeArchived })) || [],
    staleTime: 45 * SECOND,
  });
}

export function useDateCategories() {
  return useQuery({
    queryKey: queryKeys.dateCategories(),
    queryFn: async () => (await api.get('/date-categories')).data?.data ?? [],
    staleTime: 5 * 60 * SECOND,
  });
}

// ---- Love board -----------------------------------------------------------------------
// The board is dragged around and edited optimistically, so a background refetch landing in
// the middle of an interaction would visibly snap notes back. It still refetches on mount
// once stale; it just does not refetch on window focus.
export function useLoveNotes() {
  return useQuery({
    queryKey: queryKeys.loveNotes(),
    queryFn: async () => (await loveBoardService.getNotes()) || [],
    staleTime: 45 * SECOND,
    refetchOnWindowFocus: false,
  });
}

export function useLoveStickers() {
  return useQuery({
    queryKey: queryKeys.loveStickers(),
    queryFn: async () => (await loveBoardService.getStickers()) || [],
    staleTime: 45 * SECOND,
    refetchOnWindowFocus: false,
  });
}

// ---- Menu (Our usual orders) ----------------------------------------------------------
export function useMenuItems() {
  return useQuery({
    queryKey: queryKeys.menuItems(),
    queryFn: async () => (await menuService.getItems()) || [],
    staleTime: 30 * SECOND,
  });
}

// Returns [data, setData]. `setData` accepts a value or an updater function (like useState's
// setter) and writes straight to the query cache, so existing optimistic-update code that did
// `setNotes(prev => ...)` keeps working unchanged and the cache stays the single source of truth.
export function useCacheSetter(queryKey) {
  const queryClient = useQueryClient();
  const keyHash = JSON.stringify(queryKey);
  return useCallback(
    (updater) => {
      queryClient.setQueryData(JSON.parse(keyHash), (prev) =>
        typeof updater === 'function' ? updater(prev ?? []) : updater
      );
    },
    [queryClient, keyHash]
  );
}

// ---- Notifications --------------------------------------------------------------------
// Replaces the hand-rolled cache + in-flight de-dupe that used to live in notificationService:
// every mounted bell shares this one query, and it is considered fresh for 15 seconds.
export function useNotificationsQuery() {
  return useQuery({
    queryKey: queryKeys.notifications(),
    queryFn: async () => {
      const data = await notificationService.getNotifications();
      return Array.isArray(data) ? data : [];
    },
    staleTime: 15 * SECOND,
  });
}

// ---- Profile --------------------------------------------------------------------------
export function useProfile() {
  return useQuery({
    queryKey: queryKeys.profile(),
    queryFn: () => profileService.getProfile(),
    staleTime: 60 * SECOND,
  });
}

// ---- Home -----------------------------------------------------------------------------
export function useHomeSummary(today) {
  return useQuery({
    queryKey: queryKeys.homeSummary(today),
    queryFn: () => homeService.getSummary(today),
    staleTime: 45 * SECOND,
  });
}
