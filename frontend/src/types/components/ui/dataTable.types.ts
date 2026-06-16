/**
 * @interface DataTableColumn
 * @description Interface for DataTableColumn representing a column in a data table.
 * @property {string} key - The key of the column.
 * @property {string} label - The label of the column.
 * @property {boolean | undefined} sortable - Whether the column is sortable.
 * @property {'left' | 'right' | 'center' | undefined} align - The alignment of the column.
 * @property {string | undefined} width - The width of the column.
 */
export interface DataTableColumn {
    key: string;
    label: string;
    sortable?: boolean;
    align?: 'left' | 'right' | 'center';
    width?: string;
}