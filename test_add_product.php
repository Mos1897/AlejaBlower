<?php
// Debug script for testing add_product API
require_once 'config.php';

header('Content-Type: application/json');

// Test data
$testData = [
    'action' => 'add_product',
    'name' => 'Test Product',
    'category_id' => 'fans',
    'price' => 100.00,
    'stock_quantity' => 10,
    'description' => 'Test product description'
];

echo "Testing add_product function...\n";

try {
    $result = addProduct($testData);
    echo json_encode(['success' => true, 'product_id' => $result]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
