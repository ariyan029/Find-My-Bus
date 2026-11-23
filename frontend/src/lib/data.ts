import type { BusStatus, Occupancy } from "./enums";

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
}

export interface LiveBus {
  id: string;
  busNumber: string;
  routeId: string;
  regNumber: string;
  currentLat: number;
  currentLng: number;
  speedKmh: number;
  heading: number;
  status: BusStatus;
  occupancy: Occupancy;
  nextStop: string;
  etaNextStopMins: number;
  destination: string;
  lastUpdatedSecsAgo: number;
  crowdsourceContributors: number;
}

export const KOLKATA_STOPS: BusStop[] = [
  {
    id: "hwh",
    name: "Howrah Station",
    bengaliName: "হাওড়া স্টেশন",
    code: "HWH",
    lat: 22.5850,
    lng: 88.3426,
    landmark: "Howrah Bridge & Suburban Rail Terminus",
    zone: "Central / West",
    connectingRoutes: ["S-12", "AC-39", "C-11", "AC-12", "S-5", "24A", "E-1"],
  },
  {
    id: "esp",
    name: "Esplanade Bus Terminus",
    bengaliName: "এসপ্ল্যানেড",
    code: "ESP",
    lat: 22.5654,
    lng: 88.3516,
    landmark: "Metro Interchange & Tram Depot",
    zone: "Central",
    connectingRoutes: ["S-12", "AC-39", "C-11", "239B", "S-24", "AC-4B"],
  },
  {
    id: "prk",
    name: "Park Street Crossing",
    bengaliName: "পার্ক স্ট্রিট",
    code: "PRK",
    lat: 22.5511,
    lng: 88.3524,
    landmark: "Chowringhee & Camac St Junction",
    zone: "Central",
    connectingRoutes: ["AC-12", "S-12", "C-11", "AC-4B"],
  },
  {
    id: "exd",
    name: "Exide / Rabindra Sadan",
    bengaliName: "এক্সাইড / রবীন্দ্র সদন",
    code: "EXD",
    lat: 22.5393,
    lng: 88.3475,
    landmark: "Nandan Cultural Center & Exide Crossing",
    zone: "South",
    connectingRoutes: ["AC-12", "S-12", "V-1", "3C/1", "212"],
  },
  {
    id: "ght",
    name: "Gariahat Junction",
    bengaliName: "গড়িয়াহাট",
    code: "GHT",
    lat: 22.5167,
    lng: 88.3667,
    landmark: "Gariahat Flyover & Retail Center",
    zone: "South",
    connectingRoutes: ["AC-12", "S-9", "C-14", "212", "AC-24"],
  },
  {
    id: "jdp",
    name: "Jadavpur 8B Bus Stand",
    bengaliName: "যাদবপুর ৮বি",
    code: "JDP",
    lat: 22.4988,
    lng: 88.3718,
    landmark: "Jadavpur University Main Campus",
    zone: "South",
    connectingRoutes: ["S-9", "AC-24", "8B", "45", "47B"],
  },
  {
    id: "sdah",
    name: "Sealdah Station",
    bengaliName: "শিয়ালদহ স্টেশন",
    code: "SDAH",
    lat: 22.5675,
    lng: 88.3712,
    landmark: "Eastern Railway Main Terminus",
    zone: "Central / East",
    connectingRoutes: ["S-12", "239B", "C-11", "30B", "217"],
  },
  {
    id: "syb",
    name: "Shyambazar Five Point",
    bengaliName: "শ্যামবাজার পাঁচ মাথার মোড়",
    code: "SYB",
    lat: 22.6022,
    lng: 88.3718,
    landmark: "Netaji Equestrian Statue",
    zone: "North",
    connectingRoutes: ["AC-39", "239B", "30B", "78", "L238"],
  },
  {
    id: "ult",
    name: "Ultadanga Hudco",
    bengaliName: "উল্টোডাঙা হাডকো",
    code: "ULT",
    lat: 22.5976,
    lng: 88.3912,
    landmark: "Bidhannagar Road Station Corridor",
    zone: "North-East",
    connectingRoutes: ["S-12", "AC-39", "S-9", "215A", "46A"],
  },
  {
    id: "krn",
    name: "Salt Lake Karunamoyee",
    bengaliName: "করুণাময়ী",
    code: "KRN",
    lat: 22.5855,
    lng: 88.4208,
    landmark: "Central Park Bus Depot & Metro",
    zone: "East",
    connectingRoutes: ["S-9", "S-12", "AC-39", "201", "C-11"],
  },
  {
    id: "sec5",
    name: "Salt Lake Sector V",
    bengaliName: "সেক্টর ৫",
    code: "SEC5",
    lat: 22.5735,
    lng: 88.4339,
    landmark: "Wipro Geofence & College More",
    zone: "East / IT Corridor",
    connectingRoutes: ["C-11", "S-12", "AC-12", "215A", "ST-6"],
  },
  {
    id: "ntw",
    name: "New Town Shapoorji",
    bengaliName: "নিউ টাউন শাপুর্জি",
    code: "NTW",
    lat: 22.5682,
    lng: 88.4901,
    landmark: "Sukhobrishti Bus Terminus",
    zone: "New Town",
    connectingRoutes: ["S-12", "AC-12", "C-11", "ST-7"],
  },
  {
    id: "ccu",
    name: "Netaji Subhash Airport (Gate 1)",
    bengaliName: "বিমানবন্দর ১নং গেট",
    code: "CCU",
    lat: 22.6534,
    lng: 88.4467,
    landmark: "VIP Road Airport Terminal",
    zone: "North-East",
    connectingRoutes: ["AC-39", "V-1", "30B", "L238"],
  },
];

