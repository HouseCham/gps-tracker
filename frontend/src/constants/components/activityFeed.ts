import type { ActivityType } from '@/types/components';
import {
    Activity,
    Wifi,
    WifiOff,
    Plus,
    TriangleAlert,
    LogIn,
    ShieldCheck,
} from '@lucide/astro';
/**
 * @constant ACTIVITY_FEED_ICON
 * @description Icon for each activity type
 * @type {Record<ActivityType, typeof Activity>}
 */
export const ACTIVITY_FEED_ICON: Record<ActivityType, typeof Activity> = {
    'device-online': Wifi,
    'device-offline': WifiOff,
    'location-update': Activity,
    'device-added': Plus,
    alert: TriangleAlert,
    'user-login': LogIn,
    'role-change': ShieldCheck,
};
