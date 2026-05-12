import { useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '@/apis/client';

export const useLogout = () => {
  const qc = useQueryClient();
  return useMutation<void, unknown, void>({
    mutationFn: async () => {
      await client.authApi.postLogout();
    },
    onSuccess: () => {
      // セッション切れた後は何も信用しない: 全キャッシュをクリア
      qc.clear();
    },
  });
};
