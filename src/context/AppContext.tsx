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
  INITIAL_STATIONS,
} from '../data/mockData';
import {
  ApiError,
  createVehicle as createVehicleWithApi,
  deleteVehicle as deleteVehicleWithApi,
  getWallet,
  listVehicles,
  listPaymentMethods,
  login as loginWithApi,
  logout as clearApiSession,
  register as registerWithApi,
  setPrimaryVehicle as setPrimaryVehicleWithApi,
  updateVehicle as updateVehicleWithApi,
  cancelBooking as cancelBookingWithApi,
  createBooking as createBookingWithApi,
  listBookings,
  listStations,
  toChargingStation,
  type ApiBooking,
  type CreateBookingInput,
} from '../lib/api';

interface Toast {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
}

type CreateBookingDetails = Omit<
  Booking,
  'id' | 'bookingReference' | 'userId' | 'status' | 'qrCodeData' | 'createdAt' |
  'date' | 'timeSlot' | 'estimatedEnergyKwh' | 'estimatedCost'
> & Pick<CreateBookingInput, 'startsAt' | 'targetSocPercent'>;

const formatBookingTime = (value: string) =>
  new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const bookingFromApi = (
  item: ApiBooking,
  userId: string,
  stations: ChargingStation[],
  vehicles: Vehicle[],
): Booking => {
  const station = stations.find((entry) => entry.id === item.stationId);
  const vehicle = vehicles.find((entry) => entry.id === item.vehicleId);
  const port = station?.ports.find((entry) => entry.id === item.portId);
  const startsAt = new Date(item.startsAt);
  const endsAt = new Date(item.endsAt);

  return {
    id: item.id,
    bookingReference: item.bookingReference,
    userId,
    vehicleId: item.vehicleId,
    vehicleName: vehicle ? `${vehicle.make} ${vehicle.model}` : 'Vehicle',
    stationId: item.stationId,
    stationName: station?.name ?? 'Charging station',
    stationAddress: station ? `${station.address}, ${station.city}` : '',
    portId: item.portId,
    portNumber: port?.portNumber ?? 0,
    connectorType: port?.connectorType ?? vehicle?.connectorType ?? 'CCS2',
    date: startsAt.toLocaleDateString(),
    timeSlot: `${formatBookingTime(item.startsAt)} - ${formatBookingTime(item.endsAt)}`,
    durationMinutes: Math.max(0, Math.round((endsAt.getTime() - startsAt.getTime()) / 60000)),
    estimatedEnergyKwh: item.estimatedEnergyKwh,
    estimatedCost: item.estimatedCost,
    status: item.status,
    qrCodeData: item.bookingReference,
    createdAt: item.createdAt,
  };
};

