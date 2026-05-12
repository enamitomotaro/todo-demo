import { useQuery } from '@tanstack/react-query';
import { client } from '@/apis/client';
import { authKeys } from '@/features/auth/queryKeys';
import type { User } from '@/features/auth/types';

export const useMe = () =>
  useQuery<User>({
    queryKey: authKeys.me,
    queryFn: async () => (await client.authApi.getMe()).data,
    retry: false,
    // 一度認証情報が取れれば次のリロードまで再取得しない
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  });
