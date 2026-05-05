<?php
require_once 'config.php';
require_once 'api.php'; // Test api.php calls

echo "Testing API endpoints:\n\n";

echo "1. Products:\n";
print_r(getAllProducts());

echo "\n2. Categories:\n";
print_r(getCategories());

?>

