import '@/styles/components/table.css';
import type { ReactNode } from 'react';
import type { JSX } from 'react/jsx-runtime';
//-- Types
import type { DataTableColumn } from '@/types/components/ui';
//-- Icons
import { SortIcon } from './SortIcon';
/**
 * Interface for DataTable component
 * @interface DataTableProps
 * @param {readonly DataTableColumn[]} columns - Column definitions; only `key` is used to pick the skeleton width modifier.
 * @param {string} [caption] - Table caption.
 * @param {string} [className] - Extra class appended to the class list.
 * @param {boolean} [loading] - Whether the table is loading.
 * @param {boolean} [empty] - Whether the table is empty.
 * @param {string} [emptyTitle] - The title of the empty state.
 * @param {string} [emptyMessage] - The message of the empty state.
 * @param {ReactNode} [children] - The children of the table.
 */
interface DataTableProps {
    columns: readonly DataTableColumn[];
    caption?: string;
    className?: string;
    loading?: boolean;
    empty?: boolean;
    emptyTitle?: string;
    emptyMessage?: string;
    children?: ReactNode;
}

/**
 * @constant EMPTY_COLUMNS
 * @description Single-column placeholder used by loading/empty states so the
 * table renders a valid header row without committing to real columns.
 */
export const EMPTY_COLUMNS: readonly DataTableColumn[] = [
    { key: 'empty-header', label: '' },
];

/**
 * Interface for TableStatus component
 * @interface TableStatusProps
 * @param {'loading' | 'empty'} mode - Which skeleton/empty state to render.
 * @param {string} [className] - Extra class appended to the class list.
 * @param {string} [title] - Empty-state title (used when mode === 'empty').
 * @param {string} [message] - Empty-state message (used when mode === 'empty').
 */
interface TableStatusProps {
    mode: 'loading' | 'empty';
    className?: string;
    title?: string;
    message?: string;
}

/**
 * @function TableStatus
 * @description Shared loading/empty wrapper around DataTable so callers don't
 * repeat the placeholder-columns + flag plumbing. Adds one when a second table
 * needs a third bespoke loading/empty branch.
 * @param {TableStatusProps} props - The props for the component.
 * @returns {JSX.Element} The rendered DataTable in the requested state.
 */
export function TableStatus({
    mode,
    className,
    title,
    message,
}: TableStatusProps): JSX.Element {
    if (mode === 'loading') {
        return <DataTable columns={EMPTY_COLUMNS} className={className} loading />;
    }
    return (
        <DataTable
            columns={EMPTY_COLUMNS}
            className={className}
            empty
            emptyTitle={title}
            emptyMessage={message}
        />
    );
}
/**
 * @function DataTable
 * @param {DataTableProps} props - The props for the DataTable component.
 * @returns {JSX.Element} The rendered component
 */
export function DataTable({
    columns,
    caption,
    className,
    loading = false,
    empty = false,
    emptyTitle = 'No data',
    emptyMessage = 'There is nothing to display here.',
    children,
}: DataTableProps): JSX.Element {
    const rootClasses = ['data-table', className].filter(Boolean).join(' ');
    /**
     * Renders a `<th>` for a column.
     * @param {DataTableColumn} col - Column definition.
     * @returns {JSX.Element} A `<th>` element.
     */
    const renderHeadCell = (col: DataTableColumn): JSX.Element => {
        const align = col.align ?? 'left';
        return (
            <th
                key={col.key}
                scope="col"
                style={col.width ? { width: col.width } : undefined}
                className={[
                    'data-table__head',
                    col.sortable && 'is-sortable',
                    `is-align-${align}`,
                ]
                    .filter(Boolean)
                    .join(' ')}
            >
                {col.sortable ? (
                    <button className="data-table__sort" type="button">
                        <span>{col.label}</span>
                        <SortIcon direction={null} />
                    </button>
                ) : (
                    col.label
                )}
            </th>
        );
    };

    return (
        <div className="data-table__scroll">
            <table className={rootClasses}>
                {caption && (
                    <caption className="data-table__caption">
                        {caption}
                    </caption>
                )}
                <thead>
                    <tr>
                        {
                            loading ? (
                                <th colSpan={columns.length} className="data-table__skeleton--head" aria-hidden="true" />
                            ) : <>{columns.map(renderHeadCell)}</>
                        }
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr className="data-table__empty-row" aria-hidden="true">
                            <td
                                className="data-table__cell data-table__empty"
                                colSpan={columns.length}
                            >
                                <div className="data-table__skeleton data-table__skeleton--name" />
                                <div className="data-table__skeleton data-table__skeleton--email" />
                            </td>
                        </tr>
                    ) : empty ? (
                        <tr className="data-table__empty-row">
                            <td
                                className="data-table__cell data-table__empty"
                                colSpan={columns.length}
                            >
                                <span
                                    className="data-table__empty-icon"
                                    aria-hidden="true"
                                >
                                    &#8203;
                                </span>
                                <span className="data-table__empty-title">
                                    {emptyTitle}
                                </span>
                                <span className="data-table__empty-msg">
                                    {emptyMessage}
                                </span>
                            </td>
                        </tr>
                    ) : (
                        children
                    )}
                </tbody>
            </table>
        </div>
    );
}
