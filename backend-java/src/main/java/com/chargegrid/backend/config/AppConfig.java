package com.chargegrid.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.beans.factory.annotation.Value;
import java.net.URI;
import java.util.Arrays;
import java.util.List;

@Configuration
public class AppConfig {
    @Bean public PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(12); }

    @Bean public WebMvcConfigurer corsConfigurer(
            @Value("${CORS_ALLOWED_ORIGINS:}") String configuredOrigins,
            @Value("${APP_ENV:production}") String appEnv) {
        List<String> origins = parseOrigins(configuredOrigins, appEnv);
        return new WebMvcConfigurer() {
            @Override public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**").allowedOrigins(origins.toArray(String[]::new))
                    .allowedMethods("GET","POST","PATCH","PUT","DELETE","OPTIONS")
                    .allowedHeaders("Authorization","Content-Type","Idempotency-Key")
                    .maxAge(3600);
            }
        };
    }

    static List<String> parseOrigins(String configuredOrigins, String appEnv) {
        boolean production = "production".equalsIgnoreCase(appEnv);
        if (configuredOrigins == null || configuredOrigins.isBlank()) {
            if (production) {
                throw new IllegalStateException("CORS_ALLOWED_ORIGINS must be configured in production");
            }
            return List.of("http://localhost:5173");
        }

        List<String> origins = Arrays.stream(configuredOrigins.split(","))
            .map(String::trim)
            .filter(origin -> !origin.isEmpty())
            .map(AppConfig::validateOrigin)
            .distinct()
            .toList();
        if (origins.isEmpty() || origins.contains("*")) {
            throw new IllegalStateException("CORS_ALLOWED_ORIGINS must contain exact origins");
        }
        return origins;
    }

    private static String validateOrigin(String origin) {
        if ("*".equals(origin)) {
            return origin;
        }
        try {
            URI uri = URI.create(origin);
            if (!("http".equals(uri.getScheme()) || "https".equals(uri.getScheme()))
                    || uri.getHost() == null || uri.getUserInfo() != null || uri.getQuery() != null
                    || uri.getFragment() != null || (uri.getPath() != null && !uri.getPath().isEmpty()
                    && !"/".equals(uri.getPath()))) {
                throw new IllegalArgumentException();
            }
            return origin.endsWith("/") ? origin.substring(0, origin.length() - 1) : origin;
        } catch (IllegalArgumentException exception) {
            throw new IllegalStateException("CORS_ALLOWED_ORIGINS must contain valid exact origins");
        }
    }
}
