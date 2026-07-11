import '@/styles/components/mobile-cards.css';
//-- Types
import type { DataTableColumn } from "@/types/components/ui";
import type { JSX } from "react/jsx-runtime";
//-- Components
import { DataTable } from "@/components/ui/DataTable";
//-- Icons
import { Inbox } from "lucide-react";
/**
 * @interface EmptyTableProps
 * @param {DataTableColumn[]} columns - The columns to display in the empty table.
 * @param {string} [emptyTitle] - The title for the empty table.
 * @param {string} [emptyMessage] - The message for the empty table.
 * @param {string} [className] - The class name for the empty table.
 */
interface EmptyTableProps {
    columns: DataTableColumn[];
    emptyTitle?: string;
    emptyMessage?: string;
    className?: string;
};
/**
 * EmptyTable component.
 * @param {EmptyTableProps} props - The props for the EmptyTable component.
 * @returns {JSX.Element} - The rendered EmptyTable component.
 */
export function EmptyTable({ columns, emptyTitle, emptyMessage, className }: EmptyTableProps): JSX.Element {
    return (
        <>
            {/* Empty Header */}
            <DataTable columns={columns} className={className} />
            {/* Empty Table Message */}
            <div className="mobile-empty">
                <div className="mobile-empty__icon" aria-hidden="true">
                    <Inbox />
                </div>
                <h3 className="mobile-empty__title">
                    {emptyTitle}
                </h3>
                <p className="mobile-empty__message">
                    {emptyMessage}
                </p>
            </div>
        </>
    )
};