import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  NavTab,
  ChargingStation,
  Vehicle,
  Booking,
  ChargingSession,
  PaymentTransaction,
  UserProfile,
  ConnectorType,
  UtmParams,
  ConfirmationModalState,
} from '../types';
import {
  INITIAL_USER,
  INITIAL_VEHICLES,
  INITIAL_STATIONS,
  INITIAL_BOOKINGS,
  INITIAL_TRANSACTIONS,
} from '../data/mockData';

interface Toast {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
}

interface AppContextType {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  // Auth
  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  login: (email: string, pass: string) => { success: boolean; error?: string };
  register: (name: string, email: string, pass: string, phone: string) => { success: boolean; error?: string };
  logout: () => void;
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  toggleUserRole: () => void;
  // Vehicles
  vehicles: Vehicle[];
  primaryVehicle: Vehicle;
  addVehicle: (vehicleData: Omit<Vehicle, 'id' | 'userId' | 'isPrimary'>) => void;
  setPrimaryVehicle: (vehicleId: string) => void;
  updateVehicleSoc: (vehicleId: string, newSoc: number) => void;
  // Stations & Search
  stations: ChargingStation[];
  selectedStation: ChargingStation | null;
  setSelectedStation: (station: ChargingStation | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedConnectorFilter: ConnectorType | 'ALL';
  setSelectedConnectorFilter: (filter: ConnectorType | 'ALL') => void;
  selectedSpeedFilter: 'ALL' | 'FAST' | 'ULTRA';
  setSelectedSpeedFilter: (filter: 'ALL' | 'FAST' | 'ULTRA') => void;
  selectedCityFilter: string;
  setSelectedCityFilter: (city: string) => void;
  selectedStateFilter: string;
  setSelectedStateFilter: (state: string) => void;
  lastUpdatedDate: string;
  refreshStationData: () => void;
  isStationRefreshing: boolean;
  // Site Search Palette
  isSearchPaletteOpen: boolean;
  setIsSearchPaletteOpen: (open: boolean) => void;
  // Bookings
  bookings: Booking[];
  createBooking: (bookingData: Omit<Booking, 'id' | 'bookingReference' | 'userId' | 'status' | 'qrCodeToken' | 'createdAt'>) => Booking;
  cancelBooking: (bookingId: string) => void;
  // Live Charging & Payments
  activeSession: ChargingSession | null;
  startChargingSession: (params: {
    station: ChargingStation;
    portNumber: number;
    connectorType: ConnectorType;
    vehicle: Vehicle;
    bookingId?: string;
  }) => void;
  pauseChargingSession: () => void;
  resumeChargingSession: () => void;
  stopChargingSession: () => void;
  pendingPaymentSession: ChargingSession | null;
  clearPendingPayment: () => void;
  processPayment: (paymentMethod: 'WALLET' | 'CARD' | 'APPLE_PAY' | 'GOOGLE_PAY' | 'RFID') => boolean;
  transactions: PaymentTransaction[];
  addFundsToWallet: (amount: number) => void;
  // Utilities & Modals
  isArchitectureModalOpen: boolean;
  setIsArchitectureModalOpen: (open: boolean) => void;
  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  openBookingForStation: (station: ChargingStation) => void;
  isAddVehicleModalOpen: boolean;
  setIsAddVehicleModalOpen: (open: boolean) => void;
  recentApiCall: { method: string; endpoint: string; layer: string; timestamp: string } | null;
  // Cookie banner
  cookieConsent: boolean | null;
  acceptCookies: () => void;
  rejectCookies: () => void;
  // Mobile Menu
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  // Floating Contact
  isContactDrawerOpen: boolean;
  setIsContactDrawerOpen: (open: boolean) => void;
  // Copy button
  copyToClipboard: (text: string, label?: string) => void;
  // Confirmation Modal
  confirmationModal: ConfirmationModalState;
  openConfirmationModal: (params: Omit<ConfirmationModalState, 'isOpen'>) => void;
  closeConfirmationModal: () => void;
  // UTM
  utmParams: UtmParams;
  // Maps Quota
  isMapsQuotaExceeded: boolean;
  setIsMapsQuotaExceeded: (val: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('voltflow_theme') as 'dark' | 'light') || 'dark';
  });
  // First-time users see the dedicated Login Page first
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('evcharged_auth') === 'true';
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);
  const [vehicles, setVehicles] = useState<Vehicle[]>(INITIAL_VEHICLES);
  const [stations, setStations] = useState<ChargingStation[]>(INITIAL_STATIONS);
  const [selectedStation, setSelectedStation] = useState<ChargingStation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConnectorFilter, setSelectedConnectorFilter] = useState<ConnectorType | 'ALL'>('ALL');
  const [selectedSpeedFilter, setSelectedSpeedFilter] = useState<'ALL' | 'FAST' | 'ULTRA'>('ALL');
  const [selectedCityFilter, setSelectedCityFilter] = useState<string>('ALL');
  const [selectedStateFilter, setSelectedStateFilter] = useState<string>('ALL');
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>(INITIAL_TRANSACTIONS);
  const [activeSession, setActiveSession] = useState<ChargingSession | null>(null);
  const [pendingPaymentSession, setPendingPaymentSession] = useState<ChargingSession | null>(null);
  const [isArchitectureModalOpen, setIsArchitectureModalOpen] = useState(false);
  const [isAddVehicleModalOpen, setIsAddVehicleModalOpen] = useState(false);
  const [isSearchPaletteOpen, setIsSearchPaletteOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isContactDrawerOpen, setIsContactDrawerOpen] = useState(false);
  const [isMapsQuotaExceeded, setIsMapsQuotaExceeded] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [lastUpdatedDate, setLastUpdatedDate] = useState<string>('Just now (Oct 25, 2026 02:52 AM)');
  const [isStationRefreshing, setIsStationRefreshing] = useState(false);

  // Cookie consent state
  const [cookieConsent, setCookieConsent] = useState<boolean | null>(() => {
    const saved = localStorage.getItem('voltflow_cookie_consent');
    return saved !== null ? saved === 'true' : null;
  });

  // UTM tracking params
  const [utmParams, setUtmParams] = useState<UtmParams>({});

  // Confirmation modal state
  const [confirmationModal, setConfirmationModal] = useState<ConfirmationModalState>({
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    onConfirm: () => {},
  });

  const [recentApiCall, setRecentApiCall] = useState<{ method: string; endpoint: string; layer: string; timestamp: string } | null>({
    method: 'GET',
    endpoint: '/api/v1/stations/nearby?lat=37.77&lng=-122.41',
    layer: 'Application Layer (Spring Boot)',
    timestamp: 'Just now',
  });

  // Listen to Google Maps quota exceeded event
  useEffect(() => {
    const handleQuota = () => {
      setIsMapsQuotaExceeded(true);
    };
    window.addEventListener('gmp-quota-exceeded', handleQuota);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuota);
  }, []);

  // Parse UTM parameters on mount
  useEffect(() => {
    try {
      const search = window.location.search;
      if (search) {
        const params = new URLSearchParams(search);
        const utm: UtmParams = {};
        if (params.get('utm_source')) utm.source = params.get('utm_source')!;
        if (params.get('utm_medium')) utm.medium = params.get('utm_medium')!;
        if (params.get('utm_campaign')) utm.campaign = params.get('utm_campaign')!;
        if (params.get('utm_term')) utm.term = params.get('utm_term')!;
        if (params.get('utm_content')) utm.content = params.get('utm_content')!;

        if (Object.keys(utm).length > 0) {
          setUtmParams(utm);
          sessionStorage.setItem('voltflow_utm', JSON.stringify(utm));
        }
      } else {
        const saved = sessionStorage.getItem('voltflow_utm');
        if (saved) {
          setUtmParams(JSON.parse(saved));
        }
      }
    } catch {
      // safe fallback
    }
  }, []);

  // Keyboard shortcut for Site Search (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync theme with HTML class
  useEffect(() => {
    localStorage.setItem('voltflow_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
    showToast(`Switched to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`, 'info');
  };

  const showToast = (message: string, type: 'success' | 'info' | 'warning' | 'error' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const copyToClipboard = (text: string, label: string = 'Text') => {
    try {
      navigator.clipboard.writeText(text);
      showToast(`${label} copied to clipboard!`, 'success');
    } catch {
      showToast(`Unable to copy automatically.`, 'error');
    }
  };

  const acceptCookies = () => {
    setCookieConsent(true);
    localStorage.setItem('voltflow_cookie_consent', 'true');
    showToast('Cookie preferences saved.', 'info');
  };

  const rejectCookies = () => {
    setCookieConsent(false);
    localStorage.setItem('voltflow_cookie_consent', 'false');
    showToast('Non-essential cookies disabled.', 'info');
  };

  const openConfirmationModal = (params: Omit<ConfirmationModalState, 'isOpen'>) => {
    setConfirmationModal({ ...params, isOpen: true });
  };

  const closeConfirmationModal = () => {
    setConfirmationModal((prev) => ({ ...prev, isOpen: false }));
  };

  const refreshStationData = () => {
    setIsStationRefreshing(true);
    setTimeout(() => {
      setLastUpdatedDate(`Just now (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`);
      setIsStationRefreshing(false);
      showToast('Live charging network telemetry refreshed', 'success');
    }, 600);
  };

  const login = (identifier: string, pass: string): { success: boolean; error?: string } => {
    const cleanId = identifier.trim();
    if (!cleanId) {
      return { success: false, error: 'Please enter your email address or mobile number.' };
    }
    // Check if it looks like email or phone number
    const isEmail = cleanId.includes('@');
    const digitsOnly = cleanId.replace(/\D/g, '');
    const isPhone = digitsOnly.length >= 10;

    if (!isEmail && !isPhone) {
      return { success: false, error: 'Please enter a valid email address or 10-digit mobile number.' };
    }
    if (!pass || pass.length < 4) {
      return { success: false, error: 'Password must be at least 4 characters.' };
    }

    setIsAuthenticated(true);
    setIsAuthModalOpen(false);
    localStorage.setItem('evcharged_auth', 'true');
    showToast(`Welcome back to EV Charged, ${user.name}!`, 'success');
    return { success: true };
  };

  const register = (name: string, email: string, pass: string, phone: string): { success: boolean; error?: string } => {
    if (!name || name.trim().length < 2) {
      return { success: false, error: 'Please enter your full name.' };
    }
    if (!email || !email.includes('@')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    if (!pass || pass.length < 4) {
      return { success: false, error: 'Password must contain at least 4 characters.' };
    }

    setUser((prev) => ({
      ...prev,
      name,
      email,
      phone: phone || prev.phone,
    }));
    setIsAuthenticated(true);
    setIsAuthModalOpen(false);
    localStorage.setItem('evcharged_auth', 'true');
    showToast(`Account created successfully! Welcome to EV Charged, ${name}.`, 'success');
    return { success: true };
  };

  const logout = () => {
    openConfirmationModal({
      title: 'Sign Out of EV Charged',
      message: 'Are you sure you want to end your current session? You will be returned to the login screen.',
      confirmLabel: 'Sign Out',
      isDestructive: true,
      onConfirm: () => {
        setIsAuthenticated(false);
        localStorage.removeItem('evcharged_auth');
        setActiveTab('home');
        showToast('You have been signed out. Welcome back anytime!', 'info');
      },
    });
  };

  const primaryVehicle = vehicles.find((v) => v.isPrimary) || vehicles[0];

  const toggleUserRole = () => {
    const newRole = user.role === 'CUSTOMER' ? 'ADMIN' : 'CUSTOMER';
    setUser((prev) => ({ ...prev, role: newRole }));
    setRecentApiCall({
      method: 'PUT',
      endpoint: `/api/v1/users/${user.id}/role`,
      layer: 'Business / Domain Layer (Role-Based Authorization)',
      timestamp: new Date().toLocaleTimeString(),
    });
    showToast(`Switched view to ${newRole === 'ADMIN' ? 'Station Operator / Admin Mode' : 'Customer Mode'}`, 'info');
  };

  const addVehicle = (vehicleData: Omit<Vehicle, 'id' | 'userId' | 'isPrimary'>) => {
    const newVehicle: Vehicle = {
      ...vehicleData,
      id: `veh_${Date.now().toString().slice(-4)}`,
      userId: user.id,
      isPrimary: vehicles.length === 0,
    };
    setVehicles((prev) => [...prev, newVehicle]);
    setRecentApiCall({
      method: 'POST',
      endpoint: '/api/v1/vehicles',
      layer: 'Application Layer -> JPA VehicleRepository.save()',
      timestamp: new Date().toLocaleTimeString(),
    });
    showToast(`${newVehicle.make} ${newVehicle.model} added to your EV Garage!`, 'success');
  };

  const setPrimaryVehicle = (vehicleId: string) => {
    setVehicles((prev) =>
      prev.map((v) => ({
        ...v,
        isPrimary: v.id === vehicleId,
      }))
    );
    showToast('Primary vehicle updated', 'info');
  };

  const updateVehicleSoc = (vehicleId: string, newSoc: number) => {
    setVehicles((prev) =>
      prev.map((v) => {
        if (v.id === vehicleId) {
          const estimatedRangeKm = Math.round((newSoc / 100) * (v.batteryCapacityKwh * 5.8));
          return { ...v, currentSocPercent: newSoc, estimatedRangeKm };
        }
        return v;
      })
    );
  };

  const createBooking = (
    bookingData: Omit<Booking, 'id' | 'bookingReference' | 'userId' | 'status' | 'qrCodeToken' | 'createdAt'>
  ): Booking => {
    const refNum = Math.floor(1000 + Math.random() * 9000);
    const newBooking: Booking = {
      ...bookingData,
      id: `bk_${Date.now().toString().slice(-4)}`,
      bookingReference: `VF-BK-${refNum}`,
      userId: user.id,
      status: 'CONFIRMED',
      qrCodeToken: `VF-QR-CONFIRMED-${refNum}-${Date.now()}`,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };

    setBookings((prev) => [newBooking, ...prev]);

    // Update port status in station
    setStations((prev) =>
      prev.map((stn) => {
        if (stn.id === bookingData.stationId) {
          return {
            ...stn,
            availablePorts: Math.max(0, stn.availablePorts - 1),
            ports: stn.ports.map((p) =>
              p.id === bookingData.portId ? { ...p, status: 'RESERVED' } : p
            ),
          };
        }
        return stn;
      })
    );

    setRecentApiCall({
      method: 'POST',
      endpoint: '/api/v1/bookings/reserve',
      layer: 'Application Layer -> Business Logic Conflict Validator -> MySQL Bookings',
      timestamp: new Date().toLocaleTimeString(),
    });

    showToast(`Slot reserved successfully! Ref: ${newBooking.bookingReference}`, 'success');
    return newBooking;
  };

  const cancelBooking = (bookingId: string) => {
    const bk = bookings.find((b) => b.id === bookingId);
    if (!bk) return;

    openConfirmationModal({
      title: 'Cancel Reservation',
      message: `Are you sure you want to cancel reservation ${bk.bookingReference} for ${bk.stationName}? The charging stall will be immediately released for other drivers.`,
      confirmLabel: 'Yes, Cancel Reservation',
      isDestructive: true,
      onConfirm: () => {
        setBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? { ...b, status: 'CANCELLED' } : b))
        );

        // Free up port
        setStations((prev) =>
          prev.map((stn) => {
            if (stn.id === bk.stationId) {
              return {
                ...stn,
                availablePorts: Math.min(stn.totalPorts, stn.availablePorts + 1),
                ports: stn.ports.map((p) =>
                  p.id === bk.portId ? { ...p, status: 'AVAILABLE' } : p
                ),
              };
            }
            return stn;
          })
        );

        setRecentApiCall({
          method: 'PUT',
          endpoint: `/api/v1/bookings/${bookingId}/cancel`,
          layer: 'Application Layer -> Spring Data JPA BookingRepository.deleteById()',
          timestamp: new Date().toLocaleTimeString(),
        });

        showToast('Reservation cancelled', 'info');
      },
    });
  };

  const startChargingSession = (params: {
    station: ChargingStation;
    portNumber: number;
    connectorType: ConnectorType;
    vehicle: Vehicle;
    bookingId?: string;
  }) => {
    const port = params.station.ports.find((p) => p.portNumber === params.portNumber);
    const portId = port ? port.id : `port_${params.portNumber}`;

    const newSession: ChargingSession = {
      id: `sess_${Date.now().toString().slice(-4)}`,
      bookingId: params.bookingId,
      stationId: params.station.id,
      stationName: params.station.name,
      portId: portId,
      portNumber: params.portNumber,
      vehicleId: params.vehicle.id,
      vehicleName: `${params.vehicle.make} ${params.vehicle.model}`,
      userId: user.id,
      startedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      initialSoc: params.vehicle.currentSocPercent,
      currentSoc: params.vehicle.currentSocPercent,
      targetSoc: 85,
      currentPowerKw: Math.min(params.station.powerKw, params.vehicle.maxChargingRateKw),
      energyDeliveredKwh: 0.1,
      elapsedTimeSeconds: 0,
      costAccrued: 0.05,
      ratePerKwh: params.station.pricingPerKwh,
      status: 'CHARGING',
    };

    setActiveSession(newSession);

    // Update station port to occupied
    setStations((prev) =>
      prev.map((stn) => {
        if (stn.id === params.station.id) {
          return {
            ...stn,
            ports: stn.ports.map((p) =>
              p.portNumber === params.portNumber
                ? { ...p, status: 'OCCUPIED', currentOccupantVehicle: newSession.vehicleName }
                : p
            ),
          };
        }
        return stn;
      })
    );

    if (params.bookingId) {
      setBookings((prev) =>
        prev.map((b) => (b.id === params.bookingId ? { ...b, status: 'ACTIVE' } : b))
      );
    }

    setRecentApiCall({
      method: 'POST',
      endpoint: '/api/v1/charging/session/start',
      layer: 'Business Layer (Java OOP ChargingService -> Hardware Telemetry Interface)',
      timestamp: new Date().toLocaleTimeString(),
    });

    showToast(`Charging started at ${params.station.name} (Stall #${params.portNumber})`, 'success');
  };

  // Real-time ticking telemetry during active session
  useEffect(() => {
    if (!activeSession || activeSession.status !== 'CHARGING') return;

    const interval = setInterval(() => {
      setActiveSession((prev) => {
        if (!prev || prev.status !== 'CHARGING') return prev;

        const newElapsedSeconds = prev.elapsedTimeSeconds + 1;
        const addedKwh = (prev.currentPowerKw / 3600) * 1.5;
        const newEnergyKwh = Number((prev.energyDeliveredKwh + addedKwh).toFixed(2));
        const newCost = Number((newEnergyKwh * prev.ratePerKwh).toFixed(2));

        const vehicle = vehicles.find((v) => v.id === prev.vehicleId);
        const batterySize = vehicle ? vehicle.batteryCapacityKwh : 80;
        const addedSocPercent = (addedKwh / batterySize) * 100;
        const updatedSoc = Math.min(100, Math.round(prev.currentSoc + addedSocPercent));

        if (updatedSoc >= prev.targetSoc) {
          showToast('Target charge limit reached (85%)!', 'success');
          return {
            ...prev,
            elapsedTimeSeconds: newElapsedSeconds,
            energyDeliveredKwh: newEnergyKwh,
            costAccrued: newCost,
            currentSoc: updatedSoc,
            status: 'COMPLETED',
          };
        }

        return {
          ...prev,
          elapsedTimeSeconds: newElapsedSeconds,
          energyDeliveredKwh: newEnergyKwh,
          costAccrued: newCost,
          currentSoc: updatedSoc,
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession, vehicles]);

  const pauseChargingSession = () => {
    if (!activeSession) return;
    setActiveSession((prev) => (prev ? { ...prev, status: 'PAUSED' } : null));
    setRecentApiCall({
      method: 'PUT',
      endpoint: `/api/v1/charging/session/${activeSession.id}/pause`,
      layer: 'Business Layer (ChargingService.pauseSession)',
      timestamp: new Date().toLocaleTimeString(),
    });
    showToast('Charging paused', 'info');
  };

  const resumeChargingSession = () => {
    if (!activeSession) return;
    setActiveSession((prev) => (prev ? { ...prev, status: 'CHARGING' } : null));
    setRecentApiCall({
      method: 'PUT',
      endpoint: `/api/v1/charging/session/${activeSession.id}/resume`,
      layer: 'Business Layer (ChargingService.resumeSession)',
      timestamp: new Date().toLocaleTimeString(),
    });
    showToast('Charging resumed', 'info');
  };

  const stopChargingSession = () => {
    if (!activeSession) return;

    openConfirmationModal({
      title: 'Stop Charging Session',
      message: `Are you sure you want to stop charging at ${activeSession.stationName}? Your session will end, and you will proceed to payment checkout.`,
      confirmLabel: 'Stop & Proceed to Pay',
      isDestructive: false,
      onConfirm: () => {
        const completedSession: ChargingSession = {
          ...activeSession,
          status: 'COMPLETED',
          endedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        updateVehicleSoc(activeSession.vehicleId, completedSession.currentSoc);

        setStations((prev) =>
          prev.map((stn) => {
            if (stn.id === activeSession.stationId) {
              return {
                ...stn,
                ports: stn.ports.map((p) =>
                  p.portNumber === activeSession.portNumber ? { ...p, status: 'AVAILABLE', currentOccupantVehicle: undefined } : p
                ),
              };
            }
            return stn;
          })
        );

        if (activeSession.bookingId) {
          setBookings((prev) =>
            prev.map((b) => (b.id === activeSession.bookingId ? { ...b, status: 'COMPLETED' } : b))
          );
        }

        setPendingPaymentSession(completedSession);
        setActiveSession(null);

        setRecentApiCall({
          method: 'POST',
          endpoint: `/api/v1/charging/session/${activeSession.id}/stop`,
          layer: 'Application Layer -> PaymentManagementController',
          timestamp: new Date().toLocaleTimeString(),
        });

        showToast('Charging session completed. Ready for payment checkout.', 'success');
      },
    });
  };

  const clearPendingPayment = () => {
    setPendingPaymentSession(null);
  };

  const processPayment = (paymentMethod: 'WALLET' | 'CARD' | 'APPLE_PAY' | 'GOOGLE_PAY' | 'RFID'): boolean => {
    if (!pendingPaymentSession) return false;

    const totalAmount = pendingPaymentSession.costAccrued;

    if (paymentMethod === 'WALLET' && user.walletBalance < totalAmount) {
      showToast('Insufficient wallet balance. Please top up or select a card.', 'error');
      return false;
    }

    const invNum = `INV-${Date.now().toString().slice(-6)}`;
    const newTx: PaymentTransaction = {
      id: `tx_${Date.now().toString().slice(-4)}`,
      sessionId: pendingPaymentSession.id,
      bookingId: pendingPaymentSession.bookingId,
      userId: user.id,
      invoiceNumber: invNum,
      amount: totalAmount,
      currency: 'USD',
      paymentMethod,
      status: 'SUCCESS',
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      description: `Fast charging (${pendingPaymentSession.energyDeliveredKwh} kWh) at ${pendingPaymentSession.stationName}`,
      breakdown: {
        energyKwh: pendingPaymentSession.energyDeliveredKwh,
        energyCost: totalAmount,
        serviceFee: 0.0,
        tax: 0.0,
        discount: 0.0,
      },
    };

    setTransactions((prev) => [newTx, ...prev]);

    setUser((prev) => ({
      ...prev,
      walletBalance: paymentMethod === 'WALLET' ? Number((prev.walletBalance - totalAmount).toFixed(2)) : prev.walletBalance,
      totalKwhCharged: Number((prev.totalKwhCharged + pendingPaymentSession.energyDeliveredKwh).toFixed(1)),
      totalCo2SavedKg: Number((prev.totalCo2SavedKg + pendingPaymentSession.energyDeliveredKwh * 0.62).toFixed(1)),
    }));

    setRecentApiCall({
      method: 'POST',
      endpoint: '/api/v1/payments/process',
      layer: 'Application Layer -> PaymentService -> Hibernate Transaction Ledger -> MySQL payments',
      timestamp: new Date().toLocaleTimeString(),
    });

    setPendingPaymentSession(null);
    showToast(`Payment of $${totalAmount.toFixed(2)} completed successfully!`, 'success');
    return true;
  };

  const addFundsToWallet = (amount: number) => {
    setUser((prev) => ({
      ...prev,
      walletBalance: Number((prev.walletBalance + amount).toFixed(2)),
    }));
    setRecentApiCall({
      method: 'POST',
      endpoint: `/api/v1/users/${user.id}/wallet/top-up`,
      layer: 'Application Layer -> Spring Data JPA UserRepository.save()',
      timestamp: new Date().toLocaleTimeString(),
    });
    showToast(`₹${amount.toFixed(2)} added to your EV Charged Wallet!`, 'success');
  };

  const openBookingForStation = (station: ChargingStation) => {
    setSelectedStation(station);
    setActiveTab('booking');
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        theme,
        toggleTheme,
        isAuthenticated,
        isAuthModalOpen,
        setIsAuthModalOpen,
        login,
        register,
        logout,
        user,
        setUser,
        toggleUserRole,
        vehicles,
        primaryVehicle,
        addVehicle,
        setPrimaryVehicle,
        updateVehicleSoc,
        stations,
        selectedStation,
        setSelectedStation,
        searchQuery,
        setSearchQuery,
        selectedConnectorFilter,
        setSelectedConnectorFilter,
        selectedSpeedFilter,
        setSelectedSpeedFilter,
        selectedCityFilter,
        setSelectedCityFilter,
        selectedStateFilter,
        setSelectedStateFilter,
        lastUpdatedDate,
        refreshStationData,
        isStationRefreshing,
        isSearchPaletteOpen,
        setIsSearchPaletteOpen,
        bookings,
        createBooking,
        cancelBooking,
        activeSession,
        startChargingSession,
        pauseChargingSession,
        resumeChargingSession,
        stopChargingSession,
        pendingPaymentSession,
        clearPendingPayment,
        processPayment,
        transactions,
        addFundsToWallet,
        isArchitectureModalOpen,
        setIsArchitectureModalOpen,
        toasts,
        showToast,
        openBookingForStation,
        isAddVehicleModalOpen,
        setIsAddVehicleModalOpen,
        recentApiCall,
        cookieConsent,
        acceptCookies,
        rejectCookies,
        isMobileMenuOpen,
        setIsMobileMenuOpen,
        isContactDrawerOpen,
        setIsContactDrawerOpen,
        copyToClipboard,
        confirmationModal,
        openConfirmationModal,
        closeConfirmationModal,
        utmParams,
        isMapsQuotaExceeded,
        setIsMapsQuotaExceeded,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
