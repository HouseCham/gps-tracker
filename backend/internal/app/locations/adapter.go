package locations

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/HouseCham/gps-tracker/backend/internal/domain"
	"github.com/HouseCham/gps-tracker/backend/internal/infra/postgres"
)

// Adapter implements the locations Writer and Reader ports using
// sqlc-generated queries. The same pool instance backs both —
// sqlc.New(pool) is cheap and stateless.
type Adapter struct {
	pool *pgxpool.Pool
}

func NewAdapter(pool *pgxpool.Pool) *Adapter {
	return &Adapter{pool: pool}
}

// Insert writes a single location row. Idempotency is enforced at the DB
// layer via ON CONFLICT (device_id, recorded_at) DO NOTHING on the partition
// PK — ESP32 retries do not surface here as duplicates.
//
// sqlc generates signal_strength as *int32 because Postgres returns
// smallints that way; we adapt int → int32 here. The cast is exact
// for the [0, 31] SIM7080G AT+CSQ scale.
func (a *Adapter) Insert(ctx context.Context, loc domain.Location) error {
	queries := postgres.New(a.pool)

	var signalStrength *int32
	if loc.SignalStrength != nil {
		v := int32(*loc.SignalStrength)
		signalStrength = &v
	}

	return postgres.WrapPgError(queries.InsertLocation(ctx, postgres.InsertLocationParams{
		DeviceID:       postgres.PgtypeUUID(loc.DeviceID),
		RecordedAt:     postgres.PgtypeTimestamptz(loc.RecordedAt),
		Latitude:       loc.Latitude,
		Longitude:      loc.Longitude,
		Altitude:       loc.Altitude,
		Speed:          loc.Speed,
		Accuracy:       loc.Accuracy,
		BatteryVoltage: loc.BatteryVoltage,
		SignalStrength: signalStrength,
	}))
}

// GetLatest returns the most recent location for a device, or
// domain.ErrNotFound when the device has never reported. "No rows"
// maps to ErrNotFound (not a 500) so the handler can answer 404
// without inspecting pgx.ErrNoRows itself.
func (a *Adapter) GetLatest(ctx context.Context, deviceID uuid.UUID) (domain.Location, error) {
	queries := postgres.New(a.pool)
	row, err := queries.GetLatestLocationForDevice(ctx, postgres.PgtypeUUID(deviceID))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.Location{}, domain.ErrNotFound
		}
		return domain.Location{}, fmt.Errorf("Adapter.GetLatest: %w", err)
	}
	return locationFromRow(row), nil
}

// locationFromRow projects a sqlc Location row into the domain.Location
// the application layer reads through. signal_strength arrives as *int32
// (sqlc's choice for Postgres smallint); we widen back to *int at the
// boundary so downstream code never has to think about pgx specifics.
func locationFromRow(row postgres.Location) domain.Location {
	var signalStrength *int
	if row.SignalStrength != nil {
		v := int(*row.SignalStrength)
		signalStrength = &v
	}
	return domain.Location{
		DeviceID:       uuid.UUID(row.DeviceID.Bytes),
		RecordedAt:     row.RecordedAt.Time,
		Latitude:       row.Latitude,
		Longitude:      row.Longitude,
		Altitude:       row.Altitude,
		Speed:          row.Speed,
		Accuracy:       row.Accuracy,
		BatteryVoltage: row.BatteryVoltage,
		SignalStrength: signalStrength,
	}
}