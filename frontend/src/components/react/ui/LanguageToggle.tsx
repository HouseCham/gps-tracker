import { useState, useEffect, type JSX } from 'react';
import type { Language } from '@/types';
import { Globe } from 'lucide-react';

interface LanguageToggleProps {
    class?: string;
    locale: Language;
}

export default function LanguageToggle({
    class: className,
    locale,
}: LanguageToggleProps): JSX.Element {
    const [currentLocale, setCurrentLocale] = useState<Language>(() => {
        if (typeof document === 'undefined') return locale;
        // Safe: localStorage.getItem returns string | null; the next guard
        // narrows the value to 'en' | 'es' with an explicit equality check.
        const stored = localStorage.getItem('language') as Language | null;
        if (stored === 'en' || stored === 'es') return stored;
        const browser = navigator.language.toLowerCase();
        return browser.startsWith('es') ? 'es' : 'en';
    });

    useEffect(() => {
        localStorage.setItem('language', currentLocale);
    }, [currentLocale]);

    const toggleLanguage = (): void => {
        const next: Language = currentLocale === 'en' ? 'es' : 'en';
        setCurrentLocale(next);
        const pathname = window.location.pathname;
        const newPath = pathname.replace(/^\/(en|es)/, `/${next}`);
        window.location.href = newPath;
    };

    return (
        <button
            type="button"
            className={`icon-btn ${className ?? ''}`}
            onClick={toggleLanguage}
            aria-label={
                currentLocale === 'en'
                    ? 'Cambiar a español'
                    : 'Switch to English'
            }
            title={
                currentLocale === 'en'
                    ? 'Cambiar a español'
                    : 'Switch to English'
            }
        >
            <Globe size={18} strokeWidth={1.75} />
        </button>
    );
}