interface AppContextType {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  // Auth
  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, pass: string, phone: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  // Vehicles
  vehicles: Vehicle[];
  primaryVehicle: Vehicle | undefined;
  addVehicle: (vehicleData: Omit<Vehicle, 'id' | 'userId' | 'isPrimary' | 'photoUrl'>) => Promise<boolean>;
  updateVehicle: (vehicleId: string, updates: Partial<Omit<Vehicle, 'id' | 'userId' | 'isPrimary' | 'photoUrl'>>) => Promise<boolean>;
  deleteVehicle: (vehicleId: string) => void;
  setPrimaryVehicle: (vehicleId: string) => Promise<void>;
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
  createBooking: (bookingData: CreateBookingDetails) => Promise<Booking>;
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
  transactions: PaymentTransaction[];
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [stations, setStations] = useState<ChargingStation[]>(INITIAL_STATIONS);
  const [selectedStation, setSelectedStation] = useState<ChargingStation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConnectorFilter, setSelectedConnectorFilter] = useState<ConnectorType | 'ALL'>('ALL');
  const [selectedSpeedFilter, setSelectedSpeedFilter] = useState<'ALL' | 'FAST' | 'ULTRA'>('ALL');
  const [selectedCityFilter, setSelectedCityFilter] = useState<string>('ALL');
  const [selectedStateFilter, setSelectedStateFilter] = useState<string>('ALL');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
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

  const login = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.includes('@')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    if (!pass) {
      return { success: false, error: 'Please enter your password.' };
    }

    try {
      const authenticatedUser = await loginWithApi({ email: cleanEmail, password: pass });
      const [wallet, paymentMethods, savedVehicles, savedBookings, savedStations] = await Promise.all([
        getWallet(),
        listPaymentMethods(),
        listVehicles(),
        listBookings(),
        listStations(new URLSearchParams({ limit: '100' })),
      ]);
      const accountVehicles = savedVehicles.items.map((vehicle) => ({ ...vehicle, vin: vehicle.vin ?? '' }));
      const accountStations = savedStations.items.map(toChargingStation);
      setUser({
        ...INITIAL_USER,
        id: authenticatedUser.id,
        name: authenticatedUser.name,
        email: authenticatedUser.email,
        phone: authenticatedUser.phone,
        role: authenticatedUser.role,
        walletBalance: wallet.balance,
        paymentMethods: paymentMethods.items,
      });
      setTransactions([]);
      setBookings(savedBookings.items.map((booking) =>
        bookingFromApi(booking, authenticatedUser.id, accountStations, accountVehicles)
      ));
      setVehicles(accountVehicles);
      setIsAuthenticated(true);
      setIsAuthModalOpen(false);
      showToast(`Welcome back to EV Charged, ${authenticatedUser.name}!`, 'success');
      return { success: true };
    } catch (error) {
      clearApiSession();
      return {
        success: false,
        error: error instanceof ApiError
          ? error.message
          : 'Unable to sign in. Please try again.',
      };
    }
  };

  const register = async (
    name: string,
    email: string,
    pass: string,
    phone: string,
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    if (cleanName.length < 2) {
      return { success: false, error: 'Please enter your full name.' };
    }
    if (!cleanEmail.includes('@')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    if (!pass || pass.length < 10) {
      return { success: false, error: 'Password must contain at least 10 characters.' };
    }

    try {
      const registeredUser = await registerWithApi({
        name: cleanName,
        email: cleanEmail,
        password: pass,
        phone: phone.trim(),
      });
      setUser({
        ...INITIAL_USER,
        id: registeredUser.id,
        name: registeredUser.name,
        email: registeredUser.email,
        phone: registeredUser.phone,
        role: registeredUser.role,
        walletBalance: registeredUser.walletBalance,
        paymentMethods: [],
      });
      setTransactions([]);
      setVehicles([]);
      setBookings([]);
      setIsAuthenticated(true);
      setIsAuthModalOpen(false);
      showToast(`Account created successfully! Welcome to EV Charged, ${registeredUser.name}.`, 'success');
      return { success: true };
    } catch (error) {
      clearApiSession();
      return {
        success: false,
        error: error instanceof ApiError
          ? error.message
          : 'Unable to connect to the server. Please try again.',
      };
    }
  };

  const logout = () => {
    openConfirmationModal({
      title: 'Sign Out of EV Charged',
      message: 'Are you sure you want to end your current session? You will be returned to the login screen.',
      confirmLabel: 'Sign Out',
      isDestructive: true,
      onConfirm: () => {
        setIsAuthenticated(false);
        clearApiSession();
        setUser(INITIAL_USER);
        setVehicles([]);
        setBookings([]);
        setTransactions([]);
        setActiveTab('home');
        showToast('You have been signed out. Welcome back anytime!', 'info');
      },
    });
  };

  const primaryVehicle = vehicles.find((v) => v.isPrimary);

  const addVehicle = async (
    vehicleData: Omit<Vehicle, 'id' | 'userId' | 'isPrimary' | 'photoUrl'>
  ): Promise<boolean> => {
    try {
      const savedVehicle = await createVehicleWithApi(vehicleData);
      setVehicles((prev) => [...prev, savedVehicle]);
      setRecentApiCall({
        method: 'POST',
        endpoint: '/api/v1/vehicles',
        layer: 'Node API -> authenticated vehicle record',
        timestamp: new Date().toLocaleTimeString(),
      });
      showToast(`${savedVehicle.make} ${savedVehicle.model} added to your EV Garage!`, 'success');
      return true;
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : 'Unable to save vehicle. Please try again.', 'error');
      return false;
    }
  };

  const updateVehicle = async (
    vehicleId: string,
    updates: Partial<Omit<Vehicle, 'id' | 'userId' | 'isPrimary' | 'photoUrl'>>
  ): Promise<boolean> => {
    try {
      const savedVehicle = await updateVehicleWithApi(vehicleId, updates);
      setVehicles((previous) =>
        previous.map((vehicle) => vehicle.id === vehicleId
          ? { ...vehicle, ...savedVehicle, vin: savedVehicle.vin ?? vehicle.vin }
          : vehicle)
      );
      showToast(`${savedVehicle.make} ${savedVehicle.model} updated.`, 'success');
      return true;
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : 'Unable to update vehicle. Please try again.', 'error');
      return false;
    }
  };

  const deleteVehicle = (vehicleId: string) => {
    const vehicle = vehicles.find((item) => item.id === vehicleId);
    if (!vehicle) {
      showToast('Vehicle not found in your garage.', 'error');
      return;
    }

    openConfirmationModal({
      title: 'Delete Vehicle',
      message: `Delete ${vehicle.make} ${vehicle.model}? Existing bookings or charging-session records may prevent deletion.`,
      confirmLabel: 'Delete Vehicle',
      isDestructive: true,
      onConfirm: () => {
        void (async () => {
          try {
            await deleteVehicleWithApi(vehicleId);
            setVehicles((previous) => {
              const remaining = previous.filter((item) => item.id !== vehicleId);
              if (!vehicle.isPrimary || remaining.length === 0) return remaining;
              const nextPrimaryId = remaining[0].id;
              return remaining.map((item) => ({ ...item, isPrimary: item.id === nextPrimaryId }));
            });
            showToast(`${vehicle.make} ${vehicle.model} deleted.`, 'success');
          } catch (error) {
            showToast(error instanceof ApiError ? error.message : 'Unable to delete vehicle. Please try again.', 'error');
          }
        })();
      },
    });
  };

  const setPrimaryVehicle = async (vehicleId: string) => {
    try {
      await setPrimaryVehicleWithApi(vehicleId);
      setVehicles((prev) => prev.map((vehicle) => ({ ...vehicle, isPrimary: vehicle.id === vehicleId })));
      showToast('Primary vehicle updated', 'info');
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : 'Unable to update preferred vehicle.', 'error');
    }
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

  const createBooking = async (bookingData: CreateBookingDetails): Promise<Booking> => {
    const savedBooking = await createBookingWithApi({
      vehicleId: bookingData.vehicleId,
      stationId: bookingData.stationId,
      portId: bookingData.portId,
      startsAt: bookingData.startsAt,
      durationMinutes: bookingData.durationMinutes,
      targetSocPercent: bookingData.targetSocPercent,
    });
    const newBooking: Booking = {
      ...bookingData,
      id: savedBooking.id,
      bookingReference: savedBooking.bookingReference,
      userId: user.id,
      date: new Date(savedBooking.startsAt).toLocaleDateString(),
      timeSlot: `${formatBookingTime(savedBooking.startsAt)} - ${formatBookingTime(savedBooking.endsAt)}`,
      estimatedEnergyKwh: savedBooking.estimatedEnergyKwh,
      estimatedCost: savedBooking.estimatedCost,
      status: savedBooking.status,
      qrCodeData: savedBooking.bookingReference,
      createdAt: savedBooking.createdAt,
    };

    setBookings((prev) => [newBooking, ...prev]);
    setRecentApiCall({
      method: 'POST',
      endpoint: '/api/v1/bookings',
      layer: 'Node API -> authenticated SQLite booking with availability validation',
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
      onConfirm: async () => {
        try {
          await cancelBookingWithApi(bookingId);
          setBookings((prev) =>
            prev.map((b) => (b.id === bookingId ? { ...b, status: 'CANCELLED' } : b))
          );
          setRecentApiCall({
            method: 'POST',
            endpoint: `/api/v1/bookings/${bookingId}/cancel`,
            layer: 'Node API -> authenticated booking cancellation',
            timestamp: new Date().toLocaleTimeString(),
          });
          showToast('Reservation cancelled', 'info');
        } catch (error) {
          showToast(error instanceof ApiError ? error.message : 'Unable to cancel this reservation.', 'error');
        }
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

        showToast('Simulated charging session completed. A cost estimate is available; no payment was taken.', 'info');
      },
    });
  };

  const clearPendingPayment = () => {
    setPendingPaymentSession(null);
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
        vehicles,
        primaryVehicle,
        addVehicle,
        updateVehicle,
        deleteVehicle,
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
        transactions,
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
