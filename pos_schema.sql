-- POS Complete Schema for laundry DB
USE laundry;

-- Products table (main)
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

-- Sales table
CREATE TABLE IF NOT EXISTS `sales` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `transaction_id` varchar(50) NOT NULL UNIQUE,
    `total_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
    `payment_method` varchar(50) NOT NULL DEFAULT 'cash',
    `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_transaction` (`transaction_id`),
    KEY `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sales items table
CREATE TABLE IF NOT EXISTS `sales_items` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `sale_id` int(11) NOT NULL,
    `product_id` int(11) NOT NULL,
    `quantity` int(11) NOT NULL,
    `unit_price` decimal(10,2) NOT NULL,
    `total_price` decimal(10,2) NOT NULL,
    PRIMARY KEY (`id`),
    KEY `fk_sale` (`sale_id`),
    KEY `fk_product` (`product_id`),
    CONSTRAINT `fk_sales_items_sale` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_sales_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample products
INSERT IGNORE INTO `products` (`name`, `category_id`, `price`, `stock_quantity`) VALUES
('Industrial Fan', 'fans', 3500.00, 25),
('Centrifugal Blower', 'blowers', 12500.00, 15),
('Roof Ventilator', 'roof_mount_ventilators', 1800.00, 40),
('Air Circulator', 'circulator', 2800.00, 30),
('Exhaust Ventilator', 'ventilator', 3200.00, 20);

