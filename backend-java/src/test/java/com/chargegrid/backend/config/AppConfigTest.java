package com.chargegrid.backend.config;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.util.List;
import org.junit.jupiter.api.Test;

class AppConfigTest {
    @Test
    void allowsOnlyConfiguredExactProductionOrigins() {
        assertEquals(List.of("https://chargegrid-frontend.onrender.com"),
            AppConfig.parseOrigins(" https://chargegrid-frontend.onrender.com/ ", "production"));
        assertThrows(IllegalStateException.class, () -> AppConfig.parseOrigins("", "production"));
        assertThrows(IllegalStateException.class, () -> AppConfig.parseOrigins("*", "production"));
        assertThrows(IllegalStateException.class,
            () -> AppConfig.parseOrigins("https://example.com/path", "production"));
    }

    @Test
    void defaultsToLocalhostOnlyOutsideProduction() {
        assertEquals(List.of("http://localhost:5173"), AppConfig.parseOrigins("", "development"));
    }
}
