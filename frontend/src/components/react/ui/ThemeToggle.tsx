import { useState, useEffect, type JSX } from 'react';
//-- Types
import type { Theme } from '@/types/components';
//-- Icons
import { Sun, Moon } from 'lucide-react';
/**
 * @interface ThemeToggleProps
 * @param {string} [class] - The class name of the component.
 */
interface ThemeToggleProps {
    class?: string;
}
/**
 * A button that toggles between light and dark themes.
 * @param {ThemeToggleProps} props - The props for the component.
 * @returns {JSX.Element} The rendered component.
 */
export default function ThemeToggle({
    class: className,
}: ThemeToggleProps): JSX.Element {
    const [theme, setTheme] = useState<Theme>(() => {
        if (typeof document === 'undefined') return 'dark';
        // Safe: document.documentElement.dataset.theme is set by the server/inline script
        // and only contains values from the Theme type ('light' | 'dark')
        return (document.documentElement.dataset.theme as Theme) ?? 'dark';
    });

    useEffect(() => {
        document.documentElement.dataset.theme = theme;
    }, [theme]);

    const toggleTheme = (): void => {
        const next: Theme = theme === 'dark' ? 'light' : 'dark';
        setTheme(next);
        localStorage.setItem('theme', next);
    };

    return (
        <button
            type="button"
            className={`icon-btn ${className ?? ''}`}
            onClick={toggleTheme}
            aria-label={
                theme === 'dark'
                    ? 'Switch to light mode'
                    : 'Switch to dark mode'
            }
            title={
                theme === 'dark'
                    ? 'Switch to light mode'
                    : 'Switch to dark mode'
            }
        >
            {theme === 'dark' ? (
                <Sun size={18} strokeWidth={1.75} />
            ) : (
                <Moon size={18} strokeWidth={1.75} />
            )}
        </button>
    );
}
