import { createContext, useContext } from 'react';

export type ColorMode = 'light' | 'dark';

type ColorModeContextValue = {
  mode: ColorMode;
  toggle: () => void;
  setMode: (mode: ColorMode) => void;
};

export const ColorModeContext = createContext<ColorModeContextValue>({
  mode: 'light',
  toggle: () => {},
  setMode: () => {},
});

export const useColorMode = () => useContext(ColorModeContext);
