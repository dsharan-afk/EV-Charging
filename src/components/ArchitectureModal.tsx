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
              React/Vite frontend with a Node/SQLite API and a separate Java/SQLite backend
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
            <span>02. Application Layer (Node REST API)</span>
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
            <span>03. API Logic & Authorization</span>
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
            <span>04. Data Access Layer (SQLite)</span>
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
            <span>05. Database Layer (Separate SQLite Stores)</span>
          </button>
        </div>

        {/* Tab 1: 5-Layer Flow Diagram */}
        {activeTab === 'flow' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-neutral-900/60 p-4 rounded-2xl border border-neutral-800">
              <div>
                <h3 className="text-sm font-bold text-white">Illustrative Request Pipeline</h3>
                <p className="text-xs text-neutral-400">
                  This animation illustrates the layers; it does not issue a live API request.
                </p>
              </div>
              <button
                onClick={triggerTraceSimulation}
                disabled={isTracing}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-500 text-neutral-950 hover:bg-emerald-400 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>{isTracing ? 'Animating...' : 'Animate Layer Flow'}</span>
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
                      <h4 className="text-sm font-bold text-white">PRESENTATION LAYER (React/Vite)</h4>
                      <p className="text-xs text-neutral-400 font-sans">
                        Auth, wallet, and saved methods use the API; station/vehicle/booking screens still include demo data.
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
                      <h4 className="text-sm font-bold text-white">APPLICATION LAYER (Node.js / Express)</h4>
                      <p className="text-xs text-neutral-400 font-sans">
                        Authentication · Persisted Wallet Reads · Saved Payment Methods
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
                      <h4 className="text-sm font-bold text-white">API LOGIC & AUTHORIZATION</h4>
                      <p className="text-xs text-neutral-400 font-sans">
                        Zod Validation · JWT Identity · User-Scoped Data Access
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-emerald-400 font-sans hidden sm:inline">Node API</span>
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
                      <h4 className="text-sm font-bold text-white">DATA ACCESS LAYER (SQLite)</h4>
                      <p className="text-xs text-neutral-400 font-sans">
                        Parameterized better-sqlite3 queries and SQLite transactions
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-emerald-400 font-sans hidden sm:inline">Node database</span>
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
                      <h4 className="text-sm font-bold text-white">DATABASE LAYER (SQLite)</h4>
                      <p className="text-xs text-neutral-400 font-sans">
                        Node and Java backends use separate SQLite database files; they are not synchronized.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-emerald-400 font-sans hidden sm:inline">Two SQLite stores</span>
                </div>
              </div>
            </div>

            {/* Trace Step Result Notice */}
            {simulatedTraceStep === 6 && (
              <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-500/40 flex items-center gap-3 text-xs text-emerald-300">
                <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
                <span>
                  <strong>Animation complete:</strong> No API request was executed. The Node API handles account, wallet, and saved-method endpoints; charging is simulated.
                </span>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Node.js REST APIs */}
        {activeTab === 'rest' && (
          <div className="space-y-4 font-mono text-xs">
            <p className="text-neutral-400 font-sans text-xs">
              The frontend targets the Node.js API. The Java Spring Boot service is separate and is not the current frontend API.
            </p>

            <div className="space-y-3">
              <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">GET</span>
                  <span className="text-white font-bold">/api/v1/wallet</span>
                </div>
                <p className="text-neutral-400 font-sans text-xs">Returns the signed-in user’s persisted INR balance and ledger; the user ID comes from the JWT.</p>
                <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 text-[11px] text-neutral-300 overflow-x-auto">
                  {`// Response 200 OK\n{\n  "balance": 0,\n  "currency": "INR",\n  "ledger": []\n}`}
                </div>
              </div>

              <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold">POST</span>
                  <span className="text-white font-bold">/api/v1/payment-methods</span>
                </div>
                <p className="text-neutral-400 font-sans text-xs">Lists only methods owned by the authenticated account.</p>
                <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 text-[11px] text-neutral-300 overflow-x-auto">
                  {`// Response 200 OK\n{\n  "items": []\n}`}
                </div>
              </div>

              <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold">POST</span>
                  <span className="text-white font-bold">POST /api/v1/payment-methods</span>
                </div>
                <p className="text-neutral-400 font-sans text-xs">Saves masked demo card metadata or an unverified UPI ID. No payment is attempted.</p>
              </div>

              <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 font-bold">POST</span>
                  <span className="text-white font-bold">DELETE /api/v1/payment-methods/{'{id}'}</span>
                </div>
                <p className="text-neutral-400 font-sans text-xs">Removes only a method owned by the signed-in account. Real payment processing is unavailable.</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Java OOP Domain Layer */}
        {activeTab === 'domain' && (
          <div className="space-y-4 font-mono text-xs">
            <p className="text-neutral-400 font-sans text-xs">
              The Java 21 Spring Boot project is a separate SQLite-backed service. The current frontend targets the Node API instead.
            </p>

            <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4 space-y-3">
              <span className="text-emerald-400 text-xs font-bold block">// Illustrative Java sample; not an implemented service in this repository</span>
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

        {/* Tab 4: Persistence */}
        {activeTab === 'jpa' && (
          <div className="space-y-4 font-mono text-xs">
            <p className="text-neutral-400 font-sans text-xs">
              The frontend-connected Node API uses parameterized better-sqlite3 queries. The separate Java service uses JDBC with SQLite; neither backend currently uses PostgreSQL.
            </p>

            <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4 space-y-3">
              <span className="text-emerald-400 text-xs font-bold block">// backend-java Database.java methods</span>
              <pre className="text-[11px] text-neutral-300 leading-relaxed overflow-x-auto">
{`Map<String, Object> account = db.one(
    "SELECT id, wallet_balance FROM users WHERE id = ?",
    authenticatedUserId
);

List<Map<String, Object>> ledgerEntries = db.query(
    "SELECT id, amount, kind FROM wallet_ledger WHERE user_id = ?",
    authenticatedUserId
);

// Separate SQLite/JDBC connection; not the frontend's Node API database.`}
              </pre>
            </div>
          </div>
        )}

        {/* Tab 5: SQLite Database Schema */}
        {activeTab === 'mysql' && (
          <div className="space-y-4 font-mono text-xs">
            <p className="text-neutral-400 font-sans text-xs">
              Both backends currently use SQLite in separate database files. The Node schema is initialized safely from backend/src/db.ts.
            </p>

            <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4 space-y-3">
              <span className="text-emerald-400 text-xs font-bold block">-- Node API SQLite schema overview</span>
              <pre className="text-[11px] text-neutral-300 leading-relaxed overflow-x-auto">
{`users:
  id TEXT PRIMARY KEY
  wallet_balance_minor INTEGER NOT NULL DEFAULT 0

wallet_ledger_entries:
  user_id REFERENCES users(id)
  UNIQUE(user_id, idempotency_key)

payment_methods:
  user_id REFERENCES users(id) ON DELETE CASCADE
  type CARD | UPI
  status DEMO_ONLY | UNVERIFIED`}
              </pre>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-neutral-800 text-xs text-neutral-400">
          <span>Current frontend API: Node.js + Express + SQLite; Java Spring Boot/SQLite is separate</span>
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
