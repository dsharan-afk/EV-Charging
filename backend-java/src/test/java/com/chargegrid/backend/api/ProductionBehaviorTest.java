package com.chargegrid.backend.api;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;

import com.chargegrid.backend.data.Database;
import com.chargegrid.backend.security.Auth;
import com.chargegrid.backend.security.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.http.HttpStatus;

class ProductionBehaviorTest {
    @Test
    void disablesDemoCreditsWhenProductionEnvironmentIsConfigured() {
        ApiController controller = new ApiController(
            mock(Database.class),
            mock(Auth.class),
            new JwtService("development-test-secret-only", "development"),
            mock(PasswordEncoder.class),
            java.math.BigDecimal.valueOf(18),
            "production");

        assertThrows(IllegalArgumentException.class,
            () -> controller.demoCredit(new ApiController.CreditInput(500, null), null));
    }

    @Test
    void readinessReturnsUnavailableWhenDatabaseCheckFails() {
        Database database = mock(Database.class);
        doThrow(new IllegalStateException("database unavailable")).when(database).checkReady();
        ApiController controller = new ApiController(
            database,
            mock(Auth.class),
            new JwtService("development-test-secret-only", "development"),
            mock(PasswordEncoder.class),
            java.math.BigDecimal.valueOf(18),
            "production");

        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, controller.ready().getStatusCode());
    }
}
