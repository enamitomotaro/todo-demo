import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/router';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useLogout } from '@/features/auth/hooks/useLogout';
import { useColorMode } from '@/theme/ColorModeContext';

export function AppHeader() {
  const { mode, toggle } = useColorMode();
  const { status } = useAuth();
  const logout = useLogout();
  const router = useRouter();
  const isDark = mode === 'dark';

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => router.replace('/login'),
    });
  };

  return (
    <AppBar position="sticky">
      <Toolbar sx={{ minHeight: 64, gap: 0.5, px: { xs: 2, sm: 3 } }}>
        <Typography
          variant="subtitle1"
          component="h1"
          sx={{
            fontWeight: 700,
            letterSpacing: '-0.015em',
            fontSize: 17,
          }}
        >
          Todo Demo
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Tooltip title={isDark ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}>
          <IconButton
            onClick={toggle}
            aria-label="カラーモードを切り替える"
            size="small"
            sx={{ color: 'text.secondary' }}
          >
            {isDark ? (
              <LightModeOutlinedIcon fontSize="small" />
            ) : (
              <DarkModeOutlinedIcon fontSize="small" />
            )}
          </IconButton>
        </Tooltip>
        {status === 'authed' && (
          <Tooltip title="ログアウト">
            <IconButton
              onClick={handleLogout}
              disabled={logout.isPending}
              aria-label="ログアウト"
              size="small"
              sx={{ color: 'text.secondary' }}
            >
              <LogoutOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Toolbar>
    </AppBar>
  );
}
