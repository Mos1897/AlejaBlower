<?php
// Test Sale Insertion
header('Content-Type: text/plain');

echo "=== Test Sale Insertion ===\n\n";

require_once 'config.php';

try {
    echo "1. Testing direct sale insertion...\n";
    
    // Insert a test sale
$stmt = $pdo->prepare("INSERT INTO sales (transaction_id, total_amount, payment_method, created_at) VALUES (?, ?, ?, NOW())");
    $testItems = json_encode([
        [
            'product_id' => 1,
            'name' => 'Test Product',
            'quantity' => 2,
            'unit_price' => 100.00,
            'total_price' => 200.00
        ]
    ]);
    
    $result = $stmt->execute(['TEST' . time(), 200.00, 'cash']);

    
    if ($result) {
        $saleId = $pdo->lastInsertId();
        echo "✓ Test sale inserted successfully\n";
        echo "Sale ID: $saleId\n";
        echo "Transaction ID: TXN" . str_pad($saleId, 6, '0', STR_PAD_LEFT) . "\n\n";
        
        echo "2. Verifying sale was saved...\n";
        $stmt = $pdo->prepare("SELECT * FROM sales WHERE id = ?");
        $stmt->execute([$saleId]);
        $sale = $stmt->fetch();
        
        if ($sale) {
            echo "✓ Sale found in database\n";
            echo "Amount: ₱{$sale['total_amount']}\n";
            echo "Payment: {$sale['payment_method']}\n";
            echo "Customer: {$sale['customer_name']}\n";
            echo "Created: {$sale['created_at']}\n\n";
        } else {
            echo "✗ Sale not found in database\n\n";
        }
        
        echo "3. Testing today's sales count...\n";
        $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM sales WHERE DATE(created_at) = CURDATE()");
        $stmt->execute();
        $result = $stmt->fetch();
        echo "Today's sales count: " . $result['count'] . "\n\n";
        
        echo "4. Testing API response...\n";
        $ch = curl_init('http://localhost/laundry/api/api.php?action=stats');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        $response = curl_exec($ch);
        curl_close($ch);
        
        echo "API Response: $response\n\n";
        
        // Clean up test sale
        $stmt = $pdo->prepare("DELETE FROM sales WHERE id = ?");
        $stmt->execute([$saleId]);
        echo "✓ Test sale cleaned up\n";
        
    } else {
        echo "✗ Failed to insert test sale\n";
        echo "Error info: " . print_r($stmt->errorInfo(), true) . "\n";
    }
    
} catch (Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
}

echo "\n=== End Test ===\n";
?>
