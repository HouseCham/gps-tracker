import type { JSX } from 'react/jsx-runtime';
import { Bike, Bus, Car, Circle, Truck } from 'lucide-react';
import type { DeviceVehicleType } from '@/types/api';

interface DeviceTypeIconProps {
    type: DeviceVehicleType;
    className?: string;
}

const ICON_MAP: Record<DeviceVehicleType, JSX.Element> = {
    bicycle: <Bike size={16} strokeWidth={1.75} />,
    motorcycle: <Bike size={16} strokeWidth={1.75} />,
    car: <Car size={16} strokeWidth={1.75} />,
    truck: <Truck size={16} strokeWidth={1.75} />,
    van: <Bus size={16} strokeWidth={1.75} />,
    other: <Circle size={16} strokeWidth={1.75} />,
};

export function DeviceTypeIcon({
    type,
    className,
}: DeviceTypeIconProps): JSX.Element {
    return (
        <span
            className={['device-type-icon', className]
                .filter(Boolean)
                .join(' ')}
        >
            {ICON_MAP[type]}
        </span>
    );
}
