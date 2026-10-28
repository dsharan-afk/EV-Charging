import assert from "node:assert/strict";
import { once } from "node:events";
import type { Server } from "node:http";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

test("health, auth, authorization, stations, and transactional database operations", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "ev-charging-test-"));
  process.env.DATABASE_PATH = join(directory, "test.sqlite");
  process.env.JWT_SECRET = "integration-test-secret-with-more-than-32-bytes";
  process.env.NODE_ENV = "development";

  const { db, closeDatabase, seedDemoStations } = await import("../src/db.ts");
  let server: Server | undefined;
  let baseUrl = "";

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
  const authHeaders = (token: string): HeadersInit => ({ Authorization: "Bearer " + token });

  try {
    await t.test("station initialization seeds only local development and preserves existing records", () => {
      const originalNodeEnv = process.env.NODE_ENV;
      const originalSeedSetting = process.env.SEED_DEMO_STATIONS;
      try {
        delete process.env.SEED_DEMO_STATIONS;
        const now = new Date().toISOString();
        db.prepare(`INSERT INTO users
          (id, name, email, phone, password_hash, role, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, 'CUSTOMER', ?, ?)`)
          .run("preserved-user", "Existing User", "existing@example.com", "", "hash", now, now);
        db.prepare(`INSERT INTO vehicles
          (id, user_id, make, model, year, license_plate, vin, battery_capacity_kwh,
           max_charging_rate_kw, connector_type, current_soc_percent, estimated_range_km,
           is_primary, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
          .run("preserved-vehicle", "preserved-user", "Existing", "EV", 2024, "", "",
            60, 100, "CCS2", 50, 200, 1, now, now);

        process.env.NODE_ENV = "production";
        seedDemoStations();
        assert.equal((db.prepare("SELECT COUNT(*) AS count FROM stations").get() as { count: number }).count, 0);
        assert.equal((db.prepare("SELECT COUNT(*) AS count FROM station_ports").get() as { count: number }).count, 0);

        delete process.env.NODE_ENV;
        seedDemoStations();
        assert.equal((db.prepare("SELECT COUNT(*) AS count FROM stations").get() as { count: number }).count, 0);

        process.env.NODE_ENV = "development";
        seedDemoStations();
        const stationCount = (db.prepare("SELECT COUNT(*) AS count FROM stations").get() as { count: number }).count;
        const portCount = (db.prepare("SELECT COUNT(*) AS count FROM station_ports").get() as { count: number }).count;
        assert.equal(stationCount, 3);
        assert.equal(portCount, 6);
        assert.match((db.prepare("SELECT name FROM stations ORDER BY city LIMIT 1").get() as { name: string }).name, /^Demo - /);

        seedDemoStations();
        assert.equal((db.prepare("SELECT COUNT(*) AS count FROM stations").get() as { count: number }).count, stationCount);
        assert.equal((db.prepare("SELECT COUNT(*) AS count FROM station_ports").get() as { count: number }).count, portCount);
        assert.ok(db.prepare("SELECT 1 FROM users WHERE id = ?").get("preserved-user"));
        assert.ok(db.prepare("SELECT 1 FROM vehicles WHERE id = ?").get("preserved-vehicle"));
      } finally {
        process.env.NODE_ENV = originalNodeEnv;
        if (originalSeedSetting === undefined) delete process.env.SEED_DEMO_STATIONS;
        else process.env.SEED_DEMO_STATIONS = originalSeedSetting;
      }
    });

    const { app } = await import("../src/server.ts");
    server = app.listen(0);
    await once(server, "listening");
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    baseUrl = `http://127.0.0.1:${address.port}`;

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

    await t.test("development CORS allows the active Vite origin and exposes HTTP auth errors", async () => {
      const origin = "http://localhost:3003";
      const preflight = await request("/api/v1/auth/login", {
        method: "OPTIONS",
        headers: {
          Origin: origin,
          "Access-Control-Request-Method": "POST",
          "Access-Control-Request-Headers": "content-type"
        }
      });
      assert.equal(preflight.response.status, 204);
      assert.equal(preflight.response.headers.get("access-control-allow-origin"), origin);

      const unauthorized = await request("/api/v1/vehicles", {
        headers: { Origin: origin }
      });
      assert.equal(unauthorized.response.status, 401);
      assert.equal(unauthorized.response.headers.get("access-control-allow-origin"), origin);
      assert.equal(unauthorized.payload.error.code, "UNAUTHENTICATED");

      const denied = await request("/api/v1/auth/login", {
        method: "OPTIONS",
        headers: {
          Origin: "http://localhost:3999",
          "Access-Control-Request-Method": "POST",
          "Access-Control-Request-Headers": "content-type"
        }
      });
      assert.equal(denied.response.status, 403);
      assert.equal(denied.response.headers.get("access-control-allow-origin"), null);
    });

    let customerToken = "";
    let secondCustomerToken = "";
    let customerVehicleId = "";
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
      const emptyVehicles = await request("/api/v1/vehicles", {
        headers: authHeaders(customerToken)
      });
      assert.equal(emptyVehicles.response.status, 200);
      assert.deepEqual(emptyVehicles.payload.items, []);

      const secondRegistration = await request("/api/v1/auth/register", json({
        name: "Second Driver", email: "second-driver@example.com", password: "another-correct-password"
      }));
      assert.equal(secondRegistration.response.status, 201);
      secondCustomerToken = secondRegistration.payload.token as string;

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

    await t.test("vehicles start empty, persist across login, and stay account-scoped", async () => {
      const emptyAfterLogin = await request("/api/v1/vehicles", {
        headers: authHeaders(customerToken)
      });
      assert.deepEqual(emptyAfterLogin.payload.items, []);

      const added = await request("/api/v1/vehicles", json({
        make: "Personal", model: "Driver EV", year: 2025, licensePlate: "USER-1",
        batteryCapacityKwh: 60, maxChargingRateKw: 100, connectorType: "CCS2",
        currentSocPercent: 50
      }, customerToken));
      assert.equal(added.response.status, 201);
      customerVehicleId = added.payload.id as string;
      assert.equal(added.payload.isPrimary, true);

      const relogin = await request("/api/v1/auth/login", json({
        email: "driver@example.com", password: "correct-horse-battery"
      }));
      assert.equal(relogin.response.status, 200);
      const persistedVehicles = await request("/api/v1/vehicles", {
        headers: authHeaders(relogin.payload.token as string)
      });
      assert.deepEqual(persistedVehicles.payload.items.map((vehicle: { id: string }) => vehicle.id), [added.payload.id]);

      const vehicleUpdate = await request(`/api/v1/vehicles/${customerVehicleId}`, {
        method: "PATCH",
        headers: { ...authHeaders(customerToken), "Content-Type": "application/json" },
        body: JSON.stringify({ model: "My Updated EV" })
      });
      assert.equal(vehicleUpdate.response.status, 200);
      assert.equal(vehicleUpdate.payload.model, "My Updated EV");

      const otherAccountVehicles = await request("/api/v1/vehicles", {
        headers: authHeaders(secondCustomerToken)
      });
      assert.deepEqual(otherAccountVehicles.payload.items, []);

      const otherAccountUpdate = await request(`/api/v1/vehicles/${customerVehicleId}`, {
        method: "PATCH",
        headers: { ...authHeaders(secondCustomerToken), "Content-Type": "application/json" },
        body: JSON.stringify({ model: "Not Yours" })
      });
      assert.equal(otherAccountUpdate.response.status, 404);
      const otherAccountDelete = await request(`/api/v1/vehicles/${customerVehicleId}`, {
        method: "DELETE",
        headers: authHeaders(secondCustomerToken)
      });
      assert.equal(otherAccountDelete.response.status, 404);

      const extraVehicle = await request("/api/v1/vehicles", json({
        make: "Personal", model: "Second EV", year: 2025, licensePlate: "USER-2",
        batteryCapacityKwh: 70, maxChargingRateKw: 120, connectorType: "CCS2",
        currentSocPercent: 60
      }, customerToken));
      assert.equal(extraVehicle.response.status, 201);
      const selectedPrimary = await request(`/api/v1/vehicles/${extraVehicle.payload.id}/primary`, {
        method: "POST",
        headers: authHeaders(customerToken)
      });
      assert.equal(selectedPrimary.response.status, 200);
      const deletedVehicle = await request(`/api/v1/vehicles/${extraVehicle.payload.id}`, {
        method: "DELETE",
        headers: authHeaders(customerToken)
      });
      assert.equal(deletedVehicle.response.status, 204);
      const remainingVehicles = await request("/api/v1/vehicles", {
        headers: authHeaders(customerToken)
      });
      assert.equal(remainingVehicles.payload.items.length, 1);
      assert.equal(remainingVehicles.payload.items[0].id, customerVehicleId);
      assert.equal(remainingVehicles.payload.items[0].isPrimary, true);
    });

    await t.test("wallet and payment methods are private, persisted, and safely represented", async () => {
      const unauthenticatedMethods = await request("/api/v1/payment-methods");
      assert.equal(unauthenticatedMethods.response.status, 401);

      const emptyWallet = await request("/api/v1/wallet", {
        headers: authHeaders(customerToken)
      });
      assert.equal(emptyWallet.response.status, 200);
      assert.equal(emptyWallet.payload.balance, 0);

      const emptyList = await request("/api/v1/payment-methods", {
        headers: authHeaders(customerToken)
      });
      assert.equal(emptyList.response.status, 200);
      assert.deepEqual(emptyList.payload.items, []);

      const card = await request("/api/v1/payment-methods", json({
        type: "CARD", brand: "Visa", last4: "4242", expMonth: 12,
        expYear: new Date().getFullYear() + 3
      }, customerToken));
      assert.equal(card.response.status, 201);
      assert.equal(card.payload.status, "DEMO_ONLY");
      assert.equal(card.payload.last4, "4242");
      assert.equal("cardNumber" in card.payload, false);
      assert.equal("cvv" in card.payload, false);

      const duplicateCard = await request("/api/v1/payment-methods", json({
        type: "CARD", brand: "Visa", last4: "4242", expMonth: 12,
        expYear: new Date().getFullYear() + 3
      }, customerToken));
      assert.equal(duplicateCard.response.status, 409);

      const unsafeCard = await request("/api/v1/payment-methods", json({
        type: "CARD", brand: "Visa", last4: "4242", expMonth: 12,
        expYear: new Date().getFullYear() + 3, cardNumber: "4111111111111111", cvv: "123"
      }, customerToken));
      assert.equal(unsafeCard.response.status, 422);

      const upi = await request("/api/v1/payment-methods", json({
        type: "UPI", upiId: "driver@okaxis"
      }, customerToken));
      assert.equal(upi.response.status, 201);
      assert.equal(upi.payload.status, "UNVERIFIED");
      assert.equal(upi.payload.upiId, "driver@okaxis");

      const duplicateUpi = await request("/api/v1/payment-methods", json({
        type: "UPI", upiId: "DRIVER@OKAXIS"
      }, customerToken));
      assert.equal(duplicateUpi.response.status, 409);

      const malformedUpi = await request("/api/v1/payment-methods", json({
        type: "UPI", upiId: "not-a-valid-id"
      }, customerToken));
      assert.equal(malformedUpi.response.status, 422);

      const otherRegistration = await request("/api/v1/auth/register", json({
        name: "Other Driver", email: "other@example.com", password: "another-correct-password"
      }));
      assert.equal(otherRegistration.response.status, 201);
      const otherToken = otherRegistration.payload.token as string;
      const otherList = await request("/api/v1/payment-methods", {
        headers: authHeaders(otherToken)
      });
      assert.deepEqual(otherList.payload.items, []);

      const otherDelete = await request(`/api/v1/payment-methods/${card.payload.id}`, {
        method: "DELETE", headers: authHeaders(otherToken)
      });
      assert.equal(otherDelete.response.status, 404);
      db.prepare("UPDATE users SET wallet_balance_minor = 12345 WHERE id = ?").run(userId);
      const otherWallet = await request("/api/v1/wallet?userId=" + userId, {
        headers: authHeaders(otherToken)
      });
      assert.equal(otherWallet.payload.balance, 0);
      db.prepare("UPDATE users SET wallet_balance_minor = 0 WHERE id = ?").run(userId);

      const savedList = await request("/api/v1/payment-methods", {
        headers: authHeaders(customerToken)
      });
      assert.equal(savedList.payload.items.length, 2);

      const removed = await request(`/api/v1/payment-methods/${card.payload.id}`, {
        method: "DELETE", headers: authHeaders(customerToken)
      });
      assert.equal(removed.response.status, 204);
      const repeatedRemoval = await request(`/api/v1/payment-methods/${card.payload.id}`, {
        method: "DELETE", headers: authHeaders(customerToken)
      });
      assert.equal(repeatedRemoval.response.status, 404);
      const afterRemoval = await request("/api/v1/payment-methods", {
        headers: authHeaders(customerToken)
      });
      assert.deepEqual(afterRemoval.payload.items.map((item: { id: string }) => item.id), [upi.payload.id]);

      const removedUpi = await request(`/api/v1/payment-methods/${upi.payload.id}`, {
        method: "DELETE", headers: authHeaders(customerToken)
      });
      assert.equal(removedUpi.response.status, 204);
      const methodCount = db.prepare("SELECT COUNT(*) AS count FROM payment_methods").get() as { count: number };
      assert.equal(methodCount.count, 0);
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
      assert.equal(list.payload.total, 2);
      const testStation = list.payload.items.find((item: { id: string }) => item.id === stationId);
      assert.ok(testStation);
      assert.equal(testStation.pricingPerKwh, 10.25);
      assert.equal(testStation.pricingPerKwhMinor, 1025);
      assert.equal(testStation.ports[0].stationId, stationId);
      assert.equal(testStation.ports[0].id, "port-1");
      assert.equal(testStation.ports[0].connectorType, "CCS2");
      assert.equal(testStation.ports[0].maxPowerKw, 50);
      assert.equal(testStation.ports[0].status, "AVAILABLE");
      const detail = await request(`/api/v1/stations/${stationId}`);
      assert.equal(detail.payload.name, "Test Charging Hub");

      {
        const demoStations = await request("/api/v1/stations?limit=100");
        assert.equal(demoStations.response.status, 200);
        const demoStation = demoStations.payload.items.find((item: { name: string }) =>
          item.name === "Demo - ChargeGrid Marina Hub");
        assert.ok(demoStation);
        assert.ok(demoStation.id);
        assert.ok(demoStation.ports.some((port: { id: string; connectorType: string; maxPowerKw: number; status: string }) =>
          port.id === "demo-port-1" && port.connectorType === "CCS2" &&
          port.maxPowerKw === 50 && port.status === "AVAILABLE"));

        const startsAt = new Date(Date.now() + 20 * 60 * 1000).toISOString();
        const noVehicleBooking = await request("/api/v1/bookings", json({
          vehicleId: "ffffffffffffffffffffffff", stationId, portId: "port-1", startsAt,
          durationMinutes: 30, targetSocPercent: 100
        }, secondCustomerToken));
        assert.equal(noVehicleBooking.response.status, 404);
        assert.equal(noVehicleBooking.payload.error.code, "VEHICLE_NOT_FOUND");
        const noVehicleSession = await request("/api/v1/sessions", json({
          vehicleId: "ffffffffffffffffffffffff", stationId, portId: "port-1"
        }, secondCustomerToken));
        assert.equal(noVehicleSession.response.status, 404);

        const vehicleResult = await request("/api/v1/vehicles", json({
          make: "Example", model: "EV", year: 2025, licensePlate: "TEST-1",
          vin: "TESTVIN123456789",
          batteryCapacityKwh: 70, maxChargingRateKw: 100, connectorType: "CCS2",
          currentSocPercent: 50
        }, adminToken));
        assert.equal(vehicleResult.response.status, 201);
        const vehicleId = vehicleResult.payload.id as string;
        assert.equal(vehicleResult.payload.isPrimary, false);
        assert.equal(vehicleResult.payload.vin, "TESTVIN123456789");

        const ownerVehicles = await request("/api/v1/vehicles", {
          headers: authHeaders(adminToken)
        });
        assert.deepEqual(
          ownerVehicles.payload.items.map((vehicle: { id: string }) => vehicle.id),
          [customerVehicleId, vehicleId]
        );
        const otherAccountVehicles = await request("/api/v1/vehicles", {
          headers: authHeaders(secondCustomerToken)
        });
        assert.deepEqual(otherAccountVehicles.payload.items, []);

        const vehicleUpdate = await request(`/api/v1/vehicles/${vehicleId}`, {
          method: "PATCH",
          headers: { ...authHeaders(adminToken), "Content-Type": "application/json" },
          body: JSON.stringify({ model: "Updated EV", vin: "UPDATEDVIN123456" })
        });
        assert.equal(vehicleUpdate.response.status, 200);
        assert.equal(vehicleUpdate.payload.model, "Updated EV");
        assert.equal(vehicleUpdate.payload.vin, "UPDATEDVIN123456");

        const bookingBody = {
          vehicleId, stationId, portId: "port-1", startsAt,
          durationMinutes: 30, targetSocPercent: 100
        };
        const invalidPortBooking = await request("/api/v1/bookings", json({
          ...bookingBody, portId: "missing-port"
        }, adminToken));
        assert.equal(invalidPortBooking.response.status, 409);
        assert.equal(invalidPortBooking.payload.error.code, "PORT_UNAVAILABLE");
        db.prepare("UPDATE station_ports SET status = 'OCCUPIED' WHERE station_id = ? AND id = ?")
          .run(stationId, "port-1");
        const unavailablePortBooking = await request("/api/v1/bookings", json(bookingBody, adminToken));
        assert.equal(unavailablePortBooking.response.status, 409);
        assert.equal(unavailablePortBooking.payload.error.code, "PORT_UNAVAILABLE");
        db.prepare("UPDATE station_ports SET status = 'AVAILABLE' WHERE station_id = ? AND id = ?")
          .run(stationId, "port-1");

        const invalidBooking = await request("/api/v1/bookings", json({
          vehicleId, stationId, portId: "port-1", startsAt, durationMinutes: 30
        }, adminToken));
        assert.equal(invalidBooking.response.status, 422);
        assert.equal(invalidBooking.payload.error.code, "VALIDATION_ERROR");

        const booking = await request("/api/v1/bookings", json(bookingBody, adminToken));
        assert.equal(booking.response.status, 201);
        assert.equal(booking.payload.estimatedCost, 256.25);
        assert.equal(booking.payload.status, "CONFIRMED");
        assert.equal(typeof booking.payload.qrAccessToken, "string");
        const persistedBooking = db.prepare("SELECT id, user_id, status FROM bookings WHERE id = ?")
          .get(booking.payload.id) as { id: string; user_id: string; status: string } | undefined;
        assert.deepEqual(persistedBooking, {
          id: booking.payload.id,
          user_id: userId,
          status: "CONFIRMED"
        });
        const listedBookings = await request("/api/v1/bookings", {
          headers: authHeaders(adminToken)
        });
        assert.equal(listedBookings.payload.items.length, 1);
        assert.equal(listedBookings.payload.items[0].id, booking.payload.id);
        const overlap = await request("/api/v1/bookings", json(bookingBody, adminToken));
        assert.equal(overlap.response.status, 409);
        assert.equal(overlap.payload.error.code, "BOOKING_CONFLICT");
        assert.equal(
          (db.prepare("SELECT COUNT(*) AS count FROM bookings").get() as { count: number }).count,
          1
        );

        const sessionBody = { vehicleId, stationId, portId: "port-1" };
        const session = await request("/api/v1/sessions", json(sessionBody, adminToken));
        assert.equal(session.response.status, 201);
        assert.equal(session.payload.mode, "SIMULATED");
        const duplicateSession = await request("/api/v1/sessions", json(sessionBody, adminToken));
        assert.equal(duplicateSession.response.status, 409);
        const protectedVehicle = await request(`/api/v1/vehicles/${vehicleId}`, {
          method: "DELETE",
          headers: authHeaders(adminToken)
        });
        assert.equal(protectedVehicle.response.status, 409);
        assert.equal(protectedVehicle.payload.error.code, "VEHICLE_IN_USE");
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
    if (server) {
      server.closeAllConnections();
      await new Promise<void>((resolveClose, reject) =>
        server!.close((err) => err ? reject(err) : resolveClose()));
    }
    closeDatabase();
    await rm(directory, { recursive: true, force: true });
  }
});
