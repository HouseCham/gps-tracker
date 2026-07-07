package locations

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/HouseCham/gps-tracker/backend/internal/domain"
	"github.com/HouseCham/gps-tracker/backend/internal/infra/postgres"
)

// Adapter implements the locations Writer port using sqlc-generated
// queries.
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
func (a *Adapter) Insert(ctx context.Context, loc domain.LocationIngest) error {
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
