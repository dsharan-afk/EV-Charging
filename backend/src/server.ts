import "dotenv/config";
import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoose, { Schema, Types } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z, ZodError } from "zod";
import { randomBytes, randomUUID } from "node:crypto";

const app = express();
const PORT = Number(process.env.PORT ?? 10000);
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "1h";
const allowedOrigins = (process.env.FRONTEND_ORIGINS ?? "http://localhost:3000,http://localhost:5173")
  .split(",").map((origin) => origin.trim()).filter(Boolean);

if (!MONGO_URI) throw new Error("MONGO_URI is required");
if (!JWT_SECRET || Buffer.byteLength(JWT_SECRET) < 32) throw new Error("JWT_SECRET must contain at least 32 bytes");

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

const userSchema = new Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
  phone: { type: String, default: "", maxlength: 30 },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ["CUSTOMER", "ADMIN"], default: "CUSTOMER", immutable: true },
  walletBalanceMinor: { type: Number, default: 0, min: 0 }
}, { timestamps: true, versionKey: false });
const User = mongoose.model("User", userSchema);

const portSchema = new Schema({
  id: { type: String, required: true },
  portNumber: { type: Number, required: true, min: 1 },
  connectorType: { type: String, enum: ["CCS2", "Type 2", "CHAdeMO", "NACS"], required: true },
  maxPowerKw: { type: Number, required: true, min: 1, max: 1000 },
  status: { type: String, enum: ["AVAILABLE", "OCCUPIED", "RESERVED", "MAINTENANCE"], default: "AVAILABLE" }
}, { _id: false });
const stationSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 160 },
  operator: { type: String, required: true, maxlength: 120 },
  address: { type: String, required: true, maxlength: 250 },
  city: { type: String, required: true, index: true, maxlength: 100 },
  state: { type: String, required: true, index: true, maxlength: 100 },
  postalCode: { type: String, default: "", maxlength: 20 },
  latitude: { type: Number, required: true, min: -90, max: 90 },
  longitude: { type: Number, required: true, min: -180, max: 180 },
  pricingPerKwhMinor: { type: Number, required: true, min: 0 },
  parkingFeePerHourMinor: { type: Number, default: 0, min: 0 },
  amenities: [{ type: String, maxlength: 100 }],
  status: { type: String, enum: ["OPERATIONAL", "BUSY", "MAINTENANCE"], default: "OPERATIONAL" },
  ports: { type: [portSchema], default: [] },
  dataMode: { type: String, enum: ["SEEDED_DEMO", "OPERATOR_REPORTED", "LIVE_TELEMETRY"], default: "SEEDED_DEMO" }
}, { timestamps: true, versionKey: false });
stationSchema.index({ city: 1, state: 1, status: 1 });
stationSchema.index({ "ports.connectorType": 1, "ports.status": 1 });
const Station = mongoose.model("Station", stationSchema);

const vehicleSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  make: { type: String, required: true, trim: true, maxlength: 80 },
  model: { type: String, required: true, trim: true, maxlength: 100 },
  year: { type: Number, required: true, min: 1990, max: 2100 },
  licensePlate: { type: String, default: "", maxlength: 30 },
  vin: { type: String, default: "", select: false, maxlength: 40 },
  batteryCapacityKwh: { type: Number, required: true, min: 1, max: 500 },
  maxChargingRateKw: { type: Number, required: true, min: 1, max: 1000 },
  connectorType: { type: String, enum: ["CCS2", "Type 2", "CHAdeMO", "NACS"], required: true },
  currentSocPercent: { type: Number, default: 50, min: 0, max: 100 },
  estimatedRangeKm: { type: Number, default: 0, min: 0, max: 3000 },
  isPrimary: { type: Boolean, default: false }
}, { timestamps: true, versionKey: false });
vehicleSchema.index({ userId: 1, isPrimary: 1 });
const Vehicle = mongoose.model("Vehicle", vehicleSchema);

