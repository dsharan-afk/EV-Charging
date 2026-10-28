import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ChargingStation, ChargingPort } from '../types';
import { ALL_INDIAN_STATES } from '../data/mockData';
import {
  MapPin,
  Search,
  Zap,
  Filter,
  CheckCircle,
  AlertCircle,
  Clock,
  Compass,
  ArrowRight,
  Shield,
  Wifi,
  Coffee,
  X,
  Play,
  Calendar,
  Sparkles,
  Copy,
  RefreshCw,
  Globe2,
  Building2,
  Maximize2,
  Minimize2,
  Layers,
  ChevronRight,
  LocateFixed,
  Loader2,
} from 'lucide-react';
import { GoogleMapView } from './GoogleMapView';

interface StateMapConfig {
  name: string;
  code: string;
  discom: string;
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
  landmarks: { name: string; x: number; y: number; tag?: string }[];
  corridors: { d: string; label?: string }[];
  description: string;
  expresswayTags: string[];
}

// Detailed State Map Configurations for zooming and visual topography across India
const STATE_MAP_CONFIGS: Record<string, StateMapConfig> = {
  Maharashtra: {
    name: 'Maharashtra',
    code: 'MH',
    discom: 'MSEDCL / Tata Power / Adani',
    minLat: 15.6,
    maxLat: 21.8,
    minLng: 72.6,
    maxLng: 80.5,
    landmarks: [
      { name: 'MUMBAI (BKC & Gateway)', x: 18, y: 62, tag: 'Fin-Capital' },
      { name: 'PUNE (Hinjawadi IT)', x: 28, y: 70, tag: 'Auto Hub' },
      { name: 'NAGPUR (Zero Mile)', x: 84, y: 28, tag: 'Central Grid' },
      { name: 'NASHIK (Wine Hub)', x: 26, y: 44, tag: 'North MH' },
      { name: 'URSE (Expwy Toll)', x: 23, y: 66, tag: '350kW Hub' },
    ],
    corridors: [
      { d: 'M 70 250 L 110 280 L 140 290', label: 'Mumbai-Pune Expressway' },
      { d: 'M 70 250 L 105 180 L 220 150 L 330 110', label: 'Samruddhi Mahamarg (Mumbai-Nagpur)' },
      { d: 'M 110 280 L 120 350', label: 'Pune-Bengaluru NH-48' },
    ],
    description: 'Western regional power corridor featuring high-density 350kW liquid-cooled depots on Mumbai-Pune Expressway and Samruddhi Mahamarg.',
    expresswayTags: ['Mumbai-Pune Expressway', 'Samruddhi Mahamarg', 'NH-48'],
  },
  'Tamil Nadu': {
    name: 'Tamil Nadu',
    code: 'TN',
    discom: 'TANGEDCO (Tamil Nadu Power)',
    minLat: 8.0,
    maxLat: 13.6,
    minLng: 76.2,
    maxLng: 80.4,
    landmarks: [
      { name: 'CHENNAI (OMR IT Salai)', x: 88, y: 15, tag: 'SaaS Corridor' },
      { name: 'GUINDY & AIRPORT', x: 85, y: 22, tag: 'Transit Hub' },
      { name: 'COIMBATORE (Avinashi Rd)', x: 20, y: 58, tag: 'Textile Valley' },
      { name: 'MADURAI (Meenakshi City)', x: 44, y: 76, tag: 'Temple City' },
      { name: 'KRISHNAGIRI (NH-48)', x: 50, y: 22, tag: 'Expressway' },
      { name: 'KANYAKUMARI (Cape Comorin)', x: 30, y: 92, tag: 'South Tip' },
    ],
    corridors: [
      { d: 'M 350 60 L 200 90 L 80 230', label: 'Chennai - Krishnagiri - Bengaluru NH-48' },
      { d: 'M 200 90 L 175 170 L 175 300 L 120 370', label: 'NH-44 North-South (Salem - Madurai - Kanyakumari)' },
      { d: 'M 350 60 L 340 180 L 320 300', label: 'East Coast Road (ECR Coastal)' },
    ],
    description: 'Southern EV vanguard with heavy solar-backed fast chargers along OMR IT Corridor, Guindy Industrial Plaza, and NH-48.',
    expresswayTags: ['NH-48 Chennai-Bengaluru', 'NH-44 Golden Corridor', 'ECR Coastal'],
  },
  Karnataka: {
    name: 'Karnataka',
    code: 'KA',
    discom: 'BESCOM / HESCOM / MESCOM',
    minLat: 11.5,
    maxLat: 18.6,
    minLng: 74.0,
    maxLng: 78.6,
    landmarks: [
      { name: 'BENGALURU (Electronic City)', x: 72, y: 78, tag: 'Silicon Valley' },
      { name: 'KIA AIRPORT DEVANAHALLI', x: 75, y: 70, tag: 'Aerotropolis' },
      { name: 'MYSURU (Palace City)', x: 52, y: 88, tag: 'Expressway' },
      { name: 'HUBBALLI-DHARWAD', x: 32, y: 38, tag: 'North Hub' },
      { name: 'MANGALURU (Coastal)', x: 22, y: 74, tag: 'Port City' },
    ],
    corridors: [
      { d: 'M 290 310 L 210 350', label: 'Bengaluru-Mysuru 10-Lane Expressway' },
      { d: 'M 290 310 L 300 280 L 130 150 L 90 90', label: 'NH-48 (Bengaluru - Hubballi - Belagavi)' },
      { d: 'M 290 310 L 90 300', label: 'NH-75 (Bengaluru - Mangaluru)' },
    ],
    description: 'Premier EV technology testing ground powered by BESCOM with extensive fast charging along the Bengaluru-Mysuru 10-Lane Expressway.',
    expresswayTags: ['Bengaluru-Mysuru Expressway', 'NH-48', 'Airport Expressway'],
  },
  'Delhi NCR': {
    name: 'Delhi NCR',
    code: 'DL',
    discom: 'BSES Rajdhani / Yamuna / NDMC / DHBVN',
    minLat: 28.32,
    maxLat: 28.88,
    minLng: 76.92,
    maxLng: 77.48,
    landmarks: [
      { name: 'CONNAUGHT PLACE (Central Delhi)', x: 54, y: 44, tag: 'Capital Hub' },
      { name: 'IGI AIRPORT T3 & AEROCITY', x: 34, y: 62, tag: 'Terminal Hub' },
      { name: 'NOIDA (Sector 62 & Film City)', x: 78, y: 58, tag: 'IT Belt' },
      { name: 'GURUGRAM (Cyber City)', x: 28, y: 78, tag: 'Millennium City' },
      { name: 'DWARKA EXPRESSWAY', x: 26, y: 52, tag: 'Urban Expwy' },
    ],
    corridors: [
      { d: 'M 210 170 L 135 240 L 110 310', label: 'NH-48 Airport & Cyber City Corridor' },
      { d: 'M 210 170 L 310 230 L 340 330', label: 'Noida-Greater Noida & Yamuna Expressway' },
      { d: 'M 105 210 L 135 240 L 210 170 L 290 120', label: 'Ring Road & Delhi-Meerut Expressway' },
    ],
    description: 'Highest EV density metropolitan capital zone with 24/7 ultra-fast chargers in Aerocity, Connaught Place, and Noida.',
    expresswayTags: ['Dwarka Expressway', 'Yamuna Expressway', 'Delhi-Meerut Expressway'],
  },
  Gujarat: {
    name: 'Gujarat',
    code: 'GJ',
    discom: 'Torrent Power / GUVNL (GETCO)',
    minLat: 20.1,
    maxLat: 24.7,
    minLng: 68.2,
    maxLng: 74.4,
    landmarks: [
      { name: 'GIFT CITY (Gandhinagar)', x: 68, y: 38, tag: 'FinTech Hub' },
      { name: 'AHMEDABAD (SG Highway)', x: 64, y: 46, tag: 'Commercial' },
      { name: 'SURAT (Diamond Bourse)', x: 62, y: 78, tag: 'Textile Hub' },
      { name: 'VADODARA (Cultural Capital)', x: 68, y: 62, tag: 'Expwy Hub' },
      { name: 'RAJKOT (Saurashtra)', x: 34, y: 56, tag: 'Industrial' },
    ],
    corridors: [
      { d: 'M 255 185 L 270 250 L 250 310', label: 'Ahmedabad-Vadodara (NE-1) & Surat NH-48' },
      { d: 'M 270 150 L 255 185 L 135 225', label: 'Gandhinagar - Ahmedabad - Rajkot Highway' },
    ],
    description: 'Home to India’s flagship GIFT City 350kW dispensers and high-speed green corridors linking Ahmedabad, Vadodara, and Surat.',
    expresswayTags: ['Ahmedabad-Vadodara Expressway (NE-1)', 'Delhi-Mumbai Expwy GJ Section'],
  },
  'Uttar Pradesh': {
    name: 'Uttar Pradesh',
    code: 'UP',
    discom: 'UPPCL / PVVNL / MVVNL / DVVNL',
    minLat: 23.8,
    maxLat: 30.4,
    minLng: 77.1,
    maxLng: 84.6,
    landmarks: [
      { name: 'LUCKNOW (Gomti Nagar)', x: 52, y: 46, tag: 'State Capital' },
      { name: 'NOIDA (NCR Gateway)', x: 14, y: 28, tag: 'Expwy Start' },
      { name: 'AGRA (Taj Expressway)', x: 26, y: 42, tag: 'Tourist Hub' },
      { name: 'VARANASI (Ghats Corridor)', x: 82, y: 62, tag: 'Spiritual Capital' },
      { name: 'KANPUR (Industrial)', x: 46, y: 52, tag: 'Central UP' },
    ],
    corridors: [
      { d: 'M 55 110 L 105 170 L 210 185 L 330 250', label: 'Yamuna Expwy -> Agra-Lucknow Expwy -> Purvanchal Expwy' },
      { d: 'M 210 185 L 185 210', label: 'Lucknow-Kanpur Corridor' },
    ],
    description: 'Longest expressway EV spine in India with uninterrupted fast charging along Yamuna, Agra-Lucknow, and Purvanchal Expressways.',
    expresswayTags: ['Yamuna Expressway', 'Agra-Lucknow Expressway', 'Purvanchal Expressway'],
  },
  Telangana: {
    name: 'Telangana',
    code: 'TS',
    discom: 'TSSPDCL / TSNPDCL',
    minLat: 15.8,
    maxLat: 19.9,
    minLng: 77.2,
    maxLng: 81.8,
    landmarks: [
      { name: 'HITEC CITY (Cyber Towers)', x: 40, y: 54, tag: 'Tech Valley' },
      { name: 'GACHIBOWLI (Financial Dist)', x: 34, y: 60, tag: 'Fin-District' },
      { name: 'SECUNDERABAD', x: 46, y: 50, tag: 'Twin City' },
      { name: 'WARANGAL (Heritage City)', x: 72, y: 40, tag: 'Eastern Hub' },
    ],
    corridors: [
      { d: 'M 160 215 C 130 250, 190 280, 160 215', label: 'Hyderabad Outer Ring Road (ORR 158km)' },
      { d: 'M 160 215 L 290 160', label: 'Hyderabad - Warangal Expressway' },
      { d: 'M 160 215 L 160 380', label: 'NH-44 Hyderabad-Bengaluru' },
    ],
    description: 'Hyderabad Outer Ring Road (ORR) and Hitec City feature round-the-clock solar-canopy superchargers powered by TSSPDCL.',
    expresswayTags: ['Hyderabad Outer Ring Road (ORR)', 'NH-44 Corridor', 'Regional Ring Road'],
  },
  Kerala: {
    name: 'Kerala',
    code: 'KL',
    discom: 'KSEB (Kerala State Electricity Board)',
    minLat: 8.3,
    maxLat: 12.8,
    minLng: 74.8,
    maxLng: 77.4,
    landmarks: [
      { name: 'KOCHI (Infopark Kakkanad)', x: 50, y: 52, tag: 'Commercial Hub' },
      { name: 'THIRUVANANTHAPURAM', x: 76, y: 88, tag: 'State Capital' },
      { name: 'KOZHIKODE (Calicut)', x: 36, y: 32, tag: 'Malabar Coast' },
      { name: 'THRISSUR (Cultural Hub)', x: 46, y: 46, tag: 'Central' },
    ],
    corridors: [
      { d: 'M 140 130 L 180 180 L 200 210 L 300 350', label: 'NH-66 Coastal Green Corridor' },
      { d: 'M 200 210 L 280 200', label: 'NH-544 (Kochi - Salem Highway)' },
    ],
    description: 'Greenest EV grid in India with hydro-powered KSEB fast stations spaced along the NH-66 Coastal Highway from Kochi to Trivandrum.',
    expresswayTags: ['NH-66 Coastal Corridor', 'NH-544 Kochi-Coimbatore'],
  },
  Rajasthan: {
    name: 'Rajasthan',
    code: 'RJ',
    discom: 'JVVNL / AVVNL (Rajasthan Vidyut)',
    minLat: 23.1,
    maxLat: 30.2,
    minLng: 69.5,
    maxLng: 78.3,
    landmarks: [
      { name: 'JAIPUR (WTP & Malviya Nagar)', x: 68, y: 46, tag: 'Pink City' },
      { name: 'JODHPUR (Blue City)', x: 36, y: 52, tag: 'Sun City' },
      { name: 'UDAIPUR (Lake City)', x: 38, y: 78, tag: 'Heritage' },
      { name: 'KOTA (Energy Hub)', x: 66, y: 72, tag: 'Coaching Hub' },
    ],
    corridors: [
      { d: 'M 270 180 L 140 210', label: 'Jaipur - Jodhpur Highway' },
      { d: 'M 270 180 L 150 310', label: 'Jaipur - Udaipur - Ahmedabad NH-48' },
      { d: 'M 290 120 L 260 290', label: 'Delhi-Mumbai Expressway Rajasthan Section' },
    ],
    description: 'Solar-rich territory connecting the National Capital to Gujarat with high-speed charging plazas along NH-48 and WTP Jaipur.',
    expresswayTags: ['Delhi-Mumbai Expressway', 'NH-48 Jaipur-Ajmer', 'NH-21'],
  },
  'West Bengal': {
    name: 'West Bengal',
    code: 'WB',
    discom: 'WBSEDCL / CESC Kolkata',
    minLat: 21.5,
    maxLat: 27.2,
    minLng: 85.8,
    maxLng: 89.9,
    landmarks: [
      { name: 'KOLKATA (Salt Lake Sector V)', x: 56, y: 72, tag: 'Tech Hub' },
      { name: 'NEW TOWN ECO PARK', x: 60, y: 70, tag: 'Smart City' },
      { name: 'DURGAPUR (Steel City)', x: 36, y: 62, tag: 'Industrial' },
      { name: 'SILIGURI (North Bengal)', x: 62, y: 18, tag: 'Gateway' },
    ],
    corridors: [
      { d: 'M 140 250 L 225 290', label: 'Durgapur Expressway (NH-19)' },
      { d: 'M 225 290 L 250 70', label: 'NH-12 Kolkata - Siliguri Corridor' },
    ],
    description: 'Eastern India EV anchor with high-speed CESC charging stations situated in Salt Lake Sector V, New Town, and along NH-19.',
    expresswayTags: ['Durgapur Expressway', 'Kona Expressway', 'NH-19'],
  },
  Punjab: {
    name: 'Punjab',
    code: 'PB',
    discom: 'PSPCL (Punjab Power)',
    minLat: 29.5,
    maxLat: 32.5,
    minLng: 73.8,
    maxLng: 76.9,
    landmarks: [
      { name: 'AMRITSAR (Golden Temple)', x: 34, y: 32, tag: 'Heritage' },
      { name: 'LUDHIANA (Industrial Capital)', x: 54, y: 56, tag: 'Textile Hub' },
      { name: 'MOHALI / CHANDIGARH', x: 84, y: 60, tag: 'Tricity' },
      { name: 'JALANDHAR', x: 48, y: 44, tag: 'Sports Hub' },
    ],
    corridors: [
      { d: 'M 135 130 L 190 175 L 215 225 L 335 240', label: 'GT Road (NH-44) Amritsar - Jalandhar - Ludhiana - Chandigarh' },
    ],
    description: 'Agricultural heartland powered by PSPCL with rapid EV chargers along the historic GT Road (NH-44) and Delhi-Amritsar-Katra expressway.',
    expresswayTags: ['NH-44 GT Road', 'Delhi-Amritsar-Katra Expressway'],
  },
  Haryana: {
    name: 'Haryana',
    code: 'HR',
    discom: 'DHBVN / UHBVN',
    minLat: 27.6,
    maxLat: 30.9,
    minLng: 74.4,
    maxLng: 77.6,
    landmarks: [
      { name: 'GURUGRAM (Cyber Hub & Golf Course)', x: 68, y: 76, tag: 'MNC Hub' },
      { name: 'FARIDABAD', x: 76, y: 78, tag: 'Industrial' },
      { name: 'KARNAL (Highway Stop)', x: 64, y: 38, tag: 'Dhabas' },
      { name: 'PANCHKULA', x: 72, y: 14, tag: 'Tricity' },
    ],
    corridors: [
      { d: 'M 285 55 L 255 150 L 270 305', label: 'NH-44 (Ambala - Karnal - Delhi - Gurugram)' },
      { d: 'M 200 310 L 310 310', label: 'KMP Western Peripheral Expressway' },
    ],
    description: 'Western Peripheral (KMP) Expressway and Gurugram Cyber Hub boast dense 240kW+ fast chargers powered by DHBVN.',
    expresswayTags: ['Western Peripheral (KMP) Expressway', 'NH-44', 'Dwarka Expwy'],
  },
  'Madhya Pradesh': {
    name: 'Madhya Pradesh',
    code: 'MP',
    discom: 'MPWZ / MPMZ (MP Paschim / Madhya)',
    minLat: 21.1,
    maxLat: 26.9,
    minLng: 74.0,
    maxLng: 82.8,
    landmarks: [
      { name: 'INDORE (Super Corridor & 56 Dukan)', x: 28, y: 68, tag: 'Cleanest City' },
      { name: 'BHOPAL (VIP Road & Lower Lake)', x: 42, y: 58, tag: 'City of Lakes' },
      { name: 'GWALIOR (Fort Gateway)', x: 48, y: 18, tag: 'North MP' },
      { name: 'JABALPUR (Marble Rocks)', x: 68, y: 60, tag: 'Central Hub' },
    ],
    corridors: [
      { d: 'M 110 270 L 170 230 L 270 240', label: 'Indore - Bhopal - Jabalpur 4-Lane Spine' },
      { d: 'M 190 70 L 170 230', label: 'Gwalior - Bhopal NH-46' },
    ],
    description: 'Central transmission bridge hosting high-speed charging hubs along the Indore Super Corridor, connecting Western and Northern India.',
    expresswayTags: ['Indore-Bhopal Corridor', 'Delhi-Mumbai Expwy MP Section'],
  },
  'Andhra Pradesh': {
    name: 'Andhra Pradesh',
    code: 'AP',
    discom: 'APEPDCL / APSPDCL',
    minLat: 12.6,
    maxLat: 19.1,
    minLng: 76.7,
    maxLng: 84.8,
    landmarks: [
      { name: 'VISAKHAPATNAM (Beach Road)', x: 86, y: 22, tag: 'Steel & Tech' },
      { name: 'VIJAYAWADA (Benz Circle)', x: 58, y: 52, tag: 'Commercial' },
      { name: 'TIRUPATI (Alipiri Pilgrim Hub)', x: 42, y: 88, tag: 'Spiritual' },
    ],
    corridors: [
      { d: 'M 345 90 L 230 210 L 170 350', label: 'NH-16 Coastal Highway (Vizag - Vijayawada - Chennai)' },
    ],
    description: 'East Coast Highway corridor featuring solar-backed fast charging plazas at Visakhapatnam, Vijayawada, and the pilgrim gateway of Tirupati.',
    expresswayTags: ['NH-16 East Coast Highway', 'Vijayawada-Hyderabad NH-65'],
  },
  Goa: {
    name: 'Goa',
    code: 'GA',
    discom: 'Goa Electricity Department',
    minLat: 14.88,
    maxLat: 15.82,
    minLng: 73.68,
    maxLng: 74.40,
    landmarks: [
      { name: 'PANAJI (Miramar & Mandovi)', x: 45, y: 40, tag: 'Capital' },
      { name: 'CANDOLIM & CALANGUTE', x: 32, y: 34, tag: 'North Beach' },
      { name: 'MARGAO (Colva Beach)', x: 56, y: 68, tag: 'South Hub' },
      { name: 'MOPA AIRPORT', x: 42, y: 14, tag: 'Greenfield T2' },
    ],
    corridors: [
      { d: 'M 170 55 L 130 135 L 180 160 L 225 270', label: 'NH-66 & Atal Setu Bridge Link' },
    ],
    description: 'Coastal eco-tourism hotspot equipped with 150kW-240kW CCS2 rapid chargers linking North and South Goa across Atal Setu.',
    expresswayTags: ['NH-66 Coastal Highway', 'Atal Setu Cable Bridge'],
  },
  Odisha: {
    name: 'Odisha',
    code: 'OD',
    discom: 'TPCODL (Tata Power Odisha)',
    minLat: 17.8,
    maxLat: 22.6,
    minLng: 81.4,
    maxLng: 87.5,
    landmarks: [
      { name: 'BHUBANESWAR (InfoCity Patia)', x: 68, y: 56, tag: 'Temple City' },
      { name: 'CUTTACK (Silver City)', x: 68, y: 50, tag: 'Mahanadi' },
      { name: 'PURI (Grand Road)', x: 72, y: 66, tag: 'Pilgrim Hub' },
    ],
    corridors: [
      { d: 'M 270 200 L 270 225 L 290 265', label: 'Bhubaneswar - Cuttack - Puri Marine Drive' },
    ],
    description: 'Rapidly emerging Eastern EV corridor with solar-assisted charging at InfoCity Patia, connecting Bhubaneswar to the Golden Triangle of Puri and Konark.',
    expresswayTags: ['NH-16 Golden Quadrilateral', 'Puri-Konark Marine Drive'],
  },
  Bihar: {
    name: 'Bihar',
    code: 'BR',
    discom: 'SBPDCL / NBPDCL',
    minLat: 24.3,
    maxLat: 27.5,
    minLng: 83.3,
    maxLng: 88.3,
    landmarks: [
      { name: 'PATNA (Bailey Road & Ganga Path)', x: 42, y: 50, tag: 'State Capital' },
      { name: 'GAYA & BODHGAYA', x: 38, y: 72, tag: 'Enlightenment' },
      { name: 'MUZAFFARPUR (North Hub)', x: 48, y: 34, tag: 'Smart City' },
    ],
    corridors: [
      { d: 'M 170 200 L 150 290', label: 'Patna - Gaya - Dobhi 4-Lane' },
      { d: 'M 170 200 L 190 135', label: 'Patna - Muzaffarpur Ganga Bridge Link' },
    ],
    description: 'Gangetic plain hub boasting high-power charging at Patna Bailey Road and along the newly inaugurated Ganga Marine Drive.',
    expresswayTags: ['Patna Ganga Marine Drive', 'Purvanchal-Patna Link', 'NH-31'],
  },
  'National Expressways': {
    name: 'National Expressways',
    code: 'EXP',
    discom: 'NHAI / National Grid Corp',
    minLat: 12.0,
    maxLat: 29.0,
    minLng: 72.0,
    maxLng: 81.0,
    landmarks: [
      { name: 'MUMBAI-PUNE (Urse Plaza)', x: 25, y: 62, tag: '6-Lane Iconic' },
      { name: 'YAMUNA (Noida-Agra)', x: 60, y: 22, tag: '165km Fast' },
      { name: 'SAMRUDDHI (Nagpur Expwy)', x: 48, y: 48, tag: '701km Super' },
      { name: 'BENGALURU-MYSURU', x: 44, y: 84, tag: '10-Lane Modern' },
    ],
    corridors: [
      { d: 'M 240 90 L 100 250 L 175 335', label: 'Intercity Expressway Highway Grid' },
    ],
    description: 'Intercity high-speed charging arteries with 240kW and 350kW liquid-cooled stalls located at major highway rest stops.',
    expresswayTags: ['Mumbai-Pune Expressway', 'Yamuna Expressway', 'Samruddhi Mahamarg', 'Bengaluru-Mysuru'],
  },
};

