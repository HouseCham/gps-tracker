//-- Types
import type { Translation } from "@/i18n";
import type { DeviceAccessListItem, DeviceDetail } from "@/types/api";
import type { DeviceAccessTableTranslations } from "@/types/components";
import type { Language } from "@/types/i18n";
import type { JSX } from "react/jsx-runtime";
//-- Components
import { Button } from "@/components/react/ui";
import { Plus, Trash2, UserRound, Users } from "lucide-react";
import { RolePill } from "@/components/react/RolePill";
//-- Utils
import { formatRelativeTime, getInitials, interpolateTemplate } from "@/lib";
/**
 * Props for the DeviceAccessTable component
 * @interface DeviceAccessTableProps
 * @prop {DeviceDetail} device - Device details.
 * @prop {Language} locale - Locale.
 * @prop {Translation['device']} translations - Translations.
 * @prop {() => void} onInvite - Callback for the invite button.
 * @prop {(user: DeviceAccessListItem) => void} onRevoke - Callback for the revoke button.
 */
interface DeviceAccessTableProps {
    device: DeviceDetail;
    locale: Language;
    translations: Translation['device'];
    onInvite: () => void;
    onRevoke: (user: DeviceAccessListItem) => void;
}
/**
 * Table component for showing the users that have access to the device.
 * @param {DeviceAccessTableProps} props - Props for the component.
 * @returns {JSX.Element} The rendered component.
 */
export function DeviceAccessTable({
    device,
    locale,
    translations,
    onInvite,
    onRevoke,
}: DeviceAccessTableProps): JSX.Element {
    const t: DeviceAccessTableTranslations = translations.detail.accessTable;
    const users = device.users ?? [];
    const owner = device.access_role === 'owner';

    return (
        <div className="dd-card dd-access-card">
            <div className="dd-card-head">
                <div>
                    <h3>{t.title}</h3>
                    <div className="dd-card-sub">
                        {owner
                            ? interpolateTemplate(t.peopleCanView, {
                                  count: users.length,
                              })
                            : t.visibleToOwnerOnly}
                    </div>
                </div>
                {owner && (
                    <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        icon={<Plus size={13} />}
                        onClick={onInvite}
                    >
                        {t.addUser}
                    </Button>
                )}
            </div>
            {!owner ? (
                <div className="dd-users-empty">
                    <UserRound size={28} />
                    <div>{t.ownerOnly}</div>
                </div>
            ) : users.length === 0 ? (
                <div className="dd-users-empty">
                    <Users size={28} />
                    <div>{t.noUsers}</div>
                </div>
            ) : (
                <div className="dd-table-wrap">
                    <table className="dd-table">
                        <thead>
                            <tr>
                                <th>{t.name}</th>
                                <th>{t.role}</th>
                                <th>{t.accessGranted}</th>
                                <th className="dd-table-actions">
                                    {t.actions}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.user_id}>
                                    <td>
                                        <div className="dd-user-cell">
                                            <span className="dd-avatar">
                                                {getInitials(user.name)}
                                            </span>
                                            <span>
                                                <strong>{user.name}</strong>
                                                <small>{user.email}</small>
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <RolePill
                                            role={user.role}
                                            translations={translations}
                                        />
                                    </td>
                                    <td className="dd-muted">
                                        {formatRelativeTime(
                                            user.access_granted_at,
                                            locale
                                        )}
                                    </td>
                                    <td className="dd-table-actions">
                                        {user.role === 'owner' ? (
                                            <span className="dd-protected">
                                                {t.protected}
                                            </span>
                                        ) : (
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                size="sm"
                                                iconOnly
                                                icon={<Trash2 size={13} />}
                                                onClick={() => onRevoke(user)}
                                                aria-label={`${t.remove} ${user.name}`}
                                                title={t.remove}
                                            />
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}