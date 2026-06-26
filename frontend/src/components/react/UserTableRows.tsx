import type { JSX } from "react/jsx-runtime";
//-- Hooks
import { useUserService } from "@/lib/api/services";
//-- Components
import { TableDataLoader, TableErrorBoundary } from "@/components/react/shared";
import { USER_ROLE_LABEL, USER_ROLE_VARIANT } from "@/constants/components";
import { Button, Badge } from "@/components/ui";
import { useEffect } from "react";
/**
 * @function UserTableRows
 * @description Renders user table rows.
 * @returns {JSX.Element} - User table rows.
 */
export function UserTableRows(): JSX.Element {
    const { error, isLoading, users, getAllUsers } = useUserService();

    useEffect(() => {
        getAllUsers();
    }, []);

    if (isLoading) return (
        <TableDataLoader
            rows={5}
            columns={[]}
        />
    );
    if (error) return (
        <TableErrorBoundary
            title=""
            message={error.message}
            colspan={3}
            onRetry={getAllUsers}
        />
    );

    return (
        <>
            {users.map((user) => (
                <tr key={user.id} className="data-table__row user-table__row">
                    <td className="data-table__cell">
                        <span className="user-table__name">{user.name}</span>
                    </td>
                    <td className="data-table__cell user-table__email">{user.email}</td>
                    <td className="data-table__cell">
                        <Badge variant={USER_ROLE_VARIANT[user.role] ?? 'default'} size="sm" label={USER_ROLE_LABEL[user.role] ?? user.role} />
                    </td>
                    <td className="data-table__cell">
                        <Badge
                            variant={user.email_verified ? 'success' : 'warning'}
                            size="sm"
                            label={user.email_verified ? 'Verified' : 'Unverified'}
                        />
                    </td>
                    <td className="data-table__cell user-table__time">{user.created_at}</td>
                    <td className="data-table__cell" data-align="center">
                        {0}
                    </td>
                    <td className="data-table__cell" data-align="right">
                        <div className="user-table__actions">
                            <Button variant="ghost" size="sm">Edit</Button>
                            <Button variant="danger" size="sm">Delete</Button>
                        </div>
                    </td>
                </tr>
            ))}
        </>
    )
};