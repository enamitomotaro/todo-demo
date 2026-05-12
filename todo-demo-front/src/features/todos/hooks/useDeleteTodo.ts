import { useMutation, useQueryClient } from '@tanstack/react-query';
import { client, type Todo } from '@/apis/client';
import { todoKeys } from '@/features/todos/queryKeys';

type Context = {
  snapshots: Array<{ key: ReadonlyArray<unknown>; value: Todo[] | undefined }>;
};

export const useDeleteTodo = () => {
  const qc = useQueryClient();
  return useMutation<void, unknown, { id: number }, Context>({
    mutationFn: async ({ id }) => {
      await client.todoApi.deleteTodo({ id });
    },

    onMutate: async ({ id }) => {
      await qc.cancelQueries({ queryKey: todoKeys.all });
      const snapshots = qc
        .getQueriesData<Todo[]>({ queryKey: todoKeys.all })
        .map(([key, value]) => ({ key, value }));

      qc.setQueriesData<Todo[]>({ queryKey: todoKeys.all }, (old) =>
        old?.filter((t) => t.id !== id),
      );
      return { snapshots };
    },

    onError: (_e, _v, ctx) => {
      if (!ctx) return;
      for (const { key, value } of ctx.snapshots) {
        qc.setQueryData(key, value);
      }
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: todoKeys.all });
    },
  });
};
