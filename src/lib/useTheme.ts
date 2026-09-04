import { useState, useEffect, useCallback } from 'react';

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'aerolog-theme';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
      return saved ?? 'dark';
    } catch {
      return 'dark';
    }
  });

  const applyTheme = useCallback((newTheme: Theme) => {
    const root = document.documentElement;

    const performUpdate = () => {
      if (newTheme === 'dark') {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.add('light');
        root.classList.remove('dark');
      }
      try {
        localStorage.setItem(STORAGE_KEY, newTheme);
      } catch {}
    };

    // If browser supports View Transitions API, animate smoothly
    if ('startViewTransition' in document && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      (document as any).startViewTransition(performUpdate);
    } else {
      performUpdate();
    }
  }, []);

  const toggle = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      return next;
    });
  }, [applyTheme]);

  const setExplicitTheme = useCallback((t: Theme) => {
    setTheme(t);
    applyTheme(t);
  }, [applyTheme]);

  useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  return {
    theme,
    isDark: theme === 'dark',
    toggle,
    setTheme: setExplicitTheme
  };
}
