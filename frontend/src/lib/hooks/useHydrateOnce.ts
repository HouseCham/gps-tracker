import { useEffect, useRef } from 'react';

//* note: hydrate-once gate. Refresh fn is captured by ref-equivalent
//   (the deps array); StrictMode's double-mount is absorbed by the ref
//   check so the network call fires exactly once per component lifetime.
export function useHydrateOnce(refresh: () => void | Promise<void>): void {
    const hydrated = useRef(false);
    useEffect(() => {
        if (hydrated.current) return;
        hydrated.current = true;
        void refresh();
    }, [refresh]);
}
