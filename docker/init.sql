-- PostgreSQL + PostGIS Schema for "PRAVAH / Find My Bus" (Kolkata)
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
    bus_type VARCHAR(64) NOT NULL,
    operator VARCHAR(64) NOT NULL,
    average_trip_time_mins INT NOT NULL,
    fare_min INT NOT NULL,
    fare_max INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. ROUTE STOPS (Ordered sequence along each corridor)
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
    status VARCHAR(32) DEFAULT 'ON_ROUTE',
    occupancy_status VARCHAR(32) DEFAULT 'SEATS_AVAILABLE',
    telemetry_source VARCHAR(32) DEFAULT 'COMMUTER_CROWD',
    active_device_id VARCHAR(64),
    last_ping TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE buses ADD COLUMN IF NOT EXISTS telemetry_source VARCHAR(32) DEFAULT 'COMMUTER_CROWD';
ALTER TABLE buses ADD COLUMN IF NOT EXISTS active_device_id VARCHAR(64);

-- 5. IOT HARDWARE DEVICES (ESP32 + NEO-6M GPS units fitted on buses)
CREATE TABLE IF NOT EXISTS iot_devices (
    id VARCHAR(64) PRIMARY KEY,
    bus_id VARCHAR(64) REFERENCES buses(id) ON DELETE SET NULL,
    bus_number VARCHAR(32) NOT NULL,
    hardware_type VARCHAR(64) DEFAULT 'ESP32_NEO6M',
    firmware_version VARCHAR(32) DEFAULT '1.0.0',
    api_key VARCHAR(128),
    battery_pct INT,
    satellites INT,
    signal_rssi INT,
    last_lat DOUBLE PRECISION,
    last_lng DOUBLE PRECISION,
    last_seen TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. TELEMETRY PINGS (ESP32 IoT, Driver Mobile, and Crowdsourced GPS stream logs)
CREATE TABLE IF NOT EXISTS telemetry_pings (
    id BIGSERIAL PRIMARY KEY,
    bus_id VARCHAR(64) REFERENCES buses(id),
    route_id VARCHAR(64) REFERENCES routes(id),
    contributor_id VARCHAR(64),
    device_id VARCHAR(64),
    source VARCHAR(32) DEFAULT 'COMMUTER_CROWD',
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    accuracy_meters DOUBLE PRECISION,
    speed_kmh DOUBLE PRECISION,
    heading DOUBLE PRECISION,
    satellites INT,
    occupancy_status VARCHAR(32),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE telemetry_pings ADD COLUMN IF NOT EXISTS device_id VARCHAR(64);
ALTER TABLE telemetry_pings ADD COLUMN IF NOT EXISTS source VARCHAR(32) DEFAULT 'COMMUTER_CROWD';
ALTER TABLE telemetry_pings ADD COLUMN IF NOT EXISTS satellites INT;
ALTER TABLE telemetry_pings ADD COLUMN IF NOT EXISTS occupancy_status VARCHAR(32);

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
('stop-ruby', 'Ruby Hospital Crossing', 'রুবি হাসপাতাল মোড়', 'RBY', 22.5137, 88.4017, 'EM Bypass & Hemanta Mukherjee Metro', 'South-East'),
('stop-sciencecity', 'Science City More', 'সায়েন্স সিটি মোড়', 'SCI', 22.5416, 88.3965, 'EM Bypass & Maa Flyover', 'East'),
('stop-chinar', 'Chinar Park', 'চিনার পার্ক', 'CNR', 22.6276, 88.4485, 'Rajarhat Main Rd', 'North-East'),
('stop-newtown', 'New Town Shapoorji', 'নিউ টাউন শাপুর্জি', 'NTW', 22.5682, 88.4901, 'Action Area III Terminus', 'East'),
('stop-airport', 'Netaji Subhash Airport (Gate 1)', 'বিমানবন্দর', 'CCU', 22.6534, 88.4467, 'Domestic & Intl Terminals', 'North')
ON CONFLICT (id) DO NOTHING;

-- SEED DATA: REAL KOLKATA ROUTES
INSERT INTO routes (id, route_number, name, source, destination, distance_km, total_stops, bus_type, operator, average_trip_time_mins, fare_min, fare_max) VALUES
('route-s12', 'S-12', 'Howrah Station ⇄ New Town Shapoorji', 'Howrah Station', 'New Town Shapoorji', 24.5, 7, 'AC_EXPRESS', 'WBTC', 75, 25, 45),
('route-ac39', 'AC-39', 'Howrah Station ⇄ Kolkata Airport', 'Howrah Station', 'Netaji Subhash Airport (Gate 1)', 20.2, 5, 'AC_EXPRESS', 'WBTC', 60, 30, 50),
('route-c11', 'C-11', 'Howrah Station ⇄ Salt Lake Sector V', 'Howrah Station', 'Salt Lake Sector V', 16.8, 5, 'ORDINARY', 'CSTC', 55, 10, 20),
('route-s9', 'S-9', 'Jadavpur 8B ⇄ Salt Lake Karunamoyee', 'Jadavpur 8B Bus Stand', 'Salt Lake Karunamoyee', 18.0, 5, 'ORDINARY', 'WBTC', 50, 12, 22),
('route-ac12', 'AC-12', 'Howrah Station ⇄ Garia Bus Stand', 'Howrah Station', 'Garia Bus Stand', 19.5, 6, 'AC_EXPRESS', 'WBTC', 65, 25, 40),
('route-239b', '239B', 'Esplanade ⇄ Chinar Park', 'Esplanade Bus Terminus', 'Chinar Park', 17.2, 5, 'MINIBUS', 'PRIVATE', 50, 10, 18)
ON CONFLICT (id) DO NOTHING;

-- SEED DATA: ORDERED ROUTE STOPS
INSERT INTO route_stops (id, route_id, stop_id, stop_sequence, typical_time_mins, fare_from_start) VALUES
-- S-12: Howrah -> Esplanade -> Sealdah -> Ultadanga -> Karunamoyee -> Sector V -> New Town Shapoorji
('rs-s12-1', 'route-s12', 'stop-howrah', 1, 0, 0),
('rs-s12-2', 'route-s12', 'stop-esplanade', 2, 12, 25),
('rs-s12-3', 'route-s12', 'stop-sealdah', 3, 22, 25),
('rs-s12-4', 'route-s12', 'stop-ultadanga', 4, 36, 30),
('rs-s12-5', 'route-s12', 'stop-karunamoyee', 5, 48, 35),
('rs-s12-6', 'route-s12', 'stop-sector5', 6, 58, 40),
('rs-s12-7', 'route-s12', 'stop-newtown', 7, 75, 45),
-- AC-39: Howrah -> Shyambazar -> Ultadanga -> Chinar Park -> Airport
('rs-ac39-1', 'route-ac39', 'stop-howrah', 1, 0, 0),
('rs-ac39-2', 'route-ac39', 'stop-shyambazar', 2, 18, 30),
('rs-ac39-3', 'route-ac39', 'stop-ultadanga', 3, 28, 35),
('rs-ac39-4', 'route-ac39', 'stop-chinar', 4, 46, 45),
('rs-ac39-5', 'route-ac39', 'stop-airport', 5, 60, 50),
-- C-11: Howrah -> Esplanade -> Moulali -> Ultadanga -> Sector V
('rs-c11-1', 'route-c11', 'stop-howrah', 1, 0, 0),
('rs-c11-2', 'route-c11', 'stop-esplanade', 2, 12, 10),
('rs-c11-3', 'route-c11', 'stop-moulali', 3, 22, 12),
('rs-c11-4', 'route-c11', 'stop-ultadanga', 4, 38, 16),
('rs-c11-5', 'route-c11', 'stop-sector5', 5, 55, 20),
-- S-9: Jadavpur 8B -> Gariahat -> Ruby -> Science City -> Karunamoyee
('rs-s9-1', 'route-s9', 'stop-jadavpur', 1, 0, 0),
('rs-s9-2', 'route-s9', 'stop-gariahat', 2, 12, 12),
('rs-s9-3', 'route-s9', 'stop-ruby', 3, 24, 15),
('rs-s9-4', 'route-s9', 'stop-sciencecity', 4, 36, 18),
('rs-s9-5', 'route-s9', 'stop-karunamoyee', 5, 50, 22),
-- AC-12: Howrah -> Park Street -> Exide -> Hazra -> Rashbehari -> Garia
('rs-ac12-1', 'route-ac12', 'stop-howrah', 1, 0, 0),
('rs-ac12-2', 'route-ac12', 'stop-parkst', 2, 16, 25),
('rs-ac12-3', 'route-ac12', 'stop-exide', 3, 24, 25),
('rs-ac12-4', 'route-ac12', 'stop-hazra', 4, 34, 30),
('rs-ac12-5', 'route-ac12', 'stop-rashbehari', 5, 42, 35),
('rs-ac12-6', 'route-ac12', 'stop-garia', 6, 65, 40),
-- 239B: Esplanade -> Sealdah -> Khanna -> Ultadanga -> Chinar Park
('rs-239b-1', 'route-239b', 'stop-esplanade', 1, 0, 0),
('rs-239b-2', 'route-239b', 'stop-sealdah', 2, 10, 10),
('rs-239b-3', 'route-239b', 'stop-khanna', 3, 22, 12),
('rs-239b-4', 'route-239b', 'stop-ultadanga', 4, 32, 15),
('rs-239b-5', 'route-239b', 'stop-chinar', 5, 50, 18)
ON CONFLICT (id) DO NOTHING;

-- SEED DATA: ACTIVE SAMPLE BUSES WITH LIVE COORDINATES
INSERT INTO buses (id, bus_number, route_id, reg_number, driver_name, current_lat, current_lng, heading, speed_kmh, status, occupancy_status, telemetry_source, active_device_id) VALUES
('bus-wb01-101', 'S-12', 'route-s12', 'WB-01-A-4482', 'Subhasish Ghosh', 22.5802, 88.4110, 85.0, 38.5, 'ON_ROUTE', 'SEATS_AVAILABLE', 'ESP_IOT', 'esp32-wb01-101'),
('bus-wb01-102', 'S-12', 'route-s12', 'WB-01-A-4491', 'Tapan Mondal', 22.5695, 88.4421, 92.0, 29.0, 'CONGESTED', 'STANDING_ONLY', 'DRIVER_APP', NULL),
('bus-wb01-201', 'AC-39', 'route-ac39', 'WB-04-C-9812', 'Debabrata Pal', 22.6120, 88.4310, 40.0, 44.0, 'ON_ROUTE', 'SEATS_AVAILABLE', 'ESP_IOT', 'esp32-wb01-201'),
('bus-wb01-301', 'C-11', 'route-c11', 'WB-02-B-3105', 'Ramesh Sen', 22.5710, 88.3980, 75.0, 22.0, 'DELAYED', 'FULL', 'COMMUTER_CROWD', NULL),
('bus-wb01-401', 'S-9', 'route-s9', 'WB-01-E-7120', 'Bikash Das', 22.5350, 88.3890, 25.0, 35.0, 'ON_ROUTE', 'SEATS_AVAILABLE', 'DRIVER_APP', NULL)
ON CONFLICT (id) DO NOTHING;

-- SEED DATA: ESP32 IOT HARDWARE DEVICES
INSERT INTO iot_devices (id, bus_id, bus_number, hardware_type, firmware_version, battery_pct, satellites, signal_rssi, last_lat, last_lng, last_seen, is_active) VALUES
('esp32-wb01-101', 'bus-wb01-101', 'S-12', 'ESP32_NEO6M', '1.2.0', 92, 9, -64, 22.5802, 88.4110, CURRENT_TIMESTAMP, TRUE),
('esp32-wb01-201', 'bus-wb01-201', 'AC-39', 'ESP32_NEO6M', '1.2.0', 87, 8, -71, 22.6120, 88.4310, CURRENT_TIMESTAMP, TRUE),
('esp32-wb01-301', 'bus-wb01-301', 'C-11', 'ESP32_SIM800L', '1.1.4', 76, 6, -79, 22.5710, 88.3980, CURRENT_TIMESTAMP - INTERVAL '5 minutes', TRUE)
ON CONFLICT (id) DO NOTHING;
