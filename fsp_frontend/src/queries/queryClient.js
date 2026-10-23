import { QueryClient } from '@tanstack/react-query';

// One shared client for the whole app. AuthProvider clears it on login/logout so one
// account's cached data can never be shown to the next account on the same browser.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Lists are cheap to show instantly from cache and re-validate in the background.
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      // Retry once, and only for network/5xx failures. A 4xx (including 401, which the axios
      // interceptor turns into a redirect to /auth) will not get better by retrying.
      retry: (failureCount, error) => {
        const status = error?.response?.status;
        if (status && status < 500) return false;
        return failureCount < 1;
      },
    },
  },
});
