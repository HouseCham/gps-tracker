import { useState } from 'react';
import { Sun, Moon } from 'lucide-react';

type Theme = 'light' | 'dark';

interface ThemeToggleProps {
    class?: string;
}

export default function ThemeToggle({
    class: className,
}: ThemeToggleProps): React.JSX.Element {
    const [theme, setTheme] = useState<Theme>(() => {
        if (typeof document === 'undefined') return 'dark';
        return (document.documentElement.dataset.theme as Theme) ?? 'dark';
    });

    const toggleTheme = (): void => {
        const next: Theme = theme === 'dark' ? 'light' : 'dark';
        setTheme(next);
        document.documentElement.dataset.theme = next;
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
