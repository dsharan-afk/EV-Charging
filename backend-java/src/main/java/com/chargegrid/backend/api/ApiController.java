package com.chargegrid.backend.api;

import com.chargegrid.backend.data.Database;
import com.chargegrid.backend.security.Auth;
import com.chargegrid.backend.security.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.util.*;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.math.BigDecimal;
import org.springframework.beans.factory.annotation.Value;

@RestController
public class ApiController {
    private final Database db; private final Auth auth; private final JwtService jwt; private final PasswordEncoder passwords;
    private final BigDecimal defaultPricePerKwhInr;
    private final String appEnv;
    public ApiController(Database db,Auth auth,JwtService jwt,PasswordEncoder passwords,
                         @Value("${chargegrid.pricing.default-inr-per-kwh:18.00}") BigDecimal defaultPricePerKwhInr,
                         @Value("${APP_ENV:production}") String appEnv){
        this.db=db;this.auth=auth;this.jwt=jwt;this.passwords=passwords;
        if(defaultPricePerKwhInr.signum()<0)throw new IllegalArgumentException("Default station price cannot be negative");
        this.defaultPricePerKwhInr=defaultPricePerKwhInr;
        this.appEnv=appEnv;
    }

    public record Register(@Email @NotBlank String email,@Size(min=10,max=100) String password,@NotBlank String name,String phone){}
    public record Login(@Email @NotBlank String email,@NotBlank String password){}
    public record StationInput(@NotBlank String name,@NotBlank String address,@NotBlank String city,@NotBlank String state,Double latitude,Double longitude,String status,String connectorType,Double powerKw,@DecimalMin("0.0") @DecimalMax("100000.0") @Digits(integer=6,fraction=2) BigDecimal pricePerKwh,Integer totalPorts){}
    public record VehicleInput(@NotBlank String make,@NotBlank String model,String registrationNumber,String connectorType,Double batteryCapacity){}
    public record BookingInput(@NotBlank String stationId,String vehicleId,@NotBlank String startTime,@NotBlank String endTime,@NotNull @DecimalMin(value="0.0",inclusive=false) @DecimalMax("500.0") @Digits(integer=3,fraction=6) BigDecimal estimatedKwh){}
    public record CreditInput(@Positive long amount,String description){}

