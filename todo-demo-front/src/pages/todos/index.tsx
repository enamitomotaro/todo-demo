import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { AppHeader } from '@/features/todos/components/AppHeader';
import { EmptyState } from '@/features/todos/components/EmptyState';
import { TodoCreator } from '@/features/todos/components/TodoCreator';
import { TodoList } from '@/features/todos/components/TodoList';
import { TodoListSkeleton } from '@/features/todos/components/TodoListSkeleton';
import { useTodos } from '@/features/todos/hooks/useTodos';

export default function TodosPage() {
  const router = useRouter();
  const { status } = useAuth();

  // AUTH-04: 未認証なら /login へ
  useEffect(() => {
    if (status === 'guest') {
      router.replace('/login');
    }
  }, [status, router]);

  // 認証が確定するまではコンテンツを描画しない（API も叩かない）
  const authed = status === 'authed';
  const todos = useTodos(undefined, { enabled: authed });
  const { data, isLoading, isFetched } = todos;
  const showSkeleton = !authed || isLoading;

  return (
    <>
      <Head>
        <title>タスク一覧 | Todo Demo</title>
      </Head>
      <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default' }}>
        <AppHeader />
        <Container maxWidth="sm" sx={{ pt: { xs: 4, sm: 6 }, pb: 10, px: { xs: 2, sm: 3 } }}>
          <Stack spacing={{ xs: 3, sm: 4 }}>
            <TodoCreator />
            <Box>
              {showSkeleton && <TodoListSkeleton />}
              {authed && isFetched && (data?.length ?? 0) === 0 && <EmptyState />}
              {authed && isFetched && data && data.length > 0 && <TodoList todos={data} />}
            </Box>
          </Stack>
        </Container>
      </Box>
    </>
  );
}