const bookingSchema = new Schema({
  reference: { type: String, required: true, unique: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  vehicleId: { type: Schema.Types.ObjectId, ref: "Vehicle", required: true },
  stationId: { type: Schema.Types.ObjectId, ref: "Station", required: true },
  portId: { type: String, required: true },
  startsAt: { type: Date, required: true },
  endsAt: { type: Date, required: true },
  estimatedEnergyKwh: { type: Number, required: true, min: 0 },
  estimatedCostMinor: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ["CONFIRMED", "CANCELLED", "COMPLETED"], default: "CONFIRMED" },
  qrTokenHash: { type: String, required: true, select: false }
}, { timestamps: true, versionKey: false });
bookingSchema.index({ stationId: 1, portId: 1, startsAt: 1, endsAt: 1, status: 1 });
const Booking = mongoose.model("Booking", bookingSchema);

const ledgerSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  amountMinor: { type: Number, required: true },
  kind: { type: String, enum: ["CREDIT", "DEBIT", "REFUND", "ADJUSTMENT"], required: true },
  status: { type: String, enum: ["PENDING", "COMPLETED", "FAILED"], default: "COMPLETED" },
  idempotencyKey: { type: String, required: true },
  description: { type: String, required: true, maxlength: 200 }
}, { timestamps: true, versionKey: false });
ledgerSchema.index({ userId: 1, idempotencyKey: 1 }, { unique: true });
const Ledger = mongoose.model("LedgerEntry", ledgerSchema);

const sessionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  vehicleId: { type: Schema.Types.ObjectId, ref: "Vehicle", required: true },
  stationId: { type: Schema.Types.ObjectId, ref: "Station", required: true },
  portId: { type: String, required: true },
  bookingId: { type: Schema.Types.ObjectId, ref: "Booking" },
  status: { type: String, enum: ["CHARGING", "PAUSED", "COMPLETED"], default: "CHARGING" },
  mode: { type: String, enum: ["SIMULATED", "LIVE"], default: "SIMULATED" },
  startedAt: { type: Date, default: Date.now, required: true },
  endedAt: Date,
  energyDeliveredKwh: { type: Number, default: 0, min: 0 },
  accruedCostMinor: { type: Number, default: 0, min: 0 }
}, { timestamps: true, versionKey: false });
sessionSchema.index({ userId: 1, status: 1 });
const ChargingSession = mongoose.model("ChargingSession", sessionSchema);

type AuthRequest = Request & { auth?: { userId: string; role: "CUSTOMER" | "ADMIN" } };
const asyncRoute = (fn: (req: AuthRequest, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => Promise.resolve(fn(req as AuthRequest, res, next)).catch(next);
const error = (res: Response, status: number, code: string, message: string) =>
  res.status(status).json({ error: { code, message } });
const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const header = req.header("authorization");
  if (!header?.startsWith("Bearer ")) return error(res, 401, "UNAUTHENTICATED", "Sign in to continue.");
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET!) as jwt.JwtPayload;
    if (typeof payload.sub !== "string" || !["CUSTOMER", "ADMIN"].includes(String(payload.role))) {
      return error(res, 401, "INVALID_TOKEN", "Your session is invalid. Sign in again.");
    }
    req.auth = { userId: payload.sub, role: payload.role as "CUSTOMER" | "ADMIN" };
    return next();
  } catch {
    return error(res, 401, "INVALID_TOKEN", "Your session is invalid or expired. Sign in again.");
  }
};
const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) =>
  req.auth?.role === "ADMIN" ? next() : error(res, 403, "FORBIDDEN", "Administrator access is required.");
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: "draft-7", legacyHeaders: false });
const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(254),
  password: z.string().min(10).max(128),
  phone: z.string().trim().max(30).optional().default("")
});
const loginSchema = z.object({ email: z.string().trim().email().max(254), password: z.string().min(1).max(128) });
const vehicleSchema = z.object({
  make: z.string().trim().min(1).max(80), model: z.string().trim().min(1).max(100),
  year: z.number().int().min(1990).max(new Date().getFullYear() + 2),
  licensePlate: z.string().trim().max(30).optional().default(""),
  batteryCapacityKwh: z.number().min(1).max(500), maxChargingRateKw: z.number().min(1).max(1000),
  connectorType: z.enum(["CCS2", "Type 2", "CHAdeMO", "NACS"]),
  currentSocPercent: z.number().min(0).max(100).optional().default(50),
  estimatedRangeKm: z.number().min(0).max(3000).optional().default(0)
});
const objectId = z.string().refine((value) => Types.ObjectId.isValid(value), "Invalid resource ID");

