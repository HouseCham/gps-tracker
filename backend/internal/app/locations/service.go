package locations

import (
	"context"
	"fmt"

	"github.com/HouseCham/gps-tracker/backend/internal/domain"
)

// Service validates incoming ingest payloads before persisting them.
// It only enforces numeric ranges that Postgres cannot enforce directly
// (the DTO already handles "required / type" fields via validate_struct);
// database constraints (NOT NULL on lat/lng, FK on device_id, partition
// key composite PK, idempotent ON CONFLICT) live one layer below.
type Service struct {
	writer Writer
}

func New(w Writer) *Service {
	return &Service{writer: w}
}

// Ingest validates the payload and inserts one location row.
// The DeviceID is set by the IoT auth middleware upstream (it never comes
// from the request body) — the service treats it as authoritative.
//
// Returns one of the Err* sentinels above when a field falls outside its
// plausible physical range. The handler maps ErrInvalidLatitude /
// ErrInvalidLongitude / ErrInvalidAltitude / ErrInvalidSpeed /
// ErrInvalidAccuracy / ErrInvalidBatteryVoltage / ErrInvalidSignalStrength
// to a 400 envelope via the httpErrorHandler.
func (s *Service) Ingest(ctx context.Context, loc domain.LocationIngest) error {
	if loc.Latitude < -90 || loc.Latitude > 90 {
		return ErrInvalidLatitude
	}
	if loc.Longitude < -180 || loc.Longitude > 180 {
		return ErrInvalidLongitude
	}
	if loc.Altitude != nil && (*loc.Altitude < MinAltitudeMeters || *loc.Altitude > MaxAltitudeMeters) {
		return ErrInvalidAltitude
	}
	if loc.Speed != nil && *loc.Speed < 0 {
		return ErrInvalidSpeed
	}
	if loc.Accuracy != nil && *loc.Accuracy < 0 {
		return ErrInvalidAccuracy
	}
	if loc.BatteryVoltage != nil && (*loc.BatteryVoltage < 0 || *loc.BatteryVoltage > MaxBatteryVoltage) {
		return ErrInvalidBatteryVoltage
	}
	if loc.SignalStrength != nil && (*loc.SignalStrength < MinSignalStrength || *loc.SignalStrength > MaxSignalStrength) {
		return ErrInvalidSignalStrength
	}
	if err := s.writer.Insert(ctx, loc); err != nil {
		return fmt.Errorf("Service.Ingest: %w", err)
	}
	return nil
}
