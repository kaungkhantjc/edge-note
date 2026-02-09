import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";

type ThemeProviderState = {
    theme: Theme;
    setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
    theme: "system",
    setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
    children,
    specifiedTheme,
    defaultTheme = "system",
    storageKey = "theme-preference",
}: {
    children: React.ReactNode;
    specifiedTheme?: Theme;
    defaultTheme?: Theme;
    storageKey?: string;
}) {
    const [theme, setThemeState] = useState<Theme>(() => {
        if (specifiedTheme) return specifiedTheme;

        // Only run on client
        if (typeof window !== "undefined") {
            // Check cookie first
            const cookieMatch = document.cookie.match(new RegExp('(^| )' + storageKey + '=([^;]+)'));
            if (cookieMatch) return cookieMatch[2] as Theme;

            // Check localStorage
            return (localStorage.getItem(storageKey) as Theme) || defaultTheme;
        }
        return defaultTheme;
    });

    useEffect(() => {
        const root = window.document.documentElement;

        root.classList.remove("light", "dark");

        // Cookie Helper
        const setCookie = (name: string, value: string, days: number = 365) => {
            const d = new Date();
            d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
            const expires = "expires=" + d.toUTCString();
            document.cookie = name + "=" + value + ";" + expires + ";path=/";
        };

        if (theme === "system") {
            const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
                .matches
                ? "dark"
                : "light";

            root.classList.add(systemTheme);
            setCookie(storageKey, "system");
            localStorage.setItem(storageKey, "system"); // Sync both just in case
            return;
        }

        root.classList.add(theme);
        setCookie(storageKey, theme);
        localStorage.setItem(storageKey, theme);
    }, [theme, storageKey]);

    // Listener for system preference changes when theme is 'system'
    useEffect(() => {
        if (theme !== "system") return;

        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const handleChange = () => {
            const root = window.document.documentElement;
            root.classList.remove("light", "dark");
            root.classList.add(mediaQuery.matches ? "dark" : "light");
        };

        mediaQuery.addEventListener("change", handleChange);
        return () => mediaQuery.removeEventListener("change", handleChange);
    }, [theme]);

    const value = {
        theme,
        setTheme: (theme: Theme) => {
            setThemeState(theme);
        },
    };

    return (
        <ThemeProviderContext.Provider value={value}>
            {children}
        </ThemeProviderContext.Provider>
    );
}

export const useTheme = () => {
    const context = useContext(ThemeProviderContext);

    if (context === undefined)
        throw new Error("useTheme must be used within a ThemeProvider");

    return context;
};