app.get("/health", (_req, res) => res.json({ status: "ok", service: "ev-charging-api", time: new Date().toISOString() }));
app.get("/ready", (_req, res) => {
  const ready = mongoose.connection.readyState === 1;
  return res.status(ready ? 200 : 503).json({ status: ready ? "ready" : "not_ready", database: ready ? "connected" : "disconnected" });
});
app.get("/api/v1/health", (_req, res) => res.json({ api: "v1", status: "ok" }));

app.post("/api/v1/auth/register", authLimiter, asyncRoute(async (req, res) => {
  const input = registerSchema.parse(req.body);
  try {
    const user = await User.create({
      name: input.name, email: input.email.toLowerCase(), phone: input.phone,
      passwordHash: await bcrypt.hash(input.password, 12), role: "CUSTOMER"
    });
    const token = jwt.sign({ role: user.role }, JWT_SECRET!, {
      subject: String(user._id), expiresIn: JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"]
    });
    return res.status(201).json({ token, user: {
      id: String(user._id), name: user.name, email: user.email, phone: user.phone,
      role: user.role, walletBalance: 0
    } });
  } catch (e) {
    if ((e as { code?: number }).code === 11000) return error(res, 409, "EMAIL_EXISTS", "An account with this email already exists.");
    throw e;
  }
}));
app.post("/api/v1/auth/login", authLimiter, asyncRoute(async (req, res) => {
  const input = loginSchema.parse(req.body);
  const user = await User.findOne({ email: input.email.toLowerCase() }).select("+passwordHash");
  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
    return error(res, 401, "INVALID_CREDENTIALS", "Email or password is incorrect.");
  }
  const token = jwt.sign({ role: user.role }, JWT_SECRET!, {
    subject: String(user._id), expiresIn: JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"]
  });
  return res.json({ token, user: {
    id: String(user._id), name: user.name, email: user.email, phone: user.phone,
    role: user.role, walletBalance: user.walletBalanceMinor / 100
  } });
}));
app.get("/api/v1/me", requireAuth, asyncRoute(async (req, res) => {
  const user = await User.findById(req.auth!.userId);
  if (!user) return error(res, 404, "USER_NOT_FOUND", "Account not found.");
  return res.json({
    id: String(user._id), name: user.name, email: user.email, phone: user.phone,
    role: user.role, walletBalance: user.walletBalanceMinor / 100, createdAt: user.createdAt
  });
}));
app.patch("/api/v1/me", requireAuth, asyncRoute(async (req, res) => {
  const input = z.object({
    name: z.string().trim().min(2).max(80).optional(),
    phone: z.string().trim().max(30).optional()
  }).strict().parse(req.body);
  const user = await User.findByIdAndUpdate(req.auth!.userId, { $set: input }, { new: true, runValidators: true });
  if (!user) return error(res, 404, "USER_NOT_FOUND", "Account not found.");
  return res.json({ id: String(user._id), name: user.name, email: user.email, phone: user.phone, role: user.role, walletBalance: user.walletBalanceMinor / 100 });
}));

