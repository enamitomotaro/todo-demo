// Todo 関連のクエリキーをまとめる。`onMutate` で楽観的更新する際に
// すべての `['todos', ...]` を一括 cancel / invalidate するために
// ベースキーを定義しておく。
export const todoKeys = {
  all: ['todos'] as const,
  list: (completed?: boolean) => [...todoKeys.all, { completed: completed ?? null }] as const,
};
