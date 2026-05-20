// Products Management JavaScript
let products = [];
let categories = [];
let currentProductId = null;

document.addEventListener('DOMContentLoaded', function() {
    initializeProducts();
    loadProducts();
    loadCategories();
    updateDateTime();
    setInterval(updateDateTime, 1000);
    
    // Listen for storage events from inventory page
    window.addEventListener('storage', function(e) {
        if (e.key === 'productsDataUpdated') {
            console.log('Products data updated in inventory page, refreshing...');
            loadProducts();
        }
    });
});

// Initialize products page
function initializeProducts() {
    // Populate user email from localStorage
    const userEmail = localStorage.getItem('userEmail');
    if (userEmail) {
        const userEmailElement = document.getElementById('user-email');
        if (userEmailElement) {
            userEmailElement.textContent = userEmail;
        }
    }

    // Navigation
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            if (page === 'logout') {
                logout();
            } else {
                navigateTo(page);
            }
        });
    });

    // Search functionality
    const searchInput = document.getElementById('product-search');
    searchInput.addEventListener('input', filterProducts);

    // Category filter
    const categoryFilter = document.getElementById('category-filter');
    categoryFilter.addEventListener('change', filterProducts);

    // Product form
    const productForm = document.getElementById('product-form');
    productForm.addEventListener('submit', handleProductSubmit);
}

// Setup image upload functionality


// Navigate to different pages
function navigateTo(page) {
    // Remove active class from all nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });

    // Add active class to clicked item
    document.querySelector(`[data-page="${page}"]`).classList.add('active');

    // Navigate to different pages
    if (page === 'dashboard') {
        window.location.href = 'dashboard.html';
    } else if (page === 'pos') {
        window.location.href = 'pos.html';
    } else if (page === 'inventory') {
        window.location.href = 'inventory.html';
    } else if (page === 'sales') {
        window.location.href = 'sales.html';
    } else if (page === 'reports') {
        window.location.href = 'reports.html';
    }
}

// Load products from API
async function loadProducts() {
    try {
        const response = await fetch('../api/api.php?action=products');
        products = await response.json();
        displayProducts(products);
    } catch (error) {
        console.error('Error loading products:', error);
        showError('Failed to load products');
    }
}

// Load categories from API
async function loadCategories() {
    try {
        const response = await fetch('../api/api.php?action=categories');
        categories = await response.json();
        populateCategoryFilter();
        populateCategorySelect();
    } catch (error) {
        console.error('Error loading categories:', error);
        // Fallback to hardcoded
        categories = [
            {id: 1, name: 'Fans'},
            {id: 2, name: 'Blowers'},
            {id: 3, name: 'Ventilators'},
            {id: 4, name: 'Circulators'},
            {id: 5, name: 'Roof Mount Ventilators'}
        ];
        populateCategoryFilter();
        populateCategorySelect();
    }
}

// Populate category filter dropdown
function populateCategoryFilter() {
    const filterSelect = document.getElementById('category-filter');
    filterSelect.innerHTML = '<option value="">All Categories</option>';

    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        filterSelect.appendChild(option);
    });
}

// Populate category select in modal
function populateCategorySelect() {
    const categorySelect = document.getElementById('product-category');
    categorySelect.innerHTML = '<option value="">Select Category</option>';

    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        categorySelect.appendChild(option);
    });
}