export const KOLKATA_ROUTES: BusRoute[] = [
  {
    id: "route-s12",
    routeNumber: "S-12",
    name: "Howrah Station ⇄ New Town Shapoorji",
    source: "Howrah Station",
    destination: "New Town Shapoorji",
    distanceKm: 24.5,
    totalStops: 22,
    busType: "AC_EXPRESS",
    operator: "WBTC",
    avgTripMins: 75,
    fareMin: 25,
    fareMax: 45,
    frequencyMins: 8,
    stops: ["Howrah Station", "Esplanade", "Sealdah", "Ultadanga", "Karunamoyee", "Sector V", "New Town Shapoorji"],
  },
  {
    id: "route-ac39",
    routeNumber: "AC-39",
    name: "Howrah Station ⇄ Kolkata Airport",
    source: "Howrah Station",
    destination: "Netaji Subhash Airport (Gate 1)",
    distanceKm: 20.2,
    totalStops: 18,
    busType: "AC_EXPRESS",
    operator: "WBTC",
    avgTripMins: 60,
    fareMin: 30,
    fareMax: 50,
    frequencyMins: 12,
    stops: ["Howrah Station", "Shyambazar", "Ultadanga", "Chinar Park", "Airport Gate 1"],
  },
  {
    id: "route-c11",
    routeNumber: "C-11",
    name: "Howrah Station ⇄ Salt Lake Sector V",
    source: "Howrah Station",
    destination: "Salt Lake Sector V",
    distanceKm: 16.8,
    totalStops: 16,
    busType: "ORDINARY",
    operator: "CSTC",
    avgTripMins: 55,
    fareMin: 10,
    fareMax: 20,
    frequencyMins: 10,
    stops: ["Howrah Station", "Esplanade", "Moulali", "Ultadanga", "Sector V"],
  },
  {
    id: "route-s9",
    routeNumber: "S-9",
    name: "Jadavpur 8B ⇄ Salt Lake Karunamoyee",
    source: "Jadavpur 8B Bus Stand",
    destination: "Salt Lake Karunamoyee",
    distanceKm: 18.0,
    totalStops: 19,
    busType: "ORDINARY",
    operator: "WBTC",
    avgTripMins: 50,
    fareMin: 12,
    fareMax: 22,
    frequencyMins: 10,
    stops: ["Jadavpur 8B", "Gariahat", "Ruby Hospital", "Science City", "Karunamoyee"],
  },
  {
    id: "route-ac12",
    routeNumber: "AC-12",
    name: "Howrah Station ⇄ Garia Bus Stand",
    source: "Howrah Station",
    destination: "Garia Bus Stand",
    distanceKm: 19.5,
    totalStops: 20,
    busType: "AC_EXPRESS",
    operator: "WBTC",
    avgTripMins: 65,
    fareMin: 25,
    fareMax: 40,
    frequencyMins: 15,
    stops: ["Howrah Station", "Park Street", "Exide", "Hazra", "Rashbehari", "Garia"],
  },
  {
    id: "route-239b",
    routeNumber: "239B",
    name: "Esplanade ⇄ Barasat / Chinar Park",
    source: "Esplanade Bus Terminus",
    destination: "Chinar Park",
    distanceKm: 17.2,
    totalStops: 15,
    busType: "MINIBUS",
    operator: "PRIVATE",
    avgTripMins: 50,
    fareMin: 10,
    fareMax: 18,
    frequencyMins: 12,
    stops: ["Esplanade", "Sealdah", "Khanna", "Ultadanga", "Chinar Park"],
  },
];

