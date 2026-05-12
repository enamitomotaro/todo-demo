import { useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '@/apis/client';
import { authKeys } from '@/features/auth/queryKeys';
import type { User } from '@/features/auth/types';

export const useLoginWithGoogle = () => {
  const qc = useQueryClient();
  return useMutation<User, unknown, string>({
    mutationFn: async (idToken) => (await client.authApi.postGoogle({ idToken })).data,
    onSuccess: (user) => {
      qc.setQueryData<User>(authKeys.me, user);
    },
  });
};
