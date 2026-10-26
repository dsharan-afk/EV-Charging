package com.chargegrid.backend.data;

import org.springframework.stereotype.Repository;
import org.springframework.beans.factory.annotation.Value;
import jakarta.annotation.PostConstruct;
import java.nio.file.*;
import java.sql.*;
import java.util.*;
import java.util.Locale;

@Repository
public class Database {
    private final String dbPath;
    private final boolean production;
    private String url;

    public Database(@Value("${chargegrid.sqlite.path:${SQLITE_PATH:data/chargegrid.db}}") String dbPath,
                    @Value("${APP_ENV:production}") String appEnv) {
        this.production = "production".equalsIgnoreCase(appEnv);
        if (production) {
            validateProductionPath(dbPath);
        }
        this.dbPath = dbPath;
    }

    private static void validateProductionPath(String dbPath) {
        if (dbPath == null || dbPath.isBlank() || ":memory:".equalsIgnoreCase(dbPath)
                || dbPath.startsWith("file:")) {
            throw new IllegalStateException("Production requires an absolute, non-temporary persistent SQLite path");
        }
        try {
            Path path = Paths.get(dbPath);
            Path temporaryDirectory = Paths.get(System.getProperty("java.io.tmpdir")).toAbsolutePath().normalize();
            if (!path.isAbsolute() || path.normalize().startsWith(temporaryDirectory)) {
                throw new IllegalStateException("Production requires an absolute, non-temporary persistent SQLite path");
            }
        } catch (InvalidPathException exception) {
            throw new IllegalStateException("Production requires an absolute, non-temporary persistent SQLite path");
        }
    }

    @PostConstruct public void init() {
        try {
            Path p = Paths.get(dbPath);
            if (p.getParent() != null) {
                if (production && !Files.isDirectory(p.getParent())) {
                    throw new IllegalStateException("Production SQLite parent directory must already exist on persistent storage");
                }
                if (!production) Files.createDirectories(p.getParent());
            }
            Class.forName("org.sqlite.JDBC");
            url = "jdbc:sqlite:" + p.toAbsolutePath();
            try (Connection c = conn(); Statement s = c.createStatement()) {
                s.execute("PRAGMA foreign_keys=ON");
                s.executeUpdate("CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY,email TEXT UNIQUE NOT NULL,password_hash TEXT NOT NULL,name TEXT NOT NULL,phone TEXT,role TEXT NOT NULL DEFAULT 'CUSTOMER',wallet_balance INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)");
                s.executeUpdate("CREATE TABLE IF NOT EXISTS stations (id TEXT PRIMARY KEY,name TEXT NOT NULL,address TEXT NOT NULL,city TEXT NOT NULL,state TEXT NOT NULL,latitude REAL,longitude REAL,status TEXT NOT NULL DEFAULT 'AVAILABLE',connector_type TEXT NOT NULL DEFAULT 'CCS2',power_kw REAL NOT NULL DEFAULT 30,price_per_kwh REAL NOT NULL DEFAULT 18.00,total_ports INTEGER NOT NULL DEFAULT 2,available_ports INTEGER NOT NULL DEFAULT 2,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)");
                s.executeUpdate("CREATE TABLE IF NOT EXISTS vehicles (id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),make TEXT NOT NULL,model TEXT NOT NULL,registration_number TEXT,connector_type TEXT NOT NULL DEFAULT 'CCS2',battery_capacity REAL NOT NULL DEFAULT 40,is_primary INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)");
                s.executeUpdate("CREATE TABLE IF NOT EXISTS bookings (id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),station_id TEXT NOT NULL REFERENCES stations(id),vehicle_id TEXT REFERENCES vehicles(id),start_time TEXT NOT NULL,end_time TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'CONFIRMED',estimated_kwh REAL NOT NULL DEFAULT 0,estimated_cost REAL NOT NULL DEFAULT 0,qr_token TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)");
                s.executeUpdate("CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),station_id TEXT NOT NULL REFERENCES stations(id),booking_id TEXT REFERENCES bookings(id),status TEXT NOT NULL DEFAULT 'CHARGING',mode TEXT NOT NULL DEFAULT 'SIMULATED',energy_kwh REAL NOT NULL DEFAULT 0,cost INTEGER NOT NULL DEFAULT 0,started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)");
                s.executeUpdate("CREATE TABLE IF NOT EXISTS wallet_ledger (id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),amount INTEGER NOT NULL,kind TEXT NOT NULL,description TEXT,idempotency_key TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)");
                s.executeUpdate("CREATE UNIQUE INDEX IF NOT EXISTS idx_wallet_idempotency ON wallet_ledger(user_id,idempotency_key) WHERE idempotency_key IS NOT NULL");
                migratePricing(c);
                if (!production) seed(c);
            }
        } catch (Exception e) { throw new IllegalStateException("Database initialization failed: " + e.getMessage(), e); }
    }

