<?php
// Fix Products Table - Remove FK constraint, use VARCHAR(50) category_id
// Run: php api/fix_products_table.php

require_once __DIR__ . '/config.php';

echo "=== Fixing Products Table ===\n";

global $pdo;

try {
    // 1. Drop existing products table (removes FK constraint)
    $pdo->exec("DROP TABLE IF EXISTS products");
    echo "✓ Products table dropped\n";
    
    // 2. Recreate matching api/config.php schema
    $sql = "CREATE TABLE `products` (
        `id` int(11) NOT NULL AUTO_INCREMENT,
        `name` varchar(255) NOT NULL,
        `category_id` varchar(50) NOT NULL,
        `price` decimal(10,2) NOT NULL DEFAULT 0.00,
        `description` text DEFAULT NULL,
        `stock_quantity` int(11) NOT NULL DEFAULT 0,
        `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (`id`),
        KEY `idx_category` (`category_id`),
        KEY `idx_name` (`name`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    $pdo->exec($sql);
    echo "✓ Products table recreated (VARCHAR(50) category_id, NO FK)\n";
    
    // 3. Repopulate sample products (matching frontend values)
    $sampleProducts = [
        ['Industrial Fan 1200mm', 'fans', 3500.00, 25, 'Heavy duty industrial fan'],
        ['Centrifugal Blower 5HP', 'blowers', 12500.00, 15, 'High performance blower'],
        ['Roof Ventilator 300mm', 'roof_mount_ventilators', 1800.00, 40, 'Aluminum roof ventilator'],
        ['Air Circulator 600mm', 'circulator', 2800.00, 30, 'Portable air circulator'],
        ['Exhaust Ventilator 450mm', 'ventilator', 3200.00, 20, 'Wall mounted exhaust ventilator']
    ];
    
    $stmt = $pdo->prepare("INSERT INTO products (name, category_id, price, stock_quantity, description) VALUES (?, ?, ?, ?, ?)");
    foreach ($sampleProducts as $product) {
        $stmt->execute($product);
    }
    echo "✓ " . count($sampleProducts) . " sample products inserted\n";
    
    // 4. Verify
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM products");
    $count = $stmt->fetch()['count'];
    echo "✓ Verification: $count products in table\n";
    
    echo "\n✅ Products table fixed! Test inventory.html form now.\n";
    
} catch (Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>

