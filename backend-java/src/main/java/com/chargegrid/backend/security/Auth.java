package com.chargegrid.backend.security;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;
import java.util.Map;

@Component
public class Auth {
    private final JwtService jwt;
    public Auth(JwtService jwt) { this.jwt = jwt; }
    public Map<String,Object> user(HttpServletRequest req) {
        String h = req.getHeader("Authorization");
        if (h == null || !h.startsWith("Bearer ")) throw new IllegalArgumentException("Authentication required");
        return jwt.verify(h.substring(7));
    }
    public Map<String,Object> admin(HttpServletRequest req) {
        var u = user(req);
        if (!"ADMIN".equals(u.get("role"))) throw new IllegalArgumentException("Admin access required");
        return u;
    }
}
