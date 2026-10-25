import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ChargingStation, ChargingPort, ConnectorType, Booking } from '../types';
import {
  Calendar,
  Clock,
  MapPin,
  Zap,
  Car,
  QrCode,
  CheckCircle2,
  AlertCircle,
  X,
  Play,
  ArrowRight,
  ShieldCheck,
  Copy,
  Printer,
} from 'lucide-react';

export const BookingView: React.FC = () => {
  const {
    vehicles,
    primaryVehicle,
    stations,
    selectedStation,
    setSelectedStation,
    bookings,
    createBooking,
    cancelBooking,
    startChargingSession,
    showToast,
    copyToClipboard,
  } = useApp();

  const [selectedVehicleId, setSelectedVehicleId] = useState(primaryVehicle?.id || vehicles[0]?.id || '');
  const [chosenStationId, setChosenStationId] = useState(selectedStation?.id || stations[0]?.id || '');
  const currentStation = stations.find((s) => s.id === chosenStationId) || stations[0];

  const availablePorts = currentStation?.ports.filter((p) => p.status === 'AVAILABLE') || [];
  const [selectedPortId, setSelectedPortId] = useState<string>(availablePorts[0]?.id || currentStation?.ports[0]?.id || '');

  const [bookingDate, setBookingDate] = useState('Today');
  const [timeSlot, setTimeSlot] = useState('04:30 PM - 05:15 PM');
  const [durationMinutes, setDurationMinutes] = useState(45);

  const [viewingPass, setViewingPass] = useState<Booking | null>(null);

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId) || primaryVehicle;
  const selectedPort = currentStation?.ports.find((p) => p.id === selectedPortId) || currentStation?.ports[0];

  const estimatedEnergyKwh = Number(((durationMinutes / 60) * Math.min(currentStation.powerKw, selectedVehicle?.maxChargingRateKw || 150) * 0.75).toFixed(1));
  const estimatedCost = Number((estimatedEnergyKwh * currentStation.pricingPerKwh).toFixed(2));

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedVehicle || !currentStation || !selectedPort) {
      showToast('Please complete all booking selections', 'warning');
      return;
    }

    const newBooking = createBooking({
      vehicleId: selectedVehicle.id,
      vehicleName: `${selectedVehicle.make} ${selectedVehicle.model}`,
      stationId: currentStation.id,
      stationName: currentStation.name,
      stationAddress: `${currentStation.address}, ${currentStation.city}`,
      portId: selectedPort.id,
      portNumber: selectedPort.portNumber,
      connectorType: selectedPort.connectorType,
      date: bookingDate,
      timeSlot: timeSlot,
      durationMinutes: Number(durationMinutes),
      estimatedEnergyKwh,
      estimatedCost,
    });

    setViewingPass(newBooking);
  };

  const handleStartChargingFromBooking = (booking: Booking) => {
    const station = stations.find((s) => s.id === booking.stationId);
    const vehicle = vehicles.find((v) => v.id === booking.vehicleId) || primaryVehicle;

    if (!station) {
      showToast('Station information could not be loaded', 'error');
      return;
    }

    startChargingSession({
      station,
      portNumber: booking.portNumber,
      connectorType: booking.connectorType,
      vehicle,
      bookingId: booking.id,
    });

    setViewingPass(null);
  };

  const handlePrintPass = () => {
    window.print();
  };

  return (
    <div className="space-y-10 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Reserve Charging Stalls</h1>
        <p className="text-xs text-neutral-400 mt-0.5">
          Schedule guaranteed charging slots, bypass wait times, and receive an instant cryptographic access QR pass
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Reservation Form */}
        <div className="lg:col-span-7 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 md:p-8 space-y-6">
          <form onSubmit={handleBookingSubmit} className="space-y-6">
            {/* Step 1: Vehicle Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                <Car className="h-3.5 w-3.5 text-emerald-400" />
                <span>1. Select Electric Vehicle</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {vehicles.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVehicleId(v.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selectedVehicleId === v.id
                        ? 'border-emerald-500 bg-emerald-950/20 ring-1 ring-emerald-500/30'
                        : 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-700'
                    }`}
                  >
                    <p className="text-xs font-bold text-white truncate">{v.make} {v.model}</p>
                    <p className="text-[11px] text-neutral-400 font-mono mt-0.5">{v.connectorType} · {v.currentSocPercent}%</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Station Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                <span>2. Select Station Hub</span>
              </label>
              <select
                value={chosenStationId}
                onChange={(e) => {
                  setChosenStationId(e.target.value);
                  const stn = stations.find((s) => s.id === e.target.value);
                  if (stn && stn.ports.length > 0) {
                    setSelectedPortId(stn.ports[0].id);
                  }
                }}
                className="w-full rounded-xl bg-neutral-950 border border-neutral-800 p-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
              >
                {stations.map((stn) => (
                  <option key={stn.id} value={stn.id}>
                    {stn.name} ({stn.city}, {stn.state}) — {stn.powerKw}kW DC (₹{stn.pricingPerKwh.toFixed(2)}/kWh) · {stn.availablePorts} Open
                  </option>
                ))}
              </select>
            </div>

            {/* Step 3: Stall / Port Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-emerald-400" />
                <span>3. Choose Stall & Connector</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {currentStation.ports.map((port) => {
                  const isAvail = port.status === 'AVAILABLE';
                  const isSelected = selectedPortId === port.id;

                  return (
                    <button
                      key={port.id}
                      type="button"
                      disabled={!isAvail}
                      onClick={() => setSelectedPortId(port.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-950/30 ring-1 ring-emerald-500/30'
                          : isAvail
                          ? 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-700'
                          : 'border-neutral-900 bg-neutral-950/30 opacity-40 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-white">Stall #{port.portNumber}</span>
                        <span className={`text-[10px] ${isAvail ? 'text-emerald-400' : 'text-neutral-500'}`}>
                          {isAvail ? 'Open' : 'Busy'}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-0.5">{port.connectorType}</p>
                      <p className="text-[10px] font-mono text-neutral-500">{port.maxPowerKw} kW</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 4: Date & Time Slot */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300">Date</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {['Today', 'Tomorrow', 'Oct 27'].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setBookingDate(d)}
                      className={`py-2 text-xs font-medium rounded-lg border transition-colors ${
                        bookingDate === d
                          ? 'bg-neutral-800 border-emerald-500 text-white font-semibold'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300">Time Window</label>
                <select
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  className="w-full rounded-xl bg-neutral-950 border border-neutral-800 p-2.5 text-xs text-white"
                >
                  <option value="04:30 PM - 05:15 PM">04:30 PM - 05:15 PM (Next available)</option>
                  <option value="05:30 PM - 06:15 PM">05:30 PM - 06:15 PM</option>
                  <option value="06:30 PM - 07:15 PM">06:30 PM - 07:15 PM</option>
                  <option value="08:00 PM - 08:45 PM">08:00 PM - 08:45 PM (Off-Peak)</option>
                </select>
              </div>
            </div>

            {/* Step 5: Duration & Estimation */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-neutral-300">Session Target Duration</label>
              <div className="grid grid-cols-4 gap-2">
                {[30, 45, 60, 75].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDurationMinutes(mins)}
                    className={`py-2 text-xs font-mono font-medium rounded-lg border transition-colors ${
                      durationMinutes === mins
                        ? 'bg-emerald-500 text-neutral-950 font-bold border-emerald-400'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {mins} mins
                  </button>
                ))}
              </div>
            </div>

            {/* Live Cost & Energy Estimate Breakdown */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-950/80 p-4 space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between text-neutral-400">
                <span className="font-sans">Estimated Energy Delivery:</span>
                <span className="text-white font-semibold tabular-nums">~{estimatedEnergyKwh} kWh</span>
              </div>
              <div className="flex items-center justify-between text-neutral-400">
                <span className="font-sans">Station Base Rate:</span>
                <span className="text-white font-semibold tabular-nums">₹{currentStation.pricingPerKwh.toFixed(2)} / kWh</span>
              </div>
              <div className="flex items-center justify-between text-neutral-400">
                <span className="font-sans">Parking & Hold Reservation Fee:</span>
                <span className="text-emerald-400 font-semibold font-sans">FREE</span>
              </div>
              <div className="pt-2 border-t border-neutral-800 flex items-center justify-between font-bold text-sm text-white font-sans">
                <span>Estimated Total:</span>
                <span className="font-mono text-emerald-400 text-base tabular-nums">₹{estimatedCost.toFixed(2)}</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-emerald-500 text-neutral-950 font-bold text-sm hover:bg-emerald-400 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-emerald-500/20"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Confirm Reservation & Generate QR Pass</span>
            </button>
          </form>
        </div>

        {/* Right Column: Existing Bookings & Active Passes */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Your Scheduled Bookings</h2>
            <span className="text-xs text-neutral-400 font-mono">{bookings.length} reservations</span>
          </div>

          {bookings.length === 0 ? (
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-8 text-center space-y-2">
              <Calendar className="h-7 w-7 text-neutral-500 mx-auto" />
              <p className="text-xs font-semibold text-white">No Active Reservations</p>
              <p className="text-[11px] text-neutral-400">
                Schedule your next charging session using the reservation form on the left.
              </p>
            </div>
          ) : (
            bookings.map((booking) => {
              const isConfirmed = booking.status === 'CONFIRMED';
              const isActive = booking.status === 'ACTIVE';

              return (
                <div
                  key={booking.id}
                  className={`rounded-2xl border p-5 space-y-3 transition-all ${
                    isActive
                      ? 'border-emerald-500 bg-emerald-950/20'
                      : isConfirmed
                      ? 'border-neutral-800 bg-neutral-900/60'
                      : 'border-neutral-900 bg-neutral-950/40 opacity-70'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      {/* Feature 9: Copy Reference ID */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-mono text-neutral-400">{booking.bookingReference}</span>
                        <button
                          onClick={() => copyToClipboard(booking.bookingReference, 'Booking Reference')}
                          className="p-0.5 text-neutral-500 hover:text-white"
                          title="Copy Booking ID"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                      <h3 className="font-bold text-white text-sm mt-0.5">{booking.stationName}</h3>
                      <p className="text-xs text-neutral-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3 text-neutral-500" />
                        <span>{booking.stationAddress}</span>
                      </p>
                    </div>

                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded font-mono ${
                        isConfirmed
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : isActive
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-neutral-800 text-neutral-400'
                      }`}
                    >
                      {booking.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 rounded-xl bg-neutral-950 p-2.5 text-xs font-mono border border-neutral-800/80">
                    <div>
                      <span className="text-[10px] text-neutral-500 block">Stall</span>
                      <span className="text-white font-bold">#{booking.portNumber} ({booking.connectorType})</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-500 block">Window</span>
                      <span className="text-neutral-200">{booking.timeSlot.split(' - ')[0]}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-500 block">Est. Cost</span>
                      <span className="text-emerald-400 font-bold">₹{booking.estimatedCost.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  {isConfirmed && (
                    <div className="pt-2 flex items-center gap-2">
                      <button
                        onClick={() => handleStartChargingFromBooking(booking)}
                        className="flex-1 py-2 text-xs font-semibold rounded-xl bg-emerald-500 text-neutral-950 hover:bg-emerald-400 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Play className="h-3.5 w-3.5 fill-current" />
                        <span>Plug In & Charge</span>
                      </button>

                      <button
                        onClick={() => setViewingPass(booking)}
                        className="p-2 text-xs font-medium rounded-xl bg-neutral-800 text-neutral-200 hover:bg-neutral-700"
                        title="View Digital QR Pass"
                      >
                        <QrCode className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => cancelBooking(booking.id)}
                        className="p-2 text-xs text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 rounded-xl"
                        title="Cancel Reservation"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Feature 10: Print-ready Digital QR Code Pass Modal */}
      {viewingPass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-sm rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl text-center space-y-4 print-card">
            <button
              onClick={() => setViewingPass(null)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white no-print"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto no-print">
              <QrCode className="h-6 w-6" />
            </div>

            <div>
              <h3 className="font-bold text-white text-lg">Digital Charging Pass</h3>
              <p className="text-xs text-neutral-400 mt-0.5">Scan at station kiosk or plug in to authenticate</p>
            </div>

            {/* Stylized QR Code Graphic Container */}
            <div className="rounded-xl border border-neutral-800 bg-white p-4 mx-auto w-44 h-44 flex items-center justify-center">
              <div className="w-full h-full border-4 border-black p-1 flex flex-col justify-between">
                <div className="flex justify-between">
                  <div className="w-8 h-8 bg-black flex items-center justify-center"><div className="w-4 h-4 bg-white" /></div>
                  <div className="w-8 h-8 bg-black flex items-center justify-center"><div className="w-4 h-4 bg-white" /></div>
                </div>
                <div className="flex justify-center items-center">
                  <div className="font-mono text-[9px] font-bold text-black tracking-widest">
                    {viewingPass.bookingReference}
                  </div>
                </div>
                <div className="flex justify-between">
                  <div className="w-8 h-8 bg-black flex items-center justify-center"><div className="w-4 h-4 bg-white" /></div>
                  <div className="w-6 h-6 bg-emerald-600 rounded-sm" />
                </div>
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <p className="font-semibold text-white">{viewingPass.stationName}</p>
              <p className="text-neutral-400 font-mono">Stall #{viewingPass.portNumber} · {viewingPass.connectorType}</p>
              <p className="text-emerald-400 font-semibold">{viewingPass.timeSlot}</p>
            </div>

            <div className="pt-2 flex flex-col gap-2 no-print">
              <button
                onClick={handlePrintPass}
                className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2"
              >
                <Printer className="h-4 w-4" />
                <span>Print Pass (PDF)</span>
              </button>

              <button
                onClick={() => handleStartChargingFromBooking(viewingPass)}
                className="w-full py-2.5 rounded-xl bg-emerald-500 text-neutral-950 font-bold text-xs hover:bg-emerald-400 transition-colors flex items-center justify-center gap-2"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>Simulate Sensor Arrival & Start Charge</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
