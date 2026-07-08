/**
 * Copies `text` to the clipboard.
 *
 * Uses the async Clipboard API on secure contexts (https / localhost)
 * and falls back to a hidden textarea + `execCommand('copy')` for
 * non-secure contexts (older browsers, plain http). The fallback path
 * is a thin compatibility shim — modern browsers always take the
 * primary branch.
 *
 * The helper stays dumb on purpose: callers own the user-facing
 * success/failure feedback (e.g. toast). This function only reports
 * whether the copy actually happened.
 *
 * @example
 *   if (await copyToClipboard(token)) {
 *       toastBus.push({ variant: 'success', title: 'Copied' });
 *   } else {
 *       toastBus.push({ variant: 'error', title: 'Copy failed' });
 *   }
 *
 * @param {string} text - The text to copy. Empty strings return `false`.
 * @returns {Promise<boolean>} `true` on success, `false` on any failure
 *   (no clipboard support, permission denied, empty input).
 */
export async function copyToClipboard(text: string): Promise<boolean> {
    if (!text) return false;
    let copyOk = false;
    try {
        if (
            typeof navigator !== 'undefined' &&
            navigator.clipboard &&
            typeof navigator.clipboard.writeText === 'function'
        ) {
            await navigator.clipboard.writeText(text);
            copyOk = true;
        }
    } catch {
        // Permission denied or insecure context — fall through to legacy path.
        copyOk = false;
    }
    if (copyOk) return true;
    return legacyCopy(text);
}

/**
 * Legacy fallback for browsers without async Clipboard API support.
 * Creates a throwaway textarea, selects its content, and runs
 * `document.execCommand('copy')`. Returns whether the command
 * reported success.
 * @param {string} text - The text to copy.
 * @returns {boolean} `true` on success, `false` on failure.
 */
function legacyCopy(text: string): boolean {
    if (typeof document === 'undefined') return false;
    const ta = document.createElement('textarea');
    ta.value = text;
    // Avoid scrolling to the offscreen element.
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-9999px';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
        ok = document.execCommand('copy');
    } catch {
        ok = false;
    }
    document.body.removeChild(ta);
    return ok;
}