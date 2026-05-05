// Inventory Management JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Auth check - ensure user is logged in
    if (!localStorage.getItem('userEmail')) {
        console.log('No user session found, redirecting to login');
        window.location.href = 'login_page.html';
        return;
    }
    console.log('User authenticated:', localStorage.getItem('userEmail'));
    
    initializeInventory();
    loadInventoryData();
    loadCategories();
    updateDateTime();
    setInterval(updateDateTime, 1000);
});

// Global variables
let currentProducts = [];
let currentProductId = null;
let deleteProductId = null;
let stockProductId = null;

// Initialize inventory page
function initializeInventory() {
    // Navigation
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            navigateTo(page);
        });
    });

    // Logout functionality
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            logout();
        });
    }

    // Search functionality
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            filterInventory();
        });
    }

    // Category filter
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', function() {
            filterInventory();
        });
    }

    // Stock filter
    const stockFilter = document.getElementById('stock-filter');
    if (stockFilter) {
        stockFilter.addEventListener('change', function() {
            filterInventory();
        });
    }

    // Product form submission
    const productForm = document.getElementById('product-form');
    if (productForm) {
        productForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveProduct();
        });
    }

    // Stock form submission
    const stockForm = document.getElementById('stock-form');
    if (stockForm) {
        stockForm.addEventListener('submit', function(e) {
            e.preventDefault();
            updateStock();
        });
    }
}

// Navigate to different pages
function navigateTo(page) {
    // Remove active class from all nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });

    // Add active class to clicked item
    document.querySelector(`[data-page="${page}"]`).classList.add('active');

    // Navigate to pages
    if (page === 'dashboard') {
        window.location.href = 'dashboard.html';
    } else if (page === 'pos') {
        window.location.href = 'pos.html';
    } else if (page === 'products') {
        window.location.href = 'products.html';
    } else if (page === 'inventory') {
        // Already on inventory page
        return;
    } else if (page === 'sales') {
        window.location.href = 'sales.html';
    } else if (page === 'reports') {
        window.location.href = 'reports.html';
    }
}

// Load inventory data
async function loadInventoryData() {
    try {
        const response = await fetch('../api/api.php?action=products');
        const products = await response.json();
        
        currentProducts = products;
        displayInventory(products);
        updateInventoryStats(products);
        
    } catch (error) {
        console.error('Error loading inventory data:', error);
        document.getElementById('inventory-tbody').innerHTML = 
            '<tr><td colspan="7" class="error">Error loading inventory data</td></tr>';
    }
}

