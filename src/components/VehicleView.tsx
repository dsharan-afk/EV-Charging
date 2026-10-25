import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { EV_CAR_IMAGE_URL } from '../data/mockData';
import { ConnectorType } from '../types';
import {
  Car,
  BatteryCharging,
  Zap,
  Plus,
  Check,
  Shield,
  Gauge,
  Sliders,
  History,
  Calendar,
  X,
  Sparkles,
} from 'lucide-react';

export const VehicleView: React.FC = () => {
  const {
    vehicles,
    primaryVehicle,
    setPrimaryVehicle,
    addVehicle,
    updateVehicleSoc,
    isAddVehicleModalOpen,
    setIsAddVehicleModalOpen,
    transactions,
    setActiveTab,
  } = useApp();

  const [formMake, setFormMake] = useState('Tata');
  const [formModel, setFormModel] = useState('Curvv.ev Empowered');
  const [formYear, setFormYear] = useState(2025);
  const [formPlate, setFormPlate] = useState('KA 01 EV 2025');
  const [formVin, setFormVin] = useState('MAT612089P1A55120');
  const [formBattery, setFormBattery] = useState(55);
  const [formMaxKw, setFormMaxKw] = useState(120);
  const [formConnector, setFormConnector] = useState<ConnectorType>('CCS2');

  const handleAddVehicleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addVehicle({
      make: formMake,
      model: formModel,
      year: Number(formYear),
      licensePlate: formPlate,
      vin: formVin,
      batteryCapacityKwh: Number(formBattery),
      maxChargingRateKw: Number(formMaxKw),
      connectorType: formConnector,
      currentSocPercent: 65,
      estimatedRangeKm: Math.round(65 * 0.01 * Number(formBattery) * 5.8),
    });
    setIsAddVehicleModalOpen(false);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">My Electric Garage</h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Manage your registered electric vehicles, monitor live battery SoC, and configure charging profiles
          </p>
        </div>

        <button
          onClick={() => setIsAddVehicleModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-neutral-950 font-semibold text-xs hover:bg-emerald-400 transition-colors whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Add New EV</span>
        </button>
      </div>

      {/* Featured Primary Vehicle Card */}
      {primaryVehicle && (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 md:p-8 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: Vehicle Image & Specs */}
            <div className="lg:col-span-5 space-y-4">
              <div className="relative rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950 aspect-video">
                <img
                  src={primaryVehicle.photoUrl || EV_CAR_IMAGE_URL}
                  alt={`${primaryVehicle.make} ${primaryVehicle.model}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-neutral-950/80 backdrop-blur-md border border-neutral-700 text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5" />
                  <span>Primary EV</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-neutral-400 border-t border-neutral-800/80 pt-3">
                <span>VIN: <span className="font-mono text-neutral-300">{primaryVehicle.vin}</span></span>
                <span>Plate: <span className="font-mono font-bold text-white bg-neutral-800 px-2 py-0.5 rounded">{primaryVehicle.licensePlate}</span></span>
              </div>
            </div>

            {/* Right: Real-time SoC Battery Telemetry & Controls */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-white">
                    {primaryVehicle.year} {primaryVehicle.make} {primaryVehicle.model}
                  </h2>
                </div>
                <p className="text-xs text-neutral-400 mt-1">
                  Compatible with {primaryVehicle.connectorType} Fast DC charging up to {primaryVehicle.maxChargingRateKw} kW
                </p>
              </div>

              {/* Live Battery SoC Gauge */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-950/80 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BatteryCharging className="h-5 w-5 text-emerald-400 animate-pulse" />
                    <span className="text-sm font-semibold text-white">Battery State of Charge (SoC)</span>
                  </div>
                  <span className="text-2xl font-extrabold text-white font-mono tabular-nums">
                    {primaryVehicle.currentSocPercent}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="h-3 w-full rounded-full bg-neutral-800 overflow-hidden relative">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        primaryVehicle.currentSocPercent < 20
                          ? 'bg-rose-500'
                          : primaryVehicle.currentSocPercent < 50
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${primaryVehicle.currentSocPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-neutral-500 font-mono">
                    <span>0% (Empty)</span>
                    <span>50%</span>
                    <span>80% (Recommended)</span>
                    <span>100% (Full)</span>
                  </div>
                </div>

                {/* Interactive Slider for Demonstration */}
                <div className="pt-2 border-t border-neutral-800/80 flex items-center gap-3">
                  <Sliders className="h-4 w-4 text-neutral-500 shrink-0" />
                  <span className="text-xs text-neutral-400 whitespace-nowrap">Simulate SoC:</span>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={primaryVehicle.currentSocPercent}
                    onChange={(e) => updateVehicleSoc(primaryVehicle.id, Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <span className="text-xs font-mono text-emerald-400 font-bold w-10 text-right">
                    {primaryVehicle.currentSocPercent}%
                  </span>
                </div>
              </div>

              {/* 3 Metric Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-3.5">
                  <span className="text-[11px] text-neutral-400 block">Est. Clean Range</span>
                  <span className="text-lg font-bold text-white font-mono tabular-nums">
                    {primaryVehicle.estimatedRangeKm} km
                  </span>
                </div>
                <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-3.5">
                  <span className="text-[11px] text-neutral-400 block">Pack Capacity</span>
                  <span className="text-lg font-bold text-white font-mono tabular-nums">
                    {primaryVehicle.batteryCapacityKwh} kWh
                  </span>
                </div>
                <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-3.5">
                  <span className="text-[11px] text-neutral-400 block">Peak DC Power</span>
                  <span className="text-lg font-bold text-white font-mono tabular-nums">
                    {primaryVehicle.maxChargingRateKw} kW
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setActiveTab('stations')}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 text-neutral-950 font-semibold text-xs hover:bg-emerald-400 transition-colors flex items-center justify-center gap-2"
                >
                  <Zap className="h-4 w-4 fill-current" />
                  <span>Find Compatible Superchargers</span>
                </button>
                <button
                  onClick={() => setActiveTab('booking')}
                  className="py-2.5 px-4 rounded-xl bg-neutral-800 text-white font-medium text-xs hover:bg-neutral-700 transition-colors flex items-center gap-2"
                >
                  <Calendar className="h-4 w-4 text-emerald-400" />
                  <span>Schedule Slot</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Garage Fleet Selector */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white">Registered Fleet ({vehicles.length} Vehicles)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {vehicles.map((v) => (
            <div
              key={v.id}
              className={`rounded-xl border p-4 transition-all ${
                v.isPrimary
                  ? 'border-emerald-500/60 bg-neutral-900/80 ring-1 ring-emerald-500/20'
                  : 'border-neutral-800 bg-neutral-900/40 hover:border-neutral-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-white text-sm">{v.make} {v.model}</h3>
                  <p className="text-xs text-neutral-400 font-mono mt-0.5">{v.licensePlate} · {v.year}</p>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
                  {v.currentSocPercent}%
                </span>
              </div>

              <div className="mt-3 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs">
                <span className="text-neutral-400">{v.connectorType} ({v.batteryCapacityKwh} kWh)</span>
                {v.isPrimary ? (
                  <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" /> Primary
                  </span>
                ) : (
                  <button
                    onClick={() => setPrimaryVehicle(v.id)}
                    className="text-xs text-neutral-300 hover:text-white font-medium underline underline-offset-2"
                  >
                    Set as Primary
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Vehicle Charging History */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Recent Charging Sessions for This Vehicle</h2>
          </div>
          <span className="text-xs text-neutral-400 font-mono">Synced with MySQL charging_sessions</span>
        </div>

        <div className="divide-y divide-neutral-800">
          {transactions.slice(0, 3).map((tx) => (
            <div key={tx.id} className="py-3 flex items-center justify-between text-xs">
              <div>
                <p className="font-semibold text-white">{tx.description}</p>
                <p className="text-[11px] text-neutral-400 mt-0.5">{tx.timestamp} · Invoice {tx.invoiceNumber}</p>
              </div>
              <div className="text-right font-mono">
                <p className="font-bold text-white">₹{tx.amount.toFixed(2)}</p>
                <p className="text-[11px] text-emerald-400">{tx.breakdown.energyKwh} kWh added</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Vehicle Modal */}
      {isAddVehicleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Car className="h-5 w-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">Register EV to Account</h3>
              </div>
              <button
                onClick={() => setIsAddVehicleModalOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddVehicleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-neutral-300 font-medium">Make</label>
                  <input
                    type="text"
                    required
                    value={formMake}
                    onChange={(e) => setFormMake(e.target.value)}
                    className="w-full rounded-lg bg-neutral-900 border border-neutral-700 p-2 text-white"
                    placeholder="e.g. Tata, Mahindra, Hyundai, MG"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-neutral-300 font-medium">Model</label>
                  <input
                    type="text"
                    required
                    value={formModel}
                    onChange={(e) => setFormModel(e.target.value)}
                    className="w-full rounded-lg bg-neutral-900 border border-neutral-700 p-2 text-white"
                    placeholder="e.g. Nexon.ev, XUV400, ZS EV, Curvv.ev"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-neutral-300 font-medium">Year</label>
                  <input
                    type="number"
                    required
                    value={formYear}
                    onChange={(e) => setFormYear(Number(e.target.value))}
                    className="w-full rounded-lg bg-neutral-900 border border-neutral-700 p-2 text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-neutral-300 font-medium">License Plate</label>
                  <input
                    type="text"
                    required
                    value={formPlate}
                    onChange={(e) => setFormPlate(e.target.value)}
                    className="w-full rounded-lg bg-neutral-900 border border-neutral-700 p-2 text-white"
                    placeholder="e.g. KA 01 EV 2025 / BH 24 EV 1000"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-neutral-300 font-medium">Battery (kWh)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formBattery}
                    onChange={(e) => setFormBattery(Number(e.target.value))}
                    className="w-full rounded-lg bg-neutral-900 border border-neutral-700 p-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-neutral-300 font-medium">Max Charge (kW)</label>
                  <input
                    type="number"
                    required
                    value={formMaxKw}
                    onChange={(e) => setFormMaxKw(Number(e.target.value))}
                    className="w-full rounded-lg bg-neutral-900 border border-neutral-700 p-2 text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-neutral-300 font-medium">Connector Standard</label>
                  <select
                    value={formConnector}
                    onChange={(e) => setFormConnector(e.target.value as ConnectorType)}
                    className="w-full rounded-lg bg-neutral-900 border border-neutral-700 p-2 text-white"
                  >
                    <option value="CCS2">CCS2 (Europe & Global DC)</option>
                    <option value="NACS">NACS (Tesla North American)</option>
                    <option value="Type 2">Type 2 (Mennekes AC)</option>
                    <option value="CHAdeMO">CHAdeMO</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-neutral-300 font-medium">VIN (Vehicle Identification Number)</label>
                <input
                  type="text"
                  required
                  value={formVin}
                  onChange={(e) => setFormVin(e.target.value)}
                  className="w-full rounded-lg bg-neutral-900 border border-neutral-700 p-2 text-white font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsAddVehicleModalOpen(false)}
                  className="px-4 py-2 text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 text-neutral-950 font-semibold hover:bg-emerald-400 transition-colors"
                >
                  Save Vehicle to DB
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
