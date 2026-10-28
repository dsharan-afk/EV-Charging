export type NavTab = 'home' | 'stations' | 'vehicle' | 'booking' | 'profile' | 'faq';

export type ConnectorType = 'CCS2' | 'Type 2' | 'CHAdeMO' | 'NACS';

export type PortStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE';

export type StationStatus = 'OPERATIONAL' | 'BUSY' | 'MAINTENANCE';

export type BookingStatus = 'CONFIRMED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export type ChargingSessionStatus = 'INITIALIZING' | 'CHARGING' | 'PAUSED' | 'COMPLETED';

export type PaymentStatus = 'SUCCESS' | 'PENDING' | 'FAILED';

export interface ChargingPort {
  id: string;
  stationId: string;
  portNumber: number;
  connectorType: ConnectorType;
  maxPowerKw: number;
  status: PortStatus;
  currentOccupantVehicle?: string;
}

export interface ChargingStation {
  id: string;
  name: string;
  operator: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  totalPorts: number;
  availablePorts: number;
  powerKw: number;
  pricingPerKwh: number;
  parkingFeePerHour: number;
  amenities: string[];
  rating: number;
  reviewCount: number;
  status: StationStatus;
  ports: ChargingPort[];
  regionZone?: 'NORTH' | 'SOUTH' | 'WEST' | 'EAST' | 'CENTRAL' | 'EXPRESSWAY';
  discom?: string;
}

export interface Vehicle {
  id: string;
  userId: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  vin: string;
  batteryCapacityKwh: number;
  maxChargingRateKw: number;
  connectorType: ConnectorType;
  currentSocPercent: number;
  estimatedRangeKm: number;
  isPrimary: boolean;
  photoUrl?: string;
}

export interface Booking {
  id: string;
  bookingReference: string;
  userId: string;
  vehicleId: string;
  vehicleName: string;
  stationId: string;
  stationName: string;
  stationAddress: string;
  portId: string;
  portNumber: number;
  connectorType: ConnectorType;
  date: string;
  timeSlot: string;
  durationMinutes: number;
  estimatedEnergyKwh: number;
  estimatedCost: number;
  status: BookingStatus;
  qrCodeData: string;
  createdAt: string;
}

export interface ChargingSession {
  id: string;
  bookingId?: string;
  stationId: string;
  stationName: string;
  portId: string;
  portNumber: number;
  vehicleId: string;
  vehicleName: string;
  userId: string;
  startedAt: string;
  endedAt?: string;
  initialSoc: number;
  currentSoc: number;
  targetSoc: number;
  currentPowerKw: number;
  energyDeliveredKwh: number;
  elapsedTimeSeconds: number;
  costAccrued: number;
  ratePerKwh: number;
  status: ChargingSessionStatus;
}

export interface PaymentTransaction {
  id: string;
  sessionId?: string;
  bookingId?: string;
  userId: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  paymentMethod: 'WALLET' | 'CARD' | 'APPLE_PAY' | 'GOOGLE_PAY' | 'RFID';
  status: PaymentStatus;
  timestamp: string;
  description: string;
  breakdown: {
    energyKwh: number;
    energyCost: number;
    serviceFee: number;
    tax: number;
    discount: number;
  };
}

export interface SavedPaymentMethod {
  id: string;
  type: 'CARD' | 'UPI';
  brand?: 'Visa' | 'Mastercard' | 'Amex' | 'RuPay';
  last4?: string;
  expMonth?: number;
  expYear?: number;
  upiId?: string;
  status: 'DEMO_ONLY' | 'UNVERIFIED';
  createdAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'CUSTOMER' | 'ADMIN';
  walletBalance: number;
  rfidTagNumber: string;
  avatarUrl?: string;
  memberSince: string;
  totalKwhCharged: number;
  totalCo2SavedKg: number;
  paymentMethods: SavedPaymentMethod[];
}

export interface UtmParams {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
}

export interface ConfirmationModalState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
}