type UserLocation = { latitude: number; longitude: number; accuracy?: number };

const getDistanceKm = (from: UserLocation, to: { latitude: number; longitude: number }) => {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = toRadians(to.latitude - from.latitude);
  const dLng = toRadians(to.longitude - from.longitude);
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const StationsView: React.FC = () => {
  const {
    stations,
    selectedStation,
    setSelectedStation,
    searchQuery,
    setSearchQuery,
    selectedConnectorFilter,
    setSelectedConnectorFilter,
    selectedSpeedFilter,
    setSelectedSpeedFilter,
    selectedStateFilter,
    setSelectedStateFilter,
    openBookingForStation,
    startChargingSession,
    primaryVehicle,
    vehicles,
    setActiveTab,
    setIsAddVehicleModalOpen,
    showToast,
    lastUpdatedDate,
    refreshStationData,
    isStationRefreshing,
    copyToClipboard,
  } = useApp();

  const [activeVisualizerMode, setActiveVisualizerMode] = useState<'google' | 'map' | 'radar'>('google');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [inspectingStation, setInspectingStation] = useState<ChargingStation | null>(null);
  const [isLiveAnimationEnabled, setIsLiveAnimationEnabled] = useState(true);
  const [isZoomedToState, setIsZoomedToState] = useState(true);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState('');


  // Auto-detect if user searched for or filtered by an Indian state
  const detectedStateName = useMemo(() => {
    // 1. Direct state filter selected
    if (selectedStateFilter && selectedStateFilter !== 'ALL') {
      return selectedStateFilter;
    }

    // 2. Search query matches a state
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      for (const st of ALL_INDIAN_STATES) {
        if (
          st.name.toLowerCase() === q ||
          st.name.toLowerCase().includes(q) ||
          st.code.toLowerCase() === q
        ) {
          return st.name;
        }
      }
      if (q.includes('delhi')) return 'Delhi NCR';
      if (q.includes('expressway') || q.includes('highway')) return 'National Expressways';
      if (q.includes('tamil') || q.includes('chennai')) return 'Tamil Nadu';
      if (q.includes('karnataka') || q.includes('bengaluru') || q.includes('bangalore')) return 'Karnataka';
      if (q.includes('maharashtra') || q.includes('mumbai') || q.includes('pune')) return 'Maharashtra';
      if (q.includes('gujarat') || q.includes('ahmedabad')) return 'Gujarat';
      if (q.includes('uttar') || q.includes('up') || q.includes('lucknow')) return 'Uttar Pradesh';
      if (q.includes('telangana') || q.includes('hyderabad')) return 'Telangana';
      if (q.includes('kerala') || q.includes('kochi')) return 'Kerala';
      if (q.includes('rajasthan') || q.includes('jaipur')) return 'Rajasthan';
      if (q.includes('bengal') || q.includes('kolkata')) return 'West Bengal';
      if (q.includes('punjab') || q.includes('chandigarh')) return 'Punjab';
      if (q.includes('haryana') || q.includes('gurugram')) return 'Haryana';
      if (q.includes('madhya') || q.includes('mp') || q.includes('indore') || q.includes('bhopal')) return 'Madhya Pradesh';
      if (q.includes('andhra') || q.includes('vizag') || q.includes('visakhapatnam')) return 'Andhra Pradesh';
      if (q.includes('goa')) return 'Goa';
      if (q.includes('odisha') || q.includes('bhubaneswar')) return 'Odisha';
      if (q.includes('bihar') || q.includes('patna')) return 'Bihar';
    }

    return null;
  }, [selectedStateFilter, searchQuery]);

  // Active state map config if a state is detected
  const activeStateConfig = useMemo(() => {
    if (!detectedStateName) return null;
    return STATE_MAP_CONFIGS[detectedStateName] || null;
  }, [detectedStateName]);

  // Filter stations across India state-wise & keyword-wise
  const filteredStations = useMemo(() => {
    return stations.filter((station) => {
      const q = searchQuery.toLowerCase().trim();

      // State-wise filter
      const matchesState =
        selectedStateFilter === 'ALL' ||
        station.state.toLowerCase() === selectedStateFilter.toLowerCase() ||
        (selectedStateFilter === 'National Expressways' &&
          (station.regionZone === 'EXPRESSWAY' || station.city === 'Highways & Expressways'));

      // Text query matches state, city, name, address, or DISCOM
      const matchesQuery =
        !q ||
        station.name.toLowerCase().includes(q) ||
        station.state.toLowerCase().includes(q) ||
        station.city.toLowerCase().includes(q) ||
        station.address.toLowerCase().includes(q) ||
        station.operator.toLowerCase().includes(q) ||
        (station.discom && station.discom.toLowerCase().includes(q));

      // Connector filter
      const matchesConnector =
        selectedConnectorFilter === 'ALL' ||
        station.ports.some((p) => p.connectorType === selectedConnectorFilter);

      // Power filter
      let matchesSpeed = true;
      if (selectedSpeedFilter === 'FAST') {
        matchesSpeed = station.powerKw >= 150;
      } else if (selectedSpeedFilter === 'ULTRA') {
        matchesSpeed = station.powerKw >= 300;
      }

      // Availability filter
      const matchesAvailability = !onlyAvailable || station.availablePorts > 0;

      return matchesState && matchesQuery && matchesConnector && matchesSpeed && matchesAvailability;
    });
  }, [stations, searchQuery, selectedStateFilter, selectedConnectorFilter, selectedSpeedFilter, onlyAvailable]);

  const displayedStations = useMemo(() => {
    if (!userLocation) return filteredStations;
    const withDistances = filteredStations.map((station) => ({
      station,
      distance: getDistanceKm(userLocation, station),
    }));
    const nearby = withDistances.filter((item) => item.distance <= 50);
    // Prefer stations within 50 km. If none exist, retain all results, nearest first.
    const results = nearby.length ? nearby : withDistances;
    return results.sort((a, b) => a.distance - b.distance).map((item) => item.station);
  }, [filteredStations, userLocation]);

  const requestUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationMessage('Location is not supported by this browser. You can still search by city or state.');
      return;
    }
    setIsLocating(true);
    setLocationMessage('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };
        setUserLocation(nextLocation);
        setSelectedStateFilter('ALL');
        setSearchQuery('');
        setLocationMessage('Showing stations nearest to your current location.');
        setIsLocating(false);
      },
      (error) => {
        const message = error.code === error.PERMISSION_DENIED
          ? 'Location permission was denied. Allow location in your browser settings, or search by city/state instead.'
          : error.code === error.TIMEOUT
            ? 'Finding your location timed out. Please try again.'
            : 'Could not determine your location. Please try again or search by city/state.';
        setLocationMessage(message);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  };

  const clearUserLocation = () => {
    setUserLocation(null);
    setLocationMessage('');
  };

  // Aggregate stats for current filter
  const stateSummary = useMemo(() => {
    const totalCapKw = filteredStations.reduce((sum, s) => sum + s.powerKw, 0);
    const totalAvailPorts = filteredStations.reduce((sum, s) => sum + s.availablePorts, 0);
    const totalPortsCount = filteredStations.reduce((sum, s) => sum + s.totalPorts, 0);
    return {
      totalCapKw,
      totalCapMw: (totalCapKw / 1000).toFixed(2),
      totalAvailPorts,
      totalPortsCount,
      uniqueStates: Array.from(new Set(filteredStations.map((s) => s.state))),
    };
  }, [filteredStations]);

  const handleStartImmediateCharge = (station: ChargingStation, port: ChargingPort) => {
    if (port.status !== 'AVAILABLE') {
      showToast(`Port ${port.portNumber} is currently ${port.status.toLowerCase()}. Please select an available stall.`, 'warning');
      return;
    }

    const vehicle = primaryVehicle ?? vehicles[0];
    if (!vehicle) {
      showToast('Add a vehicle before starting a charging session.', 'warning');
      setActiveTab('vehicle');
      setIsAddVehicleModalOpen(true);
      return;
    }

    startChargingSession({
      station,
      portNumber: port.portNumber,
      connectorType: port.connectorType,
      vehicle,
    });
    setInspectingStation(null);
  };

  // State options list with station counts
  const stateList = useMemo(() => {
    const counts: Record<string, number> = {};
    stations.forEach((s) => {
      counts[s.state] = (counts[s.state] || 0) + 1;
      if (s.regionZone === 'EXPRESSWAY') {
        counts['National Expressways'] = (counts['National Expressways'] || 0) + 1;
      }
    });

    const states = [
      { id: 'ALL', name: 'All India', count: stations.length },
      { id: 'Maharashtra', name: 'Maharashtra', count: counts['Maharashtra'] || 0 },
      { id: 'Tamil Nadu', name: 'Tamil Nadu', count: counts['Tamil Nadu'] || 0 },
      { id: 'Karnataka', name: 'Karnataka', count: counts['Karnataka'] || 0 },
      { id: 'Delhi NCR', name: 'Delhi NCR / Delhi', count: (counts['Delhi'] || 0) + (counts['Delhi NCR'] || 0) + (counts['Haryana'] ? 1 : 0) },
      { id: 'Telangana', name: 'Telangana', count: counts['Telangana'] || 0 },
      { id: 'Gujarat', name: 'Gujarat', count: counts['Gujarat'] || 0 },
      { id: 'Uttar Pradesh', name: 'Uttar Pradesh', count: counts['Uttar Pradesh'] || 0 },
      { id: 'Rajasthan', name: 'Rajasthan', count: counts['Rajasthan'] || 0 },
      { id: 'Kerala', name: 'Kerala', count: counts['Kerala'] || 0 },
      { id: 'West Bengal', name: 'West Bengal', count: counts['West Bengal'] || 0 },
      { id: 'Punjab', name: 'Punjab', count: counts['Punjab'] || 0 },
      { id: 'Haryana', name: 'Haryana', count: counts['Haryana'] || 0 },
      { id: 'Madhya Pradesh', name: 'Madhya Pradesh', count: counts['Madhya Pradesh'] || 0 },
      { id: 'Andhra Pradesh', name: 'Andhra Pradesh', count: counts['Andhra Pradesh'] || 0 },
      { id: 'Goa', name: 'Goa', count: counts['Goa'] || 0 },
      { id: 'Odisha', name: 'Odisha', count: counts['Odisha'] || 0 },
      { id: 'Bihar', name: 'Bihar', count: counts['Bihar'] || 0 },
      { id: 'National Expressways', name: 'National Expressways', count: counts['National Expressways'] || 4 },
    ];
    return states;
  }, [stations]);

  // Convert GPS lat/long to coordinates on the visualizer canvas
  // Dynamically zooms into state bounding box when state is active and isZoomedToState is true!
  const getMapCoordinates = (lat: number, lng: number) => {
    if (isZoomedToState && activeStateConfig) {
      const { minLat, maxLat, minLng, maxLng } = activeStateConfig;
      const latSpan = Math.max(0.2, maxLat - minLat);
      const lngSpan = Math.max(0.2, maxLng - minLng);

      // Longitude maps to X axis (with 12% margin)
      const rawX = ((lng - minLng) / lngSpan) * 76 + 12;
      // Latitude maps to Y axis (inverted in SVG screen space, with 12% margin)
      const rawY = (1 - (lat - minLat) / latSpan) * 76 + 12;

      return {
        left: `${Math.max(8, Math.min(92, rawX))}%`,
        top: `${Math.max(8, Math.min(92, rawY))}%`,
        isStateZoomed: true,
      };
    }

    // All-India view bounding box
    const minLat = 7.5;
    const maxLat = 36.0;
    const minLng = 67.5;
    const maxLng = 97.0;

    const xPercent = ((lng - minLng) / (maxLng - minLng)) * 100;
    const yPercent = (1 - (lat - minLat) / (maxLat - minLat)) * 100;

    return {
      left: `${Math.max(5, Math.min(95, xPercent))}%`,
      top: `${Math.max(5, Math.min(95, yPercent))}%`,
      isStateZoomed: false,
    };
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header & Search Bar */}
      <div className="rounded-3xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-6 space-y-5">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Zap className="h-5 w-5 fill-emerald-500/30 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  <span>Pan-India EV Power Stations</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-medium">
                    State Map Active
                  </span>
                </h1>
                <p className="text-xs text-neutral-400">
                  Search by state name or corridor to automatically open the focused state power map with live grid animations
                </p>
              </div>
            </div>
          </div>

          {/* Search Input with Clear button */}
          <div className="relative min-w-[280px] lg:min-w-[380px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Indian state (e.g. Maharashtra, Tamil Nadu, Gujarat, UP, Karnataka)..."
              className="w-full rounded-2xl bg-neutral-950 border border-neutral-800 pl-10 pr-10 py-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 transition-colors shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-500 hover:text-white"
                title="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Optional browser location access: requested only after the user clicks */}
        <div className="rounded-2xl border border-emerald-500/25 bg-gradient-to-r from-emerald-500/10 via-neutral-950 to-neutral-950 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/25 bg-emerald-500/10 text-emerald-400">
              <LocateFixed className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">
                {userLocation ? 'Nearby charging stations' : 'Find EV chargers near you'}
              </h2>
              <p className="mt-1 max-w-2xl text-xs leading-relaxed text-neutral-400">
                {userLocation
                  ? 'Your map and station results are sorted by distance from your current location. Your precise location stays in this browser session.'
                  : 'Allow location access to center the map on you and prioritize nearby chargers. Your browser will ask for permission after you click.'}
              </p>
              {locationMessage && <p role="status" className="mt-2 text-xs text-emerald-300">{locationMessage}</p>}
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {userLocation && (
              <button type="button" onClick={clearUserLocation} className="rounded-xl border border-neutral-700 px-3 py-2 text-xs font-semibold text-neutral-300 hover:border-neutral-500 hover:text-white">
                Turn off nearby mode
              </button>
            )}
            <button
              type="button"
              onClick={requestUserLocation}
              disabled={isLocating}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-neutral-950 transition hover:bg-emerald-400 disabled:cursor-wait disabled:opacity-70"
            >
              {isLocating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
              {isLocating ? 'Finding location…' : userLocation ? 'Update my location' : 'Use my location'}
            </button>
          </div>
        </div>

        {/* State-Wise Quick Pills Selector */}
        <div className="space-y-2 pt-2 border-t border-neutral-800/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <span className="text-neutral-300 font-semibold flex items-center gap-1.5">
              <Globe2 className="h-4 w-4 text-emerald-400" />
              <span>Select Indian State to Open State Map:</span>
            </span>
            <div className="flex items-center gap-2 text-neutral-400 text-[11px] font-mono">
              <span>Showing {filteredStations.length} of {stations.length} stations in India</span>
              <span>·</span>
              <button
                onClick={refreshStationData}
                disabled={isStationRefreshing}
                className="hover:text-emerald-400 flex items-center gap-1 transition-colors cursor-pointer"
                title="Refresh network telemetry"
              >
                <RefreshCw className={`h-3 w-3 ${isStationRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
            {stateList.map((st) => {
              const isSelected =
                selectedStateFilter.toLowerCase() === st.id.toLowerCase() ||
                (st.id !== 'ALL' && detectedStateName?.toLowerCase() === st.id.toLowerCase());

              return (
                <button
                  key={st.id}
                  onClick={() => {
                    setSelectedStateFilter(st.id);
                    setIsZoomedToState(true);
                    if (searchQuery) setSearchQuery('');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-500 text-neutral-950 font-bold shadow-md shadow-emerald-500/20'
                      : 'bg-neutral-950 border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700'
                  }`}
                >
                  <span>{st.name}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                      isSelected ? 'bg-neutral-950/20 text-neutral-950 font-bold' : 'bg-neutral-900 text-neutral-400'
                    }`}
                  >
                    {st.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter Bar: Connectors, Speed, Availability */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-neutral-800/80 text-xs">
          {/* Connector Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <span className="text-neutral-400 mr-1 flex items-center gap-1">
              <Filter className="h-3.5 w-3.5 text-neutral-500" /> Connector:
            </span>
            {(['ALL', 'CCS2', 'Type 2', 'CHAdeMO'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setSelectedConnectorFilter(type)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  selectedConnectorFilter === type
                    ? 'bg-emerald-500 text-neutral-950 font-bold'
                    : 'bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Speed & Live Availability */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800">
              <button
                onClick={() => setSelectedSpeedFilter('ALL')}
                className={`px-2.5 py-1 text-xs rounded transition-colors whitespace-nowrap cursor-pointer ${
                  selectedSpeedFilter === 'ALL'
                    ? 'bg-neutral-800 text-white font-medium'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                All kW
              </button>
              <button
                onClick={() => setSelectedSpeedFilter('FAST')}
                className={`px-2.5 py-1 text-xs rounded transition-colors whitespace-nowrap cursor-pointer ${
                  selectedSpeedFilter === 'FAST'
                    ? 'bg-neutral-800 text-white font-medium'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                150kW+ Fast
              </button>
              <button
                onClick={() => setSelectedSpeedFilter('ULTRA')}
                className={`px-2.5 py-1 text-xs rounded transition-colors whitespace-nowrap cursor-pointer ${
                  selectedSpeedFilter === 'ULTRA'
                    ? 'bg-neutral-800 text-emerald-400 font-bold'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                350kW Ultra
              </button>
            </div>

            <button
              onClick={() => setOnlyAvailable(!onlyAvailable)}
              className={`px-3 py-1.5 text-xs rounded-xl border transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                onlyAvailable
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                  : 'bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
              <span>Available Now</span>
            </button>
          </div>
        </div>
      </div>

      {/* State Power Spotlight Banner */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0 font-bold font-mono text-sm">
            {detectedStateName ? detectedStateName.slice(0, 2).toUpperCase() : 'IN'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-semibold tracking-wider text-emerald-400 flex items-center gap-1.5">
                <span>{detectedStateName ? `${detectedStateName} EV Power Grid Map` : 'Pan-India Power Grid Map'}</span>
                {detectedStateName && (
                  <span className="px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono normal-case">
                    State Map Mode
                  </span>
                )}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 font-mono">
                {filteredStations.length} Stations Found
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              {activeStateConfig ? (
                <span>
                  ⚡ <strong className="text-neutral-200">{activeStateConfig.discom}</strong> · Capacity: <strong className="text-white font-mono">{stateSummary.totalCapMw} MW</strong> · Open Ports: <strong className="text-emerald-400 font-mono">{stateSummary.totalAvailPorts}</strong>/{stateSummary.totalPortsCount}
                </span>
              ) : (
                <span>
                  Total Grid Capacity: <strong className="text-white font-mono">{stateSummary.totalCapMw} MW</strong> ({stateSummary.totalCapKw.toLocaleString()} kW) · Available Fast Stalls: <strong className="text-emerald-400 font-mono">{stateSummary.totalAvailPorts}</strong> / {stateSummary.totalPortsCount}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Clear Filters Reset if filtered */}
        {(selectedStateFilter !== 'ALL' || searchQuery || selectedConnectorFilter !== 'ALL' || selectedSpeedFilter !== 'ALL' || onlyAvailable) && (
          <button
            onClick={() => {
              setSelectedStateFilter('ALL');
              setSearchQuery('');
              setSelectedConnectorFilter('ALL');
              setSelectedSpeedFilter('ALL');
              setOnlyAvailable(false);
            }}
            className="text-xs text-neutral-400 hover:text-emerald-400 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
            <span>Reset All Filters to All-India</span>
          </button>
        )}
      </div>

      {/* Main Grid: Interactive State Power Grid Map / Radar + Station Cards */}
      <div className={`grid grid-cols-1 ${isMapExpanded ? 'lg:grid-cols-12' : 'lg:grid-cols-12'} gap-6 items-start`}>
        {/* Left Column: Interactive State / Pan-India Power Grid Geospatial Visualizer with Live Animation */}
        <div className={`${isMapExpanded ? 'lg:col-span-12' : 'lg:col-span-5'} rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 sticky top-20 space-y-3 transition-all`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Compass className="h-4 w-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>{detectedStateName ? `${detectedStateName} State Map` : 'India Power Grid Map'}</span>
                {detectedStateName && isZoomedToState && (
                  <span className="px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono">
                    Zoomed to State
                  </span>
                )}
              </h2>
              {isLiveAnimationEnabled && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-mono border border-emerald-500/30">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live Anim
                </span>
              )}
            </div>

            {/* Animation Toggle, State Zoom Toggle & Visualizer Mode Toggle */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* State Zoom Toggle if a state is detected */}
              {detectedStateName && (
                <button
                  type="button"
                  onClick={() => setIsZoomedToState(!isZoomedToState)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors flex items-center gap-1 cursor-pointer ${
                    isZoomedToState
                      ? 'bg-emerald-500 text-neutral-950 border-emerald-400 font-bold shadow-sm'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:text-white'
                  }`}
                  title={isZoomedToState ? 'Switch to All-India Map View' : `Zoom into ${detectedStateName} State Map`}
                >
                  <MapPin className="h-3 w-3" />
                  <span>{isZoomedToState ? `${detectedStateName} View` : 'All-India View'}</span>
                </button>
              )}

              {/* Map Expand / Minimize Toggle */}
              <button
                type="button"
                onClick={() => setIsMapExpanded(!isMapExpanded)}
                className="p-1.5 rounded-lg border border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white hover:border-neutral-700 transition-colors cursor-pointer"
                title={isMapExpanded ? 'Minimize Map View' : 'Expand Map Full Width'}
              >
                {isMapExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              </button>

              {/* Live Animation Toggle */}
              <button
                type="button"
                onClick={() => setIsLiveAnimationEnabled(!isLiveAnimationEnabled)}
                className={`px-2 py-1 rounded-lg text-[11px] font-semibold border transition-colors flex items-center gap-1 cursor-pointer ${
                  isLiveAnimationEnabled
                    ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                }`}
                title="Toggle Live Sweep & Pulse Animation"
              >
                <span className={`h-2 w-2 rounded-full ${isLiveAnimationEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-600'}`} />
                <span>{isLiveAnimationEnabled ? 'Anim ON' : 'Anim OFF'}</span>
              </button>

              <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800 text-xs">
                <button
                  onClick={() => setActiveVisualizerMode('google')}
                  className={`px-2.5 py-1 rounded transition-colors cursor-pointer flex items-center gap-1 ${
                    activeVisualizerMode === 'google'
                      ? 'bg-emerald-500 text-neutral-950 font-bold'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <MapPin className="h-3 w-3" />
                  <span>Google Map</span>
                </button>
                <button
                  onClick={() => setActiveVisualizerMode('map')}
                  className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                    activeVisualizerMode === 'map'
                      ? 'bg-emerald-500 text-neutral-950 font-bold'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  State Grid
                </button>
                <button
                  onClick={() => setActiveVisualizerMode('radar')}
                  className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                    activeVisualizerMode === 'radar'
                      ? 'bg-emerald-500 text-neutral-950 font-bold'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Radar Grid
                </button>
              </div>
            </div>
          </div>

          {/* Interactive State Map Canvas / Google Maps / Radar */}
          {activeVisualizerMode === 'google' ? (
            <div className={`relative w-full ${isMapExpanded ? 'h-[500px] sm:h-[580px]' : 'h-[440px] sm:h-[500px]'} rounded-xl overflow-hidden border border-neutral-800/80`}>
              <GoogleMapView
                stations={displayedStations}
                selectedStation={selectedStation}
                onSelectStation={(stn) => {
                  setSelectedStation(stn);
                  setInspectingStation(stn);
                }}
                activeCityKey={detectedStateName || selectedStateFilter || 'ALL'}
                userLocation={userLocation}
                onClearLocation={clearUserLocation}
              />
            </div>
          ) : activeVisualizerMode === 'map' ? (
            <div className={`relative w-full ${isMapExpanded ? 'h-[500px] sm:h-[580px]' : 'h-[440px] sm:h-[500px]'} rounded-xl bg-neutral-950 border border-neutral-800/80 overflow-hidden flex items-center justify-center transition-all`}>
              {/* Background Coordinate Grid */}
              <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="state_map_grid" width="35" height="35" patternUnits="userSpaceOnUse">
                    <path d="M 35 0 L 0 0 0 35" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-neutral-700" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#state_map_grid)" />
              </svg>

              {/* Watermark Name (State Name or INDIA) */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-15">
                <div className="text-[70px] sm:text-[90px] font-black tracking-widest text-neutral-600 select-none uppercase text-center px-4 leading-none">
                  {detectedStateName && isZoomedToState ? detectedStateName : 'INDIA'}
                </div>
                {detectedStateName && isZoomedToState && activeStateConfig && (
                  <div className="text-xs font-mono text-emerald-400 font-bold tracking-wider mt-2">
                    {activeStateConfig.discom}
                  </div>
                )}
              </div>

              {/* High-Voltage State & Highway Transmission Lines with Live Electric Flow */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                <g className={isLiveAnimationEnabled ? 'animate-electric-flow' : ''} stroke="rgba(16, 185, 129, 0.45)" strokeWidth="2" strokeDasharray="6,4" fill="none">
                  {isZoomedToState && activeStateConfig ? (
                    activeStateConfig.corridors.map((c, idx) => (
                      <path key={idx} d={c.d} />
                    ))
                  ) : (
                    <>
                      {/* North to West Grid: Delhi -> Jaipur -> Ahmedabad -> Mumbai */}
                      <path d="M 170 120 L 150 170 L 120 220 L 130 280" />
                      {/* West to South: Mumbai -> Pune -> Bengaluru -> Chennai */}
                      <path d="M 130 280 L 150 310 L 180 380 L 220 395" />
                      {/* North to East: Delhi -> Lucknow -> Varanasi -> Patna -> Kolkata */}
                      <path d="M 170 120 L 220 160 L 250 185 L 280 190 L 310 230" />
                      {/* Central Hubs: Mumbai -> Indore -> Bhopal -> Nagpur -> Hyderabad -> Bengaluru */}
                      <path d="M 130 280 L 165 240 L 185 245 L 210 270 L 205 320 L 180 380" />
                      {/* Southern Coastal: Chennai -> Visakhapatnam -> Bhubaneswar -> Kolkata */}
                      <path d="M 220 395 L 255 330 L 275 280 L 310 230" />
                    </>
                  )}
                </g>
              </svg>

              {/* State Landmarks & Major District Hub Markers */}
              {isZoomedToState && activeStateConfig ? (
                activeStateConfig.landmarks.map((lm, idx) => (
                  <div
                    key={idx}
                    style={{ left: `${lm.x}%`, top: `${lm.y}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none z-0 select-none"
                  >
                    <div className="flex items-center gap-1 bg-neutral-900/80 backdrop-blur-sm border border-neutral-700/60 px-2 py-0.5 rounded-md shadow-sm">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      <span className="text-[10px] font-mono font-bold text-neutral-300 whitespace-nowrap">{lm.name}</span>
                    </div>
                  </div>
                ))
              ) : (
                <>
                  <div className="absolute top-[20%] left-[34%] text-[10px] text-neutral-500 font-mono pointer-events-none bg-neutral-950/70 px-1 rounded">DELHI NCR</div>
                  <div className="absolute top-[48%] left-[24%] text-[10px] text-neutral-500 font-mono pointer-events-none bg-neutral-950/70 px-1 rounded">MUMBAI</div>
                  <div className="absolute top-[68%] left-[42%] text-[10px] text-neutral-500 font-mono pointer-events-none bg-neutral-950/70 px-1 rounded">BENGALURU</div>
                  <div className="absolute top-[72%] left-[54%] text-[10px] text-neutral-500 font-mono pointer-events-none bg-neutral-950/70 px-1 rounded">CHENNAI</div>
                  <div className="absolute top-[42%] left-[72%] text-[10px] text-neutral-500 font-mono pointer-events-none bg-neutral-950/70 px-1 rounded">KOLKATA</div>
                  <div className="absolute top-[40%] left-[22%] text-[10px] text-neutral-500 font-mono pointer-events-none bg-neutral-950/70 px-1 rounded">GUJARAT</div>
                  <div className="absolute top-[58%] left-[45%] text-[10px] text-neutral-500 font-mono pointer-events-none bg-neutral-950/70 px-1 rounded">HYDERABAD</div>
                </>
              )}

              {/* Live Animated Conical Radar Sweep across State */}
              {isLiveAnimationEnabled && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full animate-radar-sweep pointer-events-none opacity-30"
                    style={{
                      background: 'conic-gradient(from 0deg, transparent 0deg, transparent 270deg, rgba(16, 185, 129, 0.15) 320deg, rgba(52, 211, 153, 0.45) 360deg)',
                    }}
                  />
                  {/* Active Laser Scanline */}
                  <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400/70 to-transparent animate-scanline pointer-events-none" />
                </div>
              )}

              {/* Clickable Station Pins Plotted by Real GPS Latitude & Longitude with Animated Beacon Rings */}
              {displayedStations.map((station) => {
                const pos = getMapCoordinates(station.latitude, station.longitude);
                const isSelected = selectedStation?.id === station.id;
                const isAvail = station.availablePorts > 0;

                return (
                  <button
                    key={station.id}
                    onClick={() => {
                      setSelectedStation(station);
                      setInspectingStation(station);
                    }}
                    style={{ left: pos.left, top: pos.top }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 z-10 transition-all hover:scale-125 focus:outline-none cursor-pointer group ${
                      isSelected ? 'scale-125 z-30' : ''
                    }`}
                    title={`${station.name} (${station.city}, ${station.state} · ${station.powerKw}kW · ${station.availablePorts} of ${station.totalPorts} ports available)`}
                  >
                    {/* Live Expanding Pulse Wave Beacon Ring */}
                    {isLiveAnimationEnabled && isAvail && (
                      <span className="absolute -inset-1.5 rounded-full bg-emerald-500/40 animate-pulse-wave pointer-events-none" />
                    )}

                    {isSelected && (
                      <span className="absolute -inset-3 rounded-full bg-emerald-400/60 animate-ping pointer-events-none" />
                    )}

                    <div
                      className={`relative flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono shadow-2xl transition-all ${
                        isSelected
                          ? 'bg-emerald-400 text-neutral-950 ring-4 ring-emerald-500/40'
                          : isAvail
                          ? 'bg-neutral-900 border border-emerald-500 text-emerald-400 group-hover:border-emerald-300'
                          : 'bg-neutral-900 border border-neutral-700 text-neutral-500'
                      }`}
                    >
                      <Zap className={`h-3 w-3 fill-current ${isLiveAnimationEnabled && isAvail ? 'text-emerald-400 animate-pulse' : ''}`} />
                      <span>{station.powerKw}k</span>
                    </div>

                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-neutral-900 border border-neutral-700 text-white rounded-xl p-3 text-xs whitespace-nowrap shadow-2xl z-40 pointer-events-none min-w-[200px]">
                      <div className="font-bold text-emerald-400">{station.name}</div>
                      <div className="text-neutral-400 text-[11px]">{station.city}, {station.state}</div>
                      <div className="text-white font-mono mt-1 flex items-center justify-between">
                        <span className="text-emerald-400">{station.availablePorts} of {station.totalPorts} ports open</span>
                        <span className="text-neutral-300">₹{station.pricingPerKwh}/kWh</span>
                      </div>
                      {station.discom && (
                        <div className="text-[10px] text-neutral-500 mt-0.5">⚡ {station.discom}</div>
                      )}
                    </div>
                  </button>
                );
              })}

              {/* State Info Floating Badge on Top Left of Map */}
              <div className="absolute top-3 left-3 bg-neutral-900/90 backdrop-blur-md border border-neutral-800 p-2.5 rounded-xl z-20 max-w-[240px] pointer-events-none shadow-lg">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-[11px] font-bold text-white uppercase tracking-wider">
                    {detectedStateName ? `${detectedStateName} Grid` : 'Pan-India Grid'}
                  </span>
                </div>
                <p className="text-[10px] text-neutral-400 mt-0.5 line-clamp-2">
                  {activeStateConfig ? activeStateConfig.description : 'Real-time telemetry from state distribution companies across India.'}
                </p>
              </div>

              {/* State Expressway Corridor Badges on Bottom Left of Map */}
              {activeStateConfig && activeStateConfig.expresswayTags.length > 0 && (
                <div className="absolute bottom-3 left-3 hidden sm:flex items-center gap-1 z-20 flex-wrap max-w-sm pointer-events-none">
                  {activeStateConfig.expresswayTags.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 rounded bg-neutral-900/90 border border-neutral-800 text-[10px] font-mono text-neutral-300">
                      🛣️ {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Radar Visualizer Mode with Live Sweep Animation */
            <div className={`relative w-full ${isMapExpanded ? 'h-[500px] sm:h-[580px]' : 'h-[440px] sm:h-[500px]'} rounded-xl bg-neutral-950 border border-neutral-800/80 overflow-hidden flex items-center justify-center`}>
              <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="radar_grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-neutral-600" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#radar_grid)" />
              </svg>

              {/* Concentric Radar Rings */}
              <div className="absolute w-80 h-80 rounded-full border border-emerald-500/20 pointer-events-none" />
              <div className="absolute w-56 h-56 rounded-full border border-emerald-500/30 pointer-events-none" />
              <div className="absolute w-28 h-28 rounded-full border border-emerald-500/40 pointer-events-none" />
              <div className="absolute w-2 h-2 rounded-full bg-emerald-400 pointer-events-none shadow-lg shadow-emerald-400" />

              {/* Crosshairs */}
              <div className="absolute left-0 right-0 h-[1px] bg-emerald-500/20 pointer-events-none" />
              <div className="absolute top-0 bottom-0 w-[1px] bg-emerald-500/20 pointer-events-none" />

              {/* Rotating Radar Sweep Beam */}
              {isLiveAnimationEnabled && (
                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] rounded-full animate-radar-sweep pointer-events-none"
                  style={{
                    background: 'conic-gradient(from 0deg, transparent 0deg, transparent 270deg, rgba(16, 185, 129, 0.15) 320deg, rgba(52, 211, 153, 0.5) 360deg)',
                  }}
                />
              )}

              {/* Station Markers on Radar with Pulse Waves */}
              {displayedStations.map((station, index) => {
                const positions = [
                  { top: '35%', left: '55%' },
                  { top: '60%', left: '38%' },
                  { top: '25%', left: '30%' },
                  { top: '75%', left: '68%' },
                  { top: '80%', left: '25%' },
                  { top: '45%', left: '72%' },
                  { top: '30%', left: '65%' },
                  { top: '65%', left: '52%' },
                  { top: '20%', left: '48%' },
                  { top: '82%', left: '45%' },
                ];
                const pos = positions[index % positions.length];
                const isSelected = selectedStation?.id === station.id;
                const isAvail = station.availablePorts > 0;

                return (
                  <button
                    key={station.id}
                    onClick={() => {
                      setSelectedStation(station);
                      setInspectingStation(station);
                    }}
                    style={{ top: pos.top, left: pos.left }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 z-10 transition-transform hover:scale-110 focus:outline-none cursor-pointer ${
                      isSelected ? 'scale-125 z-30' : ''
                    }`}
                  >
                    {isLiveAnimationEnabled && isAvail && (
                      <span className="absolute -inset-1 rounded-full bg-emerald-500/30 animate-pulse-wave pointer-events-none" />
                    )}

                    <div
                      className={`relative flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold font-mono shadow-lg ${
                        isSelected
                          ? 'bg-emerald-500 text-neutral-950 ring-4 ring-emerald-500/30'
                          : station.availablePorts > 0
                          ? 'bg-neutral-900 border border-emerald-500 text-emerald-400'
                          : 'bg-neutral-900 border border-neutral-700 text-neutral-400'
                      }`}
                    >
                      <Zap className={`h-3 w-3 fill-current ${isLiveAnimationEnabled && isAvail ? 'animate-pulse' : ''}`} />
                      <span>{station.powerKw}k</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Telemetry Footer Status Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-neutral-400 pt-1 gap-2 border-t border-neutral-800/80">
            <span className="flex items-center gap-1.5 font-mono">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span>
                {detectedStateName ? `${detectedStateName} DISCOM Grid:` : 'National Grid:'}{' '}
                <strong className="text-emerald-400">50.02 Hz</strong> · Sync Active
              </span>
            </span>
            <span className="font-mono text-neutral-400">
              {filteredStations.length} hubs active in sweep
            </span>
          </div>
        </div>

        {/* Right Column: Station Listings */}
        <div className={`${isMapExpanded ? 'lg:col-span-12' : 'lg:col-span-7'} space-y-4`}>
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-neutral-400">
              Showing <span className="text-white font-bold">{filteredStations.length}</span> charging power stations
              {detectedStateName && (
                <span> in <span className="text-emerald-400 font-semibold">{detectedStateName}</span></span>
              )}
            </p>
            <span className="text-xs text-neutral-500 font-mono">Sorted by capacity & proximity</span>
          </div>

          {filteredStations.length === 0 ? (
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-8 text-center space-y-3">
              <AlertCircle className="h-8 w-8 text-neutral-500 mx-auto" />
              <p className="text-sm font-semibold text-white">No power stations found matching your criteria</p>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                Try switching to "All India" state view or clearing search keywords.
              </p>
              <button
                onClick={() => {
                  setSelectedStateFilter('ALL');
                  setSelectedConnectorFilter('ALL');
                  setSelectedSpeedFilter('ALL');
                  setOnlyAvailable(false);
                  setSearchQuery('');
                }}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-500 text-neutral-950 hover:bg-emerald-400 cursor-pointer"
              >
                Reset Filters to All India
              </button>
            </div>
          ) : (
            displayedStations.map((station) => {
              const isSelected = selectedStation?.id === station.id;

              return (
                <div
                  key={station.id}
                  className={`rounded-2xl border transition-all p-5 space-y-4 ${
                    isSelected
                      ? 'border-emerald-500/80 bg-neutral-900/90 ring-1 ring-emerald-500/20 shadow-lg'
                      : 'border-neutral-800 bg-neutral-900/50 hover:border-neutral-700 hover:bg-neutral-900/70'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5">
                      {/* State and City Pill Badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          {station.state}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[11px] bg-neutral-800 text-neutral-300 font-medium">
                          {station.city}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-neutral-800 text-emerald-300 font-mono">
                          {station.powerKw} kW DC
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-white hover:text-emerald-400 transition-colors">
                        {station.name}
                      </h3>

                      <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                        <MapPin className="h-3.5 w-3.5 text-neutral-500 shrink-0" />
                        <span>{station.address}, {station.city}, {station.state} - {station.postalCode}</span>
                        <button
                          onClick={() => copyToClipboard(`${station.name}, ${station.address}, ${station.city}, ${station.state}`, 'Station Address')}
                          className="p-1 text-neutral-500 hover:text-white rounded cursor-pointer"
                          title="Copy Full Address"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>

                      {station.discom && (
                        <p className="text-[11px] text-neutral-400 font-mono">
                          ⚡ DISCOM Grid: <span className="text-neutral-300 font-semibold">{station.discom}</span>
                        </p>
                      )}
                      <p className="text-[11px] text-neutral-500">Operated by {station.operator}</p>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-1 shrink-0">
                      <span className="text-xs font-mono font-bold text-emerald-400 tabular-nums">
                        {userLocation ? `${getDistanceKm(userLocation, station).toFixed(1)} km away` : `${station.distanceKm} km away`}
                      </span>
                      <span className="text-xs text-neutral-300 font-mono font-bold">
                        ₹{station.pricingPerKwh.toFixed(2)}/kWh
                      </span>
                      <span className="text-[10px] text-neutral-500">Zero surcharge</span>
                    </div>
                  </div>

                  {/* Port Telemetry Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-xl bg-neutral-950/80 p-3 text-xs border border-neutral-800/80 font-mono">
                    <div>
                      <span className="text-neutral-500 text-[10px] block font-sans">Port Availability</span>
                      <span className={`font-semibold ${station.availablePorts > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {station.availablePorts} of {station.totalPorts} Open
                      </span>
                    </div>
                    <div>
                      <span className="text-neutral-500 text-[10px] block font-sans">Power Rating</span>
                      <span className="font-semibold text-white">{station.powerKw} kW DC</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 text-[10px] block font-sans">Parking</span>
                      <span className="font-semibold text-white">
                        {station.parkingFeePerHour === 0 ? 'Free' : `₹${station.parkingFeePerHour}/hr`}
                      </span>
                    </div>
                    <div>
                      <span className="text-neutral-500 text-[10px] block font-sans">Rating</span>
                      <span className="font-semibold text-amber-300">★ {station.rating} ({station.reviewCount})</span>
                    </div>
                  </div>

                  {/* Connectors & Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-neutral-800/80">
                    <div className="flex flex-wrap gap-1.5">
                      {Array.from(new Set(station.ports.map((p) => p.connectorType))).map((conn) => (
                        <span key={conn} className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 text-[11px] font-mono">
                          {conn}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openBookingForStation(station)}
                        className="py-1.5 px-3.5 text-xs font-semibold rounded-xl bg-emerald-500 text-neutral-950 hover:bg-emerald-400 transition-colors flex items-center gap-1.5 shadow-sm shadow-emerald-500/20 cursor-pointer"
                      >
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Reserve Slot</span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedStation(station);
                          setInspectingStation(station);
                        }}
                        className="py-1.5 px-3 text-xs font-medium rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Zap className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Inspect Stalls</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Station Port Detail Modal */}
      {inspectingStation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-neutral-800 pb-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    {inspectingStation.state}
                  </span>
                  <h2 className="text-xl font-bold text-white">{inspectingStation.name}</h2>
                  <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-400 text-xs font-mono font-semibold">
                    {inspectingStation.powerKw} kW Hub
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-neutral-400">
                  <MapPin className="h-3.5 w-3.5 text-neutral-500" />
                  <span>{inspectingStation.address}, {inspectingStation.city}, {inspectingStation.state}</span>
                  <button
                    onClick={() => copyToClipboard(`${inspectingStation.address}, ${inspectingStation.city}`, 'Address')}
                    className="p-1 hover:text-white cursor-pointer"
                    title="Copy Address"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <button
                onClick={() => setInspectingStation(null)}
                className="rounded-lg p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Individual Ports Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Live Stall Telemetry</h3>
                <span className="text-xs text-neutral-400 font-mono">
                  {inspectingStation.availablePorts} of {inspectingStation.totalPorts} ports open
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {inspectingStation.ports.map((port) => (
                  <div
                    key={port.id}
                    className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-3.5 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white text-xs">Port #{port.portNumber}</span>
                        <span className="px-2 py-0.2 rounded bg-neutral-800 text-[10px] font-mono text-neutral-300">
                          {port.connectorType}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-neutral-400">{port.maxPowerKw} kW DC</span>
                        <span className="text-neutral-600">·</span>
                        <span
                          className={`text-xs font-semibold ${
                            port.status === 'AVAILABLE'
                              ? 'text-emerald-400'
                              : port.status === 'OCCUPIED'
                              ? 'text-amber-400'
                              : port.status === 'RESERVED'
                              ? 'text-blue-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {port.status}
                        </span>
                      </div>
                      {port.currentOccupantVehicle && (
                        <p className="text-[10px] text-neutral-400 font-mono mt-0.5">
                          Charging: {port.currentOccupantVehicle}
                        </p>
                      )}
                    </div>

                    <button
                      disabled={port.status !== 'AVAILABLE'}
                      onClick={() => handleStartImmediateCharge(inspectingStation, port)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                        port.status === 'AVAILABLE'
                          ? 'bg-emerald-500 text-neutral-950 hover:bg-emerald-400 cursor-pointer'
                          : 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
                      }`}
                    >
                      <Play className="h-3 w-3 fill-current" />
                      <span>Start</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
              <button
                onClick={() => setInspectingStation(null)}
                className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  openBookingForStation(inspectingStation);
                  setInspectingStation(null);
                }}
                className="px-5 py-2 text-xs font-semibold rounded-xl bg-emerald-500 text-neutral-950 hover:bg-emerald-400 transition-colors shadow-sm shadow-emerald-500/20 cursor-pointer"
              >
                Reserve Slot at This Station
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
