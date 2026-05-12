import '@/styles/globals.css';

import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { AppCacheProvider } from '@mui/material-nextjs/v16-pagesRouter';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { QueryClientProvider } from '@tanstack/react-query';
import type { AppProps } from 'next/app';
import { Noto_Sans_JP, Plus_Jakarta_Sans } from 'next/font/google';
import Head from 'next/head';
import { SnackbarProvider } from 'notistack';
import { useEffect, useMemo, useState } from 'react';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { createQueryClient } from '@/lib/queryClient';
import { getTheme } from '@/theme';
import { type ColorMode, ColorModeContext } from '@/theme/ColorModeContext';
import { readColorMode, writeColorMode } from '@/theme/colorModeStorage';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const notoSansJp = Noto_Sans_JP({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '700'],
  preload: false,
});

// theme.typography.fontFamily に直接渡す。CssBaseline が body に当ててくれるため、
// ポータル要素 (Dialog / Snackbar / Tooltip) でもこのフォントが効く。
const fontFamily = `${plusJakarta.style.fontFamily}, ${notoSansJp.style.fontFamily}, system-ui, sans-serif`;

export default function App({ Component, pageProps }: AppProps) {
  // QueryClient はマウント時に一度だけ生成（HMR / 再レンダ耐性）
  const [queryClient] = useState(() => createQueryClient());

  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)', { noSsr: false });
  const [mode, setMode] = useState<ColorMode>('light');

  // 初回マウントで Cookie と OS 設定を反映（SSR ハイドレーション後）
  useEffect(() => {
    const stored = readColorMode();
    if (stored) {
      setMode(stored);
      return;
    }
    setMode(prefersDark ? 'dark' : 'light');
  }, [prefersDark]);

  const colorModeValue = useMemo(
    () => ({
      mode,
      toggle: () => {
        setMode((prev) => {
          const next: ColorMode = prev === 'dark' ? 'light' : 'dark';
          writeColorMode(next);
          return next;
        });
      },
      setMode: (next: ColorMode) => {
        writeColorMode(next);
        setMode(next);
      },
    }),
    [mode],
  );

  const theme = useMemo(() => getTheme(mode, fontFamily), [mode]);

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';

  return (
    <AppCacheProvider {...pageProps}>
      <Head>
        <title>Todo Demo</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>
      <GoogleOAuthProvider clientId={googleClientId}>
        <QueryClientProvider client={queryClient}>
          <ColorModeContext.Provider value={colorModeValue}>
            <ThemeProvider theme={theme}>
              <CssBaseline />
              <SnackbarProvider
                maxSnack={3}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                autoHideDuration={3500}
              >
                <AuthProvider>
                  <Component {...pageProps} />
                </AuthProvider>
              </SnackbarProvider>
            </ThemeProvider>
          </ColorModeContext.Provider>
        </QueryClientProvider>
      </GoogleOAuthProvider>
    </AppCacheProvider>
  );
}
