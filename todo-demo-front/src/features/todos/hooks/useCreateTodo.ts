import { useMutation, useQueryClient } from '@tanstack/react-query';
import { client, type Todo } from '@/apis/client';
import type { PostTodoRequest } from '@/apis/generated/TodoApi';
import { todoKeys } from '@/features/todos/queryKeys';

type Context = {
  // 各 list キャッシュのスナップショット。ロールバックに使う
  snapshots: Array<{ key: ReadonlyArray<unknown>; value: Todo[] | undefined }>;
  tempId: number;
};

export const useCreateTodo = () => {
  const qc = useQueryClient();
  return useMutation<Todo, unknown, PostTodoRequest, Context>({
    mutationFn: async (req) => (await client.todoApi.postTodo(req)).data,

    onMutate: async (req) => {
      await qc.cancelQueries({ queryKey: todoKeys.all });
      const snapshots = qc
        .getQueriesData<Todo[]>({ queryKey: todoKeys.all })
        .map(([key, value]) => ({ key, value }));

      // 楽観的に追加する仮 Todo。実サーバーから戻った値で onSettled 時に置換される
      const tempId = -Date.now();
      const now = new Date().toISOString();
      const optimistic: Todo = {
        id: tempId,
        userId: 0,
        title: req.title,
        completed: false,
        createdAt: now,
        updatedAt: now,
      };

      qc.setQueriesData<Todo[]>({ queryKey: todoKeys.all }, (old) =>
        old ? [optimistic, ...old] : [optimistic],
      );
      return { snapshots, tempId };
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
