import { useMutation, useQueryClient } from '@tanstack/react-query';
import { client, type Todo } from '@/apis/client';
import type { PutTodoRequest } from '@/apis/generated/TodoApi';
import { todoKeys } from '@/features/todos/queryKeys';

type Variables = { id: number; patch: PutTodoRequest };
type Context = {
  snapshots: Array<{ key: ReadonlyArray<unknown>; value: Todo[] | undefined }>;
};

export const useUpdateTodo = () => {
  const qc = useQueryClient();
  return useMutation<Todo, unknown, Variables, Context>({
    mutationFn: async ({ id, patch }) => (await client.todoApi.putTodo({ id }, patch)).data,

    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: todoKeys.all });
      const snapshots = qc
        .getQueriesData<Todo[]>({ queryKey: todoKeys.all })
        .map(([key, value]) => ({ key, value }));

      qc.setQueriesData<Todo[]>({ queryKey: todoKeys.all }, (old) =>
        old?.map((t) =>
          t.id === id
            ? {
                ...t,
                title: patch.title ?? t.title,
                completed: patch.completed ?? t.completed,
                updatedAt: new Date().toISOString(),
              }
            : t,
        ),
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
