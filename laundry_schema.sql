-- Complete Laundry Database Schema (Fixed for DB_NAME='laundry')
-- Run: mysql -u root < database/laundry_schema.sql

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

CREATE DATABASE IF NOT EXISTS laundry
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE laundry;

-- ROLES TABLE
CREATE TABLE IF NOT EXISTS roles (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(50) NOT NULL UNIQUE,
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

-- TEMP REGISTRATION TABLE (for register.php)
CREATE TABLE IF NOT EXISTS temp_registration (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    otp_expires DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_temp_reg_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- OTP VERIFICATION TABLE (for both register/login)
CREATE TABLE IF NOT EXISTS otp_verification (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    otp VARCHAR(10) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_otp_email (email),
    INDEX idx_otp_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- PASSWORD RESETS TABLE
CREATE TABLE IF NOT EXISTS password_resets (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT UNSIGNED NOT NULL,
    token_hash  CHAR(64) NOT NULL,
    expires_at  DATETIME NOT NULL,
    used_at     DATETIME NULL,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_password_resets_user_id FOREIGN KEY (user_id) REFERENCES users(id)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_password_resets_user_id_expires ON password_resets(user_id, expires_at);
CREATE UNIQUE INDEX uq_password_resets_token_hash ON password_resets(token_hash);

-- LOGIN LOGS TABLE
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

-- EMAIL VERIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS email_verifications (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT UNSIGNED NOT NULL,
    email       VARCHAR(191) NOT NULL,
    otp_code    VARCHAR(10) NULL,
    token_hash  CHAR(64) NULL,
    purpose     ENUM('registration','login','password_reset','change_email') NOT NULL,
    expires_at  DATETIME NOT NULL,
    verified_at DATETIME NULL,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_email_verifications_user_id FOREIGN KEY (user_id) REFERENCES users(id)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- SEED DATA
INSERT INTO roles (name, description) VALUES
('tenant',   'Regular customer using laundry services'),
('landlord', 'Property owner / manager'),
('admin',    'System administrator')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- Sample users (use php password_hash() for real passwords)
INSERT INTO users (email, password_hash, role_id, status, email_verified_at) VALUES
('admin@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 3, 'active', NOW()),
('test@example.com',  '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 'active', NULL)
ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash);

INSERT INTO user_profiles (user_id, full_name, phone, city, country)
SELECT u.id, 'Admin User', '+63-900-000-0000', 'Manila', 'Philippines' 
FROM users u JOIN roles r ON u.role_id = r.id WHERE u.email = 'admin@example.com'
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name);

