import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ConnectorType } from '../types';
import {
  Car,
  Plus,
  Check,
  History,
  X,
  Pencil,
  Trash2,
} from 'lucide-react';

export const VehicleView: React.FC = () => {
  const {
    vehicles,
    setPrimaryVehicle,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    isAddVehicleModalOpen,
    setIsAddVehicleModalOpen,
    transactions,
  } = useApp();

  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  const [formMake, setFormMake] = useState('');
  const [formModel, setFormModel] = useState('');
  const [formYear, setFormYear] = useState('');
  const [formPlate, setFormPlate] = useState('');
  const [formVin, setFormVin] = useState('');
  const [formBattery, setFormBattery] = useState('');
  const [formMaxKw, setFormMaxKw] = useState('');
  const [formConnector, setFormConnector] = useState<ConnectorType>('CCS2');

  const handleAddVehicleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const existingVehicle = editingVehicleId
      ? vehicles.find((vehicle) => vehicle.id === editingVehicleId)
      : undefined;
    const currentSocPercent = existingVehicle?.currentSocPercent ?? 50;
    const vehicleData = {
      make: formMake,
      model: formModel,
      year: Number(formYear),
      licensePlate: formPlate,
      ...(formVin.trim() ? { vin: formVin.trim() } : {}),
      batteryCapacityKwh: Number(formBattery),
      maxChargingRateKw: Number(formMaxKw),
      connectorType: formConnector,
      currentSocPercent,
      estimatedRangeKm: Math.round((currentSocPercent / 100) * Number(formBattery) * 5.8),
    };
    const saved = editingVehicleId
      ? await updateVehicle(editingVehicleId, vehicleData)
      : await addVehicle({ ...vehicleData, vin: formVin.trim() });
    if (saved) {
      setIsAddVehicleModalOpen(false);
      setEditingVehicleId(null);
      setFormMake('');
      setFormModel('');
      setFormYear('');
      setFormPlate('');
      setFormVin('');
      setFormBattery('');
      setFormMaxKw('');
    }
  };

  const openAddVehicle = () => {
    setEditingVehicleId(null);
    setFormMake('');
    setFormModel('');
    setFormYear('');
    setFormPlate('');
    setFormVin('');
    setFormBattery('');
    setFormMaxKw('');
    setFormConnector('CCS2');
    setIsAddVehicleModalOpen(true);
  };

  const openEditVehicle = (vehicleId: string) => {
    const vehicle = vehicles.find((item) => item.id === vehicleId);
    if (!vehicle) return;
    setEditingVehicleId(vehicle.id);
    setFormMake(vehicle.make);
    setFormModel(vehicle.model);
    setFormYear(String(vehicle.year));
    setFormPlate(vehicle.licensePlate);
    setFormVin('');
    setFormBattery(String(vehicle.batteryCapacityKwh));
    setFormMaxKw(String(vehicle.maxChargingRateKw));
    setFormConnector(vehicle.connectorType);
    setIsAddVehicleModalOpen(true);
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
          onClick={openAddVehicle}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-neutral-950 font-semibold text-xs hover:bg-emerald-400 transition-colors whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Add New EV</span>
        </button>
      </div>

      {/* Garage Fleet Selector */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white">Registered Fleet ({vehicles.length} Vehicles)</h2>
        {vehicles.length === 0 ? (
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-6 text-center space-y-3">
            <p className="text-sm font-semibold text-white">No vehicles added yet</p>
            <button
              onClick={openAddVehicle}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-neutral-950 font-semibold text-xs hover:bg-emerald-400 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add Vehicle</span>
            </button>
          </div>
        ) : (
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

              <div className="mt-3 pt-3 border-t border-neutral-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                <span className="text-neutral-400">{v.connectorType} ({v.batteryCapacityKwh} kWh)</span>
                <div className="flex items-center gap-3">
                  {v.isPrimary ? (
                    <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1">
                      <Check className="h-3.5 w-3.5" /> Primary
                    </span>
                  ) : (
                    <button
                      onClick={() => void setPrimaryVehicle(v.id)}
                      className="text-xs text-neutral-300 hover:text-white font-medium underline underline-offset-2"
                    >
                      Set as Primary
                    </button>
                  )}
                  <button
                    onClick={() => openEditVehicle(v.id)}
                    className="inline-flex items-center gap-1 text-xs text-neutral-300 hover:text-white font-medium"
                    aria-label={`Edit ${v.make} ${v.model}`}
                  >
                    <Pencil className="h-3 w-3" /> Edit
                  </button>
                  <button
                    onClick={() => deleteVehicle(v.id)}
                    className="inline-flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 font-medium"
                    aria-label={`Delete ${v.make} ${v.model}`}
                  >
                    <Trash2 className="h-3 w-3" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        )}
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

      {/* Add/Edit Vehicle Modal */}
      {isAddVehicleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Car className="h-5 w-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">
                  {editingVehicleId ? 'Edit Vehicle' : 'Register EV to Account'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsAddVehicleModalOpen(false);
                  setEditingVehicleId(null);
                }}
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
                    placeholder="Enter your vehicle make"
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
                    placeholder="Enter your vehicle model"
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
                    onChange={(e) => setFormYear(e.target.value)}
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
                    onChange={(e) => setFormBattery(e.target.value)}
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
                    onChange={(e) => setFormMaxKw(e.target.value)}
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
                  value={formVin}
                  onChange={(e) => setFormVin(e.target.value)}
                  className="w-full rounded-lg bg-neutral-900 border border-neutral-700 p-2 text-white font-mono"
                  placeholder={editingVehicleId ? 'Leave blank to keep the current VIN' : 'Optional'}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddVehicleModalOpen(false);
                    setEditingVehicleId(null);
                  }}
                  className="px-4 py-2 text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 text-neutral-950 font-semibold hover:bg-emerald-400 transition-colors"
                >
                  {editingVehicleId ? 'Save Changes' : 'Save Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
