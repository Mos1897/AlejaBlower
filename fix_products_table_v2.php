<?php
// Fix Products Table v2 - First disable FK checks
require_once __DIR__ . '/config.php';

echo "=== Fixing Products Table v2 ===\n";

try {
    global $pdo;
    
    // 1. Disable foreign key checks
    $pdo->exec('SET FOREIGN_KEY_CHECKS = 0');
    echo "✓ Foreign key checks disabled\n";
    
    // 2. Drop products table
    $pdo->exec("DROP TABLE IF EXISTS products");
    echo "✓ Products table dropped\n";
    
    // 3. Recreate table (matching api/config.php)
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
    echo "✓ Products table recreated (VARCHAR category_id, NO FK)\n";
    
    // 4. Insert sample products
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
    echo "✓ 5 sample products inserted\n";
    
    // 5. Re-enable foreign key checks
    $pdo->exec('SET FOREIGN_KEY_CHECKS = 1');
    echo "✓ Foreign key checks re-enabled\n";
    
    // 6. Verify
    $stmt = $pdo->query("DESCRIBE products");
    echo "Table structure:\n";
    foreach ($stmt->fetchAll() as $col) {
        echo "- {$col['Field']}: {$col['Type']}\n";
    }
    
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM products");
    echo "\n✓ " . $stmt->fetch()['count'] . " products loaded\n";
    
    echo "\n✅ FIXED! Now test inventory.html form.\n";
    
} catch (Exception $e) {
    $pdo->exec('SET FOREIGN_KEY_CHECKS = 1');
    echo "✗ Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>

