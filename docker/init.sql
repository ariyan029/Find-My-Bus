-- PostgreSQL + PostGIS Schema for "Where is my Bus" (Kolkata)
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. STOPS TABLE
CREATE TABLE IF NOT EXISTS stops (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    bengali_name VARCHAR(255),
    code VARCHAR(32) UNIQUE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    landmark VARCHAR(255),
    zone VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Spatial index on stop location
CREATE INDEX IF NOT EXISTS idx_stops_geom ON stops USING GIST (
    ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
);

-- 2. ROUTES TABLE
CREATE TABLE IF NOT EXISTS routes (
    id VARCHAR(64) PRIMARY KEY,
    route_number VARCHAR(32) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    source VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    distance_km DOUBLE PRECISION NOT NULL,
    total_stops INT NOT NULL,
    bus_type VARCHAR(64) NOT NULL, -- AC_EXPRESS, ORDINARY, MINIBUS, ELECTRIC
    operator VARCHAR(64) NOT NULL, -- WBTC, CSTC, PRIVATE
    average_trip_time_mins INT NOT NULL,
    fare_min INT NOT NULL,
    fare_max INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. ROUTE STOPS (Many-to-Many with Sequence)
CREATE TABLE IF NOT EXISTS route_stops (
    id VARCHAR(64) PRIMARY KEY,
    route_id VARCHAR(64) REFERENCES routes(id) ON DELETE CASCADE,
    stop_id VARCHAR(64) REFERENCES stops(id) ON DELETE CASCADE,
    stop_sequence INT NOT NULL,
    typical_time_mins INT NOT NULL,
    fare_from_start INT NOT NULL,
    UNIQUE(route_id, stop_sequence)
);

-- 4. ACTIVE BUSES TABLE
CREATE TABLE IF NOT EXISTS buses (
    id VARCHAR(64) PRIMARY KEY,
    bus_number VARCHAR(32) NOT NULL,
    route_id VARCHAR(64) REFERENCES routes(id),
    reg_number VARCHAR(32) UNIQUE,
    driver_name VARCHAR(128),
    current_lat DOUBLE PRECISION,
    current_lng DOUBLE PRECISION,
    heading DOUBLE PRECISION DEFAULT 0.0,
    speed_kmh DOUBLE PRECISION DEFAULT 0.0,
    status VARCHAR(32) DEFAULT 'ON_ROUTE', -- ON_ROUTE, DELAYED, CONGESTED, IDLE, TERMINATED (see frontend/src/lib/enums.ts)
    occupancy_status VARCHAR(32) DEFAULT 'SEATS_AVAILABLE', -- EMPTY, SEATS_AVAILABLE, STANDING_ONLY, FULL (see frontend/src/lib/enums.ts)
    last_ping TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. TELEMETRY PINGS (Crowdsourced GPS stream logs)
CREATE TABLE IF NOT EXISTS telemetry_pings (
    id BIGSERIAL PRIMARY KEY,
    bus_id VARCHAR(64) REFERENCES buses(id),
    route_id VARCHAR(64) REFERENCES routes(id),
    contributor_id VARCHAR(64),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    accuracy_meters DOUBLE PRECISION,
    speed_kmh DOUBLE PRECISION,
    heading DOUBLE PRECISION,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_telemetry_bus_time ON telemetry_pings(bus_id, recorded_at DESC);

-- SEED DATA: KOLKATA KEY BUS STOPS
INSERT INTO stops (id, name, bengali_name, code, latitude, longitude, landmark, zone) VALUES
('stop-howrah', 'Howrah Station', 'হাওড়া স্টেশন', 'HWH', 22.5850, 88.3426, 'Howrah Bridge / Rail Terminal', 'Central'),
('stop-esplanade', 'Esplanade Bus Terminus', 'এসপ্ল্যানেড', 'ESP', 22.5654, 88.3516, 'Metro & Tram Junction', 'Central'),
('stop-parkst', 'Park Street Crossing', 'পার্ক স্ট্রিট', 'PRK', 22.5511, 88.3524, 'Chowringhee Road', 'Central'),
('stop-exide', 'Exide / Rabindra Sadan', 'এক্সাইড / রবীন্দ্র সদন', 'EXD', 22.5393, 88.3475, 'Nandan Cultural Center', 'South'),
('stop-hazra', 'Hazra More', 'হাজরা মোড়', 'HZR', 22.5255, 88.3458, 'Ashutosh College', 'South'),
('stop-rashbehari', 'Rashbehari Crossing', 'রাসবিহারী মোড়', 'RSB', 22.5186, 88.3497, 'Kalighat Metro', 'South'),
('stop-gariahat', 'Gariahat Junction', 'গড়িয়াহাট', 'GHT', 22.5167, 88.3667, 'Shopping Hub & Flyover', 'South'),
('stop-jadavpur', 'Jadavpur 8B Bus Stand', 'যাদবপুর ৮বি', 'JDP', 22.4988, 88.3718, 'Jadavpur University', 'South'),
('stop-garia', 'Garia Bus Stand', 'গড়িয়া', 'GAR', 22.4633, 88.3812, 'Kavi Subhash Metro', 'South'),
('stop-sealdah', 'Sealdah Station', 'শিয়ালদহ', 'SDAH', 22.5675, 88.3712, 'Sealdah Court & Rail Hub', 'Central'),
('stop-moulali', 'Moulali Crossing', 'মৌলালী', 'MLI', 22.5593, 88.3683, 'Youth Hostel', 'Central'),
('stop-khanna', 'Khanna Cinema', 'খান্না সিনেমা', 'KHN', 22.5932, 88.3745, 'Maniktala Corridor', 'North'),
('stop-shyambazar', 'Shyambazar Five Point', 'শ্যামবাজার পাঁচ মাথার মোড়', 'SYB', 22.6022, 88.3718, 'Netaji Statue', 'North'),
('stop-ultadanga', 'Ultadanga Hudco', 'উল্টোডাঙা হাডকো', 'ULT', 22.5976, 88.3912, 'Bidhannagar Road Station', 'North-East'),
('stop-karunamoyee', 'Salt Lake Karunamoyee', 'করুণাময়ী', 'KRN', 22.5855, 88.4208, 'Central Park & Bus Hub', 'East'),
('stop-sector5', 'Salt Lake Sector V', 'সেক্টর ৫', 'SEC5', 22.5735, 88.4339, 'Tech IT Corridor', 'East'),
('stop-chinar', 'Chinar Park', 'চিনার পার্ক', 'CNR', 22.6276, 88.4485, 'Rajarhat Main Rd', 'North-East'),
('stop-newtown', 'New Town Shapoorji', 'নিউ টাউন শাপুর্জি', 'NTW', 22.5682, 88.4901, 'Action Area III Terminus', 'East'),
('stop-airport', 'Netaji Subhash Airport (Gate 1)', 'বিমানবন্দর', 'CCU', 22.6534, 88.4467, 'Domestic & Intl Terminals', 'North')
ON CONFLICT (id) DO NOTHING;

-- SEED DATA: REAL KOLKATA ROUTES
INSERT INTO routes (id, route_number, name, source, destination, distance_km, total_stops, bus_type, operator, average_trip_time_mins, fare_min, fare_max) VALUES
('route-s12', 'S-12', 'Howrah Stn - New Town Shapoorji', 'Howrah Station', 'New Town Shapoorji', 24.5, 22, 'AC_EXPRESS', 'WBTC', 75, 25, 45),
('route-ac39', 'AC-39', 'Howrah Stn - Kolkata Airport', 'Howrah Station', 'Netaji Subhash Airport (Gate 1)', 20.2, 18, 'AC_EXPRESS', 'WBTC', 60, 30, 50),
('route-c11', 'C-11', 'Howrah Stn - Salt Lake Sector V', 'Howrah Station', 'Salt Lake Sector V', 16.8, 16, 'ORDINARY', 'CSTC', 55, 10, 20),
('route-s9', 'S-9', 'Jadavpur 8B - Karunamoyee', 'Jadavpur 8B Bus Stand', 'Salt Lake Karunamoyee', 18.0, 19, 'ORDINARY', 'WBTC', 50, 12, 22),
('route-ac12', 'AC-12', 'Howrah Stn - Garia Bus Stand', 'Howrah Station', 'Garia Bus Stand', 19.5, 20, 'AC_EXPRESS', 'WBTC', 65, 25, 40),
('route-239b', '239B', 'Barasat - Babughat / Esplanade', 'Esplanade Bus Terminus', 'Chinar Park', 17.2, 15, 'MINIBUS', 'PRIVATE', 50, 10, 18)
ON CONFLICT (id) DO NOTHING;

-- SEED DATA: ACTIVE SAMPLE BUSES WITH LIVE COORDINATES
INSERT INTO buses (id, bus_number, route_id, reg_number, driver_name, current_lat, current_lng, heading, speed_kmh, status, occupancy_status) VALUES
('bus-wb01-101', 'S-12', 'route-s12', 'WB-01-A-4482', 'Subhasish Ghosh', 22.5802, 88.4110, 85.0, 38.5, 'ON_ROUTE', 'SEATS_AVAILABLE'),
('bus-wb01-102', 'S-12', 'route-s12', 'WB-01-A-4491', 'Tapan Mondal', 22.5695, 88.4421, 92.0, 29.0, 'ON_ROUTE', 'STANDING_ONLY'),
('bus-wb01-201', 'AC-39', 'route-ac39', 'WB-04-C-9812', 'Debabrata Pal', 22.6120, 88.4310, 40.0, 44.0, 'ON_ROUTE', 'SEATS_AVAILABLE'),
('bus-wb01-301', 'C-11', 'route-c11', 'WB-02-B-3105', 'Ramesh Sen', 22.5710, 88.3980, 75.0, 22.0, 'DELAYED', 'FULL'),
('bus-wb01-401', 'S-9', 'route-s9', 'WB-01-E-7120', 'Bikash Das', 22.5350, 88.3890, 25.0, 35.0, 'ON_ROUTE', 'SEATS_AVAILABLE')
ON CONFLICT (id) DO NOTHING;
