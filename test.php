<?php
// Simple test file to debug API
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "Testing API...<br>";

// Test database connection
require_once 'config/database.php';

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "Database connection: SUCCESS<br>";
    
    // Test if products table exists
    $stmt = $pdo->query("SHOW TABLES LIKE 'products'");
    if ($stmt->rowCount() > 0) {
        echo "Products table: EXISTS<br>";
        
        // Count products
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM products");
        $count = $stmt->fetch()['count'];
        echo "Products count: $count<br>";
        
        // Show sample products
        $stmt = $pdo->query("SELECT * FROM products LIMIT 3");
        $products = $stmt->fetchAll();
        echo "Sample products:<br>";
        foreach ($products as $product) {
            echo "- {$product['name']} ({$product['category_id']})<br>";
        }
    } else {
        echo "Products table: NOT FOUND<br>";
    }
    
    // Test categories table
    $stmt = $pdo->query("SHOW TABLES LIKE 'categories'");
    if ($stmt->rowCount() > 0) {
        echo "Categories table: EXISTS<br>";
    } else {
        echo "Categories table: NOT FOUND<br>";
    }
    
} catch (PDOException $e) {
    echo "Database connection: FAILED - " . $e->getMessage() . "<br>";
}

// Test API functions
require_once 'config.php';
echo "<br>Testing getAllProducts():<br>";
$products = getAllProducts();
echo "Found " . count($products) . " products<br>";

echo "<br>Testing getCategories():<br>";
$categories = getCategories();
echo "Found " . count($categories) . " categories<br>";
?>
