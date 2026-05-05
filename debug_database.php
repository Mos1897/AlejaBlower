<?php
// Debug Database Connection and Tables
header('Content-Type: text/plain');

echo "=== Database Debug ===\n\n";

// Include database configuration
require_once 'config/database.php';

try {
    echo "1. Testing database connection...\n";
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "✓ Database connection successful\n\n";

    echo "2. Checking if tables exist...\n";
    
    // Check products table
    $stmt = $pdo->query("SHOW TABLES LIKE 'products'");
    $productsExists = $stmt->rowCount() > 0;
    echo "Products table: " . ($productsExists ? "✓ EXISTS" : "✗ MISSING") . "\n";
    
    // Check sales table
    $stmt = $pdo->query("SHOW TABLES LIKE 'sales'");
    $salesExists = $stmt->rowCount() > 0;
    echo "Sales table: " . ($salesExists ? "✓ EXISTS" : "✗ MISSING") . "\n\n";

    if ($productsExists) {
        echo "3. Products table data:\n";
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM products");
        $result = $stmt->fetch();
        echo "Total products: " . $result['count'] . "\n";
        
        if ($result['count'] > 0) {
            $stmt = $pdo->query("SELECT id, name, price, stock_quantity FROM products LIMIT 5");
            $products = $stmt->fetchAll();
            foreach ($products as $product) {
                echo "- ID: {$product['id']}, Name: {$product['name']}, Price: ₱{$product['price']}, Stock: {$product['stock_quantity']}\n";
            }
        }
        echo "\n";
    }

    if ($salesExists) {
        echo "4. Sales table data:\n";
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM sales");
        $result = $stmt->fetch();
        echo "Total sales: " . $result['count'] . "\n";
        
        if ($result['count'] > 0) {
            $stmt = $pdo->query("SELECT id, total_amount, payment_method, created_at FROM sales ORDER BY created_at DESC LIMIT 5");
            $sales = $stmt->fetchAll();
            foreach ($sales as $sale) {
                echo "- ID: {$sale['id']}, Amount: ₱{$sale['total_amount']}, Method: {$sale['payment_method']}, Date: {$sale['created_at']}\n";
            }
        } else {
            echo "No sales records found\n";
        }
        echo "\n";
    }

    echo "5. Testing today's sales query:\n";
    $stmt = $pdo->prepare("SELECT SUM(total_amount) as total, COUNT(*) as count FROM sales WHERE DATE(created_at) = CURDATE()");
    $stmt->execute();
    $result = $stmt->fetch();
    echo "Today's total: ₱" . ($result['total'] ?? 0) . "\n";
    echo "Today's count: " . ($result['count'] ?? 0) . "\n\n";

    echo "6. Testing API endpoints:\n";
    
    // Test stats endpoint
    echo "Testing /api/api.php?action=stats...\n";
    $ch = curl_init('http://localhost/laundry/api/api.php?action=stats');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    echo "HTTP Code: $httpCode\n";
    echo "Response: $response\n\n";

    // Test sales history endpoint
    echo "Testing /api/api.php?action=sales_history...\n";
    $ch = curl_init('http://localhost/laundry/api/api.php?action=sales_history');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    echo "HTTP Code: $httpCode\n";
    echo "Response: $response\n\n";

} catch (PDOException $e) {
    echo "✗ Database connection failed: " . $e->getMessage() . "\n";
} catch (Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
}

echo "\n=== End Debug ===\n";
?>
