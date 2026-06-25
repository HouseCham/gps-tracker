//-- Icons
import { LogOut } from 'lucide-react';
//-- Components
import { Button } from '@/components/ui';
//-- Hooks
import { useAuth } from '@/lib/hooks/useAuth';

/**
 * @interface LogoutButtonProps
 * @property {string} ariaLabel - Accessible name for the button.
 */
interface LogoutButtonProps {
    ariaLabel: string;
}

/**
 * React island for the sidebar logout button.
 *
 * Reads `isAuthLoading` from `useAuth()` to keep the button disabled
 * while the sign-out redirect is in flight, preventing double-submit.
 * The actual sign-out is delegated to `authService.signOut()`.
 *
 * @param {LogoutButtonProps} props - The component props.
 * @returns {JSX.Element} The logout `<button>`.
 */
export default function LogoutButton({
    ariaLabel,
}: LogoutButtonProps): React.JSX.Element {
    const { signOut, isAuthLoading } = useAuth();

    return (
        <Button
            variant="ghost"
            size="sm"
            aria-label={ariaLabel}
            disabled={isAuthLoading}
            loading={isAuthLoading}
            onClick={signOut}
        >
            <LogOut size={18} stroke-width={1.75} />
        </Button>
    );
}
