-- Laundry Management Auth Schema
-- Compatible with MySQL (XAMPP)

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- Create database (optional – change name if you already use a different DB)
CREATE DATABASE IF NOT EXISTS laundry_app
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE laundry_app;

-- ROLES TABLE
CREATE TABLE IF NOT EXISTS roles (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(50) NOT NULL UNIQUE, -- 'tenant', 'landlord', 'admin'
    description VARCHAR(255) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email             VARCHAR(191) NOT NULL,
    password_hash     VARCHAR(255) NOT NULL,
    role_id           INT UNSIGNED NOT NULL,
    status            ENUM('active', 'suspended', 'deleted') NOT NULL DEFAULT 'active',
    email_verified_at DATETIME NULL,
    created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT fk_users_role_id FOREIGN KEY (role_id) REFERENCES roles(id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_role_id ON users(role_id);

-- USER PROFILES TABLE
CREATE TABLE IF NOT EXISTS user_profiles (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT UNSIGNED NOT NULL,
    full_name       VARCHAR(191) NULL,
    phone           VARCHAR(30) NULL,
    address_line1   VARCHAR(191) NULL,
    address_line2   VARCHAR(191) NULL,
    city            VARCHAR(100) NULL,
    state_region    VARCHAR(100) NULL,
    postal_code     VARCHAR(20) NULL,
    country         VARCHAR(100) NULL,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT uq_user_profiles_user_id UNIQUE (user_id),
    CONSTRAINT fk_user_profiles_user_id FOREIGN KEY (user_id) REFERENCES users(id)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- PASSWORD RESETS TABLE (token based)
CREATE TABLE IF NOT EXISTS password_resets (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT UNSIGNED NOT NULL,
    token_hash  CHAR(64) NOT NULL, -- SHA-256 of reset token
    expires_at  DATETIME NOT NULL,
    used_at     DATETIME NULL,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_password_resets_user_id FOREIGN KEY (user_id) REFERENCES users(id)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_password_resets_user_id_expires
    ON password_resets(user_id, expires_at);
CREATE UNIQUE INDEX uq_password_resets_token_hash
    ON password_resets(token_hash);

-- EMAIL VERIFICATIONS TABLE (OTP or token)
CREATE TABLE IF NOT EXISTS email_verifications (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT UNSIGNED NOT NULL,
    email       VARCHAR(191) NOT NULL,
    otp_code    VARCHAR(10) NULL,   -- e.g. 6-digit OTP as string
    token_hash  CHAR(64) NULL,      -- optional hashed token if using links
    purpose     ENUM('registration','login','password_reset','change_email') NOT NULL,
    expires_at  DATETIME NOT NULL,
    verified_at DATETIME NULL,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_email_verifications_user_id FOREIGN KEY (user_id) REFERENCES users(id)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_email_verifications_user_purpose
    ON email_verifications(user_id, purpose, expires_at);
CREATE INDEX idx_email_verifications_email
    ON email_verifications(email);
CREATE UNIQUE INDEX uq_email_verifications_token_hash
    ON email_verifications(token_hash);

-- LOGIN LOGS TABLE (audit)
CREATE TABLE IF NOT EXISTS login_logs (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT UNSIGNED NULL,
    email_attempted VARCHAR(191) NOT NULL,
    ip_address      VARCHAR(45) NOT NULL,
    user_agent      VARCHAR(255) NULL,
    success         TINYINT(1) NOT NULL DEFAULT 0,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_login_logs_user_id FOREIGN KEY (user_id) REFERENCES users(id)
        ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_login_logs_user_id_created
    ON login_logs(user_id, created_at);
CREATE INDEX idx_login_logs_email_created
    ON login_logs(email_attempted, created_at);

-- SEED ROLES
INSERT INTO roles (name, description) VALUES
('tenant',   'Regular customer using laundry services'),
('landlord', 'Property owner / manager'),
('admin',    'System administrator')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- EXAMPLE USERS (replace password hashes with real ones from PHP password_hash)
INSERT INTO users (email, password_hash, role_id, status, email_verified_at)
VALUES
('admin@example.com',
 '$2y$10$ABCDEFGHIJKLMNOPQRSTUVabcdefghijklmnopqrstuv123456',
 (SELECT id FROM roles WHERE name = 'admin'),
 'active',
 NOW()),

('tenant1@example.com',
 '$2y$10$ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ',
 (SELECT id FROM roles WHERE name = 'tenant'),
 'active',
 NULL);

INSERT INTO user_profiles (user_id, full_name, phone, city, country)
SELECT id, 'Admin User', '+63-900-000-0000', 'Manila', 'Philippines' FROM users WHERE email = 'admin@example.com'
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name);

INSERT INTO user_profiles (user_id, full_name, phone, city, country)
SELECT id, 'Sample Tenant', '+63-900-111-1111', 'Manila', 'Philippines' FROM users WHERE email = 'tenant1@example.com'
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name);


CREATE TABLE otp_verification (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    otp VARCHAR(10) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE temp_registration (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    otp_expires DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);