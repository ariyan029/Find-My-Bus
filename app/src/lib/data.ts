import type { BusStatus, Occupancy, TelemetrySource } from "./enums";

export interface BusStop {
  id: string;
  name: string;
  bengaliName: string;
  code: string;
  lat: number;
  lng: number;
  landmark: string;
  zone: string;
  connectingRoutes: string[];
}

export interface RouteStopPoint {
  stopId: string;
  name: string;
  bengaliName?: string;
  lat: number;
  lng: number;
  sequence: number;
  typicalTimeMins: number;
  fareFromStart: number;
}

export interface BusRoute {
  id: string;
  routeNumber: string;
  name: string;
  source: string;
  destination: string;
  distanceKm: number;
  totalStops: number;
  busType: "AC_EXPRESS" | "ORDINARY" | "MINIBUS" | "ELECTRIC";
  operator: "WBTC" | "CSTC" | "PRIVATE";
  avgTripMins: number;
  fareMin: number;
  fareMax: number;
  frequencyMins: number;
  stops: string[];
  stopPoints?: RouteStopPoint[];
}

export interface LiveBus {
  id: string;
  busNumber: string;
  routeId: string;
  regNumber: string;
  driverName?: string;
  currentLat: number;
  currentLng: number;
  speedKmh: number;
  heading: number;
  status: BusStatus;
  occupancy: Occupancy;
  telemetrySource: TelemetrySource;
  activeDeviceId?: string | null;
  satellites?: number | null;
  originStop: string;
  nextStop: string;
  etaNextStopMins: number;
  distanceToNextStopKm?: number;
  progressPct: number;
  destination: string;
  lastUpdatedSecsAgo: number;
  crowdsourceContributors: number;
}

export interface IoTDeviceInfo {
  id: string;
  busId: string | null;
  busNumber: string;
  hardwareType: string;
  firmwareVersion: string;
  batteryPct: number | null;
  satellites: number | null;
  signalRssi: number | null;
  lastLat: number | null;
  lastLng: number | null;
  lastSeenIso: string | null;
  isActive: boolean;
  connectionState: "online" | "stale" | "offline";
}

