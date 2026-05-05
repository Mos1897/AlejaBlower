<?php
require_once 'config.php';

header('Content-Type: application/json');

// Get dashboard statistics
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action'])) {
    $action = $_GET['action'];

    switch ($action) {
        case 'stats':
            echo json_encode([
                'total_products' => getTotalProducts(),
                'total_inventory' => getTotalInventory(),
                'low_stock_count' => getLowStockCount(),
                'inventory_value' => getInventoryValue(),
                'today_sales' => getTodaySales(),
                'total_sales' => getTotalSales(),
                'total_transactions' => getTotalTransactions(),
                'recent_transactions' => getRecentTransactions()
            ]);
            break;

        case 'products':
            echo json_encode(getAllProducts());
            break;

        case 'categories':
            echo json_encode(getCategories());
            break;

        case 'search_products':
            $query = $_GET['q'] ?? '';
            echo json_encode(searchProducts($query));
            break;

        case 'sales_history':
            try {
                $search = $_GET['search'] ?? '';
                $date = $_GET['date'] ?? '';
                $sort = $_GET['sort'] ?? 'desc';
                echo json_encode(getSalesHistory(50, $search, $date, $sort));
            } catch (Exception $e) {
                echo json_encode(['error' => 'Failed to load sales history: ' . $e->getMessage()]);
            }
            break;

        case 'all_sales':
            try {
                $range = $_GET['range'] ?? null;
                echo json_encode(getSalesHistory(10000, '', '', 'desc', $range));
            } catch (Exception $e) {
                echo json_encode(['error' => 'Failed to load all sales: ' . $e->getMessage()]);
            }
            break;

        case 'inventory_report':
            echo json_encode(getInventoryReport());
            break;

        case 'sales_trend':
            $range = $_GET['range'] ?? 'week';
            echo json_encode(getSalesTrendData($range));
            break;

        case 'sales_by_category':
            echo json_encode(getSalesByCategory());
            break;

        case 'sales_by_payment_method':
            echo json_encode(getSalesByPaymentMethod());
            break;

        case 'top_selling_items':
            echo json_encode(getTopSellingItems());
            break;

        case 'daily_report':
            $date = $_GET['date'] ?? date('Y-m-d');
            echo json_encode(getDailySalesReport($date));
            break;

        case 'monthly_report':
            $year = $_GET['year'] ?? date('Y');
            $month = $_GET['month'] ?? date('m');
            echo json_encode(getMonthlySalesReport($year, $month));
            break;

        case 'clear_products':
            echo json_encode(['success' => true, 'deleted_count' => clearAllProducts()]);
            break;

        case 'inventory_analytics':
            echo json_encode(getInventoryAnalytics());
            break;
    }
    exit;
}

// Handle POST requests
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    if (isset($data['action'])) {
        $action = $data['action'];

        switch ($action) {
            case 'add_product':
                try {
                    $productId = addProduct($data);
                    echo json_encode(['success' => true, 'product_id' => $productId]);
                } catch (Exception $e) {
                    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
                }
                break;

            case 'update_product':
                try {
                    updateProduct($data['id'], $data);
                    echo json_encode(['success' => true]);
                } catch (Exception $e) {
                    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
                }
                break;

            case 'delete_product':
                try {
                    deleteProduct($data['id']);
                    echo json_encode(['success' => true]);
                } catch (Exception $e) {
                    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
                }
                break;

            case 'process_sale':
                $result = processSale($data['cart'], $data['payment_method'] ?? 'cash');
                echo json_encode(['success' => true, 'sale' => $result]);
                break;
        }
    }
    exit;
}

echo json_encode(['error' => 'Invalid request']);
?>