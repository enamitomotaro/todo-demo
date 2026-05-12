import type { GetMeResponse } from '@/apis/generated/TodoApi';

// /auth-api/me と /auth-api/google のレスポンスは同形（{ id, name, email, picture? }）。
// アプリ内で User として扱うため別名定義しておく（再エクスポートでDTO重複は避ける）。
export type User = GetMeResponse;
