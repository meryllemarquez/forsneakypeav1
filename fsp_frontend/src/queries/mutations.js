import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { memoryService } from '../services/memoryService';
import { dateService } from '../services/dateService';
import { checklistService } from '../services/checklistService';
import { loveBoardService } from '../services/loveBoardService';
import { profileService } from '../services/profileService';
import { menuService } from '../services/menuService';
import { wheelService } from '../services/wheelService';
import { bouquetService } from '../services/bouquetService';
import { keyFamilies, queryKeys } from './queryKeys';

/*
 * Every write in the app goes through one of these hooks, and each one says which cached
 * queries it makes stale. Pages call them exactly like the old service calls
 * (`await memoryMutations.createFolder(payload)`), so error handling in the pages is unchanged.
 * Where a mutation's onSuccess returns a promise, the call resolves only after the active
 * queries it invalidated have refetched -- the same "await reload" behaviour the pages had.
 *
 * Mutation                                    Invalidates
 * ------------------------------------------  ---------------------------------------------
 * memory: createFolder / updateFolder /       folders (all), calendar (all), home
 *   deleteFolder / addPhoto / addPhotosBatch /
 *   updatePhoto /
 *   deletePhoto / setCalendarHighlight /
 *   clearCalendarHighlight
 * memory: updateHighlightPosition             folders (the calendar view updates its own
 *                                             cache optimistically)
 * dates:  createDate / updateDate /           dates (all), home
 *   deleteDate / archiveDate /
 *   unarchiveDate / duplicateDate
 * dates:  setFavorite                         dates, marked stale only (the page already
 *                                             flipped the heart optimistically)
 * checklist: create / toggle / update /       dates, marked stale only (the page patches the
 *   delete / reorder item                     list counts optimistically)
 * love:   createNote / updateNote /           home (the page writes the returned note into
 *   deleteNote                                the notes cache itself)
 * love:   updateNotePosition                  nothing on success (optimistic drag); resyncs
 *                                             love-notes if the request fails
 * love:   create/update/deleteSticker         nothing on success (page updates the cache);
 *                                             updateSticker resyncs love-stickers on failure
 * menu:   createItem / updateItem             menu-items
 * menu:   deleteItem                          menu-items (row removed optimistically)
 * menu:   reorderItems                        nothing on success (cache set to the saved
 *                                             order); reverts + refetches on failure
 * wheel:  createWheel / updateWheel           wheels (cache set to the saved wheel)
 * wheel:  deleteWheel                         wheels (row removed optimistically), wheel-spins
 * wheel:  addSpin / setSpinAccepted /         wheel-spins
 *   clearSpins
 * bouquet: create / update / delete /         bouquets (all, including single bouquets);
 *   deleteAll                                 delete / deleteAll also love-stickers
 * profile: updateProfile / updateAvatar /     profile (cache set to the saved profile)
 *   removeAvatar
 * notifications: see useNotifications.js     notifications (optimistic, resync when settled)
 */

// Wraps a service function as a mutation and returns a stable async function with the same
// signature, so `fn(a, b)` resolves/rejects exactly like the underlying service call.
function useAction(fn, options = {}) {
  const { mutateAsync } = useMutation({ mutationFn: (args) => fn(...args), ...options });
  return useCallback((...args) => mutateAsync(args), [mutateAsync]);
}

const invalidate = (queryClient, family, extra = {}) =>
  queryClient.invalidateQueries({ queryKey: family, ...extra });

