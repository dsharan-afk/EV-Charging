import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ARCHITECTURE_LAYERS_DATA } from '../data/mockData';
import {
  Layers,
  Server,
  Code,
  Database,
  ShieldCheck,
  Cpu,
  ArrowDown,
  ArrowRight,
  X,
  Play,
  CheckCircle,
  Terminal,
  Activity,
} from 'lucide-react';

export const ArchitectureModal: React.FC = () => {
  const { isArchitectureModalOpen, setIsArchitectureModalOpen, recentApiCall } = useApp();
  const [activeTab, setActiveTab] = useState<'flow' | 'rest' | 'domain' | 'jpa' | 'mysql'>('flow');
  const [simulatedTraceStep, setSimulatedTraceStep] = useState<number | null>(null);
  const [isTracing, setIsTracing] = useState(false);

  if (!isArchitectureModalOpen) return null;

  const triggerTraceSimulation = () => {
    setIsTracing(true);
    setSimulatedTraceStep(1);

    setTimeout(() => setSimulatedTraceStep(2), 600);
    setTimeout(() => setSimulatedTraceStep(3), 1200);
    setTimeout(() => setSimulatedTraceStep(4), 1800);
    setTimeout(() => setSimulatedTraceStep(5), 2400);
    setTimeout(() => {
      setSimulatedTraceStep(6);
      setIsTracing(false);
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-5xl rounded-3xl border border-neutral-800 bg-neutral-950 p-6 sm:p-8 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-neutral-800 pb-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
              <Layers className="h-4 w-4" />
              <span>5-Layer Enterprise EV Architecture</span>
            </div>
            <h2 className="text-2xl font-bold text-white mt-1">
              EV Charging Station Management System
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              5-layer architecture for reliable, scalable, and intelligent charging operations (Spring Boot, Java OOP, JPA, MySQL)
            </p>
          </div>

          <button
            onClick={() => setIsArchitectureModalOpen(false)}
            className="rounded-xl p-2 text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs for Architecture Inspection */}
        <div className="flex flex-wrap items-center gap-2 border-b border-neutral-800/80 pb-3">
          <button
            onClick={() => setActiveTab('flow')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'flow'
                ? 'bg-emerald-500 text-neutral-950'
                : 'bg-neutral-900 text-neutral-400 hover:text-white'
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            <span>01. 5-Layer Flow Diagram</span>
          </button>

          <button
            onClick={() => setActiveTab('rest')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'rest'
                ? 'bg-emerald-500 text-neutral-950'
                : 'bg-neutral-900 text-neutral-400 hover:text-white'
            }`}
          >
            <Server className="h-3.5 w-3.5" />
            <span>02. Application Layer (Spring Boot REST)</span>
          </button>

          <button
            onClick={() => setActiveTab('domain')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'domain'
                ? 'bg-emerald-500 text-neutral-950'
                : 'bg-neutral-900 text-neutral-400 hover:text-white'
            }`}
          >
            <Code className="h-3.5 w-3.5" />
            <span>03. Business / Domain Layer (Java OOP)</span>
          </button>

          <button
            onClick={() => setActiveTab('jpa')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'jpa'
                ? 'bg-emerald-500 text-neutral-950'
                : 'bg-neutral-900 text-neutral-400 hover:text-white'
            }`}
          >
            <Cpu className="h-3.5 w-3.5" />
            <span>04. Data Access Layer (JPA / Hibernate)</span>
          </button>

          <button
            onClick={() => setActiveTab('mysql')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'mysql'
                ? 'bg-emerald-500 text-neutral-950'
                : 'bg-neutral-900 text-neutral-400 hover:text-white'
            }`}
          >
            <Database className="h-3.5 w-3.5" />
            <span>05. Database Layer (MySQL Tables)</span>
          </button>
        </div>

        {/* Tab 1: 5-Layer Flow Diagram */}
        {activeTab === 'flow' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-neutral-900/60 p-4 rounded-2xl border border-neutral-800">
              <div>
                <h3 className="text-sm font-bold text-white">Live End-to-End Request Pipeline</h3>
                <p className="text-xs text-neutral-400">
                  Simulate a real booking request traversal through all 5 layers from client to MySQL
                </p>
              </div>
              <button
                onClick={triggerTraceSimulation}
                disabled={isTracing}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-500 text-neutral-950 hover:bg-emerald-400 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>{isTracing ? 'Tracing Handshake...' : 'Simulate Request Flow'}</span>
              </button>
            </div>

            {/* 5 Layer Cards Stack */}
            <div className="space-y-3 font-mono">
              {/* Layer 1: Presentation */}
              <div
                className={`rounded-2xl border p-4 transition-all ${
                  simulatedTraceStep === 1 || simulatedTraceStep === 6
                    ? 'border-emerald-400 bg-emerald-950/30 ring-2 ring-emerald-500/30'
                    : 'border-neutral-800 bg-neutral-900/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="h-7 w-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                      01
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-white">PRESENTATION LAYER (Client-Side)</h4>
                      <p className="text-xs text-neutral-400 font-sans">
                        Web Interface: Home · Charging Stations · My Vehicle · Booking · Profile (HTML, CSS, JS)
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-emerald-400 font-sans hidden sm:inline">User / Browser</span>
                </div>
              </div>

              <div className="flex justify-center text-neutral-600">
                <ArrowDown className="h-4 w-4 animate-bounce" />
              </div>

              {/* Layer 2: Application */}
              <div
                className={`rounded-2xl border p-4 transition-all ${
                  simulatedTraceStep === 2
                    ? 'border-emerald-400 bg-emerald-950/30 ring-2 ring-emerald-500/30'
                    : 'border-neutral-800 bg-neutral-900/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="h-7 w-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                      02
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-white">APPLICATION LAYER (Spring Boot REST)</h4>
                      <p className="text-xs text-neutral-400 font-sans">
                        User Management · Vehicle Management · Station Management · Booking · Charging · Payment
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-emerald-400 font-sans hidden sm:inline">REST APIs</span>
                </div>
              </div>

              <div className="flex justify-center text-neutral-600">
                <ArrowDown className="h-4 w-4 animate-bounce" />
              </div>

              {/* Layer 3: Domain */}
              <div
                className={`rounded-2xl border p-4 transition-all ${
                  simulatedTraceStep === 3
                    ? 'border-emerald-400 bg-emerald-950/30 ring-2 ring-emerald-500/30'
                    : 'border-neutral-800 bg-neutral-900/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="h-7 w-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                      03
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-white">BUSINESS / DOMAIN LAYER (Java OOP)</h4>
                      <p className="text-xs text-neutral-400 font-sans">
                        Domain Entities · ChargingService · Slot Conflict Validation · JWT Security Filter
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-emerald-400 font-sans hidden sm:inline">Java Logic</span>
                </div>
              </div>

              <div className="flex justify-center text-neutral-600">
                <ArrowDown className="h-4 w-4 animate-bounce" />
              </div>

              {/* Layer 4: Data Access */}
              <div
                className={`rounded-2xl border p-4 transition-all ${
                  simulatedTraceStep === 4
                    ? 'border-emerald-400 bg-emerald-950/30 ring-2 ring-emerald-500/30'
                    : 'border-neutral-800 bg-neutral-900/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="h-7 w-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                      04
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-white">DATA ACCESS LAYER (Spring Data JPA)</h4>
                      <p className="text-xs text-neutral-400 font-sans">
                        Hibernate ORM · Repositories: StationRepository · BookingRepository · TransactionRepository
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-emerald-400 font-sans hidden sm:inline">Hibernate</span>
                </div>
              </div>

              <div className="flex justify-center text-neutral-600">
                <ArrowDown className="h-4 w-4 animate-bounce" />
              </div>

              {/* Layer 5: Database */}
              <div
                className={`rounded-2xl border p-4 transition-all ${
                  simulatedTraceStep === 5
                    ? 'border-emerald-400 bg-emerald-950/30 ring-2 ring-emerald-500/30'
                    : 'border-neutral-800 bg-neutral-900/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="h-7 w-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                      05
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-white">DATABASE LAYER (MySQL Relational)</h4>
                      <p className="text-xs text-neutral-400 font-sans">
                        Tables: users · vehicles · charging_stations · charging_ports · bookings · payments
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-emerald-400 font-sans hidden sm:inline">MySQL InnoDB</span>
                </div>
              </div>
            </div>

            {/* Trace Step Result Notice */}
            {simulatedTraceStep === 6 && (
              <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-500/40 flex items-center gap-3 text-xs text-emerald-300">
                <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
                <span>
                  <strong>Request Lifecycle Complete (200 OK):</strong> MySQL returned transaction commit, Hibernate mapped entity DTO, Spring Service confirmed charging state, and React UI refreshed live telemetry without reload.
                </span>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Spring Boot REST APIs */}
        {activeTab === 'rest' && (
          <div className="space-y-4 font-mono text-xs">
            <p className="text-neutral-400 font-sans text-xs">
              The Application Layer exposes RESTful endpoints built with Spring MVC (`@RestController`) consuming and returning JSON payloads.
            </p>

            <div className="space-y-3">
              <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">GET</span>
                  <span className="text-white font-bold">/api/v1/stations/nearby</span>
                </div>
                <p className="text-neutral-400 font-sans text-xs">Queries stations within radius with active port availability.</p>
                <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 text-[11px] text-neutral-300 overflow-x-auto">
                  {`// Response 200 OK\n[\n  {\n    "id": "stn_101",\n    "name": "Downtown Supercharge Hub",\n    "powerKw": 350,\n    "availablePorts": 5,\n    "pricingPerKwh": 0.36\n  }\n]`}
                </div>
              </div>

              <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold">POST</span>
                  <span className="text-white font-bold">/api/v1/bookings/reserve</span>
                </div>
                <p className="text-neutral-400 font-sans text-xs">Atomically reserves a stall and generates an encrypted QR pass token.</p>
                <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 text-[11px] text-neutral-300 overflow-x-auto">
                  {`// Request Body\n{\n  "userId": "usr_001",\n  "vehicleId": "veh_001",\n  "stationId": "stn_101",\n  "portNumber": 1,\n  "timeSlot": "04:30 PM - 05:15 PM"\n}`}
                </div>
              </div>

              <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold">POST</span>
                  <span className="text-white font-bold">/api/v1/charging/session/start</span>
                </div>
                <p className="text-neutral-400 font-sans text-xs">Initializes high-power hardware session and live telemetry stream.</p>
              </div>

              <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 font-bold">POST</span>
                  <span className="text-white font-bold">/api/v1/payments/process</span>
                </div>
                <p className="text-neutral-400 font-sans text-xs">Settle session charges via wallet balance, saved card, or RFID debit.</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Java OOP Domain Layer */}
        {activeTab === 'domain' && (
          <div className="space-y-4 font-mono text-xs">
            <p className="text-neutral-400 font-sans text-xs">
              The Business/Domain Layer encapsulates domain logic in Java 21 classes, enforcing validation, pricing rules, and security.
            </p>

            <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4 space-y-3">
              <span className="text-emerald-400 text-xs font-bold block">// ChargingServiceImpl.java (Spring Service)</span>
              <pre className="text-[11px] text-neutral-300 leading-relaxed overflow-x-auto">
{`@Service
@Transactional
public class ChargingServiceImpl implements ChargingService {

    private final ChargingSessionRepository sessionRepository;
    private final StationRepository stationRepository;
    private final VehicleRepository vehicleRepository;

    @Override
    public ChargingSession startSession(StartSessionRequest request) {
        ChargingPort port = stationRepository.findPortById(request.getPortId())
            .orElseThrow(() -> new ResourceNotFoundException("Port not found"));
            
        if (port.getStatus() != PortStatus.AVAILABLE && port.getStatus() != PortStatus.RESERVED) {
            throw new IllegalStateException("Port is occupied or undergoing maintenance");
        }
        
        port.setStatus(PortStatus.OCCUPIED);
        ChargingSession session = ChargingSession.builder()
            .userId(request.getUserId())
            .vehicleId(request.getVehicleId())
            .port(port)
            .initialSoc(request.getCurrentSoc())
            .targetSoc(85)
            .status(SessionStatus.CHARGING)
            .startTime(Instant.now())
            .build();
            
        return sessionRepository.save(session);
    }
}`}
              </pre>
            </div>
          </div>
        )}

        {/* Tab 4: Spring Data JPA */}
        {activeTab === 'jpa' && (
          <div className="space-y-4 font-mono text-xs">
            <p className="text-neutral-400 font-sans text-xs">
              Spring Data JPA and Hibernate provide an ORM abstraction layer over MySQL, managing transactional boundaries and query generation.
            </p>

            <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4 space-y-3">
              <span className="text-emerald-400 text-xs font-bold block">// StationRepository.java</span>
              <pre className="text-[11px] text-neutral-300 leading-relaxed overflow-x-auto">
{`@Repository
public interface StationRepository extends JpaRepository<ChargingStation, String> {

    @Query("SELECT s FROM ChargingStation s WHERE s.status = 'OPERATIONAL' " +
           "AND (6371 * acos(cos(radians(:lat)) * cos(radians(s.latitude)) * " +
           "cos(radians(s.longitude) - radians(:lng)) + sin(radians(:lat)) * " +
           "sin(radians(s.latitude)))) <= :radiusKm")
    List<ChargingStation> findNearby(
        @Param("lat") double lat, 
        @Param("lng") double lng, 
        @Param("radiusKm") double radiusKm
    );

    @Query("SELECT COUNT(p) FROM ChargingPort p WHERE p.station.id = :stationId AND p.status = 'AVAILABLE'")
    int countAvailablePorts(@Param("stationId") String stationId);
}`}
              </pre>
            </div>
          </div>
        )}

        {/* Tab 5: MySQL Database Schema */}
        {activeTab === 'mysql' && (
          <div className="space-y-4 font-mono text-xs">
            <p className="text-neutral-400 font-sans text-xs">
              The Database Layer uses MySQL 8.0 InnoDB with foreign key integrity and B-Tree indexes for lightning-fast lookups.
            </p>

            <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4 space-y-3">
              <span className="text-emerald-400 text-xs font-bold block">-- MySQL Schema Definitions (schema.sql)</span>
              <pre className="text-[11px] text-neutral-300 leading-relaxed overflow-x-auto">
{`CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    wallet_balance DECIMAL(10,2) DEFAULT 0.00,
    rfid_tag VARCHAR(50),
    role ENUM('CUSTOMER', 'ADMIN') DEFAULT 'CUSTOMER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE charging_stations (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    power_kw INT NOT NULL,
    pricing_per_kwh DECIMAL(5,2) NOT NULL,
    status ENUM('OPERATIONAL', 'BUSY', 'MAINTENANCE') DEFAULT 'OPERATIONAL',
    INDEX idx_coords (latitude, longitude)
);

CREATE TABLE bookings (
    id VARCHAR(36) PRIMARY KEY,
    booking_reference VARCHAR(20) UNIQUE NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    station_id VARCHAR(36) NOT NULL,
    port_id VARCHAR(36) NOT NULL,
    status ENUM('CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED'),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (station_id) REFERENCES charging_stations(id)
);`}
              </pre>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-neutral-800 text-xs text-neutral-400">
          <span>Compliant with standard Spring Boot + MySQL production architecture</span>
          <button
            onClick={() => setIsArchitectureModalOpen(false)}
            className="px-5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-medium transition-colors"
          >
            Close Explorer
          </button>
        </div>
      </div>
    </div>
  );
};
