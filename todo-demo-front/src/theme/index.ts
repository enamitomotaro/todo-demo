import { createTheme, type ThemeOptions } from '@mui/material/styles';

// ui-design.md のカラーパレット（モノクロ + ブルーアクセント）
const palette = {
  light: {
    primary: { main: '#2563EB', contrastText: '#FFFFFF' }, // CTA / Accent
    secondary: { main: '#3F3F46' },
    background: { default: '#FAFAFA', paper: '#FFFFFF' },
    text: { primary: '#09090B', secondary: '#3F3F46', disabled: '#71717A' },
    divider: '#E4E4E7',
    action: { hover: 'rgba(9, 9, 11, 0.04)', selected: 'rgba(37, 99, 235, 0.08)' },
  },
  dark: {
    primary: { main: '#3B82F6', contrastText: '#FFFFFF' },
    secondary: { main: '#A1A1AA' },
    background: { default: '#0A0A0A', paper: '#18181B' },
    text: { primary: '#FAFAFA', secondary: '#A1A1AA', disabled: '#71717A' },
    divider: '#27272A',
    action: { hover: 'rgba(250, 250, 250, 0.06)', selected: 'rgba(59, 130, 246, 0.16)' },
  },
} as const;

// Flat Design: 影を全段階で none に置換
const flatShadows = Array(25).fill('none') as ThemeOptions['shadows'];

const DEFAULT_FONT_FAMILY = '"Plus Jakarta Sans", "Noto Sans JP", system-ui, sans-serif';

const baseOptions = (mode: 'light' | 'dark', fontFamily: string): ThemeOptions => ({
  palette: { mode, ...palette[mode] },
  shape: { borderRadius: 12 },
  shadows: flatShadows,
  typography: {
    // pages/_app.tsx から next/font の fontFamily 文字列を受け取り、
    // theme.typography.fontFamily に直接埋め込むことで MUI ポータル要素
    // (Dialog / Snackbar / Tooltip) にもフォントが効くようにする。
    fontFamily,
    fontSize: 16,
    h1: { fontWeight: 700, letterSpacing: '-0.02em' },
    h2: { fontWeight: 700, letterSpacing: '-0.02em' },
    h3: { fontWeight: 700, letterSpacing: '-0.01em' },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    body1: { lineHeight: 1.6 },
    body2: { lineHeight: 1.6 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: (theme) => ({
        body: {
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
          // 数字をタブラー揃えにして並びの揺れを抑える（洗練の細部）
          fontVariantNumeric: 'tabular-nums',
        },
        '::selection': {
          backgroundColor:
            theme.palette.mode === 'dark' ? 'rgba(59, 130, 246, 0.32)' : 'rgba(37, 99, 235, 0.18)',
        },
      }),
    },
    MuiAppBar: {
      defaultProps: { elevation: 0, color: 'inherit' },
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundImage: 'none',
          borderBottom: `1px solid ${theme.palette.divider}`,
        }),
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: { root: { backgroundImage: 'none' } },
    },
    MuiButton: {
      defaultProps: { disableElevation: true, disableRipple: false },
      styleOverrides: {
        root: { borderRadius: 12, transition: 'background-color 180ms ease, color 180ms ease' },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: { transition: 'background-color 180ms ease, color 180ms ease, opacity 150ms ease' },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined', fullWidth: true },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 12,
          // 入力欄の枠線を細部レベルで整える（hover/focus の遷移を均一化）
          transition: 'border-color 180ms ease, box-shadow 180ms ease',
          '& fieldset': { borderColor: theme.palette.divider },
        }),
      },
    },
    MuiCheckbox: {
      defaultProps: { disableRipple: false, size: 'small' },
      styleOverrides: {
        root: ({ theme }) => ({
          color: theme.palette.text.disabled,
          padding: 6,
          '&.Mui-checked': { color: theme.palette.primary.main },
          '&:hover': { backgroundColor: theme.palette.action.hover },
        }),
      },
    },
    MuiTooltip: {
      defaultProps: { arrow: true },
      styleOverrides: {
        tooltip: { fontSize: 12, fontWeight: 500 },
      },
    },
    MuiDialog: {
      defaultProps: { slotProps: { paper: { sx: { borderRadius: 3 } } } },
    },
  },
});

export const getTheme = (mode: 'light' | 'dark', fontFamily: string = DEFAULT_FONT_FAMILY) =>
  createTheme(baseOptions(mode, fontFamily));
