import type { ColorMode } from './ColorModeContext';

// requirements.md の非機能要件「localStorage 不使用」を守るため、
// ダークモード設定は Cookie に保存する（認証 Cookie とは別キー、非機密）。
const COOKIE_KEY = 'todo-demo-color-mode';
const ONE_YEAR = 60 * 60 * 24 * 365;

export const readColorMode = (): ColorMode | null => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_KEY}=([^;]+)`));
  const value = match?.[1];
  return value === 'light' || value === 'dark' ? value : null;
};

export const writeColorMode = (mode: ColorMode) => {
  if (typeof document === 'undefined') return;
  // Cookie Store API は Safari 未対応のため document.cookie を使う
  // biome-ignore lint/suspicious/noDocumentCookie: Cookie Store API はブラウザ互換性が不足
  document.cookie = `${COOKIE_KEY}=${mode}; path=/; max-age=${ONE_YEAR}; SameSite=Lax`;
};
