package com.chargegrid.backend.security;

import com.chargegrid.backend.data.Database;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.regex.Pattern;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class FirstAdminProvisioner {
    private static final Pattern EMAIL = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");

    private final Database database;
    private final PasswordEncoder passwordEncoder;

    public FirstAdminProvisioner(Database database, PasswordEncoder passwordEncoder) {
        this.database = database;
        this.passwordEncoder = passwordEncoder;
    }

    public void provision(String email, String password, String name) {
        if (email == null || !EMAIL.matcher(email.trim()).matches()) {
            throw new IllegalArgumentException("A valid administrator email is required");
        }
        if (password == null || password.length() < 12
                || password.getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new IllegalArgumentException("Administrator password must be at least 12 characters and at most 72 UTF-8 bytes");
        }
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Administrator name is required");
        }

        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
        String passwordHash = passwordEncoder.encode(password);
        database.createFirstAdmin(normalizedEmail, passwordHash, name.trim());
    }
}