    private void migratePricing(Connection c) throws SQLException {
        boolean autoCommit = c.getAutoCommit();
        c.setAutoCommit(false);
        try {
            int version;
            try (Statement s = c.createStatement(); ResultSet r = s.executeQuery("PRAGMA user_version")) {
                version = r.next() ? r.getInt(1) : 0;
            }
            if (version < 1) {
                try (Statement s = c.createStatement()) {
                    s.executeUpdate("UPDATE bookings SET estimated_cost = ROUND(estimated_kwh * (SELECT price_per_kwh FROM stations WHERE stations.id = bookings.station_id) / 100.0, 2) WHERE station_id IN (SELECT id FROM stations WHERE (id='station-demo-1' AND price_per_kwh=1800) OR (id='station-demo-2' AND price_per_kwh=1600) OR (id='station-demo-3' AND price_per_kwh=1400))");
                    s.executeUpdate("UPDATE stations SET price_per_kwh = price_per_kwh / 100.0 WHERE (id='station-demo-1' AND price_per_kwh=1800) OR (id='station-demo-2' AND price_per_kwh=1600) OR (id='station-demo-3' AND price_per_kwh=1400)");
                    s.execute("PRAGMA user_version = 1");
                }
            }
            c.commit();
        } catch (SQLException e) {
            c.rollback();
            throw e;
        } finally {
            c.setAutoCommit(autoCommit);
        }
    }

    private void seed(Connection c) throws SQLException {
        try (Statement s=c.createStatement(); ResultSet r=s.executeQuery("SELECT COUNT(*) FROM stations")) {
            if (r.next() && r.getInt(1)==0) {
                try (PreparedStatement p=c.prepareStatement("INSERT INTO stations(id,name,address,city,state,latitude,longitude,status,connector_type,power_kw,price_per_kwh,total_ports,available_ports) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)")) {
                    Object[][] rows = {
                        {"station-demo-1","ChargeGrid Central","12 Main Road","Chennai","Tamil Nadu",13.0827,80.2707,"AVAILABLE","CCS2",60,18.00,4,4},
                        {"station-demo-2","Green Energy Hub","45 Lake View","Vellore","Tamil Nadu",12.9165,79.1325,"AVAILABLE","CCS2",30,16.00,2,2},
                        {"station-demo-3","City Fast Charge","8 Market Street","Bengaluru","Karnataka",12.9716,77.5946,"AVAILABLE","TYPE2",22,14.00,3,3}
                    };
                    for(Object[] row:rows){ for(int i=0;i<row.length;i++)p.setObject(i+1,row[i]); p.executeUpdate(); }
                }
            }
        }
    }
    private Connection conn() throws SQLException { return DriverManager.getConnection(url); }

    public void createFirstAdmin(String email, String passwordHash, String name) {
        try (Connection c = conn()) {
            c.setAutoCommit(false);
            try {
                try (PreparedStatement admin = c.prepareStatement("SELECT id FROM users WHERE role='ADMIN' LIMIT 1");
                     ResultSet result = admin.executeQuery()) {
                    if (result.next()) {
                        throw new IllegalStateException("An administrator already exists; first-admin provisioning was refused");
                    }
                }
                try (PreparedStatement existing = c.prepareStatement("SELECT id FROM users WHERE lower(email)=?")) {
                    existing.setString(1, email.toLowerCase(Locale.ROOT));
                    try (ResultSet result = existing.executeQuery()) {
                        if (result.next()) {
                            throw new IllegalStateException("An account with that email already exists; no account was changed");
                        }
                    }
                }
                try (PreparedStatement insert = c.prepareStatement(
                        "INSERT INTO users(id,email,password_hash,name,role) VALUES(?,?,?,?,'ADMIN')")) {
                    insert.setString(1, UUID.randomUUID().toString());
                    insert.setString(2, email);
                    insert.setString(3, passwordHash);
                    insert.setString(4, name);
                    insert.executeUpdate();
                }
                c.commit();
            } catch (SQLException | RuntimeException exception) {
                c.rollback();
                throw exception;
            }
        } catch (SQLException exception) {
            throw new IllegalStateException("First administrator could not be provisioned; no credentials were changed", exception);
        }
    }

    public void checkReady() {
        if (one("SELECT 1 AS ready") == null) {
            throw new IllegalStateException("Database readiness check returned no result");
        }
    }

    public List<Map<String,Object>> query(String sql, Object... args) {
        try(Connection c=conn(); PreparedStatement p=c.prepareStatement(sql)){ bind(p,args); try(ResultSet r=p.executeQuery()){ List<Map<String,Object>> out=new ArrayList<>(); ResultSetMetaData m=r.getMetaData(); while(r.next()){ Map<String,Object> row=new LinkedHashMap<>(); for(int i=1;i<=m.getColumnCount();i++)row.put(m.getColumnLabel(i),r.getObject(i)); out.add(row);} return out;}}
        catch(SQLException e){throw new IllegalStateException(e.getMessage(),e);}
    }
    public Map<String,Object> one(String sql,Object...args){var rows=query(sql,args);return rows.isEmpty()?null:rows.get(0);}
    public int update(String sql,Object...args) {
        try(Connection c=conn(); PreparedStatement p=c.prepareStatement(sql)){bind(p,args);return p.executeUpdate();}
        catch(SQLException e){throw new IllegalStateException(e.getMessage(),e);}
    }
    private void bind(PreparedStatement p,Object[] args)throws SQLException{for(int i=0;i<args.length;i++)p.setObject(i+1,args[i]);}
}
