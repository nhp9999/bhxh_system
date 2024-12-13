-- Xóa database nếu tồn tại
DROP DATABASE IF EXISTS bhxh_db;

-- Tạo database mới
CREATE DATABASE bhxh_db;

-- Kết nối vào database bhxh_db
\c bhxh_db;

-- Tạo enum cho role
CREATE TYPE user_role AS ENUM ('admin', 'employee');

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    role user_role NOT NULL DEFAULT 'employee',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Batches table (Tạo trước declarations vì declarations có foreign key tới batches)
CREATE TABLE batches (
    id SERIAL PRIMARY KEY,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER NOT NULL,
    batch_number INTEGER NOT NULL,
    status VARCHAR(10) CHECK (status IN ('pending', 'submitted', 'approved', 'rejected')) DEFAULT 'pending',
    total_declarations INTEGER DEFAULT 0,
    notes TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(month, year, batch_number)
);

-- Xóa bảng declarations nếu tồn tại
DROP TABLE IF EXISTS declarations CASCADE;

-- Tạo lại bảng declarations
CREATE TABLE declarations (
    id SERIAL PRIMARY KEY,
    declaration_code VARCHAR(20) NOT NULL UNIQUE,
    user_id INT REFERENCES users(id),
    batch_id INTEGER REFERENCES batches(id),
    object_type VARCHAR(10) CHECK (object_type IN ('HGD', 'DTTS', 'NLNN')) NOT NULL,
    bhxh_code VARCHAR(10) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    birth_date DATE NOT NULL,
    gender VARCHAR(5) CHECK (gender IN ('Nam', 'Nữ')) NOT NULL,
    cccd VARCHAR(12) NOT NULL,
    phone_number VARCHAR(10) NOT NULL,
    receipt_date DATE NOT NULL,
    receipt_number VARCHAR(7) NOT NULL,
    old_card_expiry_date DATE,
    new_card_effective_date DATE NOT NULL,
    months VARCHAR(2) CHECK (months IN ('3', '6', '12')) NOT NULL,
    plan VARCHAR(2) CHECK (plan IN ('TM', 'ON')) NOT NULL,
    commune VARCHAR(50) NOT NULL,
    hamlet VARCHAR(50) NOT NULL,
    participant_number VARCHAR(2) CHECK (participant_number IN ('1', '2', '3', '4', '5+')) NOT NULL,
    hospital_code VARCHAR(20) NOT NULL,
    status VARCHAR(10) CHECK (status IN ('pending', 'submitted', 'approved', 'rejected')) DEFAULT 'pending',
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_declarations_updated_at
    BEFORE UPDATE ON declarations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_batches_updated_at
    BEFORE UPDATE ON batches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default users
INSERT INTO users (username, password, role) VALUES
('admin', 'admin123', 'admin'),
('employee', 'employee123', 'employee');

-- Tạo index cho các trường thường xuyên tìm kiếm
CREATE INDEX idx_declarations_batch_id ON declarations(batch_id);
CREATE INDEX idx_declarations_bhxh_code ON declarations(bhxh_code);
CREATE INDEX idx_declarations_cccd ON declarations(cccd);
CREATE INDEX idx_declarations_status ON declarations(status);
CREATE INDEX idx_declarations_declaration_code ON declarations(declaration_code);
CREATE INDEX idx_declarations_created_at ON declarations(created_at DESC);

CREATE INDEX idx_declaration_batch_month_year ON declaration_batch(month, year);
CREATE INDEX idx_declaration_batch_status ON declaration_batch(status);
CREATE INDEX idx_declaration_batch_created_at ON declaration_batch(created_at DESC);
CREATE INDEX idx_declaration_batch_department_code ON declaration_batch(department_code);

-- Tạo composite index cho các trường thường query cùng nhau
CREATE INDEX idx_declarations_batch_status ON declarations(batch_id, status);
CREATE INDEX idx_declaration_batch_month_year_number ON declaration_batch(month, year, batch_number);
CREATE INDEX idx_declarations_search ON declarations(bhxh_code, cccd, phone_number);

ALTER TABLE declaration_batch 
    ALTER COLUMN status TYPE VARCHAR(20),
    ALTER COLUMN status SET DEFAULT 'pending',
    ADD CONSTRAINT batch_status_check 
    CHECK (status IN ('pending', 'submitted', 'approved', 'rejected'));

ALTER TABLE declarations
    ALTER COLUMN status TYPE VARCHAR(20),
    ALTER COLUMN status SET DEFAULT 'pending',
    ADD CONSTRAINT declaration_status_check 
    CHECK (status IN ('pending', 'submitted', 'approved', 'rejected'));