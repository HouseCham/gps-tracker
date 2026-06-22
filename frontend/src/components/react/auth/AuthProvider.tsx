import { useEffect, useRef, type ReactNode } from 'react';
import { authService } from '@/lib/auth/service';
/**
 * @interface AuthProviderProps
 * @property {ReactNode} children - The React tree that depends on the hydrated auth state.
 */
interface AuthProviderProps {
    children: ReactNode;
}
/**
 * @function AuthProvider
 * @description A provider that hydrates the auth state.
 * @param {AuthProviderProps} props - The provider props.
 * @returns {JSX.Element} The children wrapped in a fragment.
 */
export function AuthProvider({ children }: AuthProviderProps): React.JSX.Element {
    const hydrated = useRef(false);

    useEffect(() => {
        if (hydrated.current) {
            return;
        }
        hydrated.current = true;
        void authService.getSession();
    }, []);

    return <>{children}</>;
}
