package com.chargegrid.backend.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.chargegrid.backend.data.Database;
import java.nio.file.Path;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

class FirstAdminProvisionerTest {
    private static final String PASSWORD = "provision-test-password-123!";

    @TempDir Path directory;
    private Database database;
    private PasswordEncoder passwordEncoder;
    private FirstAdminProvisioner provisioner;

    @BeforeEach
    void setUp() {
        database = new Database(directory.resolve("admin.db").toString(), "development");
        database.init();
        passwordEncoder = new BCryptPasswordEncoder(4);
        provisioner = new FirstAdminProvisioner(database, passwordEncoder);
    }

    @Test
    void provisionsFirstAdminWithBcryptHashedPassword() {
        provisioner.provision("  First.Admin@example.com ", PASSWORD, "First Administrator");

        Map<String, Object> admin = database.one(
            "SELECT email,password_hash,name,role FROM users WHERE email=?",
            "first.admin@example.com");
        assertEquals("ADMIN", admin.get("role"));
        assertEquals("First Administrator", admin.get("name"));
        assertFalse(PASSWORD.equals(admin.get("password_hash")));
        assertTrue(passwordEncoder.matches(PASSWORD, String.valueOf(admin.get("password_hash"))));
    }

    @Test
    void refusesRepeatedProvisioningWithoutChangingExistingAdmin() {
        provisioner.provision("first.admin@example.com", PASSWORD, "First Administrator");
        String originalHash = String.valueOf(database.one(
            "SELECT password_hash FROM users WHERE email='first.admin@example.com'").get("password_hash"));

        assertThrows(IllegalStateException.class,
            () -> provisioner.provision("first.admin@example.com", "another-test-password-456!", "Changed Name"));
        assertThrows(IllegalStateException.class,
            () -> provisioner.provision("second.admin@example.com", "another-test-password-456!", "Second Administrator"));

        assertEquals(1, ((Number) database.one("SELECT COUNT(*) AS count FROM users WHERE role='ADMIN'")
            .get("count")).intValue());
        assertEquals(originalHash, database.one(
            "SELECT password_hash FROM users WHERE email='first.admin@example.com'").get("password_hash"));
        assertEquals(1, ((Number) database.one("SELECT COUNT(*) AS count FROM users")
            .get("count")).intValue());
    }

    @Test
    void refusesToPromoteOrOverwriteAnExistingCustomer() {
        String customerHash = passwordEncoder.encode("existing-customer-password");
        database.update("INSERT INTO users(id,email,password_hash,name,role) VALUES(?,?,?,?, 'CUSTOMER')",
            "existing-user-id", "existing@example.com", customerHash, "Existing Customer");

        assertThrows(IllegalStateException.class,
            () -> provisioner.provision("existing@example.com", PASSWORD, "Attempted Promotion"));

        Map<String, Object> customer = database.one(
            "SELECT password_hash,name,role FROM users WHERE id='existing-user-id'");
        assertEquals("CUSTOMER", customer.get("role"));
        assertEquals("Existing Customer", customer.get("name"));
        assertEquals(customerHash, customer.get("password_hash"));
        assertEquals(1, ((Number) database.one("SELECT COUNT(*) AS count FROM users")
            .get("count")).intValue());
    }

    @Test
    void rejectsInvalidOrBcryptOversizeCredentialsWithoutCreatingAnAccount() {
        assertThrows(IllegalArgumentException.class,
            () -> provisioner.provision("not-an-email", PASSWORD, "Administrator"));
        assertThrows(IllegalArgumentException.class,
            () -> provisioner.provision("admin@example.com", "short", "Administrator"));
        assertThrows(IllegalArgumentException.class,
            () -> provisioner.provision("admin@example.com", "é".repeat(37), "Administrator"));
        assertEquals(0, ((Number) database.one("SELECT COUNT(*) AS count FROM users")
            .get("count")).intValue());
    }
}
