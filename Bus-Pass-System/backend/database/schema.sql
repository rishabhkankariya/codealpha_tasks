-- Smart Bus Pass System - Database Schema
-- PostgreSQL 15+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) NOT NULL CHECK (role IN ('passenger', 'admin', 'conductor')),
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Routes Table
CREATE TABLE routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_number VARCHAR(50) UNIQUE NOT NULL,
    origin VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    distance_km DECIMAL(10, 2) NOT NULL,
    estimated_duration_minutes INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_routes_route_number ON routes(route_number);
CREATE INDEX idx_routes_origin_destination ON routes(origin, destination);
CREATE INDEX idx_routes_is_active ON routes(is_active);

-- Route Stops Table
CREATE TABLE route_stops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
    stop_name VARCHAR(255) NOT NULL,
    stop_sequence INTEGER NOT NULL,
    distance_from_origin_km DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(route_id, stop_sequence)
);

CREATE INDEX idx_route_stops_route_id ON route_stops(route_id);
CREATE INDEX idx_route_stops_sequence ON route_stops(route_id, stop_sequence);

-- Buses Table
CREATE TABLE buses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bus_number VARCHAR(50) UNIQUE NOT NULL,
    total_seats INTEGER NOT NULL,
    bus_type VARCHAR(50) NOT NULL CHECK (bus_type IN ('standard', 'deluxe', 'sleeper')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_buses_bus_number ON buses(bus_number);
CREATE INDEX idx_buses_is_active ON buses(is_active);

-- Schedules Table
CREATE TABLE schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
    bus_id UUID NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
    departure_time TIME NOT NULL,
    arrival_time TIME NOT NULL,
    days_of_week INTEGER[] NOT NULL, -- Array of day numbers (0=Sunday, 6=Saturday)
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_schedules_route_id ON schedules(route_id);
CREATE INDEX idx_schedules_bus_id ON schedules(bus_id);
CREATE INDEX idx_schedules_departure_time ON schedules(departure_time);

-- Pricing Rules Table
CREATE TABLE pricing_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_name VARCHAR(255) NOT NULL,
    route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
    bus_type VARCHAR(50),
    base_price DECIMAL(10, 2) NOT NULL,
    price_per_km DECIMAL(10, 2),
    priority INTEGER DEFAULT 0, -- Higher priority rules applied first
    valid_from DATE NOT NULL,
    valid_to DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pricing_rules_route_id ON pricing_rules(route_id);
CREATE INDEX idx_pricing_rules_priority ON pricing_rules(priority DESC);
CREATE INDEX idx_pricing_rules_valid_dates ON pricing_rules(valid_from, valid_to);

-- Bookings Table
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    schedule_id UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
    journey_date DATE NOT NULL,
    seat_number INTEGER NOT NULL,
    booking_status VARCHAR(20) NOT NULL CHECK (booking_status IN ('reserved', 'confirmed', 'cancelled', 'completed')),
    price DECIMAL(10, 2) NOT NULL,
    payment_status VARCHAR(20) NOT NULL CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
    reservation_expires_at TIMESTAMP WITH TIME ZONE,
    qr_code_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(schedule_id, journey_date, seat_number)
);

CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_schedule_id ON bookings(schedule_id);
CREATE INDEX idx_bookings_journey_date ON bookings(journey_date);
CREATE INDEX idx_bookings_status ON bookings(booking_status);
CREATE INDEX idx_bookings_qr_code_id ON bookings(qr_code_id);
CREATE INDEX idx_bookings_reservation_expires ON bookings(reservation_expires_at) WHERE booking_status = 'reserved';

-- Pass Types Table
CREATE TABLE pass_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pass_name VARCHAR(100) NOT NULL,
    validity_days INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pass_types_is_active ON pass_types(is_active);

-- Bus Passes Table
CREATE TABLE bus_passes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pass_type_id UUID NOT NULL REFERENCES pass_types(id) ON DELETE CASCADE,
    route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
    pass_number VARCHAR(50) UNIQUE NOT NULL,
    valid_from DATE NOT NULL,
    valid_to DATE NOT NULL,
    pass_status VARCHAR(20) NOT NULL CHECK (pass_status IN ('active', 'expired', 'cancelled')),
    qr_code_id UUID,
    pdf_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bus_passes_user_id ON bus_passes(user_id);
