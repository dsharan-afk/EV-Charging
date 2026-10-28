import React, { useState, useEffect } from 'react';
import { APIProvider, Map, AdvancedMarker, InfoWindow, useMap } from '@vis.gl/react-google-maps';
import { useApp } from '../context/AppContext';
import { ChargingStation } from '../types';
import { INDIA_CITY_CENTERS } from '../data/mockData';
import { Zap, MapPin, Calendar, Compass, ExternalLink, Globe2 } from 'lucide-react';

interface GoogleMapViewProps {
  stations: ChargingStation[];
  onSelectStation: (station: ChargingStation) => void;
  selectedStation: ChargingStation | null;
  activeCityKey?: string;
  onCityChange?: (cityKey: string) => void;
  userLocation?: { latitude: number; longitude: number } | null;
  onClearLocation?: () => void;
}

// Helper controller component to programmatically pan and zoom the Google Map
const MapPanController: React.FC<{
  center: { lat: number; lng: number };
  zoom: number;
  selectedStation: ChargingStation | null;
}> = ({ center, zoom, selectedStation }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    if (selectedStation) {
      map.panTo({ lat: selectedStation.latitude, lng: selectedStation.longitude });
      map.setZoom(13.5);
    } else {
      map.panTo(center);
      map.setZoom(zoom);
    }
  }, [map, center, zoom, selectedStation]);

  return null;
};

