import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '../services/notificationService';
import { queryKeys } from './queryKeys';
import { useNotificationsQuery } from './queries';

// Shared by the couple-app bell, the admin shell bell and the admin notifications page, so all
// three show (and update) the same cached list. Each action updates the cache immediately and
// rolls back / resyncs from the server if the request fails.
export function useNotifications() {
  const queryClient = useQueryClient();
  const key = queryKeys.notifications();
  const query = useNotificationsQuery();

  const optimistic = (apply) => async () => {
    await queryClient.cancelQueries({ queryKey: key });
    const previous = queryClient.getQueryData(key);
    queryClient.setQueryData(key, (list = []) => apply(list));
    return { previous };
  };
  const rollback = (_error, _vars, context) => {
    if (context?.previous) queryClient.setQueryData(key, context.previous);
  };
  const resync = () => queryClient.invalidateQueries({ queryKey: key });

  const markRead = useMutation({
    mutationFn: (id) => notificationService.markRead(id),
    onMutate: (id) => optimistic((list) => list.map((n) => (n.id === id ? { ...n, isRead: true } : n)))(),
    onError: rollback,
    onSettled: resync,
  });
  const markAllRead = useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onMutate: () => optimistic((list) => list.map((n) => ({ ...n, isRead: true })))(),
    onError: rollback,
    onSettled: resync,
  });
  const remove = useMutation({
    mutationFn: (id) => notificationService.deleteNotification(id),
    onMutate: (id) => optimistic((list) => list.filter((n) => n.id !== id))(),
    onError: rollback,
    onSettled: resync,
  });

  return {
    notifications: query.data ?? [],
    loading: query.isPending,
    markRead: (id) => markRead.mutateAsync(id).catch(() => {}),
    markAllRead: () => markAllRead.mutateAsync().catch(() => {}),
    remove: (id) => remove.mutateAsync(id).catch(() => {}),
  };
}
