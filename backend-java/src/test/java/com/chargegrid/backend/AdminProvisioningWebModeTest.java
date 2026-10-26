package com.chargegrid.backend;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.chargegrid.backend.data.Database;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.boot.SpringApplication;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.boot.web.servlet.context.ServletWebServerApplicationContext;

class AdminProvisioningWebModeTest {
    @Test
    void explicitProvisioningRunsWithNoHttpServerAndUsesConfiguredDatabase() throws Exception {
        Path databasePath = Path.of("target", "admin-provisioning-" + UUID.randomUUID() + ".db")
            .toAbsolutePath();
        String[] args = {
            AdminProvisioningRunner.PROVISION_ARGUMENT,
            "--APP_ENV=production",
            "--JWT_SECRET=R4m!pQ8#sZ2@vN6$wK1%tC5^hB9&xD37",
            "--CORS_ALLOWED_ORIGINS=https://chargegrid-frontend.onrender.com",
            "--chargegrid.sqlite.path=" + databasePath,
            "--spring.main.web-application-type=servlet",
            "--FIRST_ADMIN_EMAIL=one-time-test@example.com",
            "--FIRST_ADMIN_PASSWORD=temporary-test-password-only",
            "--FIRST_ADMIN_NAME=Disposable Test Admin"
        };

        SpringApplication application = ChargegridBackendApplication.createApplication(args);
        assertTrue(application.getWebApplicationType() == org.springframework.boot.WebApplicationType.NONE);

        try (ConfigurableApplicationContext context = application.run(args)) {
            assertFalse(context instanceof WebApplicationContext);
            assertFalse(context instanceof ServletWebServerApplicationContext);
            Database database = context.getBean(Database.class);
            assertTrue(database.one("SELECT id FROM users WHERE email=? AND role='ADMIN'",
                "one-time-test@example.com") != null);
        } finally {
            Files.deleteIfExists(databasePath);
        }
    }
}
