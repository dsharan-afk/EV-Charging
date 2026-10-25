import assert from "node:assert/strict";
import { once } from "node:events";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

test("health, auth, authorization, stations, and transactional database operations", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "ev-charging-test-"));
  process.env.DATABASE_PATH = join(directory, "test.sqlite");
  process.env.JWT_SECRET = "integration-test-secret-with-more-than-32-bytes";
  process.env.NODE_ENV = "development";

  const [{ app }, { db, closeDatabase }] = await Promise.all([
    import("../src/server.ts"),
    import("../src/db.ts")
  ]);
  const server = app.listen(0);
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const baseUrl = `http://127.0.0.1:${address.port}`;

  const request = async (path: string, init: RequestInit = {}) => {
    const response = await fetch(`${baseUrl}${path}`, { ...init, signal: AbortSignal.timeout(15000) });
    const payload = response.status === 204 ? undefined : await response.json();
    return { response, payload };
  };
  const json = (body: unknown, token?: string, headers?: HeadersInit): RequestInit => ({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers
    },
    body: JSON.stringify(body)
  });

  try {
    await t.test("health endpoints and readiness", async () => {
      const health = await request("/health");
      assert.equal(health.response.status, 200);
      assert.equal(health.payload.status, "ok");
      const ready = await request("/ready");
      assert.equal(ready.response.status, 200);
      assert.equal(ready.payload.database, "connected");
      const version = await request("/api/v1/health");
      assert.deepEqual(version.payload, { api: "v1", status: "ok" });
    });

    let customerToken = "";
    let userId = "";
    await t.test("registration, duplicate prevention, login, and input validation", async () => {
      const registration = await request("/api/v1/auth/register", json({
        name: "Test Driver", email: "driver@example.com", password: "correct-horse-battery"
      }));
      assert.equal(registration.response.status, 201);
      assert.equal(registration.payload.user.email, "driver@example.com");
      assert.equal(registration.payload.user.walletBalance, 0);
      assert.equal(typeof registration.payload.token, "string");
      customerToken = registration.payload.token as string;
      userId = registration.payload.user.id as string;
      assert.match(userId, /^[a-f\d]{24}$/);

      const duplicate = await request("/api/v1/auth/register", json({
        name: "Another Driver", email: "DRIVER@example.com", password: "another-correct-password"
      }));
      assert.equal(duplicate.response.status, 409);
      assert.equal(duplicate.payload.error.code, "EMAIL_EXISTS");

      const login = await request("/api/v1/auth/login", json({
        email: "DRIVER@example.com", password: "correct-horse-battery"
      }));
      assert.equal(login.response.status, 200);
      assert.equal(login.payload.user.id, userId);
      const invalidLogin = await request("/api/v1/auth/login", json({
        email: "driver@example.com", password: "wrong-password"
      }));
      assert.equal(invalidLogin.response.status, 401);
      const invalidInput = await request("/api/v1/auth/register", json({
        name: "x", email: "not-an-email", password: "short"
      }));
      assert.equal(invalidInput.response.status, 422);
    });

    await t.test("protects private routes and administrator station management", async () => {
      const unauthorized = await request("/api/v1/vehicles");
      assert.equal(unauthorized.response.status, 401);
      const forbidden = await request("/api/v1/admin/stations", json({
        name: "Private Station"
      }, customerToken));
      assert.equal(forbidden.response.status, 403);

      db.prepare("UPDATE users SET role = 'ADMIN' WHERE id = ?").run(userId);
      const adminLogin = await request("/api/v1/auth/login", json({
        email: "driver@example.com", password: "correct-horse-battery"
      }));
      const adminToken = adminLogin.payload.token as string;
      const station = await request("/api/v1/admin/stations", json({
        name: "Test Charging Hub",
        operator: "Test Operator",
        address: "1 Test Street",
        city: "Chennai",
        state: "Tamil Nadu",
        postalCode: "600001",
        latitude: 13.0827,
        longitude: 80.2707,
        pricingPerKwh: 10.25,
        parkingFeePerHour: 5.5,
        amenities: ["Restroom"],
        ports: [{
          id: "port-1", portNumber: 1, connectorType: "CCS2", maxPowerKw: 50
        }]
      }, adminToken));
      assert.equal(station.response.status, 201);
      const stationId = station.payload.id as string;
      assert.match(stationId, /^[a-f\d]{24}$/);

      const list = await request("/api/v1/stations?city=Chennai&connector=CCS2");
      assert.equal(list.response.status, 200);
      assert.equal(list.payload.total, 1);
      assert.equal(list.payload.items[0].pricingPerKwh, 10.25);
      assert.equal(list.payload.items[0].pricingPerKwhMinor, 1025);
      assert.equal(list.payload.items[0].ports[0].stationId, stationId);
      const detail = await request(`/api/v1/stations/${stationId}`);
      assert.equal(detail.payload.name, "Test Charging Hub");

      {
        const vehicleResult = await request("/api/v1/vehicles", json({
          make: "Example", model: "EV", year: 2025, licensePlate: "TEST-1",
          batteryCapacityKwh: 70, maxChargingRateKw: 100, connectorType: "CCS2",
          currentSocPercent: 50
        }, adminToken));
        assert.equal(vehicleResult.response.status, 201);
        const vehicleId = vehicleResult.payload.id as string;
        assert.equal(vehicleResult.payload.isPrimary, true);

        const startsAt = new Date(Date.now() + 20 * 60 * 1000).toISOString();
        const bookingBody = {
          vehicleId, stationId, portId: "port-1", startsAt,
          durationMinutes: 30, targetSocPercent: 100
        };
        const booking = await request("/api/v1/bookings", json(bookingBody, adminToken));
        assert.equal(booking.response.status, 201);
        assert.equal(booking.payload.estimatedCost, 256.25);
        assert.equal(typeof booking.payload.qrAccessToken, "string");
        const overlap = await request("/api/v1/bookings", json(bookingBody, adminToken));
        assert.equal(overlap.response.status, 409);
        assert.equal(overlap.payload.error.code, "BOOKING_CONFLICT");

        const sessionBody = { vehicleId, stationId, portId: "port-1" };
        const session = await request("/api/v1/sessions", json(sessionBody, adminToken));
        assert.equal(session.response.status, 201);
        assert.equal(session.payload.mode, "SIMULATED");
        const duplicateSession = await request("/api/v1/sessions", json(sessionBody, adminToken));
        assert.equal(duplicateSession.response.status, 409);
        const stopped = await request(`/api/v1/sessions/${session.payload.id}/stop`, {
          method: "POST", headers: { Authorization: `Bearer ${adminToken}` }
        });
        assert.equal(stopped.payload.status, "COMPLETED");
        const laterSession = await request("/api/v1/sessions", json(sessionBody, adminToken));
        assert.equal(laterSession.response.status, 201);

        const credit = await request("/api/v1/wallet/demo-credit", json(
          { amount: 12.34 }, adminToken, { "Idempotency-Key": "test-credit-1" }
        ));
        assert.equal(credit.response.status, 201);
        assert.equal(credit.payload.balance, 12.34);
        const replay = await request("/api/v1/wallet/demo-credit", json(
          { amount: 900 }, adminToken, { "Idempotency-Key": "test-credit-1" }
        ));
        assert.equal(replay.payload.replayed, true);
        const wallet = await request("/api/v1/wallet", {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        assert.equal(wallet.payload.balance, 12.34);
        assert.equal(wallet.payload.ledger.length, 1);
        const ledgerAmount = db.prepare("SELECT amount_minor FROM wallet_ledger_entries").get() as
          { amount_minor: number } | undefined;
        assert.equal(ledgerAmount?.amount_minor, 1234);

        process.env.NODE_ENV = "production";
        const disabledCredit = await request("/api/v1/wallet/demo-credit", json(
          { amount: 1 }, adminToken, { "Idempotency-Key": "production-credit" }
        ));
        assert.equal(disabledCredit.response.status, 403);
        process.env.NODE_ENV = "development";
      }
    });

    await t.test("SQLite enforces foreign keys and active-session uniqueness", () => {
      assert.equal(db.pragma("foreign_keys", { simple: true }), 1);
      const index = db.prepare(`SELECT name FROM sqlite_master
        WHERE type = 'index' AND name = 'idx_sessions_one_active_per_user'`).get();
      assert.ok(index);
      const sessionCount = db.prepare("SELECT COUNT(*) AS count FROM charging_sessions").get() as
        { count: number };
      assert.equal(sessionCount.count, 2);
    });
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolveClose, reject) =>
      server.close((err) => err ? reject(err) : resolveClose()));
    closeDatabase();
    await rm(directory, { recursive: true, force: true });
  }
});
