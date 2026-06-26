import '@/styles/components/table.css';
import { AlertCircle } from 'lucide-react';
import type { DataTableColumn } from '@/types/components/ui';

/**
 * @interface TableDataLoaderProps
 * @property {readonly DataTableColumn[]} columns - Column definitions; only `key` is used to pick the skeleton width modifier.
 * @property {number} [rows=5] - Number of skeleton rows to render.
 * @property {string} [className] - Extra class appended to each row.
 */
interface TableDataLoaderProps {
    columns: readonly DataTableColumn[];
    rows?: number;
    className?: string;
}

/**
 * Renders skeleton placeholder rows for use inside a `<DataTable>` while data is loading.
 * Designed to drop into the table's `<tbody>` via a React island.
 * @param {TableDataLoaderProps} props - Component props.
 * @returns {React.JSX.Element} A fragment of skeleton `<tr>` rows.
 */
export function TableDataLoader({
    columns,
    rows = 5,
    className,
}: TableDataLoaderProps): React.JSX.Element {
    const rowClass = ['data-table__row', 'data-table__row--skeleton', className]
        .filter(Boolean)
        .join(' ');

    return (
        <>
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <tr key={rowIndex} className={rowClass} aria-hidden="true">
                    {columns.map((col) => (
                        <td key={col.key} className="data-table__cell">
                            <span
                                className={`data-table__skeleton data-table__skeleton--${col.key}`}
                            />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}

/**
 * @interface TableErrorBoundaryProps
 * @property {number} colspan - Number of columns the error cell should span.
 * @property {string} [title] - Error title.
 * @property {string} [message] - Error detail.
 * @property {() => void} [onRetry] - Optional retry handler; renders a button when provided.
 */
interface TableErrorBoundaryProps {
    colspan: number;
    title?: string;
    message?: string;
    onRetry?: () => void;
}

/**
 * Renders an error state row for use inside a `<DataTable>` when a fetch has failed.
 * @param {TableErrorBoundaryProps} props - Component props.
 * @returns {React.JSX.Element} A single `<tr>` containing the error cell.
 */
export function TableErrorBoundary({
    colspan,
    title = 'Something went wrong',
    message = "We couldn't load the data. Please try again.",
    onRetry,
}: TableErrorBoundaryProps): React.JSX.Element {
    return (
        <tr className="data-table__empty-row">
            <td
                className="data-table__cell data-table__empty data-table__empty--error"
                colSpan={colspan}
            >
                <span className="data-table__empty-icon" aria-hidden="true">
                    <AlertCircle size={18} strokeWidth={1.75} />
                </span>
                <span className="data-table__empty-title">{title}</span>
                <span className="data-table__empty-msg">{message}</span>
                {onRetry && (
                    <button
                        type="button"
                        className="data-table__retry"
                        onClick={onRetry}
                    >
                        Try again
                    </button>
                )}
            </td>
        </tr>
    );
}