export function useMemoryMutations() {
  const queryClient = useQueryClient();
  const refreshMemories = () =>
    Promise.all([
      invalidate(queryClient, keyFamilies.folders),
      invalidate(queryClient, keyFamilies.calendar),
      invalidate(queryClient, keyFamilies.home),
    ]);

  return {
    createFolder: useAction(memoryService.createFolder, { onSuccess: refreshMemories }),
    updateFolder: useAction(memoryService.updateFolder, { onSuccess: refreshMemories }),
    deleteFolder: useAction(memoryService.deleteFolder, { onSuccess: refreshMemories }),
    deleteAll: useAction(memoryService.deleteAll, { onSuccess: refreshMemories }),
    addPhotoToFolder: useAction(memoryService.addPhotoToFolder, { onSuccess: refreshMemories }),
    addPhotosBatch: useAction(memoryService.addPhotosBatch, { onSuccess: refreshMemories }),
    updatePhoto: useAction(memoryService.updatePhoto, { onSuccess: refreshMemories }),
    deletePhoto: useAction(memoryService.deletePhoto, { onSuccess: refreshMemories }),
    setCalendarHighlight: useAction(memoryService.setCalendarHighlight, { onSuccess: refreshMemories }),
    clearCalendarHighlight: useAction(memoryService.clearCalendarHighlight, { onSuccess: refreshMemories }),
    updateHighlightPosition: useAction(memoryService.updateHighlightPosition, {
      onSuccess: () => invalidate(queryClient, keyFamilies.folders),
    }),
  };
}

export function useDateMutations() {
  const queryClient = useQueryClient();
  const refreshDates = () =>
    Promise.all([invalidate(queryClient, keyFamilies.dates), invalidate(queryClient, keyFamilies.home)]);

  return {
    createDate: useAction(dateService.createDate, { onSuccess: refreshDates }),
    updateDate: useAction(dateService.updateDate, { onSuccess: refreshDates }),
    deleteDate: useAction(dateService.deleteDate, { onSuccess: refreshDates }),
    deleteAll: useAction(dateService.deleteAll, { onSuccess: refreshDates }),
    archiveDate: useAction(dateService.archiveDate, { onSuccess: refreshDates }),
    unarchiveDate: useAction(dateService.unarchiveDate, { onSuccess: refreshDates }),
    duplicateDate: useAction(dateService.duplicateDate, { onSuccess: refreshDates }),
    setFavorite: useAction(dateService.setFavorite, {
      onSuccess: () => invalidate(queryClient, keyFamilies.dates, { refetchType: 'none' }),
    }),
  };
}

export function useChecklistMutations() {
  const queryClient = useQueryClient();
  const markDatesStale = () => invalidate(queryClient, keyFamilies.dates, { refetchType: 'none' });

  return {
    createItem: useAction(checklistService.createItem, { onSuccess: markDatesStale }),
    toggleItem: useAction(checklistService.toggleItem, { onSuccess: markDatesStale }),
    updateItem: useAction(checklistService.updateItem, { onSuccess: markDatesStale }),
    deleteItem: useAction(checklistService.deleteItem, { onSuccess: markDatesStale }),
    reorderItems: useAction(checklistService.reorderItems, { onSuccess: markDatesStale }),
  };
}

export function useLoveBoardMutations() {
  const queryClient = useQueryClient();
  const refreshHome = () => invalidate(queryClient, keyFamilies.home);

  return {
    createNote: useAction(loveBoardService.createNote, { onSuccess: refreshHome }),
    updateNote: useAction(loveBoardService.updateNote, { onSuccess: refreshHome }),
    deleteNote: useAction(loveBoardService.deleteNote, { onSuccess: refreshHome }),
    // Optimistic drag: the page has already moved the note in the cache. A failure resyncs.
    updateNotePosition: useAction(loveBoardService.updateNotePosition, {
      onError: () => invalidate(queryClient, keyFamilies.loveNotes),
    }),
    createSticker: useAction(loveBoardService.createSticker),
    updateSticker: useAction(loveBoardService.updateSticker, {
      onError: () => invalidate(queryClient, keyFamilies.loveStickers),
    }),
    deleteSticker: useAction(loveBoardService.deleteSticker),
    deleteAll: useAction(loveBoardService.deleteAll, {
      onSuccess: () =>
        Promise.all([
          invalidate(queryClient, keyFamilies.loveNotes),
          invalidate(queryClient, keyFamilies.loveStickers),
          invalidate(queryClient, keyFamilies.home),
        ]),
    }),
  };
}