app.get("/api/v1/stations", asyncRoute(async (req, res) => {
  const page = Math.max(1, Number(req.query.page ?? 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20)));
  const filter: Record<string, unknown> = {};
  for (const key of ["city", "state", "status"] as const) {
    if (typeof req.query[key] === "string" && req.query[key]) filter[key] = req.query[key];
  }
  if (typeof req.query.connector === "string") filter["ports.connectorType"] = req.query.connector;
  const [items, total] = await Promise.all([
    Station.find(filter).sort({ city: 1, name: 1 }).skip((page - 1) * limit).limit(limit).lean(),
    Station.countDocuments(filter)
  ]);
  return res.json({ items: items.map((s) => ({
    ...s, id: String(s._id), pricingPerKwh: s.pricingPerKwhMinor / 100,
    parkingFeePerHour: s.parkingFeePerHourMinor / 100,
    ports: s.ports.map((p) => ({ ...p, stationId: String(s._id) }))
  })), page, limit, total });
}));
app.get("/api/v1/stations/:id", asyncRoute(async (req, res) => {
  const id = objectId.parse(req.params.id);
  const station = await Station.findById(id).lean();
  if (!station) return error(res, 404, "STATION_NOT_FOUND", "Charging station not found.");
  return res.json({
    ...station, id: String(station._id), pricingPerKwh: station.pricingPerKwhMinor / 100,
    parkingFeePerHour: station.parkingFeePerHourMinor / 100,
    ports: station.ports.map((p) => ({ ...p, stationId: String(station._id) }))
  });
}));
app.post("/api/v1/admin/stations", requireAuth, requireAdmin, asyncRoute(async (req, res) => {
  const input = z.object({
    name: z.string().trim().min(2).max(160), operator: z.string().trim().min(1).max(120),
    address: z.string().trim().min(3).max(250), city: z.string().trim().min(1).max(100),
    state: z.string().trim().min(1).max(100), postalCode: z.string().max(20).optional(),
    latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180),
    pricingPerKwh: z.number().min(0).max(100000), parkingFeePerHour: z.number().min(0).max(100000).optional(),
    amenities: z.array(z.string().trim().max(100)).max(30).optional(),
    ports: z.array(z.object({
      id: z.string().min(1).max(80), portNumber: z.number().int().min(1),
      connectorType: z.enum(["CCS2", "Type 2", "CHAdeMO", "NACS"]),
      maxPowerKw: z.number().min(1).max(1000),
      status: z.enum(["AVAILABLE", "OCCUPIED", "RESERVED", "MAINTENANCE"]).optional()
    })).max(100)
  }).strict().parse(req.body);
  const station = await Station.create({
    ...input, pricingPerKwhMinor: Math.round(input.pricingPerKwh * 100),
    parkingFeePerHourMinor: Math.round((input.parkingFeePerHour ?? 0) * 100), dataMode: "SEEDED_DEMO"
  });
  return res.status(201).json({ id: String(station._id), name: station.name });
}));

app.get("/api/v1/vehicles", requireAuth, asyncRoute(async (req, res) => {
  const items = await Vehicle.find({ userId: req.auth!.userId }).sort({ isPrimary: -1, createdAt: -1 }).lean();
  return res.json({ items: items.map((v) => ({ ...v, id: String(v._id), userId: String(v.userId) })) });
}));
app.post("/api/v1/vehicles", requireAuth, asyncRoute(async (req, res) => {
  const input = vehicleSchema.strict().parse(req.body);
  const isPrimary = !(await Vehicle.exists({ userId: req.auth!.userId }));
  const vehicle = await Vehicle.create({ ...input, userId: req.auth!.userId, isPrimary });
  return res.status(201).json({ ...vehicle.toObject(), id: String(vehicle._id), userId: req.auth!.userId });
}));
app.patch("/api/v1/vehicles/:id", requireAuth, asyncRoute(async (req, res) => {
  const id = objectId.parse(req.params.id);
  const input = vehicleSchema.partial().strict().parse(req.body);
  const vehicle = await Vehicle.findOneAndUpdate(
    { _id: id, userId: req.auth!.userId }, { $set: input }, { new: true, runValidators: true }
  );
  if (!vehicle) return error(res, 404, "VEHICLE_NOT_FOUND", "Vehicle not found.");
  return res.json({ ...vehicle.toObject(), id: String(vehicle._id), userId: req.auth!.userId });
}));
app.delete("/api/v1/vehicles/:id", requireAuth, asyncRoute(async (req, res) => {
  const id = objectId.parse(req.params.id);
  const vehicle = await Vehicle.findOneAndDelete({ _id: id, userId: req.auth!.userId });
  if (!vehicle) return error(res, 404, "VEHICLE_NOT_FOUND", "Vehicle not found.");
  return res.status(204).end();
}));
app.post("/api/v1/vehicles/:id/primary", requireAuth, asyncRoute(async (req, res) => {
  const id = objectId.parse(req.params.id);
  const vehicle = await Vehicle.findOne({ _id: id, userId: req.auth!.userId });
  if (!vehicle) return error(res, 404, "VEHICLE_NOT_FOUND", "Vehicle not found.");
  await Vehicle.updateMany({ userId: req.auth!.userId }, { $set: { isPrimary: false } });
  vehicle.isPrimary = true;
  await vehicle.save();
  return res.json({ id: String(vehicle._id), isPrimary: true });
}));

