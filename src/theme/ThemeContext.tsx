import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useState } from 'react';
import { AppColors, getTheme } from './index';

const THEME_STORAGE_KEY = 'theme-override';

type ThemeMode = 'light' | 'dark';

type ThemeContextType = {
  theme: ReturnType<typeof getTheme>;
  colors: AppColors;
  isDark: boolean;
  mode: ThemeMode;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  // Padrão fixo: light mode. O sistema operacional não influencia.
  // Só muda via toggle manual pelo usuário.
  const [mode, setMode] = useState<ThemeMode>('light');

  useEffect(() => {
    // Lê a preferência salva em background — não bloqueia a renderização inicial.
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark') {
        setMode(stored);
      }
    });
  }, []);

  const isDark = mode === 'dark';
  const builtTheme = getTheme(mode);

  const toggleTheme = useCallback(() => {
    const next: ThemeMode = isDark ? 'light' : 'dark';
    setMode(next);
    AsyncStorage.setItem(THEME_STORAGE_KEY, next);
  }, [isDark]);

  return (
    <ThemeContext.Provider value={{ theme: builtTheme, colors: builtTheme.colors, isDark, mode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme(): ThemeContextType {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useAppTheme must be used inside ThemeProvider');
  return ctx;
}
