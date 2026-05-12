import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { handleApiError } from './errorHandling';

export const createQueryClient = () =>
  new QueryClient({
    queryCache: new QueryCache({ onError: handleApiError }),
    mutationCache: new MutationCache({ onError: handleApiError }),
    defaultOptions: {
      queries: {
        // 401 は AuthProvider で /login に飛ばすので、自動リトライは抑止
        retry: false,
        refetchOnWindowFocus: false,
        staleTime: 30_000,
      },
      mutations: {
        retry: false,
      },
    },
  });
