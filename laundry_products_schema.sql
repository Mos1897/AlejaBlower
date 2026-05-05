-- Laundry Products Schema (Integrated with auth DB)
-- Run: c:/xampp/mysql/bin/mysql.exe laundry -u root < database/laundry_products_schema.sql

USE laundry;

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table (no image as requested)
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category_id INT,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    stock_quantity INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Inventory tracking (separate for stock management)
CREATE TABLE IF NOT EXISTS inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    min_stock_level INT DEFAULT 10,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Sample categories
INSERT INTO categories (name, description) VALUES
('Fans', 'Industrial and domestic fans'),
('Blowers', 'Centrifugal and axial blowers'),
('Ventilators', 'Exhaust and inline ventilators'),
('Circulators', 'Air circulators'),
('Roof Mount Ventilators', 'Turbine and roof ventilators');

-- Sample products (stock <10 for low stock test)
INSERT INTO products (name, category_id, description, price, stock_quantity) VALUES
('Test Fan Low Stock', 1, 'Low stock test product', 1500.00, 8),
('Industrial Blower', 2, 'High performance blower', 12500.00, 15),
('Roof Ventilator', 5, 'Aluminum roof ventilator', 1800.00, 25);

-- Initialize inventory
INSERT INTO inventory (product_id, quantity, min_stock_level) VALUES
(1, 8, 10),  -- Low stock
(2, 15, 10),
(3, 25, 10);