// Display inventory in table
function displayInventory(products) {
    const tbody = document.getElementById('inventory-tbody');
    
    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="no-data">No products found</td></tr>';
        return;
    }

    // Sort products by ID numerically
    const sortedProducts = [...products].sort((a, b) => parseInt(a.id) - parseInt(b.id));

    tbody.innerHTML = sortedProducts.map(product => {
        const stockStatus = getStockStatus(product.stock_quantity);
        return `
            <tr>
                <td>${product.id}</td>
                <td>${product.name}</td>
                <td>${product.category_name || formatCategory(product.category_id)}</td>
                <td>₱${parseFloat(product.price).toFixed(2)}</td>
                <td>${product.stock_quantity}</td>
                <td><span class="status ${stockStatus.class}">${stockStatus.text}</span></td>
                <td>
                    <button class="action-btn edit-btn" onclick="editProduct(${product.id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn stock-btn" onclick="openStockModal(${product.id})" title="Update Stock">
                        <i class="fas fa-boxes"></i>
                    </button>
                    <button class="action-btn delete-btn" onclick="deleteProduct(${product.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Get stock status
function getStockStatus(quantity) {
    if (quantity === 0) {
        return { class: 'out-of-stock', text: 'Out of Stock' };
    } else if (quantity <= 10) {
        return { class: 'low-stock', text: 'Low Stock' };
    } else {
        return { class: 'in-stock', text: 'In Stock' };
    }
}

// Format category name
function formatCategory(categoryId) {
    const categories = {
        'fans': 'Fans',
        'blowers': 'Blowers',
        'roof_mount_ventilators': 'Roof Mount Ventilators',
        'circulator': 'Circulator',
        'ventilator': 'Ventilator'
    };
    return categories[categoryId] || categoryId;
}

// Update inventory statistics
function updateInventoryStats(products) {
    const totalProducts = products.length;
    const totalStock = products.reduce((sum, product) => sum + product.stock_quantity, 0);
    const lowStockItems = products.filter(product => product.stock_quantity <= 10 && product.stock_quantity > 0).length;
    const inventoryValue = products.reduce((sum, product) => sum + (product.price * product.stock_quantity), 0);

    document.getElementById('total-products').textContent = totalProducts;
    document.getElementById('total-stock').textContent = totalStock;
    document.getElementById('low-stock-count').textContent = lowStockItems;
    document.getElementById('inventory-value').textContent = '₱' + inventoryValue.toFixed(2);
}

// Load categories for dropdowns
async function loadCategories() {
    try {
        const response = await fetch('../api/api.php?action=categories');
        const apiCategories = await response.json();
        const categories = apiCategories.map(cat => ({ id: cat.id, name: cat.name }));
        
        const categoryFilter = document.getElementById('category-filter');
        const productCategory = document.getElementById('product-category');
        
        if (categoryFilter) {
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                categoryFilter.appendChild(option);
            });
        }
        
        if (productCategory) {
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                productCategory.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading categories:', error);
        // Fallback to hardcoded
        const categories = [
            {name: 'Fans', id: 'fans'},
            {name: 'Blowers', id: 'blowers'},
            {name: 'Ventilators', id: 'ventilator'},
            {name: 'Circulators', id: 'circulator'},
            {name: 'Roof Mount Ventilators', id: 'roof_mount_ventilators'}
        ];
        
        const categoryFilter = document.getElementById('category-filter');
        const productCategory = document.getElementById('product-category');
        
        if (categoryFilter) {
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                categoryFilter.appendChild(option);
            });
        }
        
        if (productCategory) {
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                productCategory.appendChild(option);
            });
        }
    }
}

// Filter inventory
function filterInventory() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const categoryFilter = document.getElementById('category-filter').value;
    const stockFilter = document.getElementById('stock-filter').value;
    
    let filteredProducts = currentProducts.filter(product => {
        // Search filter
        const matchesSearch = product.name.toLowerCase().includes(searchTerm);
        
        // Category filter
        const matchesCategory = !categoryFilter || product.category_id === categoryFilter;
        
        // Stock filter
        let matchesStock = true;
        if (stockFilter === 'low') {
            matchesStock = product.stock_quantity <= 10 && product.stock_quantity > 0;
        } else if (stockFilter === 'out') {
            matchesStock = product.stock_quantity === 0;
        } else if (stockFilter === 'available') {
            matchesStock = product.stock_quantity > 10;
        }
        
        return matchesSearch && matchesCategory && matchesStock;
    });
    
    displayInventory(filteredProducts);
}

// Open add product modal
function openAddProductModal() {
    currentProductId = null;
    document.getElementById('modal-title').textContent = 'Add Product';
    document.getElementById('product-form').reset();
    document.getElementById('product-modal').style.display = 'flex';
}

// Edit product
function editProduct(productId) {
    const product = currentProducts.find(p => p.id === productId);
    if (!product) return;
    
    currentProductId = productId;
    document.getElementById('modal-title').textContent = 'Edit Product';
    
    document.getElementById('product-name').value = product.name;
    document.getElementById('product-category').value = product.category_id;
    document.getElementById('product-price').value = product.price;
    document.getElementById('product-stock').value = product.stock_quantity;
    document.getElementById('product-description').value = product.description || '';
    
    document.getElementById('product-modal').style.display = 'flex';
}

// Save product (add or update)
async function saveProduct() {
    const formData = new FormData(document.getElementById('product-form'));
    const productData = {
        name: formData.get('name'),
        category_id: formData.get('category_id'),
        price: parseFloat(formData.get('price')),
        stock_quantity: parseInt(formData.get('stock_quantity')),
        description: formData.get('description')
    };
    
    // Validate required fields
    if (!productData.name || !productData.category_id || !productData.price || productData.stock_quantity === '') {
        showMessage('Please fill in all required fields', 'error');
        return;
    }
    
    console.log('Saving product:', productData);
    
    try {
        let url = '../api/api.php';
        const action = currentProductId ? 'update_product' : 'add_product';
        
        if (currentProductId) {
            productData.id = currentProductId;
        }
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action, ...productData })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('API response:', result);
        
        if (result.success) {
            showMessage(currentProductId ? 'Product updated successfully!' : 'Product added successfully!', 'success');
            closeProductModal();
            loadInventoryData();
            // Notify dashboard of low stock update
            localStorage.setItem('lowStockDataUpdated', Date.now());
            // Also refresh products page if it's open
            refreshProductsPage();
        } else {
            showMessage(result.error || 'Error saving product', 'error');
        }
        
    } catch (error) {
        console.error('Error saving product:', error);
        showMessage('Error saving product: ' + error.message, 'error');
    }
}

// Close product modal
function closeProductModal() {
    document.getElementById('product-modal').style.display = 'none';
    document.getElementById('product-form').reset();
    currentProductId = null;
}

// Delete product
function deleteProduct(productId) {
    const product = currentProducts.find(p => p.id === productId);
    if (!product) return;
    
    deleteProductId = productId;
    document.getElementById('delete-product-name').textContent = product.name;
    document.getElementById('delete-modal').style.display = 'flex';
}

// Confirm delete
async function confirmDelete() {
    if (!deleteProductId) return;
    
    try {
        const response = await fetch('../api/api.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action: 'delete_product', id: deleteProductId })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showMessage('Product deleted successfully!', 'success');
            closeDeleteModal();
            loadInventoryData();
            // Notify dashboard of low stock update
            localStorage.setItem('lowStockDataUpdated', Date.now());
            // Also refresh products page if it's open
            refreshProductsPage();
        } else {
            showMessage('Error deleting product', 'error');
        }
        
    } catch (error) {
        console.error('Error deleting product:', error);
        showMessage('Error deleting product', 'error');
    }
}

// Close delete modal
function closeDeleteModal() {
    document.getElementById('delete-modal').style.display = 'none';
    deleteProductId = null;
}

// Open stock modal
function openStockModal(productId) {
    const product = currentProducts.find(p => p.id === productId);
    if (!product) return;
    
    stockProductId = productId;
    document.getElementById('stock-product-name').value = product.name;
    document.getElementById('current-stock').value = product.stock_quantity;
    document.getElementById('stock-quantity').value = '';
    document.getElementById('stock-operation').value = 'add';
    document.getElementById('stock-modal').style.display = 'flex';
}

// Update stock
async function updateStock() {
    if (!stockProductId) return;
    
    const formData = new FormData(document.getElementById('stock-form'));
    const operation = formData.get('operation');
    const quantity = parseInt(formData.get('quantity'));
    
    const product = currentProducts.find(p => p.id === stockProductId);
    if (!product) return;
    
    let newStock = product.stock_quantity;
    if (operation === 'add') {
        newStock += quantity;
    } else if (operation === 'subtract') {
        newStock = Math.max(0, newStock - quantity);
    } else if (operation === 'set') {
        newStock = quantity;
    }
    
    try {
        const response = await fetch('../api/api.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                action: 'update_product', 
                id: stockProductId,
                stock_quantity: newStock
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showMessage('Stock updated successfully!', 'success');
            closeStockModal();
            loadInventoryData();
            // Notify dashboard of low stock update
            localStorage.setItem('lowStockDataUpdated', Date.now());
            // Also refresh products page if it's open
            refreshProductsPage();
        } else {
            showMessage('Error updating stock', 'error');
        }
        
    } catch (error) {
        console.error('Error updating stock:', error);
        showMessage('Error updating stock', 'error');
    }
}

// Close stock modal
function closeStockModal() {
    document.getElementById('stock-modal').style.display = 'none';
    document.getElementById('stock-form').reset();
    stockProductId = null;
}

// Export inventory
function exportInventory() {
    const csvContent = [
        ['ID', 'Product Name', 'Category', 'Price', 'Stock Quantity'],
        ...currentProducts.map(product => [
            product.id,
            product.name,
            formatCategory(product.category_id),
            product.price,
            product.stock_quantity
        ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    showMessage('Inventory exported successfully!', 'success');
}

// Refresh inventory
function refreshInventory() {
    loadInventoryData();
    showMessage('Inventory refreshed!', 'success');
}

// Update date and time
function updateDateTime() {
    const now = new Date();
    const dateElement = document.getElementById('current-date');
    const timeElement = document.getElementById('current-time');

    if (dateElement && timeElement) {
        dateElement.textContent = now.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        timeElement.textContent = now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }
}

// Logout function
function logout() {
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    sessionStorage.clear();
    
    showMessage('You have been logged out successfully.', 'success');
    
    setTimeout(() => {
        window.location.href = 'login_page.html';
    }, 1500);
}

// Refresh products page if it's open
function refreshProductsPage() {
    try {
        // Check if products page is open in another tab/window
        if (typeof Storage !== 'undefined') {
            localStorage.setItem('productsDataUpdated', Date.now());
        }
        
        // Try to call refresh function if products page is accessible
        if (window.opener && window.opener.loadProducts && typeof window.opener.loadProducts === 'function') {
            window.opener.loadProducts();
        }
    } catch (error) {
        console.log('Could not refresh products page:', error);
    }
}

// Show message function
// Delete All Products functions
function confirmDeleteAllProducts() {
    document.getElementById('delete-all-modal').style.display = 'flex';
}

function closeDeleteAllModal() {
    document.getElementById('delete-all-modal').style.display = 'none';
}

async function executeDeleteAll() {
    try {
        const response = await fetch('../api/api.php?action=clear_products');
        
        const result = await response.json();
        
        if (result.success) {
            showMessage(`All products deleted (${result.deleted_count || 0})`, 'success');
            closeDeleteAllModal();
            loadInventoryData();
            localStorage.setItem('lowStockDataUpdated', Date.now());
            refreshProductsPage();
        } else {
            showMessage('Error deleting products: ' + (result.error || 'Unknown'), 'error');
        }
    } catch (error) {
        console.error('Error deleting all products:', error);
        showMessage('Error deleting all products', 'error');
    }
}

function showMessage(message, type) {
    const existingMessages = document.querySelectorAll('.form-message');
    existingMessages.forEach(msg => msg.remove());

    const messageDiv = document.createElement('div');
    messageDiv.className = `form-message ${type}`;
    messageDiv.textContent = message;


    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        z-index: 1000;
        max-width: 300px;
        word-wrap: break-word;
        font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        ${type === 'success' ? 'background-color: #2563eb;' : 'background-color: #ef4444;'}
        animation: slideIn 0.3s ease-out;
    `;

    document.body.appendChild(messageDiv);

    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.style.animation = 'slideIn 0.3s ease-out reverse';
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.parentNode.removeChild(messageDiv);
                }
            }, 300);
        }
    }, 3000);
}
