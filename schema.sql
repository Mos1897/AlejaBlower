-- Database schema for Aleja Blower Corporation POS and Inventory System

CREATE DATABASE IF NOT EXISTS blower_pos;
USE blower_pos;

-- Categories table
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category_id INT,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Inventory table
CREATE TABLE inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    min_stock_level INT DEFAULT 10,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Sales table
CREATE TABLE sales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id VARCHAR(50) UNIQUE NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_method ENUM('cash', 'card', 'transfer') DEFAULT 'cash',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Sales items table
CREATE TABLE sales_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sale_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Insert sample categories
INSERT INTO categories (name, description) VALUES
('Blowers', 'Industrial air movement equipment'),
('Fans', 'Various types of fans'),
('Ducting', 'Air ducting components'),
('Accessories', 'Related accessories and parts');

-- Insert sample products
INSERT INTO products (name, category_id, description, price) VALUES
('Centrifugal Blower', 1, 'High-efficiency centrifugal blower for industrial use', 1500.00),
('Axial Fan', 2, 'Large axial fan for ventilation', 800.00),
('Flexible Duct', 3, 'Flexible air duct, 10ft length', 50.00),
('Motor Mount', 4, 'Universal motor mounting bracket', 25.00);

-- Insert sample inventory
INSERT INTO inventory (product_id, quantity, min_stock_level) VALUES
(1, 50, 10),
(2, 30, 5),
(3, 100, 20),
(4, 75, 15);