app.post("/api/v1/bookings", requireAuth, asyncRoute(async (req, res) => {
  const input = z.object({
    vehicleId: objectId, stationId: objectId, portId: z.string().min(1).max(80),
    startsAt: z.string().datetime({ offset: true }), durationMinutes: z.number().int().min(15).max(480),
    targetSocPercent: z.number().min(1).max(100)
  }).strict().parse(req.body);
  const [vehicle, station] = await Promise.all([
    Vehicle.findOne({ _id: input.vehicleId, userId: req.auth!.userId }),
    Station.findById(input.stationId)
  ]);
  if (!vehicle) return error(res, 404, "VEHICLE_NOT_FOUND", "Vehicle not found.");
  if (!station) return error(res, 404, "STATION_NOT_FOUND", "Charging station not found.");
  const port = station.ports.find((p) => p.id === input.portId);
  if (!port || port.status !== "AVAILABLE" || station.status === "MAINTENANCE") return error(res, 409, "PORT_UNAVAILABLE", "This charging port is not available.");
  if (port.connectorType !== vehicle.connectorType) return error(res, 422, "CONNECTOR_MISMATCH", "This port is not compatible with the selected vehicle.");
  const startsAt = new Date(input.startsAt);
  if (startsAt.getTime() < Date.now() + 5 * 60 * 1000) return error(res, 422, "INVALID_START_TIME", "Choose a future time at least five minutes from now.");
  const endsAt = new Date(startsAt.getTime() + input.durationMinutes * 60000);
  const conflict = await Booking.exists({
    stationId: station._id, portId: input.portId, status: "CONFIRMED",
    startsAt: { $lt: endsAt }, endsAt: { $gt: startsAt }
  });
  if (conflict) return error(res, 409, "BOOKING_CONFLICT", "That port is already reserved during this time.");
  const usableKwh = Math.max(0, (input.targetSocPercent - vehicle.currentSocPercent) / 100 * vehicle.batteryCapacityKwh);
  const energyKwh = Math.min(usableKwh, port.maxPowerKw * input.durationMinutes / 60);
  const estimatedCostMinor = Math.round(energyKwh * station.pricingPerKwhMinor);
  const qrToken = randomBytes(32).toString("hex");
  const booking = await Booking.create({
    reference: "EVC-" + randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase(),
    userId: req.auth!.userId, vehicleId: vehicle._id, stationId: station._id, portId: input.portId,
    startsAt, endsAt, estimatedEnergyKwh: Number(energyKwh.toFixed(2)), estimatedCostMinor,
    qrTokenHash: await bcrypt.hash(qrToken, 10)
  });
  return res.status(201).json({
    id: String(booking._id), bookingReference: booking.reference,
    vehicleId: String(vehicle._id), stationId: String(station._id), portId: booking.portId,
    startsAt, endsAt, durationMinutes: input.durationMinutes,
    estimatedEnergyKwh: booking.estimatedEnergyKwh, estimatedCost: estimatedCostMinor / 100,
    status: booking.status, qrAccessToken: qrToken
  });
}));
app.get("/api/v1/bookings", requireAuth, asyncRoute(async (req, res) => {
  const items = await Booking.find({ userId: req.auth!.userId }).sort({ startsAt: -1 }).lean();
  return res.json({ items: items.map((b) => ({
    id: String(b._id), bookingReference: b.reference, vehicleId: String(b.vehicleId),
    stationId: String(b.stationId), portId: b.portId, startsAt: b.startsAt, endsAt: b.endsAt,
    estimatedEnergyKwh: b.estimatedEnergyKwh, estimatedCost: b.estimatedCostMinor / 100, status: b.status
  })) });
}));
app.post("/api/v1/bookings/:id/cancel", requireAuth, asyncRoute(async (req, res) => {
  const id = objectId.parse(req.params.id);
  const booking = await Booking.findOne({ _id: id, userId: req.auth!.userId });
  if (!booking) return error(res, 404, "BOOKING_NOT_FOUND", "Booking not found.");
  if (booking.status !== "CONFIRMED" || booking.startsAt.getTime() <= Date.now()) return error(res, 409, "BOOKING_NOT_CANCELLABLE", "This booking can no longer be cancelled.");
  booking.status = "CANCELLED";
  await booking.save();
  return res.json({ id: String(booking._id), status: booking.status });
}));

