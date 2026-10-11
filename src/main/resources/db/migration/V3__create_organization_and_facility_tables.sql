CREATE TABLE organizations (
    id uuid PRIMARY KEY,
    organization_type varchar(32) NOT NULL CHECK (organization_type IN ('CLUB','COURT_OPERATOR','PLATFORM')),
    legal_name varchar(200) NOT NULL,
    display_name varchar(160) NOT NULL,
    status varchar(32) NOT NULL CHECK (status IN ('PENDING','ACTIVE','SUSPENDED','CLOSED')),
    owner_user_id uuid NOT NULL REFERENCES users(id),
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL,
    version bigint NOT NULL DEFAULT 0
);

CREATE TABLE organization_members (
    id uuid PRIMARY KEY,
    organization_id uuid NOT NULL REFERENCES organizations(id),
    user_id uuid NOT NULL REFERENCES users(id),
    role_id uuid NOT NULL REFERENCES roles(id),
    membership_status varchar(32) NOT NULL CHECK (membership_status IN ('INVITED','ACTIVE','SUSPENDED','LEFT')),
    joined_at timestamptz,
    created_at timestamptz NOT NULL,
    CONSTRAINT uq_organization_member UNIQUE (organization_id, user_id)
);

CREATE TABLE facilities (
    id uuid PRIMARY KEY,
    organization_id uuid NOT NULL REFERENCES organizations(id),
    facility_name varchar(160) NOT NULL,
    branch_code varchar(40) NOT NULL,
    description text,
    facility_status varchar(32) NOT NULL CHECK (facility_status IN ('DRAFT','ACTIVE','TEMPORARILY_CLOSED','CLOSED')),
    contact_number varchar(40),
    contact_email varchar(320),
    timezone varchar(60) NOT NULL DEFAULT 'Asia/Manila',
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL,
    version bigint NOT NULL DEFAULT 0,
    CONSTRAINT uq_facility_branch UNIQUE (organization_id, branch_code)
);

CREATE TABLE facility_locations (
    id uuid PRIMARY KEY,
    facility_id uuid NOT NULL UNIQUE REFERENCES facilities(id) ON DELETE CASCADE,
    address_line_1 varchar(200) NOT NULL,
    address_line_2 varchar(200),
    barangay varchar(120),
    city_municipality varchar(120) NOT NULL,
    province varchar(120) NOT NULL,
    postal_code varchar(20),
    country_code char(2) NOT NULL DEFAULT 'PH',
    latitude numeric(9,6) NOT NULL CHECK (latitude BETWEEN -90 AND 90),
    longitude numeric(9,6) NOT NULL CHECK (longitude BETWEEN -180 AND 180),
    provider_place_id varchar(200),
    directions_landmark text,
    is_verified boolean NOT NULL DEFAULT false
);

CREATE TABLE facility_operating_hours (
    id uuid PRIMARY KEY,
    facility_id uuid NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    day_of_week smallint NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
    opens_at time,
    closes_at time,
    is_closed boolean NOT NULL DEFAULT false,
    CONSTRAINT uq_facility_operating_day UNIQUE (facility_id, day_of_week),
    CONSTRAINT ck_operating_period CHECK (is_closed OR (opens_at IS NOT NULL AND closes_at IS NOT NULL AND opens_at < closes_at))
);

CREATE TABLE courts (
    id uuid PRIMARY KEY,
    organization_id uuid NOT NULL REFERENCES organizations(id),
    facility_id uuid NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    court_code varchar(40) NOT NULL,
    court_name varchar(120) NOT NULL,
    court_type varchar(24) NOT NULL CHECK (court_type IN ('INDOOR','OUTDOOR','COVERED')),
    surface_type varchar(80) NOT NULL,
    court_status varchar(24) NOT NULL CHECK (court_status IN ('ACTIVE','MAINTENANCE','INACTIVE')),
    has_lighting boolean NOT NULL,
    base_hourly_rate numeric(19,4) NOT NULL CHECK (base_hourly_rate >= 0),
    currency_code char(3) NOT NULL DEFAULT 'PHP',
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL,
    version bigint NOT NULL DEFAULT 0,
    CONSTRAINT uq_court_code UNIQUE (facility_id, court_code)
);

CREATE TABLE court_rate_rules (
    id uuid PRIMARY KEY,
    court_id uuid NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
    rule_name varchar(120) NOT NULL,
    day_of_week smallint CHECK (day_of_week BETWEEN 1 AND 7),
    starts_at time,
    ends_at time,
    hourly_rate numeric(19,4) NOT NULL CHECK (hourly_rate >= 0),
    effective_from date,
    effective_until date,
    priority integer NOT NULL DEFAULT 0,
    active boolean NOT NULL DEFAULT true,
    CONSTRAINT ck_rate_period CHECK (starts_at IS NULL OR ends_at IS NULL OR starts_at < ends_at),
    CONSTRAINT ck_rate_dates CHECK (effective_until IS NULL OR effective_from IS NULL OR effective_from <= effective_until)
);

CREATE TABLE court_availability_blocks (
    id uuid PRIMARY KEY,
    court_id uuid NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
    block_type varchar(32) NOT NULL CHECK (block_type IN ('MAINTENANCE','OWNER_BLOCK','TOURNAMENT','CLOSURE')),
    starts_at timestamptz NOT NULL,
    ends_at timestamptz NOT NULL,
    reason varchar(500),
    created_by_user_id uuid NOT NULL REFERENCES users(id),
    created_at timestamptz NOT NULL,
    CONSTRAINT ck_availability_block_period CHECK (starts_at < ends_at)
);

CREATE INDEX idx_organization_owner ON organizations(owner_user_id, status);
CREATE INDEX idx_organization_member_user ON organization_members(user_id, membership_status);
CREATE INDEX idx_facility_status_city ON facilities(facility_status, facility_name);
CREATE INDEX idx_facility_location_city ON facility_locations(city_municipality, province);
CREATE INDEX idx_court_facility_status ON courts(facility_id, court_status);
CREATE INDEX idx_court_rate_lookup ON court_rate_rules(court_id, active, day_of_week, priority DESC);
CREATE INDEX idx_court_block_lookup ON court_availability_blocks(court_id, starts_at, ends_at);

