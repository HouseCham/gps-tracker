import type { GetStaticPaths } from 'astro';
/**
 * Get static paths for all supported locales
 * @returns {GetStaticPaths}
 */
export const getStaticPaths = (() => {
    return [{ params: { lan: 'en' } }, { params: { lan: 'es' } }];
}) satisfies GetStaticPaths;