CREATE INDEX idx_bus_passes_pass_number ON bus_passes(pass_number);
CREATE INDEX idx_bus_passes_validity ON bus_passes(valid_from, valid_to);
CREATE INDEX idx_bus_passes_status ON bus_passes(pass_status);
CREATE INDEX idx_bus_passes_qr_code_id ON bus_passes(qr_code_id);

-- QR Codes Table
CREATE TABLE qr_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    qr_code_data TEXT UNIQUE NOT NULL,
    verification_token VARCHAR(255) UNIQUE NOT NULL,
    qr_type VARCHAR(20) NOT NULL CHECK (qr_type IN ('ticket', 'pass')),
    reference_id UUID NOT NULL, -- booking_id or pass_id
    is_used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP WITH TIME ZONE,
    scan_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_qr_codes_verification_token ON qr_codes(verification_token);
CREATE INDEX idx_qr_codes_reference_id ON qr_codes(reference_id);
CREATE INDEX idx_qr_codes_type ON qr_codes(qr_type);

-- Payments Table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reference_type VARCHAR(20) NOT NULL CHECK (reference_type IN ('booking', 'pass')),
    reference_id UUID NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50),
    payment_status VARCHAR(20) NOT NULL CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
    transaction_id VARCHAR(255) UNIQUE,
    payment_gateway_response JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_reference ON payments(reference_type, reference_id);
CREATE INDEX idx_payments_transaction_id ON payments(transaction_id);
CREATE INDEX idx_payments_status ON payments(payment_status);

-- Complaints Table
CREATE TABLE complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    complaint_number VARCHAR(50) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('service_quality', 'technical_issue', 'billing_dispute', 'other')),
    description TEXT NOT NULL,
    booking_id UUID REFERENCES bookings(id),
    status VARCHAR(20) NOT NULL CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    assigned_to UUID REFERENCES users(id),
    resolution TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_complaints_user_id ON complaints(user_id);
CREATE INDEX idx_complaints_complaint_number ON complaints(complaint_number);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_priority ON complaints(priority);
CREATE INDEX idx_complaints_assigned_to ON complaints(assigned_to);

-- Notifications Table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN ('booking_confirmation', 'pass_expiry', 'system_update', 'complaint_update')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- Chatbot Sessions Table
CREATE TABLE chatbot_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    context JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chatbot_sessions_user_id ON chatbot_sessions(user_id);
CREATE INDEX idx_chatbot_sessions_token ON chatbot_sessions(session_token);
CREATE INDEX idx_chatbot_sessions_last_activity ON chatbot_sessions(last_activity_at) WHERE is_active = TRUE;

-- Chatbot Messages Table
CREATE TABLE chatbot_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES chatbot_sessions(id) ON DELETE CASCADE,
    message_type VARCHAR(20) NOT NULL CHECK (message_type IN ('user', 'bot')),
    message_text TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chatbot_messages_session_id ON chatbot_messages(session_id);
CREATE INDEX idx_chatbot_messages_created_at ON chatbot_messages(created_at);

