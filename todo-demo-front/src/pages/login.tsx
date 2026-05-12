import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { GoogleLogin } from '@react-oauth/google';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { enqueueSnackbar } from 'notistack';
import { useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useLoginWithDev } from '@/features/auth/hooks/useLoginWithDev';
import { useLoginWithGoogle } from '@/features/auth/hooks/useLoginWithGoogle';

// 開発用バックドアの表示可否。サーバー側 DEV_BYPASS_AUTH と組で運用する。
const devBypassEnabled = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true';
const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';

export default function LoginPage() {
  const router = useRouter();
  const { status } = useAuth();
  const login = useLoginWithGoogle();
  const devLogin = useLoginWithDev();

  // AUTH-05: 認証済みなら /todos へ
  useEffect(() => {
    if (status === 'authed') {
      router.replace('/todos');
    }
  }, [status, router]);

  return (
    <>
      <Head>
        <title>ログイン | Todo Demo</title>
      </Head>
      <Box
        sx={{
          minHeight: '100dvh',
          display: 'grid',
          placeItems: 'center',
          bgcolor: 'background.default',
          px: 2,
        }}
      >
        <Container maxWidth="xs" disableGutters>
          <Paper
            variant="outlined"
            sx={{
              p: { xs: 4, sm: 5 },
              borderRadius: 3,
              borderColor: 'divider',
              bgcolor: 'background.paper',
            }}
          >
            <Stack spacing={4} sx={{ alignItems: 'stretch' }}>
              <Stack spacing={1.25} sx={{ alignItems: 'center', textAlign: 'center' }}>
                <Typography
                  variant="h4"
                  component="h1"
                  sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}
                >
                  Todo Demo
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 280 }}>
                  シンプルで集中できるタスク管理。
                </Typography>
              </Stack>
              {googleClientId && (
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <GoogleLogin
                    onSuccess={(cred) => {
                      if (!cred.credential) {
                        enqueueSnackbar('Google 認証情報が取得できませんでした', {
                          variant: 'error',
                        });
                        return;
                      }
                      login.mutate(cred.credential, {
                        onSuccess: () => router.replace('/todos'),
                      });
                    }}
                    onError={() => {
                      enqueueSnackbar('Google 認証に失敗しました', { variant: 'error' });
                    }}
                    shape="pill"
                    text="signin_with"
                    theme="outline"
                  />
                </Box>
              )}
              {devBypassEnabled && (
                <Stack spacing={1.5}>
                  {googleClientId && (
                    <Divider sx={{ color: 'text.secondary', fontSize: 12 }}>or</Divider>
                  )}
                  <Button
                    variant="outlined"
                    color="primary"
                    size="large"
                    onClick={() =>
                      devLogin.mutate(undefined, {
                        onSuccess: () => router.replace('/todos'),
                        onError: () =>
                          enqueueSnackbar('Dev ログインに失敗しました', { variant: 'error' }),
                      })
                    }
                    disabled={devLogin.isPending}
                    sx={{ borderRadius: 999, textTransform: 'none' }}
                  >
                    Dev ログイン（開発用）
                  </Button>
                  <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
                    Google OAuth セットアップ前にフロントを確認するためのバックドアです。
                  </Typography>
                </Stack>
              )}
            </Stack>
          </Paper>
        </Container>
      </Box>
    </>
  );
}
