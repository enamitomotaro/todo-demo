import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';

// 認証状態に応じた振り分け。authed → /todos, guest → /login。
// loading の間はスピナーを描画して何もしない。
export default function IndexPage() {
  const router = useRouter();
  const { status } = useAuth();

  useEffect(() => {
    if (status === 'authed') router.replace('/todos');
    else if (status === 'guest') router.replace('/login');
  }, [status, router]);

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'grid',
        placeItems: 'center',
        bgcolor: 'background.default',
      }}
    >
      <CircularProgress aria-label="読み込み中" />
    </Box>
  );
}
