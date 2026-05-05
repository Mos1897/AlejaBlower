<?php
// api/config.php - Fixed: laundry DB + products CRUD + no image required
require_once __DIR__ . '/config/database.php';

// Global PDO
try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'DB connection failed: ' . $e->getMessage()]);
    exit;
}

// Auto-create POS tables if missing
createPOSTables();

function createPOSTables() {
    global $pdo;
    
    // Check if products table exists
    $stmt = $pdo->prepare("SHOW TABLES LIKE 'products'");
    $stmt->execute();
    
    if ($stmt->rowCount() == 0) {
        // Tables don't exist, create them
        $tables = [
            "CREATE TABLE `sales` (
                `id` int(11) NOT NULL AUTO_INCREMENT,
                `transaction_id` varchar(50) NOT NULL UNIQUE,
                `total_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
                `payment_method` varchar(50) NOT NULL DEFAULT 'cash',
                `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (`id`),
                KEY `idx_transaction` (`transaction_id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
            
            "CREATE TABLE `sales_items` (
                `id` int(11) NOT NULL AUTO_INCREMENT,
                `sale_id` int(11) NOT NULL,
                `product_id` int(11) NOT NULL,
                `quantity` int(11) NOT NULL,
                `unit_price` decimal(10,2) NOT NULL,
                `total_price` decimal(10,2) NOT NULL,
                PRIMARY KEY (`id`),
                KEY `fk_sale` (`sale_id`),
                KEY `fk_product` (`product_id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
            
            "CREATE TABLE `products` (
                `id` int(11) NOT NULL AUTO_INCREMENT,
                `name` varchar(255) NOT NULL,
                `category_id` int(11) DEFAULT NULL,
                `price` decimal(10,2) NOT NULL DEFAULT 0.00,
                `stock_quantity` int(11) NOT NULL DEFAULT 0,
                `description` text DEFAULT NULL,
                `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (`id`),
                FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
        ];
        
        foreach ($tables as $sql) {
            try {
                $pdo->exec($sql);
            } catch (PDOException $e) {
                error_log("Table creation warning: " . $e->getMessage());
            }
        }
        
        // Sample products
        $sampleProducts = [
            ['Industrial Fan', 1, 3500.00, 75],
            ['Centrifugal Blower', 2, 12500.00, 60],
            ['Roof Ventilator', 5, 1800.00, 85],
            ['Small Desk Fan', 1, 1200.00, 95],
            ['Exhaust Fan', 3, 2800.00, 50],
            ['Wall Circulator', 4, 3200.00, 70]
        ];
        
        $stmt = $pdo->prepare("INSERT IGNORE INTO products (name, category_id, price, stock_quantity) VALUES (?, ?, ?, ?)");
        foreach ($sampleProducts as $product) {
            $stmt->execute($product);
        }
    }
}


// Categories - now from DB table (loads consistent string IDs)
require_once __DIR__ . '/config/categories.php';
createCategoriesTable();

// Clear all products function (for testing)
function clearAllProducts() {
    global $pdo;
    $stmt = $pdo->prepare("DELETE FROM products");
    $stmt->execute();
    return $stmt->rowCount();
}

// Products CRUD
function getAllProducts() {
    global $pdo;
    $stmt = $pdo->prepare("SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id ORDER BY p.name ASC");
    $stmt->execute();
    return $stmt->fetchAll();
}

function addProduct($data) {
    global $pdo;
    $stmt = $pdo->prepare("INSERT INTO products (name, category_id, price, description, stock_quantity, created_at) VALUES (?, ?, ?, ?, ?, NOW())");
    $stmt->execute([
        $data['name'],
        $data['category_id'],
        $data['price'],
        $data['description'] ?? '',
        $data['stock_quantity'] ?? 0
    ]);
    return $pdo->lastInsertId();
}

function updateProduct($id, $data) {
    global $pdo;
    $stmt = $pdo->prepare("UPDATE products SET name = ?, category_id = ?, price = ?, description = ?, stock_quantity = ?, updated_at = NOW() WHERE id = ?");
    $stmt->execute([
        $data['name'],
        $data['category_id'],
        $data['price'],
        $data['description'] ?? '',
        $data['stock_quantity'] ?? 0,
        $id
    ]);
    return $stmt->rowCount() > 0;
}

function deleteProduct($id) {
    global $pdo;
    $stmt = $pdo->prepare("DELETE FROM products WHERE id = ?");
    $stmt->execute([$id]);
    return $stmt->rowCount() > 0;
}

// Stats
function getTotalProducts() {
    global $pdo;
    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM products");
    $stmt->execute();
    return $stmt->fetch()['count'];
}

function getTotalInventory() {
    global $pdo;
    $stmt = $pdo->prepare("SELECT SUM(stock_quantity) as total FROM products");
    $stmt->execute();
    return $stmt->fetch()['total'] ?? 0;
}

function getLowStockCount() {
    global $pdo;
    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM products WHERE stock_quantity <= 10 AND stock_quantity > 0");
    $stmt->execute();
    return $stmt->fetch()['count'] ?? 0;
}

function getInventoryValue() {
    global $pdo;
    $stmt = $pdo->prepare("SELECT SUM(price * stock_quantity) as total FROM products");
    $stmt->execute();
    return $stmt->fetch()['total'] ?? 0;
}

function getInventoryReport() {
    global $pdo;
    $stmt = $pdo->prepare("SELECT * FROM products ORDER BY stock_quantity ASC");
    $stmt->execute();
    return $stmt->fetchAll();
}

// Get today's sales
function getTodaySales() {
    global $pdo;
    $today = date('Y-m-d');
    
    $stmt = $pdo->prepare("SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total FROM sales WHERE DATE(created_at) = ?");
    $stmt->execute([$today]);
    $result = $stmt->fetch();
    
    return [
        'count' => (int)$result['count'],
        'total' => (float)$result['total']
    ];
}

// Get total sales from all time
function getTotalSales() {
    global $pdo;
    
    $stmt = $pdo->prepare("SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total FROM sales");
    $stmt->execute();
    $result = $stmt->fetch();
    
    return [
        'count' => (int)$result['count'],
        'total' => (float)$result['total']
    ];
}

// Get total transactions count
function getTotalTransactions() {
    global $pdo;
    
    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM sales");
    $stmt->execute();
    $result = $stmt->fetch();
    
    return (int)$result['count'];
}

// Get recent transactions
function getRecentTransactions() {
    global $pdo;
    
    $stmt = $pdo->prepare("
        SELECT s.*, COUNT(si.id) as items_count
        FROM sales s
        LEFT JOIN sales_items si ON s.id = si.sale_id
        GROUP BY s.id
        ORDER BY s.created_at DESC
        LIMIT 5
    ");
    $stmt->execute();
    return $stmt->fetchAll();
}

// Get sales trend data based on selected date range
function getSalesTrendData($range = 'week') {
    global $pdo;
    
    // Determine date range and grouping strategy
    switch ($range) {
        case 'today':
            // Hourly data for today
            $sql = "
                SELECT 
                    HOUR(created_at) as hour,
                    COALESCE(SUM(total_amount), 0) as total
                FROM sales 
                WHERE DATE(created_at) = CURDATE()
                GROUP BY HOUR(created_at)
                ORDER BY hour ASC
            ";
            $stmt = $pdo->prepare($sql);
            $stmt->execute();
            $results = $stmt->fetchAll();
            
            // Initialize all hours with 0
            $labels = [];
            $data = [];
            for ($i = 6; $i <= 21; $i += 3) { // 6AM to 9PM in 3-hour blocks
                $labels[] = ($i < 12 ? $i . 'AM' : ($i == 12 ? '12PM' : ($i - 12) . 'PM'));
                $data[] = 0;
            }
            
            // Map results to time slots
            foreach ($results as $row) {
                $hour = (int)$row['hour'];
                $slotIndex = floor(($hour - 6) / 3);
                if ($slotIndex >= 0 && $slotIndex < count($data)) {
                    $data[$slotIndex] += (float)$row['total'];
                }
            }
            break;
            
        case 'yesterday':
            // Hourly data for yesterday
            $sql = "
                SELECT 
                    HOUR(created_at) as hour,
                    COALESCE(SUM(total_amount), 0) as total
                FROM sales 
                WHERE DATE(created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)
                GROUP BY HOUR(created_at)
                ORDER BY hour ASC
            ";
            $stmt = $pdo->prepare($sql);
            $stmt->execute();
            $results = $stmt->fetchAll();
            
            $labels = [];
            $data = [];
            for ($i = 6; $i <= 21; $i += 3) {
                $labels[] = ($i < 12 ? $i . 'AM' : ($i == 12 ? '12PM' : ($i - 12) . 'PM'));
                $data[] = 0;
            }
            
            foreach ($results as $row) {
                $hour = (int)$row['hour'];
                $slotIndex = floor(($hour - 6) / 3);
                if ($slotIndex >= 0 && $slotIndex < count($data)) {
                    $data[$slotIndex] += (float)$row['total'];
                }
            }
            break;
            
        case 'week':
        default:
            // Daily data for current week (Mon-Sun)
            $data = array_fill(0, 7, 0);
            $labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            
            $stmt = $pdo->prepare("
                SELECT 
                    DAYNAME(created_at) as day_name,
                    DAYOFWEEK(created_at) as day_of_week,
                    DATE(created_at) as sale_date,
                    COALESCE(SUM(total_amount), 0) as daily_total
                FROM sales 
                WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
                AND created_at <= CURDATE() + INTERVAL 1 DAY
                GROUP BY DATE(created_at), DAYNAME(created_at), DAYOFWEEK(created_at)
                ORDER BY sale_date ASC
            ");
            $stmt->execute();
            $results = $stmt->fetchAll();
            
            foreach ($results as $row) {
                // DAYOFWEEK: 1=Sunday, 2=Monday, ..., 7=Saturday
                // Convert to 0=Monday, 1=Tuesday, ..., 6=Sunday
                $dayIndex = ($row['day_of_week'] + 5) % 7;
                $data[$dayIndex] = (float)$row['daily_total'];
            }
            break;
            
        case 'month':
        case 'quarter':
            // Daily data for current month (last 30 days)
            $sql = "
                SELECT 
                    DATE(created_at) as sale_date,
                    DAYNAME(created_at) as day_name,
                    COALESCE(SUM(total_amount), 0) as daily_total
                FROM sales 
                WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
                GROUP BY DATE(created_at), DAYNAME(created_at)
                ORDER BY sale_date ASC
            ";
            $stmt = $pdo->prepare($sql);
            $stmt->execute();
            $results = $stmt->fetchAll();
            
            // Build labels for last 30 days (showing day name)
            $labels = [];
            $data = [];
            for ($i = 29; $i >= 0; $i--) {
                $date = new DateTime();
                $date->modify("-{$i} days");
                $labels[] = $date->format('M j'); // e.g., "Apr 5"
                $data[] = 0;
            }
            
            foreach ($results as $row) {
                $dateKey = date('M j', strtotime($row['sale_date']));
                $index = array_search($dateKey, $labels);
                if ($index !== false) {
                    $data[$index] = (float)$row['daily_total'];
                }
            }
            break;
            
        case 'year':
            // Monthly data for current year
            $sql = "
                SELECT 
                    MONTH(created_at) as month,
                    COALESCE(SUM(total_amount), 0) as monthly_total
                FROM sales 
                WHERE YEAR(created_at) = YEAR(CURDATE())
                GROUP BY MONTH(created_at)
                ORDER BY month ASC
            ";
            $stmt = $pdo->prepare($sql);
            $stmt->execute();
            $results = $stmt->fetchAll();
            
            $labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            $data = array_fill(0, 12, 0);
            
            foreach ($results as $row) {
                $monthIndex = (int)$row['month'] - 1;
                if ($monthIndex >= 0 && $monthIndex < 12) {
                    $data[$monthIndex] = (float)$row['monthly_total'];
                }
            }
            break;
    }
    
    return [
        'labels' => $labels,
        'data' => $data
    ];
}

// Get sales grouped by category
function getSalesByCategory() {
    global $pdo;
    
    $stmt = $pdo->prepare("
        SELECT 
            COALESCE(c.name, 'Uncategorized') as category_name,
            COALESCE(SUM(si.total_price), 0) as total_sales
        FROM sales s
        LEFT JOIN sales_items si ON s.id = si.sale_id
        LEFT JOIN products p ON si.product_id = p.id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE s.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        GROUP BY COALESCE(c.id, 0), COALESCE(c.name, 'Uncategorized')
        ORDER BY total_sales DESC
    ");
    $stmt->execute();
    $results = $stmt->fetchAll();
    
    // If no categories found, return empty structure
    if (empty($results)) {
        return [
            'labels' => [],
            'data' => []
        ];
    }
    
    $labels = [];
    $data = [];
    
    foreach ($results as $row) {
        $labels[] = $row['category_name'];
        $data[] = (float)$row['total_sales'];
    }
    
    return [
        'labels' => $labels,
        'data' => $data
    ];
}

// Get sales grouped by payment method
function getSalesByPaymentMethod() {
    global $pdo;
    
    $stmt = $pdo->prepare("
        SELECT 
            payment_method,
            COUNT(*) as transaction_count,
            COALESCE(SUM(total_amount), 0) as total_sales
        FROM sales 
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        GROUP BY payment_method
        ORDER BY total_sales DESC
    ");
    $stmt->execute();
    $results = $stmt->fetchAll();

    // If no payment methods found, return empty structure
    if (empty($results)) {
        return [
            'labels' => [],
            'data' => [],
            'counts' => []
        ];
    }

    // Aggregate data by normalized payment method name
    $aggregated = [
        'Cash' => ['count' => 0, 'total' => 0],
        'GCash' => ['count' => 0, 'total' => 0],
        'Bank Transfer' => ['count' => 0, 'total' => 0]
    ];

    foreach ($results as $row) {
        $paymentMethod = strtolower($row['payment_method']);

        // Map raw payment method to display name
        // Note: POS stores 'card' for GCash and 'transfer' for Bank Transfer
        $method = null;
        switch ($paymentMethod) {
            case 'cash':
                $method = 'Cash';
                break;
            case 'gcash':
            case 'card':
                $method = 'GCash';
                break;
            case 'bank_transfer':
            case 'transfer':
                $method = 'Bank Transfer';
                break;
        }

        // Only aggregate known payment methods
        if ($method && isset($aggregated[$method])) {
            $aggregated[$method]['count'] += (int)$row['transaction_count'];
            $aggregated[$method]['total'] += (float)$row['total_sales'];
        }
    }

    // Build return arrays in consistent order
    $labels = ['Cash', 'GCash', 'Bank Transfer'];
    $data = [];
    $counts = [];

    foreach ($labels as $method) {
        $data[] = $aggregated[$method]['total'];
        $counts[] = $aggregated[$method]['count'];
    }

    return [
        'labels' => $labels,
        'data' => $data,
        'counts' => $counts
    ];
}

// Get sales history with optional filtering and date range
function getSalesHistory($limit = 50, $search = '', $date = '', $sort = 'desc', $range = null) {
    global $pdo;
    
    $sql = "
        SELECT s.*, COUNT(si.id) as items_count
        FROM sales s
        LEFT JOIN sales_items si ON s.id = si.sale_id
    ";
    
    $params = [];
    $whereClauses = [];
    
    // Handle date range filtering
    if ($range) {
        switch ($range) {
            case 'today':
                $whereClauses[] = "DATE(s.created_at) = CURDATE()";
                break;
            case 'yesterday':
                $whereClauses[] = "DATE(s.created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)";
                break;
            case 'week':
                $whereClauses[] = "s.created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)";
                break;
            case 'month':
                $whereClauses[] = "s.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)";
                break;
            case 'quarter':
                $whereClauses[] = "QUARTER(s.created_at) = QUARTER(CURDATE()) AND YEAR(s.created_at) = YEAR(CURDATE())";
                break;
            case 'year':
                $whereClauses[] = "YEAR(s.created_at) = YEAR(CURDATE())";
                break;
        }
    }
    
    if ($date) {
        $whereClauses[] = "DATE(s.created_at) = ?";
        $params[] = $date;
    }
    
    if ($search) {
        $whereClauses[] = "s.transaction_id LIKE ?";
        $params[] = "%$search%";
    }
    
    if (!empty($whereClauses)) {
        $sql .= " WHERE " . implode(" AND ", $whereClauses);
    }
    
    $sql .= " GROUP BY s.id ORDER BY s.created_at " . ($sort === 'asc' ? 'ASC' : 'DESC') . " LIMIT $limit";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    
    $transactions = $stmt->fetchAll();
    
    // Get detailed items for each transaction
    foreach ($transactions as &$transaction) {
        $stmt = $pdo->prepare("
            SELECT si.*, p.name as product_name
            FROM sales_items si
            LEFT JOIN products p ON si.product_id = p.id
            WHERE si.sale_id = ?
        ");
        $stmt->execute([$transaction['id']]);
        $transaction['items'] = $stmt->fetchAll();
        $transaction['customer_name'] = 'Walk-in Customer'; // Default customer name
    }
    
    return $transactions;
}

// Search products function
function searchProducts($query) {
    global $pdo;
    $stmt = $pdo->prepare("SELECT * FROM products WHERE name LIKE ? OR description LIKE ? ORDER BY name ASC");
    $stmt->execute(["%$query%", "%$query%"]);
    return $stmt->fetchAll();
}

function getDailySalesReport($date) { return []; }
function getMonthlySalesReport($year, $month) { return []; }

// Get top selling items from actual sales data
function getTopSellingItems($limit = 10) {
    global $pdo;
    
    $stmt = $pdo->prepare("
        SELECT 
            COALESCE(p.name, 'Unknown Product') as product_name,
            COALESCE(SUM(si.quantity), 0) as total_quantity,
            COALESCE(SUM(si.total_price), 0) as total_revenue
        FROM sales_items si
        LEFT JOIN products p ON si.product_id = p.id
        LEFT JOIN sales s ON si.sale_id = s.id
        WHERE s.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        GROUP BY si.product_id, COALESCE(p.name, 'Unknown Product')
        ORDER BY total_quantity DESC, total_revenue DESC
        LIMIT $limit
    ");
    $stmt->execute();
    $results = $stmt->fetchAll();
    
    // If no items found, return empty structure
    if (empty($results)) {
        return [];
    }
    
    return $results;
}
function processSale($cart, $paymentMethod = 'cash') {
    global $pdo;
    
    try {
        $pdo->beginTransaction();
        
        // Generate transaction ID
        $transactionId = 'TXN' . uniqid() . rand(100, 999);
        $totalAmount = 0;
        $items = [];
        
        // Process each item
        foreach ($cart as $item) {
            $totalAmount += $item['price'] * $item['quantity'];
$items[] = [
                'product_id' => $item['id'],
                'name' => $item['name'] ?? 'Unknown Product',
                'quantity' => $item['quantity'],
                'unit_price' => $item['price'],
                'total_price' => $item['price'] * $item['quantity']
            ];

            // Check stock availability before updating
            $stmt = $pdo->prepare("SELECT stock_quantity FROM products WHERE id = ?");
            $stmt->execute([$item['id']]);
            $currentStock = $stmt->fetch()['stock_quantity'];
            
            if ($currentStock < $item['quantity']) {
                throw new Exception("Insufficient stock for product: {$item['name']}. Available: $currentStock, Requested: {$item['quantity']}");
            }
            
            // Update stock
            $stmt = $pdo->prepare("UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?");
            $stmt->execute([$item['quantity'], $item['id']]);
        }
        
        // Insert sale
        $stmt = $pdo->prepare("INSERT INTO sales (transaction_id, total_amount, payment_method) VALUES (?, ?, ?)");
        $stmt->execute([$transactionId, $totalAmount, $paymentMethod]);
        $saleId = $pdo->lastInsertId();
        
        // Insert sale items
        $stmt = $pdo->prepare("INSERT INTO sales_items (sale_id, product_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)");
        foreach ($items as $item) {
            $stmt->execute([$saleId, $item['product_id'], $item['quantity'], $item['unit_price'], $item['total_price']]);
        }
        
        $pdo->commit();
        
        return [
            'transaction_id' => $transactionId,
            'total_amount' => $totalAmount,
            'payment_method' => $paymentMethod,
            'items' => $items,
            'sale_id' => $saleId
        ];
    } catch (Exception $e) {
        $pdo->rollBack();
        error_log('Sale error: ' . $e->getMessage());
        return ['success' => false, 'message' => $e->getMessage()];
    }
}

// Get comprehensive inventory analytics data
function getInventoryAnalytics() {
    global $pdo;
    
    return [
        'low_stock_items' => getLowStockItems(),
        'inventory_valuation' => getInventoryValuationDetails(),
        'stock_movement' => getStockMovementAnalysis(),
        'category_distribution' => getInventoryByCategory(),
        'turnover_metrics' => getInventoryTurnoverMetrics()
    ];
}

// Get low stock items with details
function getLowStockItems($threshold = 10) {
    global $pdo;
    
    $stmt = $pdo->prepare("
        SELECT 
            p.id,
            p.name,
            p.stock_quantity as current_stock,
            p.price,
            c.name as category_name,
            (p.price * p.stock_quantity) as stock_value
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.stock_quantity <= ? AND p.stock_quantity > 0
        ORDER BY p.stock_quantity ASC, p.name ASC
        LIMIT 20
    ");
    $stmt->execute([$threshold]);
    $lowStock = $stmt->fetchAll();
    
    // Categorize by severity
    $result = [];
    foreach ($lowStock as $item) {
        if ($item['current_stock'] <= 5) {
            $item['severity'] = 'Critical';
            $item['severity_color'] = 'red';
        } elseif ($item['current_stock'] <= 10) {
            $item['severity'] = 'Low';
            $item['severity_color'] = 'yellow';
        } else {
            $item['severity'] = 'Warning';
            $item['severity_color'] = 'orange';
        }
        $result[] = $item;
    }
    
    return $result;
}

// Get detailed inventory valuation
function getInventoryValuationDetails() {
    global $pdo;
    
    // Total inventory value
    $stmt = $pdo->prepare("
        SELECT 
            SUM(price * stock_quantity) as total_value,
            SUM(stock_quantity) as total_units,
            COUNT(*) as total_products,
            AVG(price) as avg_price
        FROM products
        WHERE stock_quantity > 0
    ");
    $stmt->execute();
    $summary = $stmt->fetch();
    
    // Value by stock level ranges
    $ranges = [
        'out_of_stock' => ['min' => 0, 'max' => 0],
        'critical' => ['min' => 1, 'max' => 5],
        'low' => ['min' => 6, 'max' => 10],
        'normal' => ['min' => 11, 'max' => 50],
        'high' => ['min' => 51, 'max' => PHP_INT_MAX]
    ];
    
    $distribution = [];
    foreach ($ranges as $name => $range) {
        $stmt = $pdo->prepare("
            SELECT 
                COUNT(*) as product_count,
                SUM(stock_quantity) as unit_count,
                SUM(price * stock_quantity) as value
            FROM products
            WHERE stock_quantity >= ? AND stock_quantity <= ?
        ");
        $stmt->execute([$range['min'], $range['max']]);
        $distribution[$name] = $stmt->fetch();
    }
    
    return [
        'total_value' => (float)($summary['total_value'] ?? 0),
        'total_units' => (int)($summary['total_units'] ?? 0),
        'total_products' => (int)($summary['total_products'] ?? 0),
        'average_price' => (float)($summary['avg_price'] ?? 0),
        'distribution' => $distribution
    ];
}

// Get stock movement analysis (products sold in last 30 days)
function getStockMovementAnalysis() {
    global $pdo;
    
    // Get products with sales in last 30 days
    $stmt = $pdo->prepare("
        SELECT 
            p.id,
            p.name,
            p.stock_quantity as current_stock,
            COALESCE(SUM(si.quantity), 0) as sold_quantity,
            COALESCE(SUM(si.total_price), 0) as sold_value,
            COUNT(DISTINCT s.id) as times_sold,
            MAX(s.created_at) as last_sold_date
        FROM products p
        LEFT JOIN sales_items si ON p.id = si.product_id
        LEFT JOIN sales s ON si.sale_id = s.id AND s.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        GROUP BY p.id, p.name, p.stock_quantity
        HAVING sold_quantity > 0
        ORDER BY sold_quantity DESC
        LIMIT 20
    ");
    $stmt->execute();
    $movement = $stmt->fetchAll();
    
    // Calculate stock depletion estimates
    foreach ($movement as &$item) {
        $dailySalesRate = $item['sold_quantity'] / 30;
        if ($dailySalesRate > 0) {
            $item['days_until_stockout'] = round($item['current_stock'] / $dailySalesRate, 1);
            $item['stock_status'] = $item['days_until_stockout'] <= 7 ? 'critical' : 
                                    ($item['days_until_stockout'] <= 14 ? 'warning' : 'good');
        } else {
            $item['days_until_stockout'] = null;
            $item['stock_status'] = 'no_movement';
        }
    }
    
    return $movement;
}

// Get inventory distribution by category
function getInventoryByCategory() {
    global $pdo;
    
    $stmt = $pdo->prepare("
        SELECT 
            COALESCE(c.name, 'Uncategorized') as category_name,
            COUNT(*) as product_count,
            SUM(p.stock_quantity) as total_stock,
            SUM(p.price * p.stock_quantity) as inventory_value,
            AVG(p.price) as avg_product_price,
            MIN(p.stock_quantity) as min_stock,
            MAX(p.stock_quantity) as max_stock
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        GROUP BY COALESCE(c.id, 0), COALESCE(c.name, 'Uncategorized')
        ORDER BY inventory_value DESC
    ");
    $stmt->execute();
    return $stmt->fetchAll();
}

// Get inventory turnover metrics
function getInventoryTurnoverMetrics() {
    global $pdo;
    
    // Get COGS for last 30 days (approximated by sales items cost)
    $stmt = $pdo->prepare("
        SELECT 
            COALESCE(SUM(si.total_price), 0) as cogs_30_days,
            COUNT(DISTINCT si.product_id) as products_sold,
            COUNT(DISTINCT s.id) as total_transactions
        FROM sales s
        JOIN sales_items si ON s.id = si.sale_id
        WHERE s.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    ");
    $stmt->execute();
    $cogsData = $stmt->fetch();
    
    // Get average inventory value
    $stmt = $pdo->prepare("
        SELECT COALESCE(SUM(price * stock_quantity), 0) as avg_inventory_value
        FROM products
    ");
    $stmt->execute();
    $inventoryValue = $stmt->fetch()['avg_inventory_value'] ?? 0;
    
    // Calculate turnover metrics
    $cogs30Days = (float)$cogsData['cogs_30_days'];
    $avgInventory = (float)$inventoryValue;
    
    // Avoid division by zero
    $turnoverRate = $avgInventory > 0 ? ($cogs30Days * 12) / $avgInventory : 0;
    $daysInInventory = $cogs30Days > 0 ? ($avgInventory / ($cogs30Days / 30)) : 0;
    
    // Get dead stock (no sales in last 90 days)
    $stmt = $pdo->prepare("
        SELECT 
            p.id,
            p.name,
            p.stock_quantity,
            p.price,
            (p.price * p.stock_quantity) as dead_stock_value
        FROM products p
        LEFT JOIN sales_items si ON p.id = si.product_id
        LEFT JOIN sales s ON si.sale_id = s.id AND s.created_at >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
        WHERE s.id IS NULL AND p.stock_quantity > 0
        ORDER BY dead_stock_value DESC
        LIMIT 10
    ");
    $stmt->execute();
    $deadStock = $stmt->fetchAll();
    
    $deadStockValue = array_sum(array_column($deadStock, 'dead_stock_value'));
    
    return [
        'turnover_rate_annual' => round($turnoverRate, 2),
        'days_in_inventory' => round($daysInInventory, 1),
        'cogs_30_days' => $cogs30Days,
        'avg_inventory_value' => $avgInventory,
        'products_sold_30_days' => (int)$cogsData['products_sold'],
        'dead_stock_items' => $deadStock,
        'dead_stock_value' => (float)$deadStockValue,
        'dead_stock_count' => count($deadStock)
    ];
}

?>