    @GetMapping({"/health","/api/v1/health"}) public Map<String,Object> health(){return Map.of("status","ok","service","chargegrid-java-backend");}
    @GetMapping("/ready") public ResponseEntity<Map<String,Object>> ready(){
        try {
            db.checkReady();
            return ResponseEntity.ok(Map.of("status","ok","service","chargegrid-java-backend"));
        } catch (IllegalStateException exception) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(Map.of("status","unavailable","service","chargegrid-java-backend"));
        }
    }

    @PostMapping("/api/v1/auth/register")
    public ResponseEntity<?> register(@Valid @RequestBody Register in){
        String email=in.email().trim().toLowerCase(Locale.ROOT);
        if(db.one("SELECT id FROM users WHERE email=?",email)!=null)return ResponseEntity.status(409).body(Map.of("error","Email already registered"));
        String id=UUID.randomUUID().toString();
        db.update("INSERT INTO users(id,email,password_hash,name,phone,role) VALUES(?,?,?,?,?,'CUSTOMER')",id,email,passwords.encode(in.password()),in.name().trim(),in.phone());
        return ResponseEntity.status(201).body(authResponse(id,email,in.name().trim(),"CUSTOMER"));
    }
    @PostMapping("/api/v1/auth/login")
    public Map<String,Object> login(@Valid @RequestBody Login in){
        var u=db.one("SELECT id,email,password_hash,name,phone,role FROM users WHERE email=?",in.email().trim().toLowerCase(Locale.ROOT));
        if(u==null||!passwords.matches(in.password(),String.valueOf(u.get("password_hash"))))throw new IllegalArgumentException("Invalid email or password");
        return authResponse(String.valueOf(u.get("id")),String.valueOf(u.get("email")),String.valueOf(u.get("name")),String.valueOf(u.get("role")));
    }
    private Map<String,Object> authResponse(String id,String email,String name,String role){return Map.of("token",jwt.issue(id,email,role),"user",Map.of("id",id,"email",email,"name",name,"role",role));}

    @GetMapping("/api/v1/me") public Map<String,Object> me(HttpServletRequest req){var u=auth.user(req); var row=db.one("SELECT id,email,name,phone,role, wallet_balance AS walletBalance,created_at AS createdAt FROM users WHERE id=?",u.get("id")); if(row==null)throw new IllegalArgumentException("User not found");return row;}
    @PatchMapping("/api/v1/me") public Map<String,Object> updateMe(@RequestBody Map<String,Object> in,HttpServletRequest req){var u=auth.user(req);String name=String.valueOf(in.getOrDefault("name",""));String phone=String.valueOf(in.getOrDefault("phone",""));if(name.isBlank())throw new IllegalArgumentException("Name is required");db.update("UPDATE users SET name=?,phone=? WHERE id=?",name,phone,u.get("id"));return me(req);}

    @GetMapping("/api/v1/stations") public Map<String,Object> stations(@RequestParam(defaultValue="1") int page,@RequestParam(defaultValue="20") int limit,@RequestParam(required=false) String city,@RequestParam(required=false) String state,@RequestParam(required=false) String status,@RequestParam(required=false) String connectorType){
        page=Math.max(1,page);limit=Math.min(100,Math.max(1,limit));StringBuilder where=new StringBuilder(" WHERE 1=1");List<Object> args=new ArrayList<>();
        if(city!=null&&!city.isBlank()){where.append(" AND lower(city)=lower(?)");args.add(city);}
        if(state!=null&&!state.isBlank()){where.append(" AND lower(state)=lower(?)");args.add(state);}
        if(status!=null&&!status.isBlank()){where.append(" AND status=?");args.add(status);}
        if(connectorType!=null&&!connectorType.isBlank()){where.append(" AND connector_type=?");args.add(connectorType);}
        var total=db.one("SELECT COUNT(*) AS total FROM stations"+where,args.toArray());args.add(limit);args.add((page-1)*limit);
        return Map.of("items",db.query("SELECT * FROM stations"+where+" ORDER BY name LIMIT ? OFFSET ?",args.toArray()),"page",page,"limit",limit,"total",total.get("total"));
    }
    @GetMapping("/api/v1/stations/{id}") public Map<String,Object> station(@PathVariable String id){var s=db.one("SELECT * FROM stations WHERE id=?",id);if(s==null)throw new NoSuchElementException("Station not found");return s;}
    @PostMapping("/api/v1/admin/stations") public ResponseEntity<?> createStation(@Valid @RequestBody StationInput x,HttpServletRequest req){
        auth.admin(req);String id=UUID.randomUUID().toString();int ports=x.totalPorts()==null?2:Math.max(1,Math.min(100,x.totalPorts()));
        BigDecimal pricePerKwhInr=x.pricePerKwh()==null?defaultPricePerKwhInr:x.pricePerKwh();
        db.update("INSERT INTO stations(id,name,address,city,state,latitude,longitude,status,connector_type,power_kw,price_per_kwh,total_ports,available_ports) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)",id,x.name(),x.address(),x.city(),x.state(),x.latitude(),x.longitude(),x.status()==null?"AVAILABLE":x.status(),x.connectorType()==null?"CCS2":x.connectorType(),x.powerKw()==null?30:x.powerKw(),pricePerKwhInr,ports,ports);
        return ResponseEntity.status(201).body(station(id));
    }

    @GetMapping("/api/v1/vehicles") public List<Map<String,Object>> vehicles(HttpServletRequest req){return db.query("SELECT * FROM vehicles WHERE user_id=? ORDER BY is_primary DESC,created_at DESC",auth.user(req).get("id"));}
    @PostMapping("/api/v1/vehicles") public ResponseEntity<?> addVehicle(@Valid @RequestBody VehicleInput x,HttpServletRequest req){String uid=String.valueOf(auth.user(req).get("id"));String id=UUID.randomUUID().toString();int primary=db.one("SELECT COUNT(*) AS n FROM vehicles WHERE user_id=?",uid).get("n") instanceof Number n&&n.intValue()==0?1:0;db.update("INSERT INTO vehicles(id,user_id,make,model,registration_number,connector_type,battery_capacity,is_primary) VALUES(?,?,?,?,?,?,?,?)",id,uid,x.make(),x.model(),x.registrationNumber(),x.connectorType()==null?"CCS2":x.connectorType(),x.batteryCapacity()==null?40:x.batteryCapacity(),primary);return ResponseEntity.status(201).body(db.one("SELECT * FROM vehicles WHERE id=?",id));}
    @PatchMapping("/api/v1/vehicles/{id}") public Map<String,Object> patchVehicle(@PathVariable String id,@RequestBody Map<String,Object> x,HttpServletRequest req){String uid=String.valueOf(auth.user(req).get("id"));if(db.one("SELECT id FROM vehicles WHERE id=? AND user_id=?",id,uid)==null)throw new NoSuchElementException("Vehicle not found");var old=db.one("SELECT * FROM vehicles WHERE id=?",id);db.update("UPDATE vehicles SET make=?,model=?,registration_number=?,connector_type=?,battery_capacity=? WHERE id=?",x.getOrDefault("make",old.get("make")),x.getOrDefault("model",old.get("model")),x.getOrDefault("registrationNumber",old.get("registration_number")),x.getOrDefault("connectorType",old.get("connector_type")),x.getOrDefault("batteryCapacity",old.get("battery_capacity")),id);return db.one("SELECT * FROM vehicles WHERE id=?",id);}
    @DeleteMapping("/api/v1/vehicles/{id}") public Map<String,Object> deleteVehicle(@PathVariable String id,HttpServletRequest req){String uid=String.valueOf(auth.user(req).get("id"));if(db.update("DELETE FROM vehicles WHERE id=? AND user_id=?",id,uid)==0)throw new NoSuchElementException("Vehicle not found");return Map.of("success",true);}
    @PostMapping("/api/v1/vehicles/{id}/primary") public Map<String,Object> primaryVehicle(@PathVariable String id,HttpServletRequest req){String uid=String.valueOf(auth.user(req).get("id"));if(db.one("SELECT id FROM vehicles WHERE id=? AND user_id=?",id,uid)==null)throw new NoSuchElementException("Vehicle not found");db.update("UPDATE vehicles SET is_primary=0 WHERE user_id=?",uid);db.update("UPDATE vehicles SET is_primary=1 WHERE id=? AND user_id=?",id,uid);return db.one("SELECT * FROM vehicles WHERE id=?",id);}

    @PostMapping("/api/v1/bookings") public ResponseEntity<?> createBooking(@Valid @RequestBody BookingInput x,HttpServletRequest req){
        String uid=String.valueOf(auth.user(req).get("id"));var s=station(x.stationId());
        LocalDateTime start=LocalDateTime.parse(x.startTime()),end=LocalDateTime.parse(x.endTime());if(!end.isAfter(start)||start.isBefore(LocalDateTime.now().minusMinutes(1)))throw new IllegalArgumentException("Invalid booking time range");
        if(!"AVAILABLE".equals(s.get("status")))throw new IllegalArgumentException("Station is not available");
        if(x.vehicleId()!=null&&db.one("SELECT id FROM vehicles WHERE id=? AND user_id=?",x.vehicleId(),uid)==null)throw new IllegalArgumentException("Vehicle does not belong to this user");
        if(db.one("SELECT id FROM bookings WHERE station_id=? AND status='CONFIRMED' AND start_time < ? AND end_time > ?",x.stationId(),x.endTime(),x.startTime())!=null)throw new IllegalArgumentException("Booking overlaps an existing booking");
        BigDecimal energyKwh=x.estimatedKwh();
        BigDecimal pricePerKwhInr=new BigDecimal(String.valueOf(s.get("price_per_kwh")));
        BigDecimal estimatedCostInr=BookingPricing.estimateCost(energyKwh,pricePerKwhInr);
        String id=UUID.randomUUID().toString(),qr=UUID.randomUUID().toString();
        db.update("INSERT INTO bookings(id,user_id,station_id,vehicle_id,start_time,end_time,status,estimated_kwh,estimated_cost,qr_token) VALUES(?,?,?,?,?,?,'CONFIRMED',?,?,?)",id,uid,x.stationId(),x.vehicleId(),x.startTime(),x.endTime(),energyKwh,estimatedCostInr,qr);
        return ResponseEntity.status(201).body(db.one("SELECT * FROM bookings WHERE id=?",id));
    }
    @GetMapping("/api/v1/bookings") public List<Map<String,Object>> bookings(HttpServletRequest req){return db.query("SELECT b.*,s.name AS station_name FROM bookings b JOIN stations s ON s.id=b.station_id WHERE b.user_id=? ORDER BY b.created_at DESC",auth.user(req).get("id"));}
    @PostMapping("/api/v1/bookings/{id}/cancel") public Map<String,Object> cancelBooking(@PathVariable String id,HttpServletRequest req){String uid=String.valueOf(auth.user(req).get("id"));if(db.update("UPDATE bookings SET status='CANCELLED' WHERE id=? AND user_id=? AND status='CONFIRMED'",id,uid)==0)throw new IllegalArgumentException("Booking not found or cannot be cancelled");return db.one("SELECT * FROM bookings WHERE id=?",id);}

    @PostMapping("/api/v1/sessions") public ResponseEntity<?> startSession(@RequestBody Map<String,Object> in,HttpServletRequest req){String uid=String.valueOf(auth.user(req).get("id"));String sid=String.valueOf(in.get("stationId"));var s=station(sid);if(!"AVAILABLE".equals(s.get("status")))throw new IllegalArgumentException("Station is not available");String id=UUID.randomUUID().toString();db.update("INSERT INTO sessions(id,user_id,station_id,status,mode) VALUES(?,?,?,'CHARGING','SIMULATED')",id,uid,sid);return ResponseEntity.status(201).body(db.one("SELECT * FROM sessions WHERE id=?",id));}
    @GetMapping("/api/v1/sessions") public List<Map<String,Object>> sessions(HttpServletRequest req){return db.query("SELECT * FROM sessions WHERE user_id=? ORDER BY started_at DESC",auth.user(req).get("id"));}
    @PostMapping("/api/v1/sessions/{id}/{action}") public Map<String,Object> sessionAction(@PathVariable String id,@PathVariable String action,HttpServletRequest req){String uid=String.valueOf(auth.user(req).get("id"));var old=db.one("SELECT * FROM sessions WHERE id=? AND user_id=?",id,uid);if(old==null)throw new NoSuchElementException("Session not found");String status=switch(action){case "pause"->"PAUSED";case "resume"->"CHARGING";case "stop"->"COMPLETED";default->throw new IllegalArgumentException("Action must be pause, resume, or stop");};if("COMPLETED".equals(old.get("status")))throw new IllegalArgumentException("Session already stopped");db.update("UPDATE sessions SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?",status,id);return db.one("SELECT * FROM sessions WHERE id=?",id);}

    @GetMapping("/api/v1/wallet") public Map<String,Object> wallet(HttpServletRequest req){String uid=String.valueOf(auth.user(req).get("id"));var u=db.one("SELECT wallet_balance FROM users WHERE id=?",uid);return Map.of("balance",u.get("wallet_balance"),"currency","INR","ledger",db.query("SELECT id,amount,kind,description,created_at FROM wallet_ledger WHERE user_id=? ORDER BY created_at DESC LIMIT 100",uid));}
    @PostMapping("/api/v1/wallet/demo-credit") public Map<String,Object> demoCredit(@Valid @RequestBody CreditInput in,HttpServletRequest req){if("production".equalsIgnoreCase(appEnv))throw new IllegalArgumentException("Demo credit is disabled in production");String uid=String.valueOf(auth.user(req).get("id"));String key=req.getHeader("Idempotency-Key");if(key!=null&&!key.isBlank()&&db.one("SELECT id FROM wallet_ledger WHERE user_id=? AND idempotency_key=?",uid,key)!=null)return wallet(req);db.update("UPDATE users SET wallet_balance=wallet_balance+? WHERE id=?",in.amount(),uid);db.update("INSERT INTO wallet_ledger(id,user_id,amount,kind,description,idempotency_key) VALUES(?,?,?,'DEMO_CREDIT',?,?,?)".replace("VALUES(?,?,?,'DEMO_CREDIT',?,?,?)","VALUES(?,?,?,'DEMO_CREDIT',?,?)"),UUID.randomUUID().toString(),uid,in.amount(),in.description()==null?"Demo wallet credit":in.description(),key);return wallet(req);}

    @ExceptionHandler(Exception.class) public ResponseEntity<Map<String,Object>> errors(Exception e){
        HttpStatus status=HttpStatus.BAD_REQUEST;
        if(e instanceof NoSuchElementException)status=HttpStatus.NOT_FOUND;
        else if(e instanceof org.springframework.web.bind.MethodArgumentNotValidException || e instanceof jakarta.validation.ConstraintViolationException)status=HttpStatus.BAD_REQUEST;
        else if(e instanceof org.springframework.dao.DuplicateKeyException)status=HttpStatus.CONFLICT;
        String message=e.getMessage()==null?"Request failed":e.getMessage();
        return ResponseEntity.status(status).body(Map.of("error",message));
    }
}
