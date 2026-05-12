import { Api } from '@/apis/generated/TodoApi';

// 全リクエストに Cookie を付与。!res.ok の場合は Response を throw して、
// QueryClient の onError → handleApiError で body を解析する。
const customFetch: typeof fetch = (input, init = {}) =>
  fetch(input, { ...init, credentials: 'include' }).then((res) => {
    if (!res.ok) throw res;
    return res;
  });

export const client = new Api({
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? '',
  customFetch,
});

// アプリ全体で使う共通の Todo 型（生成型は GET/POST/PUT で別 interface だが構造は同一）。
// 生成型を再エクスポートして DTO 重複定義を避ける。
export type Todo = import('@/apis/generated/TodoApi').GetTodoResponse;