export const ACTIVE_LIVE_BUSES: LiveBus[] = [
  {
    id: "bus-s12-01",
    busNumber: "S-12",
    routeId: "route-s12",
    regNumber: "WB-01-A-4482",
    currentLat: 22.5802,
    currentLng: 88.4110,
    speedKmh: 38.5,
    heading: 85,
    status: "ON_ROUTE",
    occupancy: "SEATS_AVAILABLE",
    nextStop: "Ultadanga Hudco",
    etaNextStopMins: 4,
    destination: "New Town Shapoorji",
    lastUpdatedSecsAgo: 12,
    crowdsourceContributors: 6,
  },
  {
    id: "bus-s12-02",
    busNumber: "S-12",
    routeId: "route-s12",
    regNumber: "WB-01-A-4491",
    currentLat: 22.5695,
    currentLng: 88.4421,
    speedKmh: 29.0,
    heading: 92,
    status: "CONGESTED",
    occupancy: "STANDING_ONLY",
    nextStop: "Salt Lake Sector V",
    etaNextStopMins: 7,
    destination: "New Town Shapoorji",
    lastUpdatedSecsAgo: 24,
    crowdsourceContributors: 4,
  },
  {
    id: "bus-ac39-01",
    busNumber: "AC-39",
    routeId: "route-ac39",
    regNumber: "WB-04-C-9812",
    currentLat: 22.6120,
    currentLng: 88.4310,
    speedKmh: 46.0,
    heading: 40,
    status: "ON_ROUTE",
    occupancy: "SEATS_AVAILABLE",
    nextStop: "Airport Gate 1",
    etaNextStopMins: 8,
    destination: "Netaji Subhash Airport",
    lastUpdatedSecsAgo: 8,
    crowdsourceContributors: 9,
  },
  {
    id: "bus-c11-01",
    busNumber: "C-11",
    routeId: "route-c11",
    regNumber: "WB-02-B-3105",
    currentLat: 22.5710,
    currentLng: 88.3980,
    speedKmh: 18.0,
    heading: 75,
    status: "DELAYED",
    occupancy: "FULL",
    nextStop: "Sealdah Flyover Crossing",
    etaNextStopMins: 11,
    destination: "Salt Lake Sector V",
    lastUpdatedSecsAgo: 15,
    crowdsourceContributors: 5,
  },
  {
    id: "bus-s9-01",
    busNumber: "S-9",
    routeId: "route-s9",
    regNumber: "WB-01-E-7120",
    currentLat: 22.5350,
    currentLng: 88.3890,
    speedKmh: 34.0,
    heading: 25,
    status: "ON_ROUTE",
    occupancy: "SEATS_AVAILABLE",
    nextStop: "Science City More",
    etaNextStopMins: 5,
    destination: "Karunamoyee",
    lastUpdatedSecsAgo: 30,
    crowdsourceContributors: 3,
  },
];
