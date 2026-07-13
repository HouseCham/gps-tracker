package domain

import (
	"time"

	"github.com/google/uuid"
)

// LocationIngest carries the data the IoT device posts on every cycle.
// It is the app-layer projection of the IngestLocationRequest DTO after
// the transport middleware has parsed/validated the JSON body.
//
// Nullable fields (Altitude, Speed, Accuracy, BatteryVoltage, SignalStrength)
// stay as *T: zero values from a no-fix GPS cycle are encoded as JSON null
// in the payload, and we do not want to coerce them to 0 (which would
// flatten reporting analytics).
type LocationIngest struct {
	DeviceID       uuid.UUID
	RecordedAt     time.Time
	Latitude       float64
	Longitude      float64
	Altitude       *float64
	Speed          *float64
	Accuracy       *float64
	BatteryVoltage *float64
	SignalStrength *int
}
