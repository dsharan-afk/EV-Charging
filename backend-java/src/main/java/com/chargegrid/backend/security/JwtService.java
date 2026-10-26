package com.chargegrid.backend.security;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import java.time.Instant;
import java.util.Date;
import java.util.Map;

@Service
public class JwtService {
    private final String secret;

    public JwtService(@Value("${JWT_SECRET:}") String secret,
                      @Value("${APP_ENV:production}") String appEnv) {
        boolean production = "production".equalsIgnoreCase(appEnv);
        if (!production && !"development".equalsIgnoreCase(appEnv)) {
            throw new IllegalStateException("APP_ENV must be either production or development");
        }
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException("JWT_SECRET must be configured");
        }
        if (production) {
            validateProductionSecret(secret);
        }
        this.secret = secret;
    }

    static void validateProductionSecret(String secret) {
        if (secret == null || secret.length() < 32 || secret.chars().distinct().count() < 16
                || secret.toLowerCase(java.util.Locale.ROOT).matches(".*(change.?me|replace.?me|development|example|password|secret|local.?only|your.?jwt).*")) {
            throw new IllegalStateException("JWT_SECRET must be a strong, unique production secret of at least 32 characters");
        }
    }

    private Algorithm algorithm() { return Algorithm.HMAC256(secret); }
    public String issue(String userId, String email, String role) {
        Instant now = Instant.now();
        return JWT.create().withSubject(userId).withClaim("email", email).withClaim("role", role)
            .withIssuedAt(Date.from(now)).withExpiresAt(Date.from(now.plusSeconds(3600))).sign(algorithm());
    }
    public Map<String,Object> verify(String token) {
        try {
            var d = JWT.require(algorithm()).build().verify(token);
            return Map.of("id", d.getSubject(), "email", d.getClaim("email").asString(), "role", d.getClaim("role").asString());
        } catch (JWTVerificationException ex) { throw new IllegalArgumentException("Invalid or expired token"); }
    }
}
