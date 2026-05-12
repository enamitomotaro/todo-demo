import { useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '@/apis/client';
import { authKeys } from '@/features/auth/queryKeys';
import type { User } from '@/features/auth/types';

// 開発専用バックドア。サーバー側 DEV_BYPASS_AUTH=true のときだけ成功する。
export const useLoginWithDev = () => {
  const qc = useQueryClient();
  return useMutation<User, unknown, void>({
    mutationFn: async () => (await client.authApi.postDevLogin()).data,
    onSuccess: (user) => {
      qc.setQueryData<User>(authKeys.me, user);
    },
  });
};
