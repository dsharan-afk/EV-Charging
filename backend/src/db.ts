import Database from "better-sqlite3";
import { createHash } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const configuredPath = process.env.DATABASE_PATH ?? "./data/ev-charging.sqlite";
const databasePath = configuredPath === ":memory:"
  ? configuredPath
  : isAbsolute(configuredPath) ? configuredPath : resolve(appRoot, configuredPath);

if (databasePath !== ":memory:") {
  mkdirSync(dirname(databasePath), { recursive: true });
}

export const db = new Database(databasePath);
db.pragma("foreign_keys = ON");
db.pragma("journal_mode = WAL");
db.pragma("busy_timeout = 5000");

const stableStationId = (seed: string) => createHash("sha1").update(seed).digest("hex").slice(0, 24);

type DemoPort = {
  id: string;
  portNumber: number;
  connectorType: "CCS2" | "Type 2" | "CHAdeMO" | "NACS";
  maxPowerKw: number;
  status: "AVAILABLE" | "OCCUPIED" | "RESERVED" | "MAINTENANCE";
};

type DemoStation = {
  id: string;
  name: string;
  operator: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  pricingPerKwhMinor: number;
  parkingFeePerHourMinor: number;
  amenities: string[];
  status: "OPERATIONAL" | "BUSY" | "MAINTENANCE";
  ports: DemoPort[];
};

const demoStations: DemoStation[] = [
  {
    id: stableStationId("chargegrid-demo-chennai-1"),
    name: "Demo - ChargeGrid Marina Hub",
    operator: "ChargeGrid Energy",
    address: "12 Marina Road",
    city: "Chennai",
    state: "Tamil Nadu",
    postalCode: "600001",
    latitude: 13.0827,
    longitude: 80.2707,
    pricingPerKwhMinor: 1650,
    parkingFeePerHourMinor: 250,
    amenities: ["Restroom", "Cafe", "Wi-Fi", "Security"],
    status: "OPERATIONAL",
    ports: [
      { id: "demo-port-1", portNumber: 1, connectorType: "CCS2", maxPowerKw: 50, status: "AVAILABLE" },
      { id: "demo-port-2", portNumber: 2, connectorType: "Type 2", maxPowerKw: 22, status: "AVAILABLE" }
    ]
  },
  {
    id: stableStationId("chargegrid-demo-bengaluru-2"),
    name: "Demo - Bengaluru Downtown Charge Point",
    operator: "ChargeGrid Energy",
    address: "88 MG Road",
    city: "Bengaluru",
    state: "Karnataka",
    postalCode: "560001",
    latitude: 12.9716,
    longitude: 77.5946,
    pricingPerKwhMinor: 1800,
    parkingFeePerHourMinor: 300,
    amenities: ["Parking", "Restroom", "EV Lounge"],
    status: "OPERATIONAL",
    ports: [
      { id: "demo-port-3", portNumber: 1, connectorType: "CCS2", maxPowerKw: 60, status: "AVAILABLE" },
      { id: "demo-port-4", portNumber: 2, connectorType: "CHAdeMO", maxPowerKw: 50, status: "AVAILABLE" }
    ]
  },
  {
    id: stableStationId("chargegrid-demo-delhi-3"),
    name: "Demo - Delhi NCR Express Charge",
    operator: "ChargeGrid Energy",
    address: "42 Connaught Place",
    city: "Delhi",
    state: "Delhi",
    postalCode: "110001",
    latitude: 28.6139,
    longitude: 77.2090,
    pricingPerKwhMinor: 1750,
    parkingFeePerHourMinor: 275,
    amenities: ["Restroom", "Coffee", "Fast Charge"],
    status: "OPERATIONAL",
    ports: [
      { id: "demo-port-5", portNumber: 1, connectorType: "CCS2", maxPowerKw: 100, status: "AVAILABLE" },
      { id: "demo-port-6", portNumber: 2, connectorType: "NACS", maxPowerKw: 80, status: "AVAILABLE" }
    ]
  }
];

export function shouldSeedDemoStations() {
  return process.env.NODE_ENV === "development" &&
    process.env.SEED_DEMO_STATIONS !== "false";
}

export function seedDemoStations() {
  if (!shouldSeedDemoStations()) return;

  const stationCount = (db.prepare("SELECT COUNT(*) AS count FROM stations").get() as { count: number }).count;
  if (stationCount > 0) return;

  const timestamp = new Date().toISOString();
  const insertStation = db.prepare(`INSERT OR IGNORE INTO stations
    (id, name, operator, address, city, state, postal_code, latitude, longitude,
     pricing_per_kwh_minor, parking_fee_per_hour_minor, amenities_json, status, data_mode, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const insertPort = db.prepare(`INSERT OR IGNORE INTO station_ports
    (id, station_id, port_number, connector_type, max_power_kw, status)
    VALUES (?, ?, ?, ?, ?, ?)`);

  db.transaction(() => {
    for (const station of demoStations) {
      insertStation.run(
        station.id,
        station.name,
        station.operator,
        station.address,
        station.city,
        station.state,
        station.postalCode,
        station.latitude,
        station.longitude,
        station.pricingPerKwhMinor,
        station.parkingFeePerHourMinor,
        JSON.stringify(station.amenities),
        station.status,
        "SEEDED_DEMO",
        timestamp,
        timestamp
      );

      for (const port of station.ports) {
        insertPort.run(port.id, station.id, port.portNumber, port.connectorType, port.maxPowerKw, port.status);
      }
    }
  }).immediate();
}

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

  CREATE TABLE IF NOT EXISTS payment_methods (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK(type IN ('CARD', 'UPI')),
    brand TEXT,
    last_four TEXT CHECK(last_four IS NULL OR length(last_four) = 4),
    expiration_month INTEGER CHECK(expiration_month IS NULL OR expiration_month BETWEEN 1 AND 12),
    expiration_year INTEGER,
    upi_id TEXT,
    status TEXT NOT NULL CHECK(status IN ('DEMO_ONLY', 'UNVERIFIED')),
    created_at TEXT NOT NULL,
    CHECK(
      (type = 'CARD' AND brand IS NOT NULL AND last_four IS NOT NULL
        AND expiration_month IS NOT NULL AND expiration_year IS NOT NULL AND upi_id IS NULL
        AND status = 'DEMO_ONLY')
      OR
      (type = 'UPI' AND brand IS NULL AND last_four IS NULL
        AND expiration_month IS NULL AND expiration_year IS NULL AND upi_id IS NOT NULL
        AND status = 'UNVERIFIED')
    )
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
  CREATE INDEX IF NOT EXISTS idx_payment_methods_user_created ON payment_methods(user_id, created_at);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_methods_unique_card
    ON payment_methods(user_id, brand, last_four, expiration_month, expiration_year) WHERE type = 'CARD';
  CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_methods_unique_upi
    ON payment_methods(user_id, lower(upi_id)) WHERE type = 'UPI';
`);

export function closeDatabase() {
  if (db.open) db.close();
}
