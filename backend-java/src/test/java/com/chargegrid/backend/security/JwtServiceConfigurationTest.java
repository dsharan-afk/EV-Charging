package com.chargegrid.backend.security;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;

class JwtServiceConfigurationTest {
    @Test
    void rejectsMissingWeakAndDevelopmentSecretsInProduction() {
        assertThrows(IllegalStateException.class, () -> new JwtService("", "production"));
        assertThrows(IllegalStateException.class, () -> new JwtService("short", "production"));
        assertThrows(IllegalStateException.class,
            () -> new JwtService("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "production"));
    }

    @Test
    void acceptsStrongUniqueProductionSecretWithoutExposingIt() {
        assertDoesNotThrow(() -> new JwtService("8Fs4!zQ2@vN7#kL9$wR3%pT6^mX1&cB5", "production"));
    }

    @Test
    void requiresConfiguredSecretInDevelopmentToo() {
        assertThrows(IllegalStateException.class, () -> new JwtService("", "development"));
        assertDoesNotThrow(() -> new JwtService("test-only-development-signing-key", "development"));
    }

    @Test
    void rejectsUnknownEnvironmentModesInsteadOfTreatingThemAsDevelopment() {
        assertThrows(IllegalStateException.class,
            () -> new JwtService("8Fs4!zQ2@vN7#kL9$wR3%pT6^mX1&cB5", "prodution"));
    }
}
