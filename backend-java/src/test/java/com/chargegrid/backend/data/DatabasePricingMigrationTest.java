package com.chargegrid.backend.data;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.nio.file.Path;
import java.sql.DriverManager;
import java.sql.Statement;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class DatabasePricingMigrationTest {
    @TempDir Path directory;

    @Test
    void migratesLegacyStationPaiseAndBookingEstimatesOnce() throws Exception {
        Path databaseFile = directory.resolve("legacy.db");
        try (var connection = DriverManager.getConnection("jdbc:sqlite:" + databaseFile);
             Statement statement = connection.createStatement()) {
            statement.execute("CREATE TABLE stations (id TEXT PRIMARY KEY, price_per_kwh INTEGER NOT NULL)");
            statement.execute("INSERT INTO stations(id, price_per_kwh) VALUES ('station-demo-1', 1800), ('inr-station', 14), ('high-inr-station', 180)");
            statement.execute("CREATE TABLE bookings (id TEXT, station_id TEXT, estimated_kwh REAL, estimated_cost INTEGER)");
            statement.execute("INSERT INTO bookings(id, station_id, estimated_kwh, estimated_cost) VALUES ('old-booking', 'station-demo-1', 20, 36000), ('inr-booking', 'inr-station', 20, 280), ('high-inr-booking', 'high-inr-station', 20, 3600)");
        }

        Database database = new Database(databaseFile.toString(), "development");
        database.init();
        assertEquals(18.0, ((Number) database.one(
            "SELECT price_per_kwh FROM stations WHERE id='station-demo-1'").get("price_per_kwh")).doubleValue());
        assertEquals(360.0, ((Number) database.one(
            "SELECT estimated_cost FROM bookings WHERE id='old-booking'").get("estimated_cost")).doubleValue());
        assertEquals(14.0, ((Number) database.one(
            "SELECT price_per_kwh FROM stations WHERE id='inr-station'").get("price_per_kwh")).doubleValue());
        assertEquals(280.0, ((Number) database.one(
            "SELECT estimated_cost FROM bookings WHERE id='inr-booking'").get("estimated_cost")).doubleValue());
        assertEquals(180.0, ((Number) database.one(
            "SELECT price_per_kwh FROM stations WHERE id='high-inr-station'").get("price_per_kwh")).doubleValue());
        assertEquals(3600.0, ((Number) database.one(
            "SELECT estimated_cost FROM bookings WHERE id='high-inr-booking'").get("estimated_cost")).doubleValue());

        database.init();
        assertEquals(18.0, ((Number) database.one(
            "SELECT price_per_kwh FROM stations WHERE id='station-demo-1'").get("price_per_kwh")).doubleValue());
        assertEquals(14.0, ((Number) database.one(
            "SELECT price_per_kwh FROM stations WHERE id='inr-station'").get("price_per_kwh")).doubleValue());
        assertEquals(360.0, ((Number) database.one(
            "SELECT estimated_cost FROM bookings WHERE id='old-booking'").get("estimated_cost")).doubleValue());
        assertEquals(1, ((Number) database.one(
            "PRAGMA user_version").get("user_version")).intValue());
    }

    @Test
    void productionDatabaseRequiresAnAbsolutePersistentFilePath() {
        assertThrows(IllegalStateException.class, () -> new Database("data/chargegrid.db", "production"));
        assertThrows(IllegalStateException.class, () -> new Database(":memory:", "production"));
        assertThrows(IllegalStateException.class,
            () -> new Database(java.nio.file.Path.of(System.getProperty("java.io.tmpdir"), "chargegrid.db").toString(), "production"));
        assertDoesNotThrow(() -> new Database("data/chargegrid.db", "development"));
        java.nio.file.Path persistentPath = java.nio.file.Path.of(System.getProperty("user.home"))
            .toAbsolutePath().getRoot().resolve("var").resolve("data").resolve("chargegrid.db");
        assertDoesNotThrow(() -> new Database(persistentPath.toString(), "production"));
    }
}