export const KOLKATA_STOPS: BusStop[] = [
  {
    id: "stop-howrah",
    name: "Howrah Station",
    bengaliName: "হাওড়া স্টেশন",
    code: "HWH",
    lat: 22.5850,
    lng: 88.3426,
    landmark: "Howrah Bridge & Suburban Rail Terminus",
    zone: "Central / West",
    connectingRoutes: ["S-12", "AC-39", "C-11", "AC-12"],
  },
  {
    id: "stop-esplanade",
    name: "Esplanade Bus Terminus",
    bengaliName: "এসপ্ল্যানেড",
    code: "ESP",
    lat: 22.5654,
    lng: 88.3516,
    landmark: "Metro Interchange & Tram Depot",
    zone: "Central",
    connectingRoutes: ["S-12", "C-11", "239B"],
  },
  {
    id: "stop-parkst",
    name: "Park Street Crossing",
    bengaliName: "পার্ক স্ট্রিট",
    code: "PRK",
    lat: 22.5511,
    lng: 88.3524,
    landmark: "Chowringhee & Camac St Junction",
    zone: "Central",
    connectingRoutes: ["AC-12"],
  },
  {
    id: "stop-exide",
    name: "Exide / Rabindra Sadan",
    bengaliName: "এক্সাইড / রবীন্দ্র সদন",
    code: "EXD",
    lat: 22.5393,
    lng: 88.3475,
    landmark: "Nandan Cultural Center & Exide Crossing",
    zone: "South",
    connectingRoutes: ["AC-12"],
  },
  {
    id: "stop-hazra",
    name: "Hazra More",
    bengaliName: "হাজরা মোড়",
    code: "HZR",
    lat: 22.5255,
    lng: 88.3458,
    landmark: "Ashutosh College",
    zone: "South",
    connectingRoutes: ["AC-12"],
  },
  {
    id: "stop-rashbehari",
    name: "Rashbehari Crossing",
    bengaliName: "রাসবিহারী মোড়",
    code: "RSB",
    lat: 22.5186,
    lng: 88.3497,
    landmark: "Kalighat Metro",
    zone: "South",
    connectingRoutes: ["AC-12"],
  },
  {
    id: "stop-gariahat",
    name: "Gariahat Junction",
    bengaliName: "গড়িয়াহাট",
    code: "GHT",
    lat: 22.5167,
    lng: 88.3667,
    landmark: "Gariahat Flyover & Retail Center",
    zone: "South",
    connectingRoutes: ["S-9"],
  },
  {
    id: "stop-jadavpur",
    name: "Jadavpur 8B Bus Stand",
    bengaliName: "যাদবপুর ৮বি",
    code: "JDP",
    lat: 22.4988,
    lng: 88.3718,
    landmark: "Jadavpur University Main Campus",
    zone: "South",
    connectingRoutes: ["S-9"],
  },
  {
    id: "stop-garia",
    name: "Garia Bus Stand",
    bengaliName: "গড়িয়া",
    code: "GAR",
    lat: 22.4633,
    lng: 88.3812,
    landmark: "Kavi Subhash Metro",
    zone: "South",
    connectingRoutes: ["AC-12"],
  },
  {
    id: "stop-sealdah",
    name: "Sealdah Station",
    bengaliName: "শিয়ালদহ স্টেশন",
    code: "SDAH",
    lat: 22.5675,
    lng: 88.3712,
    landmark: "Eastern Railway Main Terminus",
    zone: "Central / East",
    connectingRoutes: ["S-12", "239B"],
  },
  {
    id: "stop-moulali",
    name: "Moulali Crossing",
    bengaliName: "মৌলালী",
    code: "MLI",
    lat: 22.5593,
    lng: 88.3683,
    landmark: "Youth Hostel",
    zone: "Central",
    connectingRoutes: ["C-11"],
  },
  {
    id: "stop-khanna",
    name: "Khanna Cinema",
    bengaliName: "খান্না সিনেমা",
    code: "KHN",
    lat: 22.5932,
    lng: 88.3745,
    landmark: "Maniktala Corridor",
    zone: "North",
    connectingRoutes: ["239B"],
  },
  {
    id: "stop-shyambazar",
    name: "Shyambazar Five Point",
    bengaliName: "শ্যামবাজার পাঁচ মাথার মোড়",
    code: "SYB",
    lat: 22.6022,
    lng: 88.3718,
    landmark: "Netaji Equestrian Statue",
    zone: "North",
    connectingRoutes: ["AC-39"],
  },
  {
    id: "stop-ultadanga",
    name: "Ultadanga Hudco",
    bengaliName: "উল্টোডাঙা হাডকো",
    code: "ULT",
    lat: 22.5976,
    lng: 88.3912,
    landmark: "Bidhannagar Road Station Corridor",
    zone: "North-East",
    connectingRoutes: ["S-12", "AC-39", "C-11", "239B"],
  },
  {
    id: "stop-karunamoyee",
    name: "Salt Lake Karunamoyee",
    bengaliName: "করুণাময়ী",
    code: "KRN",
    lat: 22.5855,
    lng: 88.4208,
    landmark: "Central Park Bus Depot & Metro",
    zone: "East",
    connectingRoutes: ["S-12", "S-9"],
  },
  {
    id: "stop-sector5",
    name: "Salt Lake Sector V",
    bengaliName: "সেক্টর ৫",
    code: "SEC5",
    lat: 22.5735,
    lng: 88.4339,
    landmark: "Wipro Geofence & College More",
    zone: "East / IT Corridor",
    connectingRoutes: ["S-12", "C-11"],
  },
  {
    id: "stop-ruby",
    name: "Ruby Hospital Crossing",
    bengaliName: "রুবি হাসপাতাল মোড়",
    code: "RBY",
    lat: 22.5137,
    lng: 88.4017,
    landmark: "EM Bypass & Hemanta Mukherjee Metro",
    zone: "South-East",
    connectingRoutes: ["S-9"],
  },
  {
    id: "stop-sciencecity",
    name: "Science City More",
    bengaliName: "সায়েন্স সিটি মোড়",
    code: "SCI",
    lat: 22.5416,
    lng: 88.3965,
    landmark: "EM Bypass & Maa Flyover",
    zone: "East",
    connectingRoutes: ["S-9"],
  },
  {
    id: "stop-chinar",
    name: "Chinar Park",
    bengaliName: "চিনার পার্ক",
    code: "CNR",
    lat: 22.6276,
    lng: 88.4485,
    landmark: "Rajarhat Main Rd",
    zone: "North-East",
    connectingRoutes: ["AC-39", "239B"],
  },
  {
    id: "stop-newtown",
    name: "New Town Shapoorji",
    bengaliName: "নিউ টাউন শাপুর্জি",
    code: "NTW",
    lat: 22.5682,
    lng: 88.4901,
    landmark: "Sukhobrishti Bus Terminus",
    zone: "New Town",
    connectingRoutes: ["S-12"],
  },
  {
    id: "stop-airport",
    name: "Netaji Subhash Airport (Gate 1)",
    bengaliName: "বিমানবন্দর ১নং গেট",
    code: "CCU",
    lat: 22.6534,
    lng: 88.4467,
    landmark: "VIP Road Airport Terminal",
    zone: "North-East",
    connectingRoutes: ["AC-39"],
  },
];

