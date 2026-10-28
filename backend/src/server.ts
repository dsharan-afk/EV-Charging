import "dotenv/config";
import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z, ZodError } from "zod";
import { randomBytes, randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { closeDatabase, db, seedDemoStations } from "./db.js";

const PORT = Number(process.env.PORT ?? 10000);
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "1h";
const configuredOrigins = (process.env.FRONTEND_ORIGINS ?? "")
  .split(",").map((origin) => origin.trim()).filter(Boolean);
const developmentOrigins = process.env.NODE_ENV === "development"
  ? ["http://localhost:3000", "http://localhost:3003", "http://localhost:5173"]
  : [];
const allowedOrigins = [...new Set([...configuredOrigins, ...developmentOrigins])];

if (!JWT_SECRET || Buffer.byteLength(JWT_SECRET) < 32) {
  throw new Error("JWT_SECRET must contain at least 32 bytes");
}

type Role = "CUSTOMER" | "ADMIN";
type AuthRequest = Request & { auth?: { userId: string; role: Role } };
type UserRow = {
  id: string; name: string; email: string; phone: string; password_hash: string;
  role: Role; wallet_balance_minor: number; created_at: string; updated_at: string;
};
type StationRow = {
  id: string; name: string; operator: string; address: string; city: string; state: string;
  postal_code: string; latitude: number; longitude: number; pricing_per_kwh_minor: number;
  parking_fee_per_hour_minor: number; amenities_json: string; status: string; data_mode: string;
  created_at: string; updated_at: string;
};
type PortRow = {
  id: string; station_id: string; port_number: number; connector_type: string;
  max_power_kw: number; status: string;
};
type VehicleRow = {
  id: string; user_id: string; make: string; model: string; year: number; license_plate: string;
  vin: string; battery_capacity_kwh: number; max_charging_rate_kw: number; connector_type: string;
  current_soc_percent: number; estimated_range_km: number; is_primary: number;
  created_at: string; updated_at: string;
};
type BookingRow = {
  id: string; reference: string; user_id: string; vehicle_id: string; station_id: string;
  port_id: string; starts_at: string; ends_at: string; estimated_energy_kwh: number;
  estimated_cost_minor: number; status: string; created_at: string;
};
type SessionRow = {
  id: string; user_id: string; vehicle_id: string; station_id: string; port_id: string;
  booking_id: string | null; status: string; mode: string; started_at: string; ended_at: string | null;
  energy_delivered_kwh: number; accrued_cost_minor: number;
};
type PaymentMethodRow = {
  id: string;
  type: "CARD" | "UPI";
  brand: string | null;
  last_four: string | null;
  expiration_month: number | null;
  expiration_year: number | null;
  upi_id: string | null;
  status: "DEMO_ONLY" | "UNVERIFIED";
  created_at: string;
};

const now = () => new Date().toISOString();
const newId = () => randomBytes(12).toString("hex");
const resourceId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid resource ID");
const jsonError = (res: Response, status: number, code: string, message: string) =>
  res.status(status).json({ error: { code, message } });
const asyncRoute = (fn: (req: AuthRequest, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req as AuthRequest, res, next)).catch(next);
const userForResponse = (user: UserRow) => ({
  id: user.id, name: user.name, email: user.email, phone: user.phone,
  role: user.role, walletBalance: user.wallet_balance_minor / 100
});
const portForResponse = (port: PortRow) => ({
  id: port.id, stationId: port.station_id, portNumber: port.port_number,
  connectorType: port.connector_type, maxPowerKw: port.max_power_kw, status: port.status
});
const portsForStation = (stationId: string) =>
  db.prepare("SELECT * FROM station_ports WHERE station_id = ? ORDER BY port_number")
    .all(stationId) as PortRow[];
const stationForResponse = (station: StationRow) => ({
  id: station.id, name: station.name, operator: station.operator, address: station.address,
  city: station.city, state: station.state, postalCode: station.postal_code,
  latitude: station.latitude, longitude: station.longitude,
  pricingPerKwhMinor: station.pricing_per_kwh_minor,
  parkingFeePerHourMinor: station.parking_fee_per_hour_minor,
  pricingPerKwh: station.pricing_per_kwh_minor / 100,
  parkingFeePerHour: station.parking_fee_per_hour_minor / 100,
  amenities: JSON.parse(station.amenities_json) as string[], status: station.status,
  dataMode: station.data_mode, createdAt: station.created_at, updatedAt: station.updated_at,
  ports: portsForStation(station.id).map(portForResponse)
});
const vehicleForResponse = (vehicle: VehicleRow, includeVin = true) => ({
  id: vehicle.id, userId: vehicle.user_id, make: vehicle.make, model: vehicle.model,
  year: vehicle.year, licensePlate: vehicle.license_plate,
  ...(includeVin ? { vin: vehicle.vin } : {}),
  batteryCapacityKwh: vehicle.battery_capacity_kwh,
  maxChargingRateKw: vehicle.max_charging_rate_kw, connectorType: vehicle.connector_type,
  currentSocPercent: vehicle.current_soc_percent, estimatedRangeKm: vehicle.estimated_range_km,
  isPrimary: Boolean(vehicle.is_primary), createdAt: vehicle.created_at, updatedAt: vehicle.updated_at
});
const bookingForResponse = (booking: BookingRow) => ({
  id: booking.id, bookingReference: booking.reference, vehicleId: booking.vehicle_id,
  stationId: booking.station_id, portId: booking.port_id, startsAt: booking.starts_at,
  endsAt: booking.ends_at, estimatedEnergyKwh: booking.estimated_energy_kwh,
  estimatedCost: booking.estimated_cost_minor / 100, status: booking.status,
  createdAt: booking.created_at
});
const sessionForResponse = (session: SessionRow) => ({
  id: session.id, vehicleId: session.vehicle_id, stationId: session.station_id,
  portId: session.port_id, bookingId: session.booking_id, status: session.status,
  mode: session.mode, startedAt: session.started_at, endedAt: session.ended_at,
  energyDeliveredKwh: session.energy_delivered_kwh, accruedCost: session.accrued_cost_minor / 100
});

const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const header = req.header("authorization");
  if (!header?.startsWith("Bearer ")) return jsonError(res, 401, "UNAUTHENTICATED", "Sign in to continue.");
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET!) as jwt.JwtPayload;
    if (typeof payload.sub !== "string" || !["CUSTOMER", "ADMIN"].includes(String(payload.role))) {
      return jsonError(res, 401, "INVALID_TOKEN", "Your session is invalid. Sign in again.");
    }
    req.auth = { userId: payload.sub, role: payload.role as Role };
    return next();
  } catch {
    return jsonError(res, 401, "INVALID_TOKEN", "Your session is invalid or expired. Sign in again.");
  }
};
const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) =>
  req.auth?.role === "ADMIN" ? next() :
    jsonError(res, 403, "FORBIDDEN", "Administrator access is required.");
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: "draft-7", legacyHeaders: false
});
const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(254),
  password: z.string().min(10).max(128),
  phone: z.string().trim().max(30).optional().default("")
});
const loginSchema = z.object({
  email: z.string().trim().email().max(254), password: z.string().min(1).max(128)
});
const vehicleSchema = z.object({
  make: z.string().trim().min(1).max(80), model: z.string().trim().min(1).max(100),
  year: z.number().int().min(1990).max(new Date().getFullYear() + 2),
  licensePlate: z.string().trim().max(30).optional().default(""),
  vin: z.string().trim().max(40).optional().default(""),
  batteryCapacityKwh: z.number().min(1).max(500), maxChargingRateKw: z.number().min(1).max(1000),
  connectorType: z.enum(["CCS2", "Type 2", "CHAdeMO", "NACS"]),
  currentSocPercent: z.number().min(0).max(100).optional().default(50),
  estimatedRangeKm: z.number().min(0).max(3000).optional().default(0)
});
const paymentMethodSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("CARD"),
    brand: z.enum(["Visa", "Mastercard", "Amex", "RuPay"]),
    last4: z.string().regex(/^\d{4}$/),
    expMonth: z.number().int().min(1).max(12),
    expYear: z.number().int().min(new Date().getFullYear()).max(new Date().getFullYear() + 15)
  }).strict(),
  z.object({
    type: z.literal("UPI"),
    upiId: z.string().trim().min(3).max(320)
      .regex(/^[A-Za-z0-9][A-Za-z0-9._-]{0,255}@[A-Za-z][A-Za-z0-9.-]{1,63}$/)
  }).strict()
]);
const paymentMethodForResponse = (method: PaymentMethodRow) => ({
  id: method.id,
  type: method.type,
  ...(method.type === "CARD" ? {
    brand: method.brand,
    last4: method.last_four,
    expMonth: method.expiration_month,
    expYear: method.expiration_year
  } : { upiId: method.upi_id }),
  status: method.status,
  createdAt: method.created_at
});