export function useMenuMutations() {
  const queryClient = useQueryClient();
  const key = queryKeys.menuItems();
  const refreshMenu = () => invalidate(queryClient, keyFamilies.menuItems);
  const setItems = (updater) => queryClient.setQueryData(key, updater);

  return {
    createItem: useAction(menuService.createItem, { onSuccess: refreshMenu }),
    updateItem: useAction(menuService.updateItem, { onSuccess: refreshMenu }),
    deleteItem: useAction(menuService.deleteItem, {
      // Drop the row right away; a failed delete resyncs from the server.
      onMutate: async ([id]) => {
        await queryClient.cancelQueries({ queryKey: key });
        setItems((prev) => (prev || []).filter((item) => item.id !== id));
      },
      onError: refreshMenu,
      onSuccess: refreshMenu,
    }),
    reorderItems: useAction(menuService.reorderItems, {
      // Optimistic: show the new order immediately, revert to the previous list on failure.
      onMutate: async ([ids]) => {
        await queryClient.cancelQueries({ queryKey: key });
        const previous = queryClient.getQueryData(key);
        setItems((prev) => {
          const byId = new Map((prev || []).map((item) => [item.id, item]));
          return ids.map((id) => byId.get(id)).filter(Boolean);
        });
        return { previous };
      },
      onError: (_err, _args, context) => {
        if (context?.previous) setItems(context.previous);
        return refreshMenu();
      },
      onSuccess: (saved) => setItems(saved),
    }),
  };
}

export function useWheelMutations() {
  const queryClient = useQueryClient();
  const key = queryKeys.wheels();
  const refreshWheels = () => invalidate(queryClient, keyFamilies.wheels);
  const refreshSpins = () => invalidate(queryClient, keyFamilies.wheelSpins);
  // Autosave writes the saved wheel straight into the list so the editor never refetches mid-typing.
  const putWheel = (saved) =>
    queryClient.setQueryData(key, (prev) => {
      const rest = (prev || []).filter((wheel) => wheel.id !== saved.id);
      return [saved, ...rest];
    });

  return {
    createWheel: useAction(wheelService.createWheel, { onSuccess: putWheel }),
    updateWheel: useAction(wheelService.updateWheel, { onSuccess: putWheel }),
    deleteWheel: useAction(wheelService.deleteWheel, {
      // Drop the wheel right away; a failed delete resyncs from the server.
      onMutate: async ([id]) => {
        await queryClient.cancelQueries({ queryKey: key });
        queryClient.setQueryData(key, (prev) => (prev || []).filter((wheel) => wheel.id !== id));
      },
      onError: refreshWheels,
      onSuccess: () => Promise.all([refreshWheels(), refreshSpins()]),
    }),
    addSpin: useAction(wheelService.addSpin, { onSuccess: refreshSpins }),
    setSpinAccepted: useAction(wheelService.setSpinAccepted, { onSuccess: refreshSpins }),
    clearSpins: useAction(wheelService.clearSpins, { onSuccess: refreshSpins }),
  };
}

export function useBouquetMutations() {
  const queryClient = useQueryClient();
  const refreshBouquets = () => invalidate(queryClient, keyFamilies.bouquets);
  // Deleting a bouquet removes the stickers pinning it on the server.
  const refreshBouquetsAndStickers = () =>
    Promise.all([refreshBouquets(), invalidate(queryClient, keyFamilies.loveStickers)]);

  return {
    createBouquet: useAction(bouquetService.createBouquet, { onSuccess: refreshBouquets }),
    updateBouquet: useAction(bouquetService.updateBouquet, { onSuccess: refreshBouquets }),
    deleteBouquet: useAction(bouquetService.deleteBouquet, { onSuccess: refreshBouquetsAndStickers }),
    deleteAllBouquets: useAction(bouquetService.deleteAllBouquets, { onSuccess: refreshBouquetsAndStickers }),
  };
}

export function useProfileMutations() {
  const queryClient = useQueryClient();
  const saveProfile = (profile) => queryClient.setQueryData(queryKeys.profile(), profile);

  return {
    updateProfile: useAction(profileService.updateProfile, { onSuccess: saveProfile }),
    updateAvatar: useAction(profileService.updateAvatar, { onSuccess: saveProfile }),
    removeAvatar: useAction(profileService.removeAvatar, { onSuccess: saveProfile }),
  };
}
