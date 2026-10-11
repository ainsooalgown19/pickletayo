CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE court_bookings (
    id uuid PRIMARY KEY,
    organization_id uuid NOT NULL REFERENCES organizations(id),
    booking_reference varchar(40) NOT NULL UNIQUE,
    facility_id uuid NOT NULL REFERENCES facilities(id),
    court_id uuid NOT NULL REFERENCES courts(id),
    booked_by_user_id uuid NOT NULL REFERENCES users(id),
    booking_start timestamptz NOT NULL,
    booking_end timestamptz NOT NULL,
    booking_status varchar(32) NOT NULL CHECK (booking_status IN ('HOLD','PENDING_PAYMENT','CONFIRMED','CHECKED_IN','COMPLETED','CANCELLED','NO_SHOW','EXPIRED')),
    subtotal_amount numeric(19,4) NOT NULL CHECK (subtotal_amount >= 0),
    discount_amount numeric(19,4) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
    total_amount numeric(19,4) NOT NULL CHECK (total_amount >= 0),
    currency_code char(3) NOT NULL DEFAULT 'PHP',
    payment_status varchar(32) NOT NULL CHECK (payment_status IN ('UNPAID','PARTIALLY_PAID','PAID','REFUNDED')),
    idempotency_key varchar(120),
    hold_expires_at timestamptz,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL,
    version bigint NOT NULL DEFAULT 0,
    CONSTRAINT uq_booking_idempotency UNIQUE (booked_by_user_id, idempotency_key),
    CONSTRAINT ck_booking_period CHECK (booking_start < booking_end)
);

ALTER TABLE court_bookings ADD CONSTRAINT ex_court_booking_overlap
    EXCLUDE USING gist (
        court_id WITH =,
        tstzrange(booking_start, booking_end, '[)') WITH &&
    ) WHERE (booking_status IN ('HOLD','PENDING_PAYMENT','CONFIRMED','CHECKED_IN'));

CREATE TABLE booking_status_history (
    id uuid PRIMARY KEY,
    booking_id uuid NOT NULL REFERENCES court_bookings(id) ON DELETE CASCADE,
    from_status varchar(32),
    to_status varchar(32) NOT NULL,
    changed_by_user_id uuid REFERENCES users(id),
    reason varchar(500),
    changed_at timestamptz NOT NULL
);

CREATE INDEX idx_booking_user_created ON court_bookings(booked_by_user_id, created_at DESC);
CREATE INDEX idx_booking_facility_start ON court_bookings(facility_id, booking_start);
CREATE INDEX idx_booking_court_start ON court_bookings(court_id, booking_start, booking_end, booking_status);
CREATE INDEX idx_booking_expiring_holds ON court_bookings(hold_expires_at) WHERE booking_status='HOLD';
CREATE INDEX idx_booking_history ON booking_status_history(booking_id, changed_at);