app.post("/api/v1/sessions", requireAuth, asyncRoute(async (req, res) => {
  const input = z.object({
    vehicleId: objectId, stationId: objectId, portId: z.string().min(1).max(80), bookingId: objectId.optional()
  }).strict().parse(req.body);
  const [vehicle, station] = await Promise.all([
    Vehicle.findOne({ _id: input.vehicleId, userId: req.auth!.userId }), Station.findById(input.stationId)
  ]);
  if (!vehicle || !station) return error(res, 404, "RESOURCE_NOT_FOUND", "Vehicle or station not found.");
  if (await ChargingSession.exists({ userId: req.auth!.userId, status: { $in: ["CHARGING", "PAUSED"] } })) return error(res, 409, "ACTIVE_SESSION_EXISTS", "You already have an active charging session.");
  const port = station.ports.find((p) => p.id === input.portId);
  if (!port || port.connectorType !== vehicle.connectorType) return error(res, 422, "INVALID_PORT", "Select a compatible charging port.");
  let bookingId: Types.ObjectId | undefined;
  if (input.bookingId) {
    const booking = await Booking.findOne({
      _id: input.bookingId, userId: req.auth!.userId, stationId: station._id,
      vehicleId: vehicle._id, portId: input.portId, status: "CONFIRMED"
    });
    if (!booking) return error(res, 422, "INVALID_BOOKING", "A matching confirmed booking is required.");
    bookingId = booking._id;
  }
  const session = await ChargingSession.create({
    userId: req.auth!.userId, vehicleId: vehicle._id, stationId: station._id, portId: input.portId, bookingId, mode: "SIMULATED"
  });
  return res.status(201).json({ id: String(session._id), status: session.status, mode: session.mode, startedAt: session.startedAt, energyDeliveredKwh: 0, accruedCost: 0 });
}));
app.get("/api/v1/sessions", requireAuth, asyncRoute(async (req, res) => {
  const items = await ChargingSession.find({ userId: req.auth!.userId }).sort({ createdAt: -1 }).limit(100).lean();
  return res.json({ items: items.map((s) => ({
    id: String(s._id), vehicleId: String(s.vehicleId), stationId: String(s.stationId), portId: s.portId,
    status: s.status, mode: s.mode, startedAt: s.startedAt, endedAt: s.endedAt,
    energyDeliveredKwh: s.energyDeliveredKwh, accruedCost: s.accruedCostMinor / 100
  })) });
}));
app.post("/api/v1/sessions/:id/:action", requireAuth, asyncRoute(async (req, res) => {
  const id = objectId.parse(req.params.id);
  const action = z.enum(["pause", "resume", "stop"]).parse(req.params.action);
  const session = await ChargingSession.findOne({ _id: id, userId: req.auth!.userId });
  if (!session) return error(res, 404, "SESSION_NOT_FOUND", "Charging session not found.");
  if (action === "pause" && session.status === "CHARGING") session.status = "PAUSED";
  else if (action === "resume" && session.status === "PAUSED") session.status = "CHARGING";
  else if (action === "stop" && ["CHARGING", "PAUSED"].includes(session.status)) {
    session.status = "COMPLETED"; session.endedAt = new Date();
  } else return error(res, 409, "INVALID_SESSION_TRANSITION", "This action is not valid for the current session state.");
  await session.save();
  return res.json({ id: String(session._id), status: session.status, mode: session.mode, startedAt: session.startedAt, endedAt: session.endedAt, energyDeliveredKwh: session.energyDeliveredKwh, accruedCost: session.accruedCostMinor / 100 });
}));

