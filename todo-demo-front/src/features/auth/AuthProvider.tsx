import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import { type ReactNode, useEffect, useMemo } from 'react';
import { AuthContext, type AuthContextValue } from '@/features/auth/AuthContext';
import { useMe } from '@/features/auth/hooks/useMe';
import { authKeys } from '@/features/auth/queryKeys';
import { AUTH_UNAUTHORIZED_EVENT } from '@/lib/errorHandling';

// アプリ起動時に /auth-api/me を 1 度だけ叩き、認証状態を保持する。
// 401 が来たら auth:unauthorized イベントを listen して /login にリダイレクトし、
// 認証関連キャッシュをクリアする。
export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const qc = useQueryClient();
  const { data, isLoading, isError } = useMe();

  useEffect(() => {
    const handler = () => {
      qc.setQueryData(authKeys.me, null);
      qc.removeQueries({ queryKey: authKeys.me });
      if (router.pathname !== '/login') {
        router.replace('/login');
      }
    };
    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handler);
    return () => {
      window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handler);
    };
  }, [qc, router]);

  const value = useMemo<AuthContextValue>(() => {
    if (isLoading) return { status: 'loading', user: null };
    if (isError || !data) return { status: 'guest', user: null };
    return { status: 'authed', user: data };
  }, [data, isError, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
