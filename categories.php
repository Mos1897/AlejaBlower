<?php
// Categories configuration - consistent string IDs for products.category_id VARCHAR(50)

function getCategoriesList() {
    return [
        ['id' => 1, 'name' => 'Fans'],
        ['id' => 2, 'name' => 'Blowers'],
        ['id' => 3, 'name' => 'Ventilators'],
        ['id' => 4, 'name' => 'Circulators'],
        ['id' => 5, 'name' => 'Roof Mount Ventilators']
    ];
}

function createCategoriesTable() {
    global $pdo;
    // Check if table exists first
    $stmt = $pdo->prepare("SHOW TABLES LIKE 'categories'");
    $stmt->execute();
    
    if ($stmt->rowCount() == 0) {
        // Table doesn't exist, create it
        $sql = "CREATE TABLE categories (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
        $pdo->exec($sql);
        
        // Insert categories
        $stmt = $pdo->prepare("INSERT INTO categories (name) VALUES (?)");
        $categories = getCategoriesList();
        foreach ($categories as $cat) {
            $stmt->execute([$cat['name']]);
        }
    }
}

function getCategories() {
    global $pdo;
    createCategoriesTable(); // Ensure table exists
    $stmt = $pdo->prepare("SELECT id, name FROM categories ORDER BY name");
    $stmt->execute();
    return $stmt->fetchAll();
}
?>