-- Knowledge Base Table
CREATE TABLE knowledge_base (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(50) NOT NULL CHECK (category IN ('routes', 'policies', 'procedures', 'faqs')),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    keywords TEXT[],
    embedding VECTOR(384), -- For semantic search (requires pgvector extension)
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_knowledge_base_category ON knowledge_base(category);
CREATE INDEX idx_knowledge_base_is_active ON knowledge_base(is_active);
-- CREATE INDEX idx_knowledge_base_embedding ON knowledge_base USING ivfflat (embedding vector_cosine_ops); -- Requires pgvector

-- Audit Logs Table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- System Configuration Table
CREATE TABLE system_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_system_config_key ON system_config(config_key);

-- Feature Flags Table
CREATE TABLE feature_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    flag_name VARCHAR(100) UNIQUE NOT NULL,
    is_enabled BOOLEAN DEFAULT FALSE,
    description TEXT,
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_feature_flags_name ON feature_flags(flag_name);

-- Functions and Triggers

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_routes_updated_at BEFORE UPDATE ON routes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_buses_updated_at BEFORE UPDATE ON buses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pricing_rules_updated_at BEFORE UPDATE ON pricing_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pass_types_updated_at BEFORE UPDATE ON pass_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bus_passes_updated_at BEFORE UPDATE ON bus_passes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_complaints_updated_at BEFORE UPDATE ON complaints
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_config_updated_at BEFORE UPDATE ON system_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feature_flags_updated_at BEFORE UPDATE ON feature_flags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knowledge_base_updated_at BEFORE UPDATE ON knowledge_base
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically expire reservations
CREATE OR REPLACE FUNCTION expire_reservations()
RETURNS void AS $$
BEGIN
    UPDATE bookings
    SET booking_status = 'cancelled'
    WHERE booking_status = 'reserved'
    AND reservation_expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically expire passes
CREATE OR REPLACE FUNCTION expire_passes()
RETURNS void AS $$
BEGIN
    UPDATE bus_passes
    SET pass_status = 'expired'
    WHERE pass_status = 'active'
    AND valid_to < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Function to generate unique complaint number
CREATE OR REPLACE FUNCTION generate_complaint_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.complaint_number := 'CMP-' || TO_CHAR(CURRENT_TIMESTAMP, 'YYYYMMDD') || '-' || LPAD(nextval('complaint_number_seq')::TEXT, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE complaint_number_seq;

CREATE TRIGGER generate_complaint_number_trigger BEFORE INSERT ON complaints
    FOR EACH ROW EXECUTE FUNCTION generate_complaint_number();

-- Function to generate unique pass number
CREATE OR REPLACE FUNCTION generate_pass_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.pass_number := 'PASS-' || TO_CHAR(CURRENT_TIMESTAMP, 'YYYYMMDD') || '-' || LPAD(nextval('pass_number_seq')::TEXT, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE pass_number_seq;

CREATE TRIGGER generate_pass_number_trigger BEFORE INSERT ON bus_passes
    FOR EACH ROW EXECUTE FUNCTION generate_pass_number();

-- Views

-- View for active bookings with details
CREATE VIEW active_bookings_view AS
SELECT 
    b.id,
    b.user_id,
    u.email,
    u.first_name,
    u.last_name,
    r.route_number,
    r.origin,
    r.destination,
    b.journey_date,
    b.seat_number,
    b.booking_status,
    b.price,
    b.payment_status,
    b.created_at
FROM bookings b
JOIN users u ON b.user_id = u.id
JOIN schedules s ON b.schedule_id = s.id
JOIN routes r ON s.route_id = r.id
WHERE b.booking_status IN ('reserved', 'confirmed');

-- View for active passes with details
CREATE VIEW active_passes_view AS
SELECT 
    bp.id,
    bp.user_id,
    u.email,
    u.first_name,
    u.last_name,
    bp.pass_number,
    pt.pass_name,
    r.route_number,
    r.origin,
    r.destination,
    bp.valid_from,
    bp.valid_to,
    bp.pass_status,
    bp.created_at
FROM bus_passes bp
JOIN users u ON bp.user_id = u.id
JOIN pass_types pt ON bp.pass_type_id = pt.id
JOIN routes r ON bp.route_id = r.id
WHERE bp.pass_status = 'active';

-- Initial Data

-- Insert default feature flags
INSERT INTO feature_flags (flag_name, is_enabled, description) VALUES
('ai_chatbot_enabled', TRUE, 'Enable AI chatbot functionality'),
('real_time_notifications', TRUE, 'Enable real-time WebSocket notifications'),
('payment_processing', FALSE, 'Enable payment processing (not yet integrated)');

-- Insert default system configuration
INSERT INTO system_config (config_key, config_value, description) VALUES
('seat_reservation_timeout_minutes', '10', 'Minutes before seat reservation expires'),
('pass_expiry_reminder_days', '3', 'Days before pass expiry to send reminder'),
('max_requests_per_minute', '100', 'Rate limit for API requests per IP'),
('session_timeout_minutes', '30', 'Chatbot session timeout in minutes');

-- Comments for documentation
COMMENT ON TABLE users IS 'Stores user accounts for passengers, admins, and conductors';
COMMENT ON TABLE routes IS 'Defines bus routes with origin and destination';
COMMENT ON TABLE bookings IS 'Stores ticket bookings with seat assignments';
COMMENT ON TABLE bus_passes IS 'Stores digital bus passes with validity periods';
COMMENT ON TABLE qr_codes IS 'Stores QR codes for tickets and passes with verification tokens';
COMMENT ON TABLE audit_logs IS 'Tracks all system actions for security and compliance';
