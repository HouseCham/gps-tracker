import type { JSX } from 'react';
import type { DataTableColumn } from '@/types/components/ui';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui';

const GALLERY_COLUMNS: readonly DataTableColumn[] = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' },
    { key: 'status', label: 'Status' },
    { key: 'time', label: 'Updated' },
];

function GalleryTableRow({
    name,
    email,
    role,
    statusVariant,
    statusLabel,
    time,
}: {
    name: string;
    email: string;
    role: string;
    statusVariant: 'success' | 'warning' | 'default';
    statusLabel: string;
    time: string;
}): JSX.Element {
    return (
        <tr className="data-table__row">
            <td className="data-table__cell">
                <span className="user-table__name">{name}</span>
            </td>
            <td className="data-table__cell">
                <span className="user-table__email">{email}</span>
            </td>
            <td className="data-table__cell">{role}</td>
            <td className="data-table__cell">
                <Badge variant={statusVariant} size="sm" label={statusLabel} />
            </td>
            <td className="data-table__cell user-table__time">{time}</td>
        </tr>
    );
}

export function DataTableDemo(): JSX.Element {
    return (
        <>
            <DataTable columns={GALLERY_COLUMNS}>
                <GalleryTableRow
                    name="Alex Chen"
                    email="alex@meridian.io"
                    role="Dispatcher"
                    statusVariant="success"
                    statusLabel="Active"
                    time="2 min ago"
                />
                <GalleryTableRow
                    name="Maya Okafor"
                    email="m.okafor@meridian.io"
                    role="Fleet Manager"
                    statusVariant="success"
                    statusLabel="Active"
                    time="12 min ago"
                />
                <GalleryTableRow
                    name="Diego Ruiz"
                    email="d.ruiz@meridian.io"
                    role="Operator"
                    statusVariant="warning"
                    statusLabel="Away"
                    time="1 hr ago"
                />
            </DataTable>
        </>
    );
}

export function DataTableDemoLoading(): JSX.Element {
    return <DataTable columns={GALLERY_COLUMNS} loading />;
}

export function DataTableDemoEmpty(): JSX.Element {
    return (
        <DataTable
            columns={GALLERY_COLUMNS}
            empty
            emptyTitle="No users yet"
            emptyMessage="Add your first user to get started."
        />
    );
}
