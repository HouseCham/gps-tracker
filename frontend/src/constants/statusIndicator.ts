import type { StatusVariant } from '@/types/components/ui';
/**
 * @constant STATUS_INDICATOR_DEFAULT_LABEL
 * @description Default labels for the status indicator
 */
export const STATUS_INDICATOR_DEFAULT_LABEL: Record<StatusVariant, string> = {
    online: 'Online',
    offline: 'Offline',
    'never-seen': 'Never seen',
    unknown: 'Unknown',
};
/**
 * @constant STATUS_INDICATOR_DOT_COLOR
 * @description Colors for the status indicator
 */
export const STATUS_INDICATOR_DOT_COLOR: Record<StatusVariant, string> = {
    online: 'green',
    offline: '',
    'never-seen': 'amber',
    unknown: '',
};
