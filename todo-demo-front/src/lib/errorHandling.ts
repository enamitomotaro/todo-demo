import { enqueueSnackbar } from 'notistack';
import { errorMessages } from './errorMessages';

// 401 をグローバルイベントで AuthProvider に伝播するためのイベント名
export const AUTH_UNAUTHORIZED_EVENT = 'auth:unauthorized';

type ApiErrorBody = { code?: string; message?: string };

const isResponseLike = (value: unknown): value is Response =>
  typeof Response !== 'undefined' && value instanceof Response;

export async function handleApiError(error: unknown): Promise<void> {
  // 通信エラー（Fetch 自体が失敗、CORS、ネットワーク断など）
  if (!isResponseLike(error)) {
    enqueueSnackbar('通信エラーが発生しました', { variant: 'error' });
    return;
  }

  // 401 は AuthProvider に委譲（ここでは Snackbar を出さない）
  if (error.status === 401) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
    }
    return;
  }

  const body: ApiErrorBody | null = await error.json().catch(() => null);
  const code = body?.code;
  const message = (code && errorMessages[code]) ?? body?.message ?? '通信エラーが発生しました';
  enqueueSnackbar(message, { variant: 'error' });
}