app.get("/api/v1/wallet", requireAuth, asyncRoute(async (req, res) => {
  const user = await User.findById(req.auth!.userId).select("walletBalanceMinor");
  if (!user) return error(res, 404, "USER_NOT_FOUND", "Account not found.");
  const entries = await Ledger.find({ userId: req.auth!.userId }).sort({ createdAt: -1 }).limit(100).lean();
  return res.json({ balance: user.walletBalanceMinor / 100, currency: "INR", ledger: entries.map((entry) => ({
    id: String(entry._id), amount: entry.amountMinor / 100, kind: entry.kind,
    status: entry.status, description: entry.description, createdAt: entry.createdAt
  })) });
}));
app.post("/api/v1/wallet/demo-credit", requireAuth, asyncRoute(async (req, res) => {
  if (process.env.NODE_ENV === "production") return error(res, 403, "DISABLED_IN_PRODUCTION", "Demo wallet credits are disabled in production.");
  const input = z.object({ amount: z.number().positive().max(10000) }).strict().parse(req.body);
  const key = req.header("Idempotency-Key");
  if (!key || key.length > 100) return error(res, 400, "IDEMPOTENCY_KEY_REQUIRED", "Provide a valid Idempotency-Key header.");
  const amountMinor = Math.round(input.amount * 100);
  const existing = await Ledger.findOne({ userId: req.auth!.userId, idempotencyKey: key });
  if (existing) return res.json({ replayed: true, status: existing.status });
  const dbSession = await mongoose.startSession();
  try {
    await dbSession.withTransaction(async () => {
      await User.updateOne({ _id: req.auth!.userId }, { $inc: { walletBalanceMinor: amountMinor } }, { session: dbSession });
      await Ledger.create([{
        userId: req.auth!.userId, amountMinor, kind: "CREDIT", idempotencyKey: key, description: "Development demo credit"
      }], { session: dbSession });
    });
  } finally {
    await dbSession.endSession();
  }
  const user = await User.findById(req.auth!.userId).select("walletBalanceMinor");
  return res.status(201).json({ balance: (user?.walletBalanceMinor ?? 0) / 100, currency: "INR", mode: "DEMO_ONLY" });
}));

app.use((_req, res) => error(res, 404, "NOT_FOUND", "The requested endpoint does not exist."));
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ZodError) return res.status(422).json({
    error: { code: "VALIDATION_ERROR", message: "Check the submitted fields.", details: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })) }
  });
  if (err instanceof mongoose.Error.ValidationError || err instanceof mongoose.Error.CastError) return error(res, 422, "DATABASE_VALIDATION_ERROR", "One or more fields are invalid.");
  if (err instanceof Error && err.message.includes("CORS")) return error(res, 403, "CORS_ORIGIN_DENIED", "This origin is not allowed.");
  console.error("Unhandled request error", err instanceof Error ? { name: err.name } : { type: typeof err });
  return error(res, 500, "INTERNAL_ERROR", "An unexpected error occurred.");
});

let server: ReturnType<typeof app.listen> | undefined;
async function start() {
  await mongoose.connect(MONGO_URI!, { serverSelectionTimeoutMS: 10000 });
  server = app.listen(PORT, () => console.log("EV Charging API listening on port", PORT));
}
async function shutdown(signal: string) {
  console.log("Received", signal, "- shutting down");
  if (server) await new Promise<void>((resolve) => server!.close(() => resolve()));
  await mongoose.disconnect();
  process.exit(0);
}
process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
start().catch((err) => {
  console.error("API startup failed", err instanceof Error ? err.name : "unknown");
  process.exit(1);
});
