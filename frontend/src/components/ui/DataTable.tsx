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
                    <tr>{columns.map(renderHeadCell)}</tr>
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