// Display products in table
function displayProducts(productList) {
    const tbody = document.getElementById('products-table-body');

    if (productList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="no-data">No products found</td></tr>';
        return;
    }

    // Sort products by ID numerically
    const sortedProducts = [...productList].sort((a, b) => parseInt(a.id) - parseInt(b.id));

    tbody.innerHTML = sortedProducts.map(product => {
const categoryName = (() => {
  if (product.category_name) return product.category_name;
  // Hardcoded fallback mapping
  const categoryMap = {
    1: 'Fans',
    2: 'Blowers',
    3: 'Ventilators',
    4: 'Circulators',
    5: 'Roof Mount Ventilators'
  };
  return categoryMap[product.category_id] || product.category_id || 'N/A';
})();
        const stockStatus = getStockStatus(product.stock_quantity);

        return `
            <tr>
                <td>${product.name}</td>
                <td>${categoryName}</td>
                <td><div class="product-price">₱${parseFloat(product.price).toFixed(2)}</div></td>
                <td><span class="product-stock ${stockStatus.class}">${product.stock_quantity || 0}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn edit-btn" onclick="editProduct(${product.id})">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="action-btn delete-btn" onclick="deleteProduct(${product.id}, '${product.name}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Get stock status for styling
function getStockStatus(quantity) {
    const qty = parseInt(quantity) || 0;
    if (qty === 0) return { class: 'out', text: 'Out of Stock' };
    if (qty <= 10) return { class: 'low', text: 'Low Stock' };
    return { class: 'good', text: 'In Stock' };
}

// Filter products based on search and category
function filterProducts() {
    const searchTerm = document.getElementById('product-search').value.toLowerCase();
    const categoryId = document.getElementById('category-filter').value;

    let filteredProducts = products;

    // Filter by search term
    if (searchTerm) {
        filteredProducts = filteredProducts.filter(product =>
            product.name.toLowerCase().includes(searchTerm) ||
            (product.description && product.description.toLowerCase().includes(searchTerm))
        );
    }

    // Filter by category
    if (categoryId) {
        filteredProducts = filteredProducts.filter(product =>
            product.category_id == categoryId
        );
    }

    displayProducts(filteredProducts);
}

// Open add product modal
function openAddProductModal() {
    currentProductId = null;
    document.getElementById('modal-title').textContent = 'Add Product';
    document.getElementById('product-form').reset();
    document.getElementById('product-modal').style.display = 'block';
}

// Edit product
function editProduct(productId) {
    const product = products.find(p => p.id == productId);
    if (!product) return;

    currentProductId = productId;
    document.getElementById('modal-title').textContent = 'Edit Product';

    // Populate form
    document.getElementById('product-id').value = product.id;
    document.getElementById('product-name').value = product.name;
    document.getElementById('product-category').value = product.category_id;
    document.getElementById('product-price').value = product.price;
    document.getElementById('product-description').value = product.description || '';
    document.getElementById('product-stock').value = product.stock_quantity || 0;

    document.getElementById('product-modal').style.display = 'block';
}

// Handle product form submission
async function handleProductSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const productData = {
        name: formData.get('name'),
        category_id: formData.get('category_id'),
        price: parseFloat(formData.get('price')),
        description: formData.get('description') || '',
        stock_quantity: parseInt(formData.get('stock_quantity') || 0)
    };

    try {
        let response;
    if (currentProductId) {
            console.log('EDIT MODE - currentProductId:', currentProductId);
            productData.id = currentProductId;
            response = await fetch('../api/api.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'update_product',
                    ...productData
                })
            });
        } else {
            console.log('ADD MODE');

            response = await fetch('../api/api.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'add_product',
                    ...productData
                })
            });
        }

        const result = await response.json();

        if (result.success) {
            closeProductModal();
            loadProducts();
            showSuccess(currentProductId ? 'Product saved successfully' : 'Product added successfully');
            // Notify dashboard of product update
            localStorage.setItem('lowStockDataUpdated', Date.now());
        } else {
            showError(result.message || 'Failed to save product');
        }
    } catch (error) {
        console.error('Error saving product:', error);
        showError('Failed to save product');
    }
}

// Delete product
function deleteProduct(productId, productName) {
    currentProductId = productId;
    document.getElementById('delete-product-name').textContent = productName;
    document.getElementById('delete-modal').style.display = 'block';
}

// Confirm delete
async function confirmDelete() {
    try {
        const response = await fetch('../api/api.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'delete_product',
                id: currentProductId
            })
        });

        const result = await response.json();

        if (result.success) {
            closeDeleteModal();
            loadProducts(); // Refresh the list
            showSuccess('Product deleted successfully');
        } else {
            showError('Failed to delete product');
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        showError('Failed to delete product');
    }
}

// Close modals
function closeProductModal() {
    document.getElementById('product-modal').style.display = 'none';
    currentProductId = null;
}

function closeDeleteModal() {
    document.getElementById('delete-modal').style.display = 'none';
    currentProductId = null;
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

// Show success message
function showSuccess(message) {
    showMessage(message, 'success');
}

// Show error message
function showError(message) {
    showMessage(message, 'error');
}

// Message display function (same as login)
function showMessage(message, type) {
  // Remove existing messages
  const existingMessages = document.querySelectorAll('.form-message');
  existingMessages.forEach(msg => msg.remove());
  
  // Create new message element
  const messageDiv = document.createElement('div');
  messageDiv.className = `form-message ${type}`;
  messageDiv.textContent = message;
  
  // Add styles
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
    font-family: "Josefin Sans", sans-serif;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    ${type === 'success' ? 'background-color: #2563eb;' : 'background-color: #ef4444;'}
  `;
  
  document.body.appendChild(messageDiv);
  
  // Remove message after 5 seconds
  setTimeout(() => {
    if (messageDiv.parentNode) {
      messageDiv.parentNode.removeChild(messageDiv);
    }
  }, 5000);
}

// Close modals when clicking outside
window.onclick = function(event) {
    const productModal = document.getElementById('product-modal');
    const deleteModal = document.getElementById('delete-modal');

    if (event.target === productModal) {
        closeProductModal();
    }
    if (event.target === deleteModal) {
        closeDeleteModal();
    }
}

// Logout function
function logout() {
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    sessionStorage.clear();
    showMessage('Logged out successfully', 'success');
    setTimeout(() => {
        window.location.href = '../html/index.html';
    }, 1500);
}