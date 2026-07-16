import { useStore } from '@nanostores/react';
import { $toasts, toastBus } from '@/lib/stores/toast.store';
import { ToastContainer } from './Toast';

/**
 * Single mount point for the global toast container. Subscribes to the
 * `$toasts` nanostore so any island — or any non-React service layer —
 * can call `toastBus.push(...)` and see the toast appear.
 *
 * Mount this once at the app root (e.g. in `MainLayout.astro` via
 * `client:load`). The container portals into `document.body` itself,
 * so layout concerns (overflow, z-index) are not an issue at the
 * mount point.
 *
 * @returns {React.JSX.Element | null} The container, or `null` while
 *   SSR (the container renders to `document.body` which only exists in
 *   the browser).
 */
export default function ToastProvider(): React.JSX.Element | null {
    const toasts = useStore($toasts);
    return <ToastContainer toasts={toasts} onClose={toastBus.dismiss} />;
}
