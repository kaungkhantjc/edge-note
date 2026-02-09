import { useState, useEffect } from "react";
import { useTheme } from "../components/theme-provider";

export function useResolvedTheme() {
    const { theme } = useTheme();
    const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => {
        if (theme !== 'system') return theme;
        if (typeof window !== 'undefined') {
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        return 'light';
    });

    useEffect(() => {
        if (theme === 'system') {
            const media = window.matchMedia('(prefers-color-scheme: dark)');
            const updateTheme = () => setResolvedTheme(media.matches ? 'dark' : 'light');

            updateTheme(); // Set initial

            const listener = (e: MediaQueryListEvent) => setResolvedTheme(e.matches ? 'dark' : 'light');
            media.addEventListener('change', listener);
            return () => media.removeEventListener('change', listener);
        } else {
            setResolvedTheme(theme);
        }
    }, [theme]);

    return resolvedTheme;
}
