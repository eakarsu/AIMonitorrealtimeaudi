const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../../.env' });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'transport_safety',
  user: process.env.DB_USER || 'erolakarsu',
  password: process.env.DB_PASSWORD || '',
});

function requireDemoPassword() {
  const password = process.env.DEMO_PASSWORD || process.env.SEED_DEMO_PASSWORD || process.env.DEMO_SEED_PASSWORD || '';
  if (password.length < 12 || password.length > 1024) throw new Error('DEMO_PASSWORD must contain 12-1024 characters');
  return password;
}

async function seed() {
  console.log('🌱 Seeding database...');

  // Create tables
  await pool.query(`
    DROP TABLE IF EXISTS communications, speed_violations, fatigue_records, gps_tracking,
      threat_assessments, compliance_reports, weather_alerts, maintenance, driver_behavior,
      emergencies, passengers, safe_routes, incidents, vehicles, drivers, users CASCADE;

    CREATE TABLE users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'operator',
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE drivers (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      license_number VARCHAR(100),
      phone VARCHAR(50),
      status VARCHAR(50) DEFAULT 'active',
      rating DECIMAL(3,2) DEFAULT 5.00,
      vehicle_id INTEGER,
      experience_years INTEGER DEFAULT 0,
      last_active TIMESTAMP DEFAULT NOW(),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE vehicles (
      id SERIAL PRIMARY KEY,
      plate_number VARCHAR(50) NOT NULL,
      model VARCHAR(255),
      type VARCHAR(100),
      status VARCHAR(50) DEFAULT 'active',
      mileage INTEGER DEFAULT 0,
      last_inspection TIMESTAMP,
      fuel_level INTEGER DEFAULT 100,
      gps_enabled BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE incidents (
      id SERIAL PRIMARY KEY,
      type VARCHAR(100) NOT NULL,
      severity VARCHAR(50) DEFAULT 'medium',
      description TEXT,
      location VARCHAR(255),
      driver_id INTEGER,
      vehicle_id INTEGER,
      status VARCHAR(50) DEFAULT 'open',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE safe_routes (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      origin VARCHAR(255),
      destination VARCHAR(255),
      distance_km DECIMAL(10,2),
      risk_level VARCHAR(50) DEFAULT 'low',
      estimated_time VARCHAR(100),
      status VARCHAR(50) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE passengers (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(50),
      email VARCHAR(255),
      trip_id INTEGER,
      status VARCHAR(50) DEFAULT 'active',
      pickup_location VARCHAR(255),
      dropoff_location VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE emergencies (
      id SERIAL PRIMARY KEY,
      type VARCHAR(100) NOT NULL,
      priority VARCHAR(50) DEFAULT 'high',
      description TEXT,
      location VARCHAR(255),
      responder VARCHAR(255),
      driver_id INTEGER,
      vehicle_id INTEGER,
      status VARCHAR(50) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE driver_behavior (
      id SERIAL PRIMARY KEY,
      driver_id INTEGER,
      driver_name VARCHAR(255),
      event_type VARCHAR(100),
      severity VARCHAR(50) DEFAULT 'medium',
      score INTEGER DEFAULT 50,
      description TEXT,
      location VARCHAR(255),
      recorded_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE maintenance (
      id SERIAL PRIMARY KEY,
      vehicle_id INTEGER,
      vehicle_name VARCHAR(255),
      type VARCHAR(100),
      priority VARCHAR(50) DEFAULT 'medium',
      description TEXT,
      scheduled_date TIMESTAMP,
      cost_estimate DECIMAL(10,2) DEFAULT 0,
      status VARCHAR(50) DEFAULT 'scheduled',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE weather_alerts (
      id SERIAL PRIMARY KEY,
      type VARCHAR(100),
      severity VARCHAR(50) DEFAULT 'moderate',
      location VARCHAR(255),
      description TEXT,
      temperature DECIMAL(5,2),
      wind_speed DECIMAL(5,2),
      visibility DECIMAL(5,2),
      road_condition VARCHAR(100),
      status VARCHAR(50) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE compliance_reports (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255),
      category VARCHAR(100),
      driver_id INTEGER,
      driver_name VARCHAR(255),
      description TEXT,
      regulation VARCHAR(255),
      compliance_score INTEGER DEFAULT 100,
      status VARCHAR(50) DEFAULT 'compliant',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE threat_assessments (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255),
      threat_type VARCHAR(100),
      risk_level VARCHAR(50) DEFAULT 'medium',
      location VARCHAR(255),
      description TEXT,
      affected_routes TEXT,
      recommended_action TEXT,
      status VARCHAR(50) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE gps_tracking (
      id SERIAL PRIMARY KEY,
      vehicle_id INTEGER,
      vehicle_name VARCHAR(255),
      driver_name VARCHAR(255),
      latitude DECIMAL(10,6),
      longitude DECIMAL(10,6),
      speed DECIMAL(6,2) DEFAULT 0,
      heading DECIMAL(5,2) DEFAULT 0,
      status VARCHAR(50) DEFAULT 'moving',
      timestamp TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE fatigue_records (
      id SERIAL PRIMARY KEY,
      driver_id INTEGER,
      driver_name VARCHAR(255),
      fatigue_level VARCHAR(50) DEFAULT 'moderate',
      hours_driven DECIMAL(5,2) DEFAULT 0,
      last_rest TIMESTAMP,
      alert_type VARCHAR(50) DEFAULT 'warning',
      description TEXT,
      status VARCHAR(50) DEFAULT 'active',
      detected_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE speed_violations (
      id SERIAL PRIMARY KEY,
      driver_id INTEGER,
      driver_name VARCHAR(255),
      vehicle_id INTEGER,
      speed_recorded DECIMAL(6,2),
      speed_limit DECIMAL(6,2),
      location VARCHAR(255),
      severity VARCHAR(50) DEFAULT 'moderate',
      status VARCHAR(50) DEFAULT 'pending',
      recorded_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE communications (
      id SERIAL PRIMARY KEY,
      sender VARCHAR(255),
      recipient VARCHAR(255),
      channel VARCHAR(50) DEFAULT 'radio',
      subject VARCHAR(255),
      message TEXT,
      priority VARCHAR(50) DEFAULT 'normal',
      status VARCHAR(50) DEFAULT 'sent',
      sent_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // Seed Users
  const passwordHash = await bcrypt.hash(requireDemoPassword(), 10);
  await pool.query(`
    INSERT INTO users (name, email, password_hash, role) VALUES
    ('Admin User', 'admin@transport.com', $1, 'admin'),
    ('John Operator', 'operator@transport.com', $1, 'operator'),
    ('Sarah Manager', 'manager@transport.com', $1, 'manager')
  `, [passwordHash]);

  // Seed Drivers (15 items)
  await pool.query(`
    INSERT INTO drivers (name, license_number, phone, status, rating, vehicle_id, experience_years) VALUES
    ('Mike Johnson', 'DL-2024-001', '+1-555-0101', 'active', 4.8, 1, 12),
    ('Sarah Williams', 'DL-2024-002', '+1-555-0102', 'active', 4.9, 2, 8),
    ('Robert Brown', 'DL-2024-003', '+1-555-0103', 'on_route', 4.5, 3, 15),
    ('Emily Davis', 'DL-2024-004', '+1-555-0104', 'active', 4.7, 4, 6),
    ('James Wilson', 'DL-2024-005', '+1-555-0105', 'off_duty', 4.3, 5, 20),
    ('Maria Garcia', 'DL-2024-006', '+1-555-0106', 'active', 4.6, 6, 10),
    ('David Martinez', 'DL-2024-007', '+1-555-0107', 'on_route', 4.4, 7, 3),
    ('Lisa Anderson', 'DL-2024-008', '+1-555-0108', 'active', 4.8, 8, 14),
    ('Thomas Taylor', 'DL-2024-009', '+1-555-0109', 'suspended', 3.2, 9, 7),
    ('Jennifer Thomas', 'DL-2024-010', '+1-555-0110', 'active', 4.9, 10, 11),
    ('Christopher Lee', 'DL-2024-011', '+1-555-0111', 'on_route', 4.1, 11, 5),
    ('Amanda White', 'DL-2024-012', '+1-555-0112', 'active', 4.7, 12, 9),
    ('Daniel Harris', 'DL-2024-013', '+1-555-0113', 'off_duty', 4.5, 13, 18),
    ('Jessica Clark', 'DL-2024-014', '+1-555-0114', 'active', 4.6, 14, 4),
    ('Andrew Lewis', 'DL-2024-015', '+1-555-0115', 'on_route', 4.2, 15, 16)
  `);

  // Seed Vehicles (15 items)
  await pool.query(`
    INSERT INTO vehicles (plate_number, model, type, status, mileage, last_inspection, fuel_level, gps_enabled) VALUES
    ('TX-4521-AB', 'Volvo FH16', 'Heavy Truck', 'active', 125000, '2024-11-15', 85, true),
    ('TX-7832-CD', 'Mercedes Actros', 'Heavy Truck', 'active', 98000, '2024-10-20', 72, true),
    ('BX-1123-EF', 'MAN TGX', 'Delivery Van', 'maintenance', 156000, '2024-09-10', 45, true),
    ('BX-4456-GH', 'Scania R500', 'Heavy Truck', 'active', 87000, '2024-12-01', 91, true),
    ('TX-9987-IJ', 'DAF XF', 'Long Haul', 'active', 210000, '2024-08-22', 68, true),
    ('BX-2234-KL', 'Iveco Daily', 'Delivery Van', 'active', 45000, '2024-11-30', 95, true),
    ('TX-5567-MN', 'Renault T High', 'Heavy Truck', 'inactive', 178000, '2024-07-15', 30, false),
    ('BX-8890-OP', 'Ford Transit', 'Passenger Bus', 'active', 67000, '2024-12-05', 78, true),
    ('TX-3312-QR', 'Volvo B8R', 'Passenger Bus', 'active', 134000, '2024-10-01', 60, true),
    ('BX-6645-ST', 'Mercedes Sprinter', 'Delivery Van', 'active', 52000, '2024-11-25', 88, true),
    ('TX-1178-UV', 'Scania Citywide', 'City Bus', 'active', 89000, '2024-09-28', 55, true),
    ('BX-4401-WX', 'MAN Lions City', 'City Bus', 'maintenance', 112000, '2024-08-10', 40, true),
    ('TX-7734-YZ', 'Volvo FMX', 'Construction', 'active', 145000, '2024-12-10', 76, true),
    ('BX-2267-AA', 'DAF CF', 'Medium Truck', 'active', 78000, '2024-11-18', 82, true),
    ('TX-5590-BB', 'Iveco Stralis', 'Long Haul', 'active', 195000, '2024-10-30', 64, true)
  `);

  // Seed Incidents (15 items)
  await pool.query(`
    INSERT INTO incidents (type, severity, description, location, driver_id, vehicle_id, status) VALUES
    ('Collision', 'high', 'Rear-end collision at intersection due to sudden braking', 'Highway I-95, Mile 42', 1, 1, 'open'),
    ('Near Miss', 'medium', 'Near miss with pedestrian at crosswalk', 'Main St & 5th Ave', 3, 3, 'investigating'),
    ('Mechanical Failure', 'high', 'Brake system failure during descent', 'Mountain Pass Route 66', 5, 5, 'open'),
    ('Weather Related', 'critical', 'Vehicle hydroplaned on wet road surface', 'Interstate 40, Exit 23', 2, 2, 'open'),
    ('Cargo Spill', 'medium', 'Minor cargo shift during sharp turn', 'Industrial Blvd & Oak Rd', 7, 7, 'resolved'),
    ('Tire Blowout', 'high', 'Front tire blowout at highway speed', 'Highway 101, Mile 78', 8, 8, 'investigating'),
    ('Driver Distraction', 'medium', 'Driver seen using phone while driving', 'Commerce Dr', 9, 9, 'open'),
    ('Road Hazard', 'low', 'Debris on road caused minor vehicle damage', 'Route 30, Bridge Section', 4, 4, 'resolved'),
    ('Seatbelt Violation', 'low', 'Passenger reported without seatbelt', 'City Bus Route 12', 11, 11, 'resolved'),
    ('Speeding', 'medium', 'Exceeded speed limit by 15mph in school zone', 'School Zone, Elm Street', 12, 12, 'open'),
    ('Fuel Leak', 'high', 'Diesel fuel leak detected from tank', 'Depot Parking Lot B', 6, 6, 'investigating'),
    ('Door Malfunction', 'medium', 'Automatic door failed to close properly', 'Bus Stop Station 5', 10, 10, 'open'),
    ('Rollover Risk', 'critical', 'High center of gravity load nearly caused rollover', 'Curve on Route 15', 13, 13, 'open'),
    ('GPS Failure', 'low', 'GPS tracking lost for 2 hours', 'Unknown - Signal Lost', 14, 14, 'resolved'),
    ('Passenger Injury', 'high', 'Passenger fell during emergency brake', 'Downtown Bus Terminal', 15, 15, 'investigating')
  `);

  // Seed Safe Routes (15 items)
  await pool.query(`
    INSERT INTO safe_routes (name, origin, destination, distance_km, risk_level, estimated_time, status) VALUES
    ('North Express', 'Central Depot', 'North Terminal', 45.5, 'low', '55 min', 'active'),
    ('South Highway Link', 'Central Depot', 'South Port', 120.3, 'medium', '2h 15min', 'active'),
    ('East Industrial', 'East Warehouse', 'Industrial Zone', 28.7, 'low', '35 min', 'active'),
    ('West Coast Run', 'West Station', 'Coastal Terminal', 210.8, 'high', '3h 45min', 'active'),
    ('Airport Shuttle', 'City Center', 'International Airport', 35.2, 'low', '40 min', 'active'),
    ('Mountain Pass', 'Valley Depot', 'Mountain Station', 85.4, 'high', '1h 50min', 'restricted'),
    ('City Loop North', 'Central Station', 'North Mall', 15.3, 'low', '25 min', 'active'),
    ('City Loop South', 'Central Station', 'South Market', 18.6, 'low', '30 min', 'active'),
    ('Interstate Connector', 'Hub Alpha', 'Hub Beta', 340.5, 'medium', '5h 20min', 'active'),
    ('Harbor Express', 'Distribution Center', 'Harbor Terminal', 55.8, 'medium', '1h 10min', 'active'),
    ('School District', 'Bus Garage', 'School Zone Circuit', 22.1, 'low', '45 min', 'active'),
    ('Hospital Route', 'Central Depot', 'Medical Center', 12.4, 'low', '20 min', 'active'),
    ('Night Freight', 'Freight Yard', 'Distribution Hub', 175.6, 'medium', '3h 00min', 'active'),
    ('Border Crossing', 'Regional Depot', 'Border Terminal', 290.3, 'high', '4h 30min', 'restricted'),
    ('Emergency Corridor', 'Fire Station', 'Emergency Response Zone', 8.5, 'low', '12 min', 'active')
  `);

  // Seed Passengers (15 items)
  await pool.query(`
    INSERT INTO passengers (name, phone, email, trip_id, status, pickup_location, dropoff_location) VALUES
    ('Alice Cooper', '+1-555-1001', 'alice@email.com', 1, 'active', 'Central Station', 'North Terminal'),
    ('Bob Miller', '+1-555-1002', 'bob@email.com', 1, 'active', 'Main St Stop', 'Airport'),
    ('Carol Smith', '+1-555-1003', 'carol@email.com', 2, 'completed', 'East Gate', 'West Station'),
    ('Dan Wright', '+1-555-1004', 'dan@email.com', 3, 'active', 'Bus Stop 12', 'Downtown Mall'),
    ('Eva Johnson', '+1-555-1005', 'eva@email.com', 3, 'active', 'Harbor View', 'Medical Center'),
    ('Frank Brown', '+1-555-1006', 'frank@email.com', 4, 'cancelled', 'University', 'Tech Park'),
    ('Grace Lee', '+1-555-1007', 'grace@email.com', 5, 'active', 'Residential Area B', 'City Center'),
    ('Henry Park', '+1-555-1008', 'henry@email.com', 5, 'active', 'Industrial Zone', 'South Port'),
    ('Ivy Chen', '+1-555-1009', 'ivy@email.com', 6, 'completed', 'Airport', 'Hotel District'),
    ('Jack Davis', '+1-555-1010', 'jack@email.com', 7, 'active', 'School Zone', 'Sports Complex'),
    ('Karen Wilson', '+1-555-1011', 'karen@email.com', 8, 'active', 'Library Stop', 'Shopping Mall'),
    ('Leo Martinez', '+1-555-1012', 'leo@email.com', 8, 'active', 'Park Avenue', 'Central Station'),
    ('Mia Thomas', '+1-555-1013', 'mia@email.com', 9, 'completed', 'Suburb Station', 'Office District'),
    ('Nick Harris', '+1-555-1014', 'nick@email.com', 10, 'active', 'Convention Center', 'Airport'),
    ('Olivia Garcia', '+1-555-1015', 'olivia@email.com', 10, 'active', 'Beach Road', 'Ferry Terminal')
  `);

  // Seed Emergencies (15 items)
  await pool.query(`
    INSERT INTO emergencies (type, priority, description, location, responder, driver_id, vehicle_id, status) VALUES
    ('Accident', 'critical', 'Multi-vehicle accident on highway, injuries reported', 'Highway I-95, Mile 42', 'Unit Alpha-1', 1, 1, 'active'),
    ('Medical', 'high', 'Passenger experiencing cardiac symptoms', 'Bus Route 7, Stop 15', 'Medic Team 3', 10, 10, 'active'),
    ('Fire', 'critical', 'Engine compartment fire detected', 'Industrial Blvd', 'Fire Unit 5', 7, 7, 'responding'),
    ('Breakdown', 'medium', 'Complete engine failure on highway shoulder', 'Interstate 40, Exit 45', 'Tow Unit 2', 5, 5, 'active'),
    ('Security', 'high', 'Suspicious package reported on bus', 'Central Bus Terminal', 'Security Team A', 11, 11, 'active'),
    ('Hazmat', 'critical', 'Chemical spill from tanker truck', 'Route 66, Industrial Zone', 'Hazmat Unit 1', 3, 3, 'responding'),
    ('Weather', 'high', 'Vehicle stranded in flash flood', 'Low Bridge, River Road', 'Rescue Unit 4', 8, 8, 'active'),
    ('Theft', 'medium', 'Cargo theft attempt in progress', 'Warehouse District', 'Security Team B', 6, 6, 'responding'),
    ('Assault', 'high', 'Driver assaulted by aggressive individual', 'Downtown Route 3', 'Police Unit 7', 12, 12, 'active'),
    ('Mechanical', 'medium', 'Steering failure at low speed', 'Parking Facility C', 'Mechanic Team 2', 4, 4, 'resolved'),
    ('Derailment', 'critical', 'Bus left roadway into ditch', 'Mountain Pass Route', 'Rescue Unit 1', 13, 13, 'active'),
    ('Kidnapping', 'critical', 'Unauthorized person took control of vehicle', 'Suburban Route 8', 'Police Unit 3', 9, 9, 'active'),
    ('Power Failure', 'low', 'Electric bus complete power loss', 'Charging Station 4', 'Electric Team 1', 14, 14, 'resolved'),
    ('Evacuation', 'high', 'Bus evacuation due to smoke in cabin', 'Highway Rest Stop 12', 'Fire Unit 2', 15, 15, 'active'),
    ('Communication', 'medium', 'All radio communications lost with convoy', 'Remote Highway Section', 'Dispatch Center', 2, 2, 'active')
  `);

  // Seed Driver Behavior (15 items)
  await pool.query(`
    INSERT INTO driver_behavior (driver_id, driver_name, event_type, severity, score, description, location) VALUES
    (1, 'Mike Johnson', 'Hard Braking', 'medium', 72, 'Sudden hard braking event detected at 65mph', 'Highway I-95'),
    (2, 'Sarah Williams', 'Smooth Driving', 'low', 95, 'Consistently smooth acceleration and braking patterns', 'City Route 5'),
    (3, 'Robert Brown', 'Aggressive Turning', 'high', 45, 'Sharp turns exceeding safe lateral acceleration', 'Mountain Pass'),
    (4, 'Emily Davis', 'Phone Usage', 'high', 35, 'Mobile device usage detected while vehicle in motion', 'Main Street'),
    (5, 'James Wilson', 'Speeding', 'medium', 55, 'Exceeded speed limit by 12mph for 5 minutes', 'Interstate 40'),
    (6, 'Maria Garcia', 'Lane Drifting', 'medium', 60, 'Repeated lane drifting without signal', 'Highway 101'),
    (7, 'David Martinez', 'Tailgating', 'high', 40, 'Following distance below safe threshold for 3 minutes', 'Urban Route 3'),
    (8, 'Lisa Anderson', 'Exemplary', 'low', 98, 'Perfect driving behavior score for the entire shift', 'All Routes'),
    (9, 'Thomas Taylor', 'Reckless Driving', 'critical', 20, 'Multiple violations including speeding and lane changes', 'Highway 66'),
    (10, 'Jennifer Thomas', 'Safe Distance', 'low', 92, 'Maintains excellent following distance consistently', 'Interstate 80'),
    (11, 'Christopher Lee', 'Harsh Acceleration', 'medium', 58, 'Frequent aggressive acceleration from stops', 'City Center'),
    (12, 'Amanda White', 'Seatbelt Compliance', 'low', 100, 'Perfect seatbelt compliance record', 'All Routes'),
    (13, 'Daniel Harris', 'Fatigue Signs', 'high', 38, 'Erratic driving patterns suggesting fatigue', 'Night Route 7'),
    (14, 'Jessica Clark', 'Good Behavior', 'low', 88, 'Consistent safe driving practices', 'Suburban Routes'),
    (15, 'Andrew Lewis', 'Red Light', 'critical', 15, 'Ran red light at busy intersection', 'Downtown Crossing')
  `);

  // Seed Maintenance (15 items)
  await pool.query(`
    INSERT INTO maintenance (vehicle_id, vehicle_name, type, priority, description, scheduled_date, cost_estimate, status) VALUES
    (1, 'Volvo FH16 TX-4521', 'Brake Inspection', 'high', 'Complete brake system inspection and pad replacement', '2024-12-20', 1200.00, 'scheduled'),
    (2, 'Mercedes Actros TX-7832', 'Oil Change', 'medium', 'Regular oil and filter change at 100k miles', '2024-12-18', 350.00, 'scheduled'),
    (3, 'MAN TGX BX-1123', 'Engine Repair', 'critical', 'Engine overheating issue - thermostat replacement', '2024-12-15', 2800.00, 'in_progress'),
    (4, 'Scania R500 BX-4456', 'Tire Rotation', 'low', 'Standard tire rotation and pressure check', '2024-12-22', 180.00, 'scheduled'),
    (5, 'DAF XF TX-9987', 'Transmission Service', 'high', 'Transmission fluid flush and filter replacement', '2024-12-19', 1500.00, 'scheduled'),
    (6, 'Iveco Daily BX-2234', 'AC Repair', 'medium', 'Air conditioning compressor replacement', '2024-12-25', 900.00, 'scheduled'),
    (7, 'Renault T High TX-5567', 'Full Overhaul', 'critical', 'Complete engine overhaul required at 180k miles', '2024-12-16', 8500.00, 'in_progress'),
    (8, 'Ford Transit BX-8890', 'Suspension Check', 'medium', 'Front suspension inspection and shock replacement', '2024-12-21', 650.00, 'scheduled'),
    (9, 'Volvo B8R TX-3312', 'Electrical System', 'high', 'Complete electrical system diagnostic and repair', '2024-12-17', 1100.00, 'in_progress'),
    (10, 'Mercedes Sprinter BX-6645', 'Body Repair', 'low', 'Minor body panel dent repair', '2024-12-28', 400.00, 'scheduled'),
    (11, 'Scania Citywide TX-1178', 'Door Mechanism', 'medium', 'Automatic door mechanism adjustment', '2024-12-23', 300.00, 'scheduled'),
    (12, 'MAN Lions City BX-4401', 'Exhaust System', 'high', 'Exhaust system leak repair and emissions test', '2024-12-14', 1800.00, 'in_progress'),
    (13, 'Volvo FMX TX-7734', 'Hydraulic System', 'medium', 'Hydraulic lift system maintenance', '2024-12-24', 750.00, 'scheduled'),
    (14, 'DAF CF BX-2267', 'Battery Replace', 'low', 'Dual battery replacement', '2024-12-26', 450.00, 'scheduled'),
    (15, 'Iveco Stralis TX-5590', 'Clutch Service', 'high', 'Clutch plate replacement - slipping detected', '2024-12-13', 2200.00, 'in_progress')
  `);

  // Seed Weather Alerts (15 items)
  await pool.query(`
    INSERT INTO weather_alerts (type, severity, location, description, temperature, wind_speed, visibility, road_condition, status) VALUES
    ('Heavy Rain', 'high', 'Interstate 95 Corridor', 'Heavy rainfall expected, 2-3 inches per hour', 18.5, 25.0, 2.0, 'wet', 'active'),
    ('Ice Storm', 'critical', 'Mountain Pass Region', 'Black ice forming on elevated sections', -5.2, 15.0, 1.5, 'icy', 'active'),
    ('Fog', 'high', 'Coastal Highway 1', 'Dense fog reducing visibility below 100m', 12.0, 5.0, 0.5, 'damp', 'active'),
    ('Snow', 'medium', 'Northern Route Network', 'Light snowfall, 1-2 inches expected', -2.0, 10.0, 3.0, 'snowy', 'active'),
    ('High Wind', 'high', 'Bridge Sections All Routes', 'Wind gusts exceeding 60mph on elevated roads', 8.0, 65.0, 8.0, 'dry', 'active'),
    ('Heat Wave', 'medium', 'Southern Region Routes', 'Extreme heat advisory - tire blowout risk', 42.0, 8.0, 10.0, 'dry', 'active'),
    ('Thunderstorm', 'high', 'Central District', 'Severe thunderstorm with lightning activity', 22.0, 45.0, 3.0, 'wet', 'active'),
    ('Flooding', 'critical', 'River Road Section', 'Flash flood warning - road closures expected', 15.0, 20.0, 4.0, 'flooded', 'active'),
    ('Hail', 'medium', 'Eastern Suburbs', 'Hail up to 1 inch diameter reported', 10.0, 30.0, 5.0, 'wet', 'expired'),
    ('Dust Storm', 'high', 'Desert Highway 10', 'Visibility near zero in dust storm', 35.0, 55.0, 0.2, 'sandy', 'active'),
    ('Clear', 'low', 'Metro Area', 'Clear conditions - normal operations', 20.0, 8.0, 15.0, 'dry', 'active'),
    ('Sleet', 'medium', 'Suburban Routes', 'Mixed precipitation creating slippery conditions', 1.0, 12.0, 4.0, 'icy', 'active'),
    ('Tornado Watch', 'critical', 'Plains Region', 'Tornado watch issued for transportation corridor', 25.0, 70.0, 6.0, 'dry', 'active'),
    ('Freezing Rain', 'high', 'Northern Highway', 'Freezing rain creating dangerous ice layer', -1.0, 18.0, 3.0, 'icy', 'active'),
    ('Wind Chill', 'medium', 'All Northern Routes', 'Extreme wind chill - vehicle prep required', -15.0, 35.0, 8.0, 'frozen', 'active')
  `);

  // Seed Compliance Reports (15 items)
  await pool.query(`
    INSERT INTO compliance_reports (title, category, driver_id, driver_name, description, regulation, compliance_score, status) VALUES
    ('Hours of Service Check', 'HOS', 1, 'Mike Johnson', 'Weekly hours of service compliance review', 'FMCSA 49 CFR 395', 95, 'compliant'),
    ('Vehicle Inspection', 'DVIR', 2, 'Sarah Williams', 'Daily vehicle inspection report verification', 'FMCSA 49 CFR 396.11', 100, 'compliant'),
    ('Drug Test Result', 'Drug Testing', 3, 'Robert Brown', 'Random drug test - quarterly screening', 'FMCSA 49 CFR 382', 100, 'compliant'),
    ('CDL Verification', 'Licensing', 4, 'Emily Davis', 'Commercial driver license status verification', 'FMCSA 49 CFR 383', 100, 'compliant'),
    ('ELD Compliance', 'Electronic Logging', 5, 'James Wilson', 'Electronic logging device data audit', 'FMCSA 49 CFR 395.8', 78, 'warning'),
    ('Hazmat Certification', 'Hazmat', 6, 'Maria Garcia', 'Hazardous materials handling certification check', 'FMCSA 49 CFR 172', 100, 'compliant'),
    ('Safety Training', 'Training', 7, 'David Martinez', 'Annual safety training completion status', 'OSHA 29 CFR 1910', 60, 'non_compliant'),
    ('Weight Compliance', 'Vehicle Weight', 8, 'Lisa Anderson', 'Gross vehicle weight compliance check', 'FHWA 23 CFR 658', 92, 'compliant'),
    ('Insurance Verification', 'Insurance', 9, 'Thomas Taylor', 'Commercial vehicle insurance coverage audit', 'FMCSA 49 CFR 387', 45, 'non_compliant'),
    ('Emissions Test', 'Environmental', 10, 'Jennifer Thomas', 'Vehicle emissions compliance testing', 'EPA 40 CFR 86', 88, 'compliant'),
    ('First Aid Kit', 'Safety Equipment', 11, 'Christopher Lee', 'First aid kit and safety equipment check', 'OSHA Standards', 100, 'compliant'),
    ('Fire Extinguisher', 'Safety Equipment', 12, 'Amanda White', 'Fire extinguisher inspection and certification', 'NFPA 10', 100, 'compliant'),
    ('Background Check', 'Personnel', 13, 'Daniel Harris', 'Annual background check and record review', 'TSA 49 CFR 1572', 100, 'compliant'),
    ('Medical Certificate', 'Medical', 14, 'Jessica Clark', 'DOT medical certificate renewal status', 'FMCSA 49 CFR 391.41', 70, 'warning'),
    ('Accident Report', 'Reporting', 15, 'Andrew Lewis', 'Accident reporting compliance review', 'FMCSA 49 CFR 390.15', 55, 'non_compliant')
  `);

  // Seed Threat Assessments (15 items)
  await pool.query(`
    INSERT INTO threat_assessments (title, threat_type, risk_level, location, description, affected_routes, recommended_action, status) VALUES
    ('Highway Robbery Hotspot', 'Criminal', 'high', 'Interstate 95, Mile 30-50', 'Increased cargo theft reports in this corridor', 'South Highway Link, Interstate Connector', 'Increase security patrols, install dash cams', 'active'),
    ('Bridge Structural Concern', 'Infrastructure', 'critical', 'River Bridge, Route 30', 'Bridge inspection revealed stress fractures', 'North Express, City Loop', 'Weight restriction, engineering assessment', 'active'),
    ('Cyber Attack Risk', 'Cyber', 'high', 'Fleet Management System', 'Phishing attempts targeting dispatch system', 'All Routes', 'Update security protocols, staff training', 'monitoring'),
    ('Protest Disruption', 'Civil', 'medium', 'Downtown District', 'Planned protest may block major intersections', 'City Loop North, City Loop South', 'Prepare alternate routes, delay schedules', 'active'),
    ('Construction Zone', 'Road Work', 'medium', 'Highway 101, Mile 60-75', 'Major road construction reducing to single lane', 'West Coast Run', 'Use alternate route, allow extra time', 'active'),
    ('Fuel Supply Disruption', 'Supply Chain', 'high', 'Regional Fuel Depot', 'Fuel supplier strike may affect operations', 'All Routes', 'Stockpile fuel, identify alternate suppliers', 'monitoring'),
    ('Seasonal Wildlife', 'Natural', 'medium', 'Mountain Pass Region', 'Increased deer crossing activity during fall', 'Mountain Pass', 'Reduce speed limits, install warning signs', 'active'),
    ('Vandalism Pattern', 'Criminal', 'medium', 'Depot Parking Lots', 'Series of vehicle vandalism incidents reported', 'N/A - Depot Security', 'Enhance surveillance, increase guard presence', 'active'),
    ('Flash Flood Zone', 'Natural', 'high', 'Low Valley Routes', 'Seasonal flash flood risk in valley corridors', 'South Highway Link, Harbor Express', 'Monitor weather, prepare evacuation routes', 'active'),
    ('GPS Jamming', 'Technical', 'high', 'Industrial Zone', 'GPS signal interference detected in area', 'East Industrial', 'Use backup navigation, report to FCC', 'investigating'),
    ('Tunnel Closure Risk', 'Infrastructure', 'medium', 'City Tunnel System', 'Ventilation system maintenance required', 'City Loop North', 'Schedule off-peak maintenance window', 'monitoring'),
    ('Border Delay', 'Regulatory', 'medium', 'Border Crossing Point', 'New inspection requirements causing delays', 'Border Crossing', 'Adjust schedules, pre-clear documentation', 'active'),
    ('Chemical Plant Risk', 'Hazmat', 'high', 'Industrial Corridor', 'Chemical plant expansion near route', 'East Industrial', 'Update emergency plans, hazmat training', 'monitoring'),
    ('Terrorism Advisory', 'Security', 'critical', 'Major Transit Hubs', 'Elevated threat level for public transportation', 'All Passenger Routes', 'Enhanced screening, increase security presence', 'active'),
    ('Road Surface Degradation', 'Infrastructure', 'medium', 'Northern Rural Routes', 'Pothole damage worsening on northern roads', 'Night Freight, Border Crossing', 'Reduce speed, report to highway authority', 'active')
  `);

  // Seed GPS Tracking (15 items)
  await pool.query(`
    INSERT INTO gps_tracking (vehicle_id, vehicle_name, driver_name, latitude, longitude, speed, heading, status) VALUES
    (1, 'Volvo FH16 TX-4521', 'Mike Johnson', 40.7128, -74.0060, 65.5, 180.0, 'moving'),
    (2, 'Mercedes Actros TX-7832', 'Sarah Williams', 40.7580, -73.9855, 0.0, 0.0, 'stopped'),
    (3, 'MAN TGX BX-1123', 'Robert Brown', 40.6892, -74.0445, 45.2, 270.0, 'moving'),
    (4, 'Scania R500 BX-4456', 'Emily Davis', 40.7484, -73.9857, 30.8, 90.0, 'moving'),
    (5, 'DAF XF TX-9987', 'James Wilson', 40.7831, -73.9712, 0.0, 0.0, 'idle'),
    (6, 'Iveco Daily BX-2234', 'Maria Garcia', 40.7061, -74.0087, 55.3, 145.0, 'moving'),
    (7, 'Renault T High TX-5567', 'David Martinez', 40.7282, -73.7949, 0.0, 0.0, 'offline'),
    (8, 'Ford Transit BX-8890', 'Lisa Anderson', 40.6501, -73.9496, 28.7, 315.0, 'moving'),
    (9, 'Volvo B8R TX-3312', 'Thomas Taylor', 40.7527, -73.9772, 12.5, 45.0, 'moving'),
    (10, 'Mercedes Sprinter BX-6645', 'Jennifer Thomas', 40.7614, -73.9776, 40.1, 200.0, 'moving'),
    (11, 'Scania Citywide TX-1178', 'Christopher Lee', 40.7308, -73.9973, 18.3, 60.0, 'moving'),
    (12, 'MAN Lions City BX-4401', 'Amanda White', 40.7411, -74.0018, 0.0, 0.0, 'stopped'),
    (13, 'Volvo FMX TX-7734', 'Daniel Harris', 40.6943, -73.9866, 52.6, 120.0, 'moving'),
    (14, 'DAF CF BX-2267', 'Jessica Clark', 40.7681, -73.9819, 35.4, 280.0, 'moving'),
    (15, 'Iveco Stralis TX-5590', 'Andrew Lewis', 40.7023, -74.0157, 70.2, 170.0, 'moving')
  `);

  // Seed Fatigue Records (15 items)
  await pool.query(`
    INSERT INTO fatigue_records (driver_id, driver_name, fatigue_level, hours_driven, last_rest, alert_type, description, status) VALUES
    (1, 'Mike Johnson', 'low', 4.5, '2024-12-14 06:00:00', 'info', 'Normal fatigue levels, well-rested driver', 'resolved'),
    (2, 'Sarah Williams', 'moderate', 7.2, '2024-12-14 05:30:00', 'warning', 'Approaching maximum driving hours, rest recommended', 'active'),
    (3, 'Robert Brown', 'high', 9.8, '2024-12-13 22:00:00', 'critical', 'Exceeded safe driving hours, immediate rest required', 'active'),
    (4, 'Emily Davis', 'low', 3.0, '2024-12-14 07:00:00', 'info', 'Fresh start, minimal fatigue indicators', 'resolved'),
    (5, 'James Wilson', 'critical', 11.5, '2024-12-13 18:00:00', 'emergency', 'Dangerous fatigue level detected, must stop immediately', 'active'),
    (6, 'Maria Garcia', 'moderate', 6.8, '2024-12-14 04:00:00', 'warning', 'Moderate yawning frequency detected by cabin camera', 'active'),
    (7, 'David Martinez', 'low', 2.1, '2024-12-14 08:00:00', 'info', 'Just started shift, all vitals normal', 'resolved'),
    (8, 'Lisa Anderson', 'moderate', 7.5, '2024-12-14 03:00:00', 'warning', 'Slight lane drifting detected, possible fatigue', 'active'),
    (9, 'Thomas Taylor', 'critical', 10.2, '2024-12-13 20:00:00', 'emergency', 'Multiple microsleep indicators detected', 'active'),
    (10, 'Jennifer Thomas', 'low', 5.0, '2024-12-14 06:30:00', 'info', 'Within safe driving hours, good condition', 'resolved'),
    (11, 'Christopher Lee', 'high', 8.5, '2024-12-13 23:00:00', 'critical', 'Eye closure frequency increasing, rest stop needed', 'active'),
    (12, 'Amanda White', 'low', 1.5, '2024-12-14 09:00:00', 'info', 'Recently rested, optimal alertness', 'resolved'),
    (13, 'Daniel Harris', 'high', 9.0, '2024-12-14 01:00:00', 'critical', 'Night shift fatigue - reduced reaction time observed', 'active'),
    (14, 'Jessica Clark', 'moderate', 6.0, '2024-12-14 05:00:00', 'warning', 'Moderate fatigue signs on long haul route', 'active'),
    (15, 'Andrew Lewis', 'critical', 12.0, '2024-12-13 16:00:00', 'emergency', 'Extreme fatigue - driving privilege suspended', 'active')
  `);

  // Seed Speed Violations (15 items)
  await pool.query(`
    INSERT INTO speed_violations (driver_id, driver_name, vehicle_id, speed_recorded, speed_limit, location, severity, status) VALUES
    (1, 'Mike Johnson', 1, 75.0, 65.0, 'Highway I-95, Mile 42', 'moderate', 'reviewed'),
    (3, 'Robert Brown', 3, 85.0, 55.0, 'Mountain Pass Route 66', 'critical', 'pending'),
    (5, 'James Wilson', 5, 70.0, 60.0, 'Interstate 40, Mile 78', 'low', 'dismissed'),
    (7, 'David Martinez', 7, 50.0, 25.0, 'School Zone, Elm Street', 'critical', 'pending'),
    (9, 'Thomas Taylor', 9, 90.0, 65.0, 'Highway 101, Mile 30', 'critical', 'pending'),
    (11, 'Christopher Lee', 11, 45.0, 35.0, 'Residential Area B', 'moderate', 'reviewed'),
    (12, 'Amanda White', 12, 68.0, 55.0, 'City Route 5', 'moderate', 'pending'),
    (2, 'Sarah Williams', 2, 72.0, 65.0, 'Interstate 80, Mile 12', 'low', 'dismissed'),
    (4, 'Emily Davis', 4, 55.0, 40.0, 'Urban Route 3', 'moderate', 'pending'),
    (6, 'Maria Garcia', 6, 42.0, 30.0, 'Warehouse District', 'moderate', 'reviewed'),
    (8, 'Lisa Anderson', 8, 78.0, 65.0, 'Highway Express Lane', 'moderate', 'pending'),
    (10, 'Jennifer Thomas', 10, 40.0, 25.0, 'Hospital Zone', 'high', 'pending'),
    (13, 'Daniel Harris', 13, 95.0, 70.0, 'Open Highway Section', 'critical', 'pending'),
    (14, 'Jessica Clark', 14, 62.0, 55.0, 'Suburban Main Road', 'low', 'dismissed'),
    (15, 'Andrew Lewis', 15, 88.0, 65.0, 'Bridge Section Route 30', 'critical', 'pending')
  `);

  // Seed Communications (15 items)
  await pool.query(`
    INSERT INTO communications (sender, recipient, channel, subject, message, priority, status) VALUES
    ('Dispatch Center', 'Mike Johnson', 'radio', 'Route Update', 'Accident on I-95 Mile 42. Take alternate route via Exit 38.', 'high', 'delivered'),
    ('Sarah Williams', 'Dispatch Center', 'radio', 'Status Report', 'Arrived at North Terminal. Unloading cargo, ETA 30 min.', 'normal', 'read'),
    ('Operations Manager', 'All Drivers', 'broadcast', 'Weather Alert', 'Severe thunderstorm warning. All drivers exercise extreme caution.', 'urgent', 'sent'),
    ('Robert Brown', 'Dispatch Center', 'phone', 'Mechanical Issue', 'Hearing unusual noise from front axle. Requesting mechanic dispatch.', 'high', 'read'),
    ('Safety Officer', 'Thomas Taylor', 'email', 'Safety Warning', 'Your driving behavior score has dropped below acceptable threshold. Meeting required.', 'high', 'delivered'),
    ('Dispatch Center', 'Emily Davis', 'radio', 'New Assignment', 'Please proceed to Harbor Terminal for priority pickup.', 'normal', 'delivered'),
    ('James Wilson', 'Dispatch Center', 'radio', 'Break Request', 'Requesting 30-minute rest break at next rest stop. Fatigue setting in.', 'high', 'read'),
    ('Fleet Manager', 'All Drivers', 'app', 'Maintenance Schedule', 'Monthly maintenance schedule updated. Check your vehicle assignments.', 'normal', 'sent'),
    ('Maria Garcia', 'Dispatch Center', 'radio', 'Delivery Complete', 'Package delivered to Industrial Zone client. Heading back to depot.', 'normal', 'read'),
    ('Security Team', 'Dispatch Center', 'radio', 'Security Alert', 'Suspicious activity observed near Warehouse District. Alerting all units.', 'urgent', 'delivered'),
    ('Dispatch Center', 'Lisa Anderson', 'radio', 'Passenger Update', 'Additional passenger pickup at Bus Stop 15. Adjust route accordingly.', 'normal', 'delivered'),
    ('Christopher Lee', 'Dispatch Center', 'phone', 'Traffic Report', 'Heavy congestion on City Loop North. Suggest rerouting buses.', 'high', 'read'),
    ('HR Department', 'Daniel Harris', 'email', 'Certification Renewal', 'Your CDL certification expires in 30 days. Please schedule renewal.', 'normal', 'sent'),
    ('Dispatch Center', 'Andrew Lewis', 'radio', 'Speed Warning', 'Telemetry shows excessive speed on Bridge Section. Reduce immediately.', 'urgent', 'delivered'),
    ('Emergency Coordinator', 'All Units', 'broadcast', 'Emergency Protocol', 'Activating emergency response protocol for Highway accident. All available units respond.', 'urgent', 'sent')
  `);

  console.log('✅ Database seeded successfully with 15 items per feature!');
  await pool.end();
}

seed().catch(err => {
  console.error('❌ Seed error:', err);
  process.exit(1);
});
