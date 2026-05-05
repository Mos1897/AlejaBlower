-- Products Table Schema for Aleja Blower System

-- Create products table
CREATE TABLE IF NOT EXISTS `products` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `name` varchar(255) NOT NULL,
    `category_id` varchar(50) NOT NULL,
    `price` decimal(10,2) NOT NULL DEFAULT 0.00,
    `description` text DEFAULT NULL,
    `image` varchar(500) DEFAULT NULL,
    `stock_quantity` int(11) NOT NULL DEFAULT 0,
    `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_category` (`category_id`),
    KEY `idx_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create sales table
CREATE TABLE IF NOT EXISTS `sales` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `total_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
    `payment_method` varchar(50) NOT NULL DEFAULT 'cash',
    `customer_name` varchar(255) DEFAULT NULL,
    `items` json DEFAULT NULL,
    `notes` text DEFAULT NULL,
    `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample products
INSERT INTO `products` (`name`, `category_id`, `price`, `description`, `image`, `stock_quantity`) VALUES
('Industrial Fan 1200mm', 'fans', 3500.00, 'Heavy duty industrial fan with 1200mm blade diameter', '', 25),
('Centrifugal Blower 5HP', 'blowers', 12500.00, 'High performance centrifugal blower with 5HP motor', '', 15),
('Roof Ventilator 300mm', 'roof_mount_ventilators', 1800.00, 'Aluminum roof mount ventilator for industrial ventilation', '', 40),
('Air Circulator 600mm', 'circulator', 2800.00, 'Portable air circulator with 600mm fan', '', 30),
('Exhaust Ventilator 450mm', 'ventilator', 3200.00, 'Wall mounted exhaust ventilator with 450mm diameter', '', 20),
('Pedestal Fan 400mm', 'fans', 1200.00, 'Adjustable pedestal fan with 400mm blade', '', 50),
('Axial Blower 2HP', 'blowers', 8500.00, 'Compact axial flow blower with 2HP motor', '', 18),
('Turbine Ventilator 600mm', 'roof_mount_ventilators', 4500.00, 'Wind powered turbine ventilator', '', 12),
('Wall Circulator 300mm', 'circulator', 1500.00, 'Wall mounted air circulator', '', 35),
('Inline Ventilator 200mm', 'ventilator', 2200.00, 'Inline duct ventilator for HVAC systems', '', 28);
