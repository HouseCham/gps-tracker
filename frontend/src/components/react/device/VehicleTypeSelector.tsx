import type { JSX } from 'react/jsx-runtime';
//-- Constants
import { VEHICLE_TYPE_OPTIONS } from '@/constants';
//-- Types
import type { DeviceVehicleType } from '@/types/api';
import type { DropdownItem } from '@/types/components';
//-- Components
import Dropdown from '@/components/react/ui/Dropdown';
import { DeviceTypeIcon } from '@/components/react/device';

/**
 * @interface VehicleTypeSelectorProps
 * @description Props for the {@link VehicleTypeSelector} component.
 * @property {DeviceVehicleType} value - Currently selected vehicle type.
 * @property {(next: DeviceVehicleType) => void} onChange - Fired when a new vehicle type is picked.
 * @property {Record<DeviceVehicleType, string>} vehicleTypes - Localized label for each vehicle type.
 * @property {string} [label] - Accessible label for the dropdown menu (used by screen readers; visual labels live in the parent form).
 */
export interface VehicleTypeSelectorProps {
    value: DeviceVehicleType;
    onChange: (next: DeviceVehicleType) => void;
    vehicleTypes: Record<DeviceVehicleType, string>;
    label?: string;
}

/**
 * Selector for a {@link DeviceVehicleType}. Wraps the shared {@link Dropdown}
 * primitive so each option can show its icon + label — a native `<select>`
 * cannot render icons inside `<option>` reliably.
 * @param {VehicleTypeSelectorProps} props - Component props.
 * @returns {JSX.Element} The rendered selector.
 */
export function VehicleTypeSelector({
    value,
    onChange,
    vehicleTypes,
    label,
}: VehicleTypeSelectorProps): JSX.Element {
    const items: DropdownItem[] = VEHICLE_TYPE_OPTIONS.map(vt => ({
        key: vt,
        label: vehicleTypes[vt],
        icon: <DeviceTypeIcon type={vt} />,
        onSelect: () => onChange(vt),
    }));

    return (
        <Dropdown
            trigger={
                <span className="vehicle-type-selector__current">
                    <DeviceTypeIcon type={value} />
                    <span className="vehicle-type-selector__current-label">
                        {vehicleTypes[value]}
                    </span>
                </span>
            }
            items={items}
            ariaLabel={label}
        />
    );
}
