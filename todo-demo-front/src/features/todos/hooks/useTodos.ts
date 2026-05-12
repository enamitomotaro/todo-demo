import { useQuery } from '@tanstack/react-query';
import { client, type Todo } from '@/apis/client';
import { todoKeys } from '@/features/todos/queryKeys';

type UseTodosOptions = {
  /** false の間は API を叩かない（未認証時の 401 多重発火を防ぐ） */
  enabled?: boolean;
};

export const useTodos = (completed?: boolean, options: UseTodosOptions = {}) =>
  useQuery<Todo[]>({
    queryKey: todoKeys.list(completed),
    queryFn: async () => {
      const res = await client.todoApi.getTodos({ completed });
      return res.data;
    },
    enabled: options.enabled ?? true,
  });
