import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";

const configuredPath = process.env.DATABASE_PATH ?? "./data/ev-charging.sqlite";
const databasePath = configuredPath === ":memory:"
  ? configuredPath
  : isAbsolute(configuredPath) ? configuredPath : resolve(process.cwd(), configuredPath);

if (databasePath !== ":memory:") {
  mkdirSync(dirname(databasePath), { recursive: true });
}

export const db = new Database(databasePath);
db.pragma("foreign_keys = ON");
db.pragma("journal_mode = WAL");
db.pragma("busy_timeout = 5000");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL CHECK(length(name) BETWEEN 2 AND 80),
    email TEXT NOT NULL COLLATE NOCASE UNIQUE CHECK(length(email) <= 254),
    phone TEXT NOT NULL DEFAULT '' CHECK(length(phone) <= 30),
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'CUSTOMER' CHECK(role IN ('CUSTOMER', 'ADMIN')),
    wallet_balance_minor INTEGER NOT NULL DEFAULT 0 CHECK(wallet_balance_minor >= 0),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS stations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL CHECK(length(name) BETWEEN 2 AND 160),
    operator TEXT NOT NULL CHECK(length(operator) <= 120),
    address TEXT NOT NULL CHECK(length(address) <= 250),
    city TEXT NOT NULL CHECK(length(city) <= 100),
    state TEXT NOT NULL CHECK(length(state) <= 100),
    postal_code TEXT NOT NULL DEFAULT '' CHECK(length(postal_code) <= 20),
    latitude REAL NOT NULL CHECK(latitude BETWEEN -90 AND 90),
    longitude REAL NOT NULL CHECK(longitude BETWEEN -180 AND 180),
    pricing_per_kwh_minor INTEGER NOT NULL CHECK(pricing_per_kwh_minor >= 0),
    parking_fee_per_hour_minor INTEGER NOT NULL DEFAULT 0 CHECK(parking_fee_per_hour_minor >= 0),
    amenities_json TEXT NOT NULL DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'OPERATIONAL' CHECK(status IN ('OPERATIONAL', 'BUSY', 'MAINTENANCE')),
    data_mode TEXT NOT NULL DEFAULT 'SEEDED_DEMO',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS station_ports (
    id TEXT NOT NULL,
    station_id TEXT NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
    port_number INTEGER NOT NULL CHECK(port_number >= 1),
    connector_type TEXT NOT NULL CHECK(connector_type IN ('CCS2', 'Type 2', 'CHAdeMO', 'NACS')),
    max_power_kw REAL NOT NULL CHECK(max_power_kw BETWEEN 1 AND 1000),
    status TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK(status IN ('AVAILABLE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE')),
    PRIMARY KEY(station_id, id),
    UNIQUE(station_id, port_number)
  );

  CREATE TABLE IF NOT EXISTS vehicles (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    make TEXT NOT NULL CHECK(length(make) <= 80),
    model TEXT NOT NULL CHECK(length(model) <= 100),
    year INTEGER NOT NULL CHECK(year BETWEEN 1990 AND 2100),
    license_plate TEXT NOT NULL DEFAULT '' CHECK(length(license_plate) <= 30),
    vin TEXT NOT NULL DEFAULT '' CHECK(length(vin) <= 40),
    battery_capacity_kwh REAL NOT NULL CHECK(battery_capacity_kwh BETWEEN 1 AND 500),
    max_charging_rate_kw REAL NOT NULL CHECK(max_charging_rate_kw BETWEEN 1 AND 1000),
    connector_type TEXT NOT NULL CHECK(connector_type IN ('CCS2', 'Type 2', 'CHAdeMO', 'NACS')),
    current_soc_percent REAL NOT NULL DEFAULT 50 CHECK(current_soc_percent BETWEEN 0 AND 100),
    estimated_range_km REAL NOT NULL DEFAULT 0 CHECK(estimated_range_km BETWEEN 0 AND 3000),
    is_primary INTEGER NOT NULL DEFAULT 0 CHECK(is_primary IN (0, 1)),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    reference TEXT NOT NULL UNIQUE,
    user_id TEXT NOT NULL REFERENCES users(id),
    vehicle_id TEXT NOT NULL REFERENCES vehicles(id),
    station_id TEXT NOT NULL REFERENCES stations(id),
    port_id TEXT NOT NULL,
    starts_at TEXT NOT NULL,
    ends_at TEXT NOT NULL,
    estimated_energy_kwh REAL NOT NULL CHECK(estimated_energy_kwh >= 0),
    estimated_cost_minor INTEGER NOT NULL CHECK(estimated_cost_minor >= 0),
    status TEXT NOT NULL DEFAULT 'CONFIRMED' CHECK(status IN ('CONFIRMED', 'CANCELLED', 'COMPLETED')),
    qr_token_hash TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(station_id, port_id) REFERENCES station_ports(station_id, id)
  );

  CREATE TABLE IF NOT EXISTS charging_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    vehicle_id TEXT NOT NULL REFERENCES vehicles(id),
    station_id TEXT NOT NULL REFERENCES stations(id),
    port_id TEXT NOT NULL,
    booking_id TEXT REFERENCES bookings(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'CHARGING' CHECK(status IN ('CHARGING', 'PAUSED', 'COMPLETED')),
    mode TEXT NOT NULL DEFAULT 'SIMULATED' CHECK(mode IN ('SIMULATED', 'LIVE')),
    started_at TEXT NOT NULL,
    ended_at TEXT,
    energy_delivered_kwh REAL NOT NULL DEFAULT 0 CHECK(energy_delivered_kwh >= 0),
    accrued_cost_minor INTEGER NOT NULL DEFAULT 0 CHECK(accrued_cost_minor >= 0),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(station_id, port_id) REFERENCES station_ports(station_id, id)
  );

  CREATE TABLE IF NOT EXISTS wallet_ledger_entries (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount_minor INTEGER NOT NULL,
    kind TEXT NOT NULL CHECK(kind IN ('CREDIT', 'DEBIT', 'REFUND', 'ADJUSTMENT')),
    status TEXT NOT NULL DEFAULT 'COMPLETED' CHECK(status IN ('PENDING', 'COMPLETED', 'FAILED')),
    idempotency_key TEXT NOT NULL,
    description TEXT NOT NULL CHECK(length(description) <= 200),
    created_at TEXT NOT NULL,
    UNIQUE(user_id, idempotency_key)
  );

  CREATE INDEX IF NOT EXISTS idx_stations_city_state_status ON stations(city, state, status);
  CREATE INDEX IF NOT EXISTS idx_station_ports_connector_status ON station_ports(connector_type, status);
  CREATE INDEX IF NOT EXISTS idx_vehicles_user_primary ON vehicles(user_id, is_primary);
  CREATE INDEX IF NOT EXISTS idx_bookings_port_time_status ON bookings(station_id, port_id, starts_at, ends_at, status);
  CREATE INDEX IF NOT EXISTS idx_bookings_user_starts ON bookings(user_id, starts_at);
  CREATE INDEX IF NOT EXISTS idx_sessions_user_created ON charging_sessions(user_id, created_at);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_sessions_one_active_per_user
    ON charging_sessions(user_id) WHERE status IN ('CHARGING', 'PAUSED');
  CREATE INDEX IF NOT EXISTS idx_wallet_user_created ON wallet_ledger_entries(user_id, created_at);
`);

export function closeDatabase() {
  if (db.open) db.close();
}