export const GoogleMapView: React.FC<GoogleMapViewProps> = ({
  stations,
  onSelectStation,
  selectedStation,
  activeCityKey = 'ALL',
  onCityChange,
  userLocation = null,
  onClearLocation,
}) => {
  const { openBookingForStation, isMapsQuotaExceeded, setIsMapsQuotaExceeded, selectedCityFilter, setSelectedCityFilter } = useApp();
  const [activeMarkerStation, setActiveMarkerStation] = useState<ChargingStation | null>(null);

  const currentCityKey = onCityChange ? activeCityKey : (selectedCityFilter || 'ALL');
  const cityConfig = INDIA_CITY_CENTERS[currentCityKey] || INDIA_CITY_CENTERS['ALL'];
  const mapCenter = userLocation
    ? { lat: userLocation.latitude, lng: userLocation.longitude }
    : { lat: cityConfig.lat, lng: cityConfig.lng };
  const mapZoom = userLocation ? 12 : cityConfig.zoom;

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyCOykIG6PzBWv0QJyvmff-yCjQ9tvn9aMI';

  const handleCitySelect = (key: string) => {
    onClearLocation?.();
    if (onCityChange) {
      onCityChange(key);
    } else {
      setSelectedCityFilter(key);
    }
  };

  if (isMapsQuotaExceeded) {
    return (
      <div className="h-full min-h-[380px] rounded-xl bg-neutral-950 border border-neutral-800 p-6 flex flex-col items-center justify-center text-center space-y-3">
        <Compass className="h-8 w-8 text-neutral-500 animate-spin" />
        <p className="text-sm font-semibold text-white">Google Maps Connection Notice</p>
        <p className="text-xs text-neutral-400 max-w-xs">
          Unable to load Google Maps tiles. Please verify your API key restrictions and network connection. Stations remain fully operational.
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[420px] sm:h-[480px] rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950 flex flex-col">
      {/* Pan-India City Navigation Bar */}
      <div className="z-10 bg-neutral-950/90 backdrop-blur-md border-b border-neutral-800 p-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-[11px]">
        <span className="text-neutral-400 font-semibold flex items-center gap-1 pl-1 pr-2 shrink-0">
          <Globe2 className="h-3.5 w-3.5 text-emerald-400" />
          <span>{userLocation ? 'Your Location:' : 'India View:'}</span>
        </span>
        {Object.entries(INDIA_CITY_CENTERS).map(([key, config]) => {
          const isActive = currentCityKey === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => handleCitySelect(key)}
              className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap shrink-0 font-medium ${
                isActive
                  ? 'bg-emerald-500 text-neutral-950 font-bold shadow-sm shadow-emerald-500/20'
                  : 'bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700'
              }`}
            >
              {key === 'ALL' ? '🇮🇳 All India' : config.name}
            </button>
          );
        })}
      </div>

      {/* Google Map Canvas */}
      <div className="relative flex-1 w-full h-full">
        <APIProvider
          apiKey={apiKey}
          onError={() => setIsMapsQuotaExceeded(true)}
        >
          <Map
            mapId="DEMO_MAP_ID"
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            defaultCenter={mapCenter}
            defaultZoom={mapZoom}
            gestureHandling="greedy"
            disableDefaultUI={false}
            className="w-full h-full"
            style={{ width: '100%', height: '100%' }}
          >
            <MapPanController
              center={mapCenter}
              zoom={mapZoom}
              selectedStation={selectedStation}
            />

            {stations.map((station) => {
              const isSelected = selectedStation?.id === station.id;
              const isAvail = station.availablePorts > 0;

              return (
                <AdvancedMarker
                  key={station.id}
                  position={{ lat: station.latitude, lng: station.longitude }}
                  onClick={() => {
                    onSelectStation(station);
                    setActiveMarkerStation(station);
                  }}
                  title={station.name}
                >
                  <div
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold font-mono shadow-xl transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500 text-neutral-950 ring-4 ring-emerald-500/40 scale-110 z-30'
                        : isAvail
                        ? 'bg-neutral-900 border border-emerald-500 text-emerald-400 hover:scale-105'
                        : 'bg-neutral-900 border border-neutral-700 text-neutral-400'
                    }`}
                  >
                    <Zap className="h-3.5 w-3.5 fill-current" />
                    <span>{station.powerKw}kW</span>
                  </div>
                </AdvancedMarker>
              );
            })}

            {activeMarkerStation && (
              <InfoWindow
                position={{
                  lat: activeMarkerStation.latitude,
                  lng: activeMarkerStation.longitude,
                }}
                onCloseClick={() => setActiveMarkerStation(null)}
              >
                <div className="p-1.5 text-neutral-900 max-w-[260px] space-y-2">
                  <div>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-neutral-200 text-neutral-800 font-mono">
                        {activeMarkerStation.state}
                      </span>
                      {activeMarkerStation.discom && (
                        <span className="text-[9px] text-neutral-500 truncate">
                          {activeMarkerStation.discom.split(' ')[0]}
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-xs text-neutral-950 leading-tight">
                      {activeMarkerStation.name}
                    </h4>
                    <p className="text-[11px] text-neutral-600 mt-0.5">
                      {activeMarkerStation.address}, {activeMarkerStation.city}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-1 text-[11px] py-1 border-y border-neutral-200 font-mono">
                    <div>
                      <span className="text-neutral-500 block text-[10px]">Stalls:</span>
                      <span className="font-bold text-emerald-700">
                        {activeMarkerStation.availablePorts}/{activeMarkerStation.totalPorts} Open
                      </span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block text-[10px]">Rate:</span>
                      <span className="font-bold text-neutral-800">
                        ₹{activeMarkerStation.pricingPerKwh.toFixed(2)}/kWh
                      </span>
                    </div>
                  </div>

                  <div className="pt-1 flex gap-1.5">
                    <button
                      onClick={() => openBookingForStation(activeMarkerStation)}
                      className="flex-1 py-1.5 px-2 text-[11px] font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-center"
                    >
                      Reserve Slot
                    </button>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${activeMarkerStation.latitude},${activeMarkerStation.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-1.5 px-2 text-[11px] font-medium rounded-lg bg-neutral-200 text-neutral-800 hover:bg-neutral-300 flex items-center justify-center"
                      title="Get Directions in Google Maps"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </InfoWindow>
            )}
          </Map>
        </APIProvider>
      </div>
    </div>
  );
};