export function createApp() {
  seedDemoStations();
  const app = express();
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("CORS origin denied"));
    },
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Idempotency-Key"],
    maxAge: 600
  }));
  app.use(express.json({ limit: "100kb" }));

  app.get("/health", (_req, res) =>
    res.json({ status: "ok", service: "ev-charging-api", time: now() }));
  app.get("/ready", (_req, res) => {
    try {
      db.prepare("SELECT 1").get();
      return res.json({ status: "ready", database: "connected" });
    } catch {
      return res.status(503).json({ status: "not_ready", database: "disconnected" });
    }
  });
  app.get("/api/v1/health", (_req, res) => res.json({ api: "v1", status: "ok" }));

  app.post("/api/v1/auth/register", authLimiter, asyncRoute(async (req, res) => {
    const input = registerSchema.parse(req.body);
    const timestamp = now();
    const userId = newId();
    const passwordHash = await bcrypt.hash(input.password, 12);
    try {
      db.prepare(`INSERT INTO users
        (id, name, email, phone, password_hash, role, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'CUSTOMER', ?, ?)`).run(
        userId, input.name, input.email.toLowerCase(), input.phone, passwordHash, timestamp, timestamp
      );
    } catch (err) {
      if (err instanceof Error && "code" in err &&
        (err as { code: string }).code === "SQLITE_CONSTRAINT_UNIQUE") {
        return jsonError(res, 409, "EMAIL_EXISTS", "An account with this email already exists.");
      }
      throw err;
    }
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as UserRow;
    const token = jwt.sign({ role: user.role }, JWT_SECRET!, {
      subject: user.id, expiresIn: JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"]
    });
    return res.status(201).json({ token, user: userForResponse(user) });
  }));
  app.post("/api/v1/auth/login", authLimiter, asyncRoute(async (req, res) => {
    const input = loginSchema.parse(req.body);
    const user = db.prepare("SELECT * FROM users WHERE email = ? COLLATE NOCASE")
      .get(input.email.toLowerCase()) as UserRow | undefined;
    if (!user || !(await bcrypt.compare(input.password, user.password_hash))) {
      return jsonError(res, 401, "INVALID_CREDENTIALS", "Email or password is incorrect.");
    }
    const token = jwt.sign({ role: user.role }, JWT_SECRET!, {
      subject: user.id, expiresIn: JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"]
    });
    return res.json({ token, user: userForResponse(user) });
  }));
  app.get("/api/v1/me", requireAuth, asyncRoute(async (req, res) => {
    const user = db.prepare("SELECT * FROM users WHERE id = ?")
      .get(req.auth!.userId) as UserRow | undefined;
    if (!user) return jsonError(res, 404, "USER_NOT_FOUND", "Account not found.");
    return res.json({ ...userForResponse(user), createdAt: user.created_at });
  }));
  app.patch("/api/v1/me", requireAuth, asyncRoute(async (req, res) => {
    const input = z.object({
      name: z.string().trim().min(2).max(80).optional(),
      phone: z.string().trim().max(30).optional()
    }).strict().parse(req.body);
    const assignments: string[] = [];
    const values: (string | undefined)[] = [];
    if (input.name !== undefined) { assignments.push("name = ?"); values.push(input.name); }
    if (input.phone !== undefined) { assignments.push("phone = ?"); values.push(input.phone); }
    if (assignments.length) {
      assignments.push("updated_at = ?");
      values.push(now());
      db.prepare(`UPDATE users SET ${assignments.join(", ")} WHERE id = ?`)
        .run(...values, req.auth!.userId);
    }
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.auth!.userId) as UserRow | undefined;
    if (!user) return jsonError(res, 404, "USER_NOT_FOUND", "Account not found.");
    return res.json(userForResponse(user));
  }));

  app.get("/api/v1/stations", asyncRoute(async (req, res) => {
    const pageValue = Number(req.query.page ?? 1);
    const limitValue = Number(req.query.limit ?? 20);
    const page = Number.isFinite(pageValue) ? Math.max(1, Math.floor(pageValue)) : 1;
    const limit = Number.isFinite(limitValue) ? Math.min(100, Math.max(1, Math.floor(limitValue))) : 20;
    const conditions: string[] = [];
    const parameters: string[] = [];
    for (const key of ["city", "state", "status"] as const) {
      const value = req.query[key];
      if (typeof value === "string" && value) {
        conditions.push(`${key} = ?`);
        parameters.push(value);
      }
    }
    if (typeof req.query.connector === "string" && req.query.connector) {
      conditions.push("EXISTS (SELECT 1 FROM station_ports p WHERE p.station_id = stations.id AND p.connector_type = ?)");
      parameters.push(req.query.connector);
    }
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const items = db.prepare(`SELECT * FROM stations ${where} ORDER BY city, name LIMIT ? OFFSET ?`)
      .all(...parameters, limit, (page - 1) * limit) as StationRow[];
    const total = (db.prepare(`SELECT COUNT(*) AS count FROM stations ${where}`)
      .get(...parameters) as { count: number }).count;
    return res.json({ items: items.map(stationForResponse), page, limit, total });
  }));
  app.get("/api/v1/stations/:id", asyncRoute(async (req, res) => {
    const id = resourceId.parse(req.params.id);
    const station = db.prepare("SELECT * FROM stations WHERE id = ?").get(id) as StationRow | undefined;
    if (!station) return jsonError(res, 404, "STATION_NOT_FOUND", "Charging station not found.");
    return res.json(stationForResponse(station));
  }));
  app.post("/api/v1/admin/stations", requireAuth, requireAdmin, asyncRoute(async (req, res) => {
    const input = z.object({
      name: z.string().trim().min(2).max(160), operator: z.string().trim().min(1).max(120),
      address: z.string().trim().min(3).max(250), city: z.string().trim().min(1).max(100),
      state: z.string().trim().min(1).max(100), postalCode: z.string().max(20).optional(),
      latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180),
      pricingPerKwh: z.number().min(0).max(100000),
      parkingFeePerHour: z.number().min(0).max(100000).optional(),
      amenities: z.array(z.string().trim().max(100)).max(30).optional(),
      ports: z.array(z.object({
        id: z.string().min(1).max(80), portNumber: z.number().int().min(1),
        connectorType: z.enum(["CCS2", "Type 2", "CHAdeMO", "NACS"]),
        maxPowerKw: z.number().min(1).max(1000),
        status: z.enum(["AVAILABLE", "OCCUPIED", "RESERVED", "MAINTENANCE"]).optional()
      })).max(100)
    }).strict().parse(req.body);
    const id = newId();
    const timestamp = now();
    const insertStation = db.prepare(`INSERT INTO stations
      (id, name, operator, address, city, state, postal_code, latitude, longitude,
       pricing_per_kwh_minor, parking_fee_per_hour_minor, amenities_json, data_mode, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'SEEDED_DEMO', ?, ?)`);
    const insertPort = db.prepare(`INSERT INTO station_ports
      (id, station_id, port_number, connector_type, max_power_kw, status)
      VALUES (?, ?, ?, ?, ?, ?)`);
    db.transaction(() => {
      insertStation.run(
        id, input.name, input.operator, input.address, input.city, input.state, input.postalCode ?? "",
        input.latitude, input.longitude, Math.round(input.pricingPerKwh * 100),
        Math.round((input.parkingFeePerHour ?? 0) * 100), JSON.stringify(input.amenities ?? []), timestamp, timestamp
      );
      for (const port of input.ports) {
        insertPort.run(port.id, id, port.portNumber, port.connectorType, port.maxPowerKw, port.status ?? "AVAILABLE");
      }
    }).immediate();
    return res.status(201).json({ id, name: input.name });
  }));

  app.get("/api/v1/vehicles", requireAuth, asyncRoute(async (req, res) => {
    const items = db.prepare("SELECT * FROM vehicles WHERE user_id = ? ORDER BY is_primary DESC, created_at DESC")
      .all(req.auth!.userId) as VehicleRow[];
    return res.json({ items: items.map((vehicle) => vehicleForResponse(vehicle, false)) });
  }));
  app.post("/api/v1/vehicles", requireAuth, asyncRoute(async (req, res) => {
    const input = vehicleSchema.strict().parse(req.body);
    const userId = req.auth!.userId;
    const id = newId();
    const timestamp = now();
    const insert = db.prepare(`INSERT INTO vehicles
      (id, user_id, make, model, year, license_plate, vin, battery_capacity_kwh,
       max_charging_rate_kw, connector_type, current_soc_percent, estimated_range_km,
       is_primary, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    db.transaction(() => {
      const isPrimary = (db.prepare("SELECT 1 FROM vehicles WHERE user_id = ? LIMIT 1").get(userId) === undefined);
      insert.run(
        id, userId, input.make, input.model, input.year, input.licensePlate, input.vin,
        input.batteryCapacityKwh, input.maxChargingRateKw, input.connectorType,
        input.currentSocPercent, input.estimatedRangeKm, isPrimary ? 1 : 0, timestamp, timestamp
      );
    }).immediate();
    const vehicle = db.prepare("SELECT * FROM vehicles WHERE id = ?").get(id) as VehicleRow;
    return res.status(201).json(vehicleForResponse(vehicle));
  }));
  app.patch("/api/v1/vehicles/:id", requireAuth, asyncRoute(async (req, res) => {
    const id = resourceId.parse(req.params.id);
    const input = vehicleSchema.partial().strict().parse(req.body);
    const columns: Record<string, keyof typeof input> = {
      make: "make", model: "model", year: "year", licensePlate: "licensePlate", vin: "vin",
      batteryCapacityKwh: "batteryCapacityKwh", maxChargingRateKw: "maxChargingRateKw",
      connectorType: "connectorType", currentSocPercent: "currentSocPercent",
      estimatedRangeKm: "estimatedRangeKm"
    };
    const assignments: string[] = [];
    const values: (string | number)[] = [];
    for (const [column, key] of Object.entries(columns)) {
      const value = input[key];
      if (value !== undefined) {
        assignments.push(`${column.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)} = ?`);
        values.push(value);
      }
    }
    if (assignments.length) {
      assignments.push("updated_at = ?");
      values.push(now());
      db.prepare(`UPDATE vehicles SET ${assignments.join(", ")} WHERE id = ? AND user_id = ?`)
        .run(...values, id, req.auth!.userId);
    }
    const vehicle = db.prepare("SELECT * FROM vehicles WHERE id = ? AND user_id = ?")
      .get(id, req.auth!.userId) as VehicleRow | undefined;
    if (!vehicle) return jsonError(res, 404, "VEHICLE_NOT_FOUND", "Vehicle not found.");
    return res.json(vehicleForResponse(vehicle));
  }));
  app.delete("/api/v1/vehicles/:id", requireAuth, asyncRoute(async (req, res) => {
    const id = resourceId.parse(req.params.id);
    const userId = req.auth!.userId;
    try {
      const deleted = db.transaction(() => {
        const vehicle = db.prepare("SELECT is_primary FROM vehicles WHERE id = ? AND user_id = ?")
          .get(id, userId) as { is_primary: number } | undefined;
        if (!vehicle) return false;
        db.prepare("DELETE FROM vehicles WHERE id = ? AND user_id = ?").run(id, userId);
        if (vehicle.is_primary) {
          const nextPrimary = db.prepare(
            "SELECT id FROM vehicles WHERE user_id = ? ORDER BY created_at, id LIMIT 1"
          ).get(userId) as { id: string } | undefined;
          if (nextPrimary) {
            db.prepare("UPDATE vehicles SET is_primary = 1, updated_at = ? WHERE id = ? AND user_id = ?")
              .run(now(), nextPrimary.id, userId);
          }
        }
        return true;
      }).immediate();
      if (!deleted) return jsonError(res, 404, "VEHICLE_NOT_FOUND", "Vehicle not found.");
    } catch (error) {
      if (error instanceof Error && "code" in error &&
        (error as { code: string }).code === "SQLITE_CONSTRAINT_FOREIGNKEY") {
        return jsonError(res, 409, "VEHICLE_IN_USE", "This vehicle is referenced by existing bookings or charging sessions.");
      }
      throw error;
    }
    return res.status(204).end();
  }));
  app.post("/api/v1/vehicles/:id/primary", requireAuth, asyncRoute(async (req, res) => {
    const id = resourceId.parse(req.params.id);
    const vehicle = db.prepare("SELECT id FROM vehicles WHERE id = ? AND user_id = ?")
      .get(id, req.auth!.userId);
    if (!vehicle) return jsonError(res, 404, "VEHICLE_NOT_FOUND", "Vehicle not found.");
    db.transaction(() => {
      db.prepare("UPDATE vehicles SET is_primary = 0, updated_at = ? WHERE user_id = ?")
        .run(now(), req.auth!.userId);
      db.prepare("UPDATE vehicles SET is_primary = 1, updated_at = ? WHERE id = ? AND user_id = ?")
        .run(now(), id, req.auth!.userId);
    }).immediate();
    return res.json({ id, isPrimary: true });
  }));

  app.post("/api/v1/bookings", requireAuth, asyncRoute(async (req, res) => {
    const input = z.object({
      vehicleId: resourceId, stationId: resourceId, portId: z.string().min(1).max(80),
      startsAt: z.string().datetime({ offset: true }), durationMinutes: z.number().int().min(15).max(480),
      targetSocPercent: z.number().min(1).max(100)
    }).strict().parse(req.body);
    const vehicle = db.prepare("SELECT * FROM vehicles WHERE id = ? AND user_id = ?")
      .get(input.vehicleId, req.auth!.userId) as VehicleRow | undefined;
    const station = db.prepare("SELECT * FROM stations WHERE id = ?")
      .get(input.stationId) as StationRow | undefined;
    if (!vehicle) return jsonError(res, 404, "VEHICLE_NOT_FOUND", "Vehicle not found.");
    if (!station) return jsonError(res, 404, "STATION_NOT_FOUND", "Charging station not found.");
    const port = db.prepare("SELECT * FROM station_ports WHERE station_id = ? AND id = ?")
      .get(input.stationId, input.portId) as PortRow | undefined;
    if (!port || port.status !== "AVAILABLE" || station.status === "MAINTENANCE") {
      return jsonError(res, 409, "PORT_UNAVAILABLE", "This charging port is not available.");
    }
    if (port.connector_type !== vehicle.connector_type) {
      return jsonError(res, 422, "CONNECTOR_MISMATCH", "This port is not compatible with the selected vehicle.");
    }
    const startsAt = new Date(input.startsAt);
    if (startsAt.getTime() < Date.now() + 5 * 60 * 1000) {
      return jsonError(res, 422, "INVALID_START_TIME", "Choose a future time at least five minutes from now.");
    }
    const endsAt = new Date(startsAt.getTime() + input.durationMinutes * 60000);
    const startsIso = startsAt.toISOString();
    const endsIso = endsAt.toISOString();
    const usableKwh = Math.max(0, (input.targetSocPercent - vehicle.current_soc_percent) / 100 * vehicle.battery_capacity_kwh);
    const energyKwh = Math.min(usableKwh, port.max_power_kw * input.durationMinutes / 60);
    const estimatedCostMinor = Math.round(energyKwh * station.pricing_per_kwh_minor);
    const id = newId();
    const reference = `EVC-${randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase()}`;
    const qrToken = randomBytes(32).toString("hex");
    const qrTokenHash = await bcrypt.hash(qrToken, 10);
    const timestamp = now();
    const createBooking = db.transaction(() => {
      const conflict = db.prepare(`SELECT 1 FROM bookings
        WHERE station_id = ? AND port_id = ? AND status = 'CONFIRMED'
          AND starts_at < ? AND ends_at > ? LIMIT 1`).get(input.stationId, input.portId, endsIso, startsIso);
      if (conflict) return false;
      db.prepare(`INSERT INTO bookings
        (id, reference, user_id, vehicle_id, station_id, port_id, starts_at, ends_at,
         estimated_energy_kwh, estimated_cost_minor, qr_token_hash, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
        id, reference, req.auth!.userId, input.vehicleId, input.stationId, input.portId,
        startsIso, endsIso, Number(energyKwh.toFixed(2)), estimatedCostMinor, qrTokenHash, timestamp, timestamp
      );
      return true;
    }).immediate();
    if (!createBooking) return jsonError(res, 409, "BOOKING_CONFLICT", "That port is already reserved during this time.");
    return res.status(201).json({
      id, bookingReference: reference, vehicleId: vehicle.id, stationId: station.id,
      portId: input.portId, startsAt: startsIso, endsAt: endsIso, durationMinutes: input.durationMinutes,
      estimatedEnergyKwh: Number(energyKwh.toFixed(2)), estimatedCost: estimatedCostMinor / 100,
      status: "CONFIRMED", qrAccessToken: qrToken
    });
  }));
  app.get("/api/v1/bookings", requireAuth, asyncRoute(async (req, res) => {
    const items = db.prepare("SELECT * FROM bookings WHERE user_id = ? ORDER BY starts_at DESC")
      .all(req.auth!.userId) as BookingRow[];
    return res.json({ items: items.map(bookingForResponse) });
  }));
  app.post("/api/v1/bookings/:id/cancel", requireAuth, asyncRoute(async (req, res) => {
    const id = resourceId.parse(req.params.id);
    const booking = db.prepare("SELECT * FROM bookings WHERE id = ? AND user_id = ?")
      .get(id, req.auth!.userId) as BookingRow | undefined;
    if (!booking) return jsonError(res, 404, "BOOKING_NOT_FOUND", "Booking not found.");
    if (booking.status !== "CONFIRMED" || new Date(booking.starts_at).getTime() <= Date.now()) {
      return jsonError(res, 409, "BOOKING_NOT_CANCELLABLE", "This booking can no longer be cancelled.");
    }
    db.prepare("UPDATE bookings SET status = 'CANCELLED', updated_at = ? WHERE id = ? AND user_id = ?")
      .run(now(), id, req.auth!.userId);
    return res.json({ id, status: "CANCELLED" });
  }));

  app.post("/api/v1/sessions", requireAuth, asyncRoute(async (req, res) => {
    const input = z.object({
      vehicleId: resourceId, stationId: resourceId,
      portId: z.string().min(1).max(80), bookingId: resourceId.optional()
    }).strict().parse(req.body);
    const vehicle = db.prepare("SELECT * FROM vehicles WHERE id = ? AND user_id = ?")
      .get(input.vehicleId, req.auth!.userId) as VehicleRow | undefined;
    const station = db.prepare("SELECT * FROM stations WHERE id = ?")
      .get(input.stationId) as StationRow | undefined;
    if (!vehicle || !station) return jsonError(res, 404, "RESOURCE_NOT_FOUND", "Vehicle or station not found.");
    const port = db.prepare("SELECT * FROM station_ports WHERE station_id = ? AND id = ?")
      .get(input.stationId, input.portId) as PortRow | undefined;
    if (!port || port.connector_type !== vehicle.connector_type) {
      return jsonError(res, 422, "INVALID_PORT", "Select a compatible charging port.");
    }
    if (input.bookingId) {
      const booking = db.prepare(`SELECT id FROM bookings WHERE id = ? AND user_id = ? AND station_id = ?
        AND vehicle_id = ? AND port_id = ? AND status = 'CONFIRMED'`)
        .get(input.bookingId, req.auth!.userId, input.stationId, input.vehicleId, input.portId);
      if (!booking) return jsonError(res, 422, "INVALID_BOOKING", "A matching confirmed booking is required.");
    }
    const id = newId();
    const timestamp = now();
    try {
      db.transaction(() => {
        db.prepare(`INSERT INTO charging_sessions
          (id, user_id, vehicle_id, station_id, port_id, booking_id, status, mode,
           started_at, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, 'CHARGING', 'SIMULATED', ?, ?, ?)`).run(
          id, req.auth!.userId, input.vehicleId, input.stationId, input.portId,
          input.bookingId ?? null, timestamp, timestamp, timestamp
        );
      }).immediate();
    } catch (err) {
      if (err instanceof Error && "code" in err &&
        (err as { code: string }).code === "SQLITE_CONSTRAINT_UNIQUE") {
        return jsonError(res, 409, "ACTIVE_SESSION_EXISTS", "You already have an active charging session.");
      }
      throw err;
    }
    return res.status(201).json({
      id, status: "CHARGING", mode: "SIMULATED", startedAt: timestamp,
      energyDeliveredKwh: 0, accruedCost: 0
    });
  }));
  app.get("/api/v1/sessions", requireAuth, asyncRoute(async (req, res) => {
    const items = db.prepare("SELECT * FROM charging_sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT 100")
      .all(req.auth!.userId) as SessionRow[];
    return res.json({ items: items.map(sessionForResponse) });
  }));
  app.post("/api/v1/sessions/:id/:action", requireAuth, asyncRoute(async (req, res) => {
    const id = resourceId.parse(req.params.id);
    const action = z.enum(["pause", "resume", "stop"]).parse(req.params.action);
    const session = db.prepare("SELECT * FROM charging_sessions WHERE id = ? AND user_id = ?")
      .get(id, req.auth!.userId) as SessionRow | undefined;
    if (!session) return jsonError(res, 404, "SESSION_NOT_FOUND", "Charging session not found.");
    let status: string;
    let endedAt = session.ended_at;
    if (action === "pause" && session.status === "CHARGING") status = "PAUSED";
    else if (action === "resume" && session.status === "PAUSED") status = "CHARGING";
    else if (action === "stop" && ["CHARGING", "PAUSED"].includes(session.status)) {
      status = "COMPLETED";
      endedAt = now();
    } else {
      return jsonError(res, 409, "INVALID_SESSION_TRANSITION", "This action is not valid for the current session state.");
    }
    db.prepare("UPDATE charging_sessions SET status = ?, ended_at = ?, updated_at = ? WHERE id = ? AND user_id = ?")
      .run(status, endedAt, now(), id, req.auth!.userId);
    return res.json(sessionForResponse({ ...session, status, ended_at: endedAt }));
  }));

  app.get("/api/v1/wallet", requireAuth, asyncRoute(async (req, res) => {
    const user = db.prepare("SELECT wallet_balance_minor FROM users WHERE id = ?")
      .get(req.auth!.userId) as { wallet_balance_minor: number } | undefined;
    if (!user) return jsonError(res, 404, "USER_NOT_FOUND", "Account not found.");
    const entries = db.prepare("SELECT * FROM wallet_ledger_entries WHERE user_id = ? ORDER BY created_at DESC LIMIT 100")
      .all(req.auth!.userId) as Array<{
        id: string; amount_minor: number; kind: string; status: string;
        description: string; created_at: string;
      }>;
    return res.json({
      balance: user.wallet_balance_minor / 100, currency: "INR",
      ledger: entries.map((entry) => ({
        id: entry.id, amount: entry.amount_minor / 100, kind: entry.kind,
        status: entry.status, description: entry.description, createdAt: entry.created_at
      }))
    });
  }));
  app.get("/api/v1/payment-methods", requireAuth, asyncRoute(async (req, res) => {
    const items = db.prepare(`SELECT id, type, brand, last_four, expiration_month,
        expiration_year, upi_id, status, created_at
      FROM payment_methods WHERE user_id = ? ORDER BY created_at DESC, id`)
      .all(req.auth!.userId) as PaymentMethodRow[];
    return res.json({ items: items.map(paymentMethodForResponse) });
  }));
  app.post("/api/v1/payment-methods", requireAuth, asyncRoute(async (req, res) => {
    const input = paymentMethodSchema.parse(req.body);
    if (input.type === "CARD" &&
      input.expYear === new Date().getFullYear() && input.expMonth < new Date().getMonth() + 1) {
      return jsonError(res, 422, "INVALID_EXPIRATION", "The card expiration date must be in the future.");
    }
    const id = newId();
    const timestamp = now();
    try {
      if (input.type === "CARD") {
        db.prepare(`INSERT INTO payment_methods
          (id, user_id, type, brand, last_four, expiration_month, expiration_year, status, created_at)
          VALUES (?, ?, 'CARD', ?, ?, ?, ?, 'DEMO_ONLY', ?)`).run(
          id, req.auth!.userId, input.brand, input.last4, input.expMonth, input.expYear, timestamp
        );
      } else {
        db.prepare(`INSERT INTO payment_methods
          (id, user_id, type, upi_id, status, created_at)
          VALUES (?, ?, 'UPI', ?, 'UNVERIFIED', ?)`).run(
          id, req.auth!.userId, input.upiId.trim(), timestamp
        );
      }
    } catch (err) {
      if (err instanceof Error && "code" in err &&
        (err as { code: string }).code === "SQLITE_CONSTRAINT_UNIQUE") {
        return jsonError(res, 409, "PAYMENT_METHOD_EXISTS", "This payment method is already saved.");
      }
      throw err;
    }
    const method = db.prepare(`SELECT id, type, brand, last_four, expiration_month,
        expiration_year, upi_id, status, created_at
      FROM payment_methods WHERE id = ? AND user_id = ?`)
      .get(id, req.auth!.userId) as PaymentMethodRow;
    return res.status(201).json(paymentMethodForResponse(method));
  }));
  app.delete("/api/v1/payment-methods/:id", requireAuth, asyncRoute(async (req, res) => {
    const id = resourceId.parse(req.params.id);
    const result = db.prepare("DELETE FROM payment_methods WHERE id = ? AND user_id = ?")
      .run(id, req.auth!.userId);
    if (!result.changes) {
      return jsonError(res, 404, "PAYMENT_METHOD_NOT_FOUND", "Payment method not found.");
    }
    return res.status(204).end();
  }));
  app.post("/api/v1/wallet/demo-credit", requireAuth, asyncRoute(async (req, res) => {
    if (process.env.NODE_ENV !== "development") {
      return jsonError(res, 403, "DISABLED_OUTSIDE_DEVELOPMENT", "Demo wallet credits are only available in explicit development mode.");
    }
    const input = z.object({ amount: z.number().min(0.01).max(10000) }).strict().parse(req.body);
    const key = req.header("Idempotency-Key");
    if (!key || key.length > 100) {
      return jsonError(res, 400, "IDEMPOTENCY_KEY_REQUIRED", "Provide a valid Idempotency-Key header.");
    }
    const amountMinor = Math.round(input.amount * 100);
    const id = newId();
    const timestamp = now();
    const credit = db.transaction(() => {
      const existing = db.prepare(`SELECT status FROM wallet_ledger_entries
        WHERE user_id = ? AND idempotency_key = ?`).get(req.auth!.userId, key) as
        { status: string } | undefined;
      if (existing) return { replayed: true, status: existing.status };
      const update = db.prepare("UPDATE users SET wallet_balance_minor = wallet_balance_minor + ?, updated_at = ? WHERE id = ?")
        .run(amountMinor, timestamp, req.auth!.userId);
      if (!update.changes) return { missing: true as const };
      db.prepare(`INSERT INTO wallet_ledger_entries
        (id, user_id, amount_minor, kind, status, idempotency_key, description, created_at)
        VALUES (?, ?, ?, 'CREDIT', 'COMPLETED', ?, 'Development demo credit', ?)`)
        .run(id, req.auth!.userId, amountMinor, key, timestamp);
      const balance = db.prepare("SELECT wallet_balance_minor FROM users WHERE id = ?")
        .get(req.auth!.userId) as { wallet_balance_minor: number };
      return { balance: balance.wallet_balance_minor };
    }).immediate();
    if ("missing" in credit) return jsonError(res, 404, "USER_NOT_FOUND", "Account not found.");
    if ("replayed" in credit) return res.json({ replayed: true, status: credit.status });
    return res.status(201).json({ balance: credit.balance / 100, currency: "INR", mode: "DEMO_ONLY" });
  }));

  app.use((_req, res) => jsonError(res, 404, "NOT_FOUND", "The requested endpoint does not exist."));
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof ZodError) return res.status(422).json({
      error: {
        code: "VALIDATION_ERROR", message: "Check the submitted fields.",
        details: err.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message }))
      }
    });
    if (err instanceof SyntaxError && "body" in err) {
      return jsonError(res, 400, "INVALID_JSON", "The request body must contain valid JSON.");
    }
    if (err instanceof Error && err.message.includes("CORS")) {
      return jsonError(res, 403, "CORS_ORIGIN_DENIED", "This origin is not allowed.");
    }
    if (err instanceof Error && "code" in err &&
      String((err as { code: unknown }).code).startsWith("SQLITE_CONSTRAINT")) {
      return jsonError(res, 409, "DATABASE_CONSTRAINT", "The requested change conflicts with existing data.");
    }
    console.error("Unhandled request error", err instanceof Error ? { name: err.name } : { type: typeof err });
    return jsonError(res, 500, "INTERNAL_ERROR", "An unexpected error occurred.");
  });
  return app;
}

export const app = createApp();

let server: ReturnType<typeof app.listen> | undefined;
let shuttingDown = false;
async function start() {
  server = app.listen(PORT, () => console.log("EV Charging API listening on port", PORT));
}
async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log("Received", signal, "- shutting down");
  try {
    if (server) await new Promise<void>((resolveClose, reject) =>
      server!.close((err) => err ? reject(err) : resolveClose()));
    closeDatabase();
    process.exit(0);
  } catch (err) {
    console.error("API shutdown failed", err instanceof Error ? err.name : "unknown");
    process.exit(1);
  }
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  start().catch((err) => {
    console.error("API startup failed", err instanceof Error ? err.name : "unknown");
    closeDatabase();
    process.exit(1);
  });
}