const STOP_BY_ID = new Map(KOLKATA_STOPS.map((s) => [s.id, s]));

function buildStopPoints(entries: Array<[string, number, number]>): RouteStopPoint[] {
  return entries
    .map(([stopId, typicalTimeMins, fareFromStart], index) => {
      const stop = STOP_BY_ID.get(stopId);
      if (!stop) return null;
      return {
        stopId: stop.id,
        name: stop.name,
        bengaliName: stop.bengaliName,
        lat: stop.lat,
        lng: stop.lng,
        sequence: index + 1,
        typicalTimeMins,
        fareFromStart,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
}

const S12_STOPS = buildStopPoints([
  ["stop-howrah", 0, 0],
  ["stop-esplanade", 12, 25],
  ["stop-sealdah", 22, 25],
  ["stop-ultadanga", 36, 30],
  ["stop-karunamoyee", 48, 35],
  ["stop-sector5", 58, 40],
  ["stop-newtown", 75, 45],
]);

const AC39_STOPS = buildStopPoints([
  ["stop-howrah", 0, 0],
  ["stop-shyambazar", 18, 30],
  ["stop-ultadanga", 28, 35],
  ["stop-chinar", 46, 45],
  ["stop-airport", 60, 50],
]);

const C11_STOPS = buildStopPoints([
  ["stop-howrah", 0, 0],
  ["stop-esplanade", 12, 10],
  ["stop-moulali", 22, 12],
  ["stop-ultadanga", 38, 16],
  ["stop-sector5", 55, 20],
]);

const S9_STOPS = buildStopPoints([
  ["stop-jadavpur", 0, 0],
  ["stop-gariahat", 12, 12],
  ["stop-ruby", 24, 15],
  ["stop-sciencecity", 36, 18],
  ["stop-karunamoyee", 50, 22],
]);

const AC12_STOPS = buildStopPoints([
  ["stop-howrah", 0, 0],
  ["stop-parkst", 16, 25],
  ["stop-exide", 24, 25],
  ["stop-hazra", 34, 30],
  ["stop-rashbehari", 42, 35],
  ["stop-garia", 65, 40],
]);

const B239_STOPS = buildStopPoints([
  ["stop-esplanade", 0, 0],
  ["stop-sealdah", 10, 10],
  ["stop-khanna", 22, 12],
  ["stop-ultadanga", 32, 15],
  ["stop-chinar", 50, 18],
]);

export const KOLKATA_ROUTES: BusRoute[] = [
  {
    id: "route-s12",
    routeNumber: "S-12",
    name: "Howrah Station ⇄ New Town Shapoorji",
    source: "Howrah Station",
    destination: "New Town Shapoorji",
    distanceKm: 24.5,
    totalStops: S12_STOPS.length,
    busType: "AC_EXPRESS",
    operator: "WBTC",
    avgTripMins: 75,
    fareMin: 25,
    fareMax: 45,
    frequencyMins: 8,
    stops: S12_STOPS.map((s) => s.name),
    stopPoints: S12_STOPS,
  },
  {
    id: "route-ac39",
    routeNumber: "AC-39",
    name: "Howrah Station ⇄ Kolkata Airport",
    source: "Howrah Station",
    destination: "Netaji Subhash Airport (Gate 1)",
    distanceKm: 20.2,
    totalStops: AC39_STOPS.length,
    busType: "AC_EXPRESS",
    operator: "WBTC",
    avgTripMins: 60,
    fareMin: 30,
    fareMax: 50,
    frequencyMins: 12,
    stops: AC39_STOPS.map((s) => s.name),
    stopPoints: AC39_STOPS,
  },
  {
    id: "route-c11",
    routeNumber: "C-11",
    name: "Howrah Station ⇄ Salt Lake Sector V",
    source: "Howrah Station",
    destination: "Salt Lake Sector V",
    distanceKm: 16.8,
    totalStops: C11_STOPS.length,
    busType: "ORDINARY",
    operator: "CSTC",
    avgTripMins: 55,
    fareMin: 10,
    fareMax: 20,
    frequencyMins: 10,
    stops: C11_STOPS.map((s) => s.name),
    stopPoints: C11_STOPS,
  },
  {
    id: "route-s9",
    routeNumber: "S-9",
    name: "Jadavpur 8B ⇄ Salt Lake Karunamoyee",
    source: "Jadavpur 8B Bus Stand",
    destination: "Salt Lake Karunamoyee",
    distanceKm: 18.0,
    totalStops: S9_STOPS.length,
    busType: "ORDINARY",
    operator: "WBTC",
    avgTripMins: 50,
    fareMin: 12,
    fareMax: 22,
    frequencyMins: 10,
    stops: S9_STOPS.map((s) => s.name),
    stopPoints: S9_STOPS,
  },
  {
    id: "route-ac12",
    routeNumber: "AC-12",
    name: "Howrah Station ⇄ Garia Bus Stand",
    source: "Howrah Station",
    destination: "Garia Bus Stand",
    distanceKm: 19.5,
    totalStops: AC12_STOPS.length,
    busType: "AC_EXPRESS",
    operator: "WBTC",
    avgTripMins: 65,
    fareMin: 25,
    fareMax: 40,
    frequencyMins: 15,
    stops: AC12_STOPS.map((s) => s.name),
    stopPoints: AC12_STOPS,
  },
  {
    id: "route-239b",
    routeNumber: "239B",
    name: "Esplanade ⇄ Chinar Park",
    source: "Esplanade Bus Terminus",
    destination: "Chinar Park",
    distanceKm: 17.2,
    totalStops: B239_STOPS.length,
    busType: "MINIBUS",
    operator: "PRIVATE",
    avgTripMins: 50,
    fareMin: 10,
    fareMax: 18,
    frequencyMins: 12,
    stops: B239_STOPS.map((s) => s.name),
    stopPoints: B239_STOPS,
  },
];

export const ACTIVE_LIVE_BUSES: LiveBus[] = [
  {
    id: "bus-wb01-101",
    busNumber: "S-12",
    routeId: "route-s12",
    regNumber: "WB-01-A-4482",
    driverName: "Subhasish Ghosh",
    currentLat: 22.5802,
    currentLng: 88.4110,
    speedKmh: 38.5,
    heading: 85,
    status: "ON_ROUTE",
    occupancy: "SEATS_AVAILABLE",
    telemetrySource: "ESP_IOT",
    activeDeviceId: "esp32-wb01-101",
    satellites: 9,
    originStop: "Howrah Station",
    nextStop: "Salt Lake Karunamoyee",
    etaNextStopMins: 3,
    distanceToNextStopKm: 1.2,
    progressPct: 68,
    destination: "New Town Shapoorji",
    lastUpdatedSecsAgo: 12,
    crowdsourceContributors: 6,
  },
  {
    id: "bus-wb01-102",
    busNumber: "S-12",
    routeId: "route-s12",
    regNumber: "WB-01-A-4491",
    driverName: "Tapan Mondal",
    currentLat: 22.5695,
    currentLng: 88.4421,
    speedKmh: 29.0,
    heading: 92,
    status: "CONGESTED",
    occupancy: "STANDING_ONLY",
    telemetrySource: "DRIVER_APP",
    activeDeviceId: null,
    originStop: "Howrah Station",
    nextStop: "New Town Shapoorji",
    etaNextStopMins: 10,
    distanceToNextStopKm: 4.9,
    progressPct: 86,
    destination: "New Town Shapoorji",
    lastUpdatedSecsAgo: 24,
    crowdsourceContributors: 4,
  },
  {
    id: "bus-wb01-201",
    busNumber: "AC-39",
    routeId: "route-ac39",
    regNumber: "WB-04-C-9812",
    driverName: "Debabrata Pal",
    currentLat: 22.6120,
    currentLng: 88.4310,
    speedKmh: 46.0,
    heading: 40,
    status: "ON_ROUTE",
    occupancy: "SEATS_AVAILABLE",
    telemetrySource: "ESP_IOT",
    activeDeviceId: "esp32-wb01-201",
    satellites: 8,
    originStop: "Howrah Station",
    nextStop: "Chinar Park",
    etaNextStopMins: 4,
    distanceToNextStopKm: 2.5,
    progressPct: 72,
    destination: "Netaji Subhash Airport (Gate 1)",
    lastUpdatedSecsAgo: 8,
    crowdsourceContributors: 9,
  },
  {
    id: "bus-wb01-301",
    busNumber: "C-11",
    routeId: "route-c11",
    regNumber: "WB-02-B-3105",
    driverName: "Ramesh Sen",
    currentLat: 22.5710,
    currentLng: 88.3980,
    speedKmh: 18.0,
    heading: 75,
    status: "DELAYED",
    occupancy: "FULL",
    telemetrySource: "COMMUTER_CROWD",
    activeDeviceId: null,
    originStop: "Howrah Station",
    nextStop: "Ultadanga Hudco",
    etaNextStopMins: 10,
    distanceToNextStopKm: 3.0,
    progressPct: 64,
    destination: "Salt Lake Sector V",
    lastUpdatedSecsAgo: 15,
    crowdsourceContributors: 5,
  },
  {
    id: "bus-wb01-401",
    busNumber: "S-9",
    routeId: "route-s9",
    regNumber: "WB-01-E-7120",
    driverName: "Bikash Das",
    currentLat: 22.5350,
    currentLng: 88.3890,
    speedKmh: 34.0,
    heading: 25,
    status: "ON_ROUTE",
    occupancy: "SEATS_AVAILABLE",
    telemetrySource: "DRIVER_APP",
    activeDeviceId: null,
    originStop: "Jadavpur 8B Bus Stand",
    nextStop: "Science City More",
    etaNextStopMins: 3,
    distanceToNextStopKm: 1.1,
    progressPct: 69,
    destination: "Salt Lake Karunamoyee",
    lastUpdatedSecsAgo: 19,
    crowdsourceContributors: 3,
  },
];

export const SEED_IOT_DEVICES: IoTDeviceInfo[] = [
  {
    id: "esp32-wb01-101",
    busId: "bus-wb01-101",
    busNumber: "S-12",
    hardwareType: "ESP32_NEO6M",
    firmwareVersion: "1.2.0",
    batteryPct: 92,
    satellites: 9,
    signalRssi: -64,
    lastLat: 22.5802,
    lastLng: 88.4110,
    lastSeenIso: new Date(Date.now() - 12_000).toISOString(),
    isActive: true,
    connectionState: "online",
  },
  {
    id: "esp32-wb01-201",
    busId: "bus-wb01-201",
    busNumber: "AC-39",
    hardwareType: "ESP32_NEO6M",
    firmwareVersion: "1.2.0",
    batteryPct: 87,
    satellites: 8,
    signalRssi: -71,
    lastLat: 22.6120,
    lastLng: 88.4310,
    lastSeenIso: new Date(Date.now() - 8_000).toISOString(),
    isActive: true,
    connectionState: "online",
  },
  {
    id: "esp32-wb01-301",
    busId: "bus-wb01-301",
    busNumber: "C-11",
    hardwareType: "ESP32_SIM800L",
    firmwareVersion: "1.1.4",
    batteryPct: 76,
    satellites: 6,
    signalRssi: -79,
    lastLat: 22.5710,
    lastLng: 88.3980,
    lastSeenIso: new Date(Date.now() - 5 * 60_000).toISOString(),
    isActive: true,
    connectionState: "stale",
  },
];
