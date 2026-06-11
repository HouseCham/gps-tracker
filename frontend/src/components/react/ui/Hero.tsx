import type { JSX } from "astro/jsx-runtime";
import type { PropsWithChildren } from "react";
/**
 * @interface HeroProps
 * @property {string} title - The main title to be displayed in the hero section, representing the section or page title.
 * @property {string} dataI18n - A string used for internationalization (i18n) purposes, typically serving as a key to look up the localized version of the title in a translation file.
 * @property {string} [description] - An optional description providing additional context or information about the section or page.
 * @property {React.ReactNode} [children] - Optional React nodes that can be rendered as action buttons, links, or other interactive elements within the hero section, typically aligned to the right side of the hero section for user actions.
 */
interface HeroProps extends PropsWithChildren {
    title: string;
    dataI18n: string;
    description?: string;
};
/**
 * Hero component for displaying a section title, description, and optional action buttons or links.
 * @param {HeroProps} props - The properties for the Hero component, including:
 * @returns {JSX.Element} The rendered Hero component.
 */
export function Hero({ title, dataI18n, description, children }: HeroProps): JSX.Element {
    return (
        <header>
            <div className="section-header">
                <div>
                    <h2 className="section-title" data-i18n={dataI18n}>
                        {title}
                    </h2>
                    <p className="section-subtitle">{description}</p>
                </div>
                {
                    children && (
                        <div className="flex items-center gap-8">
                            {children}
                        </div>
                    )
                }
            </div>
        </header>
    )
};