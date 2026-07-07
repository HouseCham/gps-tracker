package dto

// IngestLocationRequest is the body of POST /api/v1/devices/:uuid_firmware/locations.
// The device sends this on every cycle: one payload per ~30 s with up to 9 telemetry fields.
//
// The validate tags cover:
//   - required:          field must be present (lat, lng, recorded_at)
//   - gte / lte:         numeric range bounds, enforced again in the service
//                        for cross-field / DTO-with-pointer fields
//   - omitempty:         nullable; absent == SQL NULL in the column
//   - datetime:          ISO 8601 parse for recorded_at (RFC 3339)
//
// The DeviceID is NEVER in the body — it is taken from the URL's
// :uuid_firmware, resolved by the IoT auth middleware, and stamped
// onto the row.
type IngestLocationRequest struct {
	RecordedAt     string   `json:"recorded_at"     validate:"required,rfc3339"`
	Latitude       float64  `json:"latitude"        validate:"required,gte=-90,lte=90"`
	Longitude      float64  `json:"longitude"       validate:"required,gte=-180,lte=180"`
	Altitude       *float64 `json:"altitude"        validate:"omitempty,gte=-500,lte=10000"`
	Speed          *float64 `json:"speed"           validate:"omitempty,gte=0"`
	Accuracy       *float64 `json:"accuracy"        validate:"omitempty,gte=0"`
	BatteryVoltage *float64 `json:"battery_voltage" validate:"omitempty,gte=0,lte=6"`
	SignalStrength *int     `json:"signal_strength" validate:"omitempty,gte=0,lte=31"`
}
