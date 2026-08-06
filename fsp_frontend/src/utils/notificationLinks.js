// Maps a notification's relatedEntityType/relatedEntityId to the route that
// should open when the notification is clicked. Each consuming page reads
// the matching query param on mount and opens the item itself (see
// LoveLettersPage/MemoriesPage/DatesPage) — this just builds the URL.
export function notificationLink(notification) {
  const { relatedEntityType, relatedEntityId } = notification;
  if (!relatedEntityId) return null;

  switch (relatedEntityType) {
    case 'LOVE_NOTE':
      return `/letters?noteId=${relatedEntityId}`;
    case 'MEMORY_FOLDER':
      return `/memories?folderId=${relatedEntityId}`;
    case 'MEMORY_PHOTO':
      // Photo notifications only carry the photo's own id, not its parent
      // folder — there's no reliable id to deep-link a specific photo yet,
      // so land on the Memories page rather than guessing a folder.
      return '/memories';
    case 'DATE':
      return `/dates?dateId=${relatedEntityId}`;
    default:
      return null;
  }
}
