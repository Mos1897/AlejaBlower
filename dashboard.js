// Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Auth check - ensure user is logged in
    if (!localStorage.getItem('userEmail')) {
        console.log('No user session found, redirecting to login');
        window.location.href = '../html/index.html';
        return;
    }
    console.log('User authenticated:', localStorage.getItem('userEmail'));
    
    initializeDashboard();
    loadDashboardData();
    updateDateTime();
    setInterval(updateDateTime, 1000);
    
    // Listen for inventory/POS updates
    window.addEventListener('storage', function(e) {
        if (e.key === 'lowStockDataUpdated') {
            console.log('Low stock data updated, refreshing...');
            loadLowStockItems();
        } else if (e.key === 'salesDataUpdated') {
            console.log('Sales data updated from POS, refreshing dashboard...');
            loadDashboardData();
        }
    });
    
    // Periodic auto-refresh for low stock (30s)
    setInterval(loadLowStockItems, 30000);
    
    // Periodic auto-refresh for stats/transactions (30s)
    setInterval(loadDashboardData, 30000);
    
    // Refresh on window focus
    window.addEventListener('focus', loadDashboardData);
});



// Initialize dashboard
function initializeDashboard() {
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
    console.log('Found nav items:', navItems.length);
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            console.log('Navigating to:', page);
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
}

// Navigate to different pages
function navigateTo(page) {
    console.log('navigateTo called with page:', page);
    
    // Remove active class from all nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });

    // Add active class to clicked item
    const targetNav = document.querySelector(`[data-page="${page}"]`);
    if (targetNav) {
        targetNav.classList.add('active');
    }

    // Route map for pages
    const pages = {
        'dashboard': 'dashboard.html',
        'pos': 'pos.html',
        'products': 'products.html',
        'inventory': 'inventory.html',
        'sales': 'sales.html',
        'reports': 'reports.html'
    };

    console.log('Looking for page in map:', page, 'Found:', pages[page]);
    
    if (pages[page]) {
        console.log('Navigating to:', pages[page]);
        window.location.href = pages[page];
    } else {
        console.error('Page not found in navigation map:', page);
    }
}

// Load dashboard data
async function loadDashboardData() {
    try {
        // Add cache-busting timestamp
        const timestamp = new Date().getTime();
        const response = await fetch(`../api/api.php?action=stats&_t=${timestamp}`, {
            cache: 'no-cache',
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
        const data = await response.json();

        console.log('Dashboard data received:', data);

        // Update statistics with safe parsing
        const stats = data.today_sales || { count: 0, total: 0 };
        const inventoryValue = parseFloat(data.inventory_value) || 0;
        const todaySalesValue = parseFloat(stats.total) || 0;
        const todaySalesCount = parseInt(stats.count, 10) || 0;
        const totalTransactionsCount = parseInt(data.total_transactions, 10) || 0;

        const totalProductsEl = document.getElementById('total-products');
        const totalInventoryEl = document.getElementById('total-inventory');
        const lowStockCountEl = document.getElementById('low-stock-count');
        const inventoryValueEl = document.getElementById('inventory-value');
        const todaySalesEl = document.getElementById('today-sales');
        const recentTransactionsEl = document.getElementById('recent-transactions');

        if (totalProductsEl) totalProductsEl.textContent = Number(data.total_products) || 0;
        if (totalInventoryEl) totalInventoryEl.textContent = Number(data.total_inventory) || 0;
        if (lowStockCountEl) lowStockCountEl.textContent = Number(data.low_stock_count) || 0;
        if (inventoryValueEl) inventoryValueEl.textContent = '₱' + inventoryValue.toFixed(2);
        if (todaySalesEl) todaySalesEl.textContent = '₱' + todaySalesValue.toFixed(2);
        if (recentTransactionsEl) recentTransactionsEl.textContent = totalTransactionsCount;

        console.log('Total transactions count:', totalTransactionsCount);

        // Load recent transactions with cache busting
        if (Array.isArray(data.recent_transactions) && data.recent_transactions.length > 0) {
            fillRecentTransactionsTable(data.recent_transactions.slice(0, 5));
        } else {
            loadRecentTransactions();
        }

        // Load low stock items
        loadLowStockItems();

    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// Load recent transactions
async function loadRecentTransactions() {
    try {
        // Add cache-busting timestamp
        const timestamp = new Date().getTime();
        const response = await fetch(`../api/api.php?action=sales_history&_t=${timestamp}`, {
            cache: 'no-cache',
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
        const data = await response.json();

        // Filter for transactions from the past 5 days
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to midnight
        
        const fiveDaysAgo = new Date(today);
        fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5); // 5 days ago at midnight
        
        const recentTransactions = data.filter(transaction => {
            const transactionDate = new Date(transaction.created_at);
            transactionDate.setHours(0, 0, 0, 0); // Normalize to midnight for comparison
            return transactionDate >= fiveDaysAgo;
        });

        const tbody = document.getElementById('recent-transactions-body');

        if (recentTransactions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="no-data">No recent transactions in the past 5 days</td></tr>';
            return;
        }

        fillRecentTransactionsTable(recentTransactions);

    } catch (error) {
        console.error('Error loading recent transactions:', error);
        const tbody = document.getElementById('recent-transactions-body');
        tbody.innerHTML = '<tr><td colspan="5" class="no-data">Error loading transactions</td></tr>';
    }
}

function fillRecentTransactionsTable(transactions) {
    const tbody = document.getElementById('recent-transactions-body');

    if (!Array.isArray(transactions) || transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="no-data">No recent transactions in the past 5 days</td></tr>';
        return;
    }

    tbody.innerHTML = transactions.slice(0, 5).map(transaction => `
        <tr>
            <td>${transaction.transaction_id}</td>
            <td>${new Date(transaction.created_at).toLocaleString()}</td>
            <td>${transaction.items_count} items</td>
            <td>₱${parseFloat(transaction.total_amount).toFixed(2)}</td>
            <td><span class="status completed">Completed</span></td>
        </tr>
    `).join('');
}

// Load low stock items
async function loadLowStockItems() {
    try {
        console.log('Loading low stock items...');
        const response = await fetch('../api/api.php?action=products', {
            cache: 'no-cache'
        });
        const data = await response.json();

        console.log('Products data received:', data);

        const lowStockContainer = document.getElementById('low-stock-items');
        // Consider items with 5 or less as low stock (exclude 0)
        const lowStockItems = data.filter(item => item.stock_quantity <= 10 && item.stock_quantity > 0);

        console.log('Low stock items filtered:', lowStockItems);

        if (lowStockItems.length === 0) {
            lowStockContainer.innerHTML = '<p>No low stock items</p>';
            return;
        }

        lowStockContainer.innerHTML = lowStockItems.map(item => `
            <div class="low-stock-item">
                <div class="item-info">
                    <strong>${item.name}</strong>
                    <span class="stock-quantity">${item.stock_quantity} remaining</span>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading low stock items:', error);
        document.getElementById('low-stock-items').innerHTML = 
            '<p>Error loading low stock items</p>';
    }
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

// Open transactions modal
function openTransactionsModal() {
    document.getElementById('transactions-modal').style.display = 'flex';
    loadAllTransactions();
}

// Close transactions modal
function closeTransactionsModal() {
    document.getElementById('transactions-modal').style.display = 'none';
}

// Load all transactions with filters
async function loadAllTransactions() {
    try {
        const date = document.getElementById('transaction-date').value;
        const search = document.getElementById('transaction-search').value;
        const sort = document.getElementById('transaction-sort').value;
        
        let url = `../api/api.php?action=sales_history&sort=${sort}`;
        if (date) url += `&date=${date}`;
        if (search) url += `&search=${search}`;
        
        const response = await fetch(url);
        const data = await response.json();

        const tbody = document.getElementById('all-transactions-body');

        if (!Array.isArray(data)) {
            console.error('Invalid data received:', data);
            tbody.innerHTML = '<tr><td colspan="7" class="no-data">Error: ' + (data.error || 'Invalid response') + '</td></tr>';
            return;
        }

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="no-data">No transactions found</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(transaction => `
            <tr>
                <td>${transaction.transaction_id}</td>
                <td>${new Date(transaction.created_at).toLocaleString()}</td>
                <td>${transaction.items_summary || 'N/A'}</td>
                <td>${transaction.items_count} items</td>
                <td>₱${parseFloat(transaction.total_amount).toFixed(2)}</td>
                <td>${formatPaymentMethod(transaction.payment_method)}</td>
                <td>
                    <button class="action-btn" onclick="viewTransactionDetails(${transaction.id})">
                        <i class="fas fa-eye"></i> View
                    </button>
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Error loading transactions:', error);
        document.getElementById('all-transactions-body').innerHTML = 
            '<tr><td colspan="7" class="no-data">Error loading transactions</td></tr>';
    }
}

// Clear filters
function clearFilters() {
    document.getElementById('transaction-date').value = '';
    document.getElementById('transaction-search').value = '';
    document.getElementById('transaction-sort').value = 'desc';
    loadAllTransactions();
}

// View transaction details
async function viewTransactionDetails(transactionId) {
    try {
        // Get all transactions and find the specific one
        const response = await fetch('../api/api.php?action=sales_history&sort=desc');
        const transactions = await response.json();
        const transaction = transactions.find(t => t.id === transactionId);
        
        if (!transaction) {
            alert('Transaction not found');
            return;
        }

        const detailsHTML = `
            <div class="transaction-details">
                <div class="detail-header">
                    <h3>Transaction ${transaction.transaction_id}</h3>
                    <p><strong>Date:</strong> ${new Date(transaction.created_at).toLocaleString()}</p>
                    <p><strong>Customer:</strong> ${transaction.customer_name}</p>
                    <p><strong>Payment Method:</strong> ${formatPaymentMethod(transaction.payment_method)}</p>
                </div>
                
                <div class="detail-items">
                    <h4>Items Purchased</h4>
                    <table class="items-table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Quantity</th>
                                <th>Unit Price</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${transaction.items.map(item => `
                                <tr>
                                    <td>${item.product_name || item.name}</td>
                                    <td>${item.quantity}</td>
                                    <td>₱${parseFloat(item.unit_price).toFixed(2)}</td>
                                    <td>₱${parseFloat(item.total_price).toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                
                <div class="detail-summary">
                    <div class="summary-row">
                        <strong>Total Amount:</strong>
                        <span class="total-amount">₱${parseFloat(transaction.total_amount).toFixed(2)}</span>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('transaction-details-content').innerHTML = detailsHTML;
        document.getElementById('transaction-details-modal').style.display = 'flex';

    } catch (error) {
        console.error('Error loading transaction details:', error);
        alert('Error loading transaction details');
    }
}

// Format payment method for display
function formatPaymentMethod(method) {
    const raw = (method || 'cash').toLowerCase().trim();
    // POS stores 'card' for GCash and 'transfer' for Bank Transfer
    if (raw === 'card') return 'GCASH';
    if (raw === 'transfer') return 'BANK TRANSFER';
    if (raw === 'cash') return 'CASH';
    if (raw === 'gcash') return 'GCASH';
    if (raw === 'bank_transfer' || raw === 'bank transfer') return 'BANK TRANSFER';
    return raw.toUpperCase();
}

// Close transaction details modal
function closeTransactionDetailsModal() {
    document.getElementById('transaction-details-modal').style.display = 'none';
}

// Navigate to inventory page with specific product
function navigateToInventory(productId) {
    // Store the product ID to highlight it on the inventory page
    localStorage.setItem('highlightProductId', productId);
    window.location.href = 'inventory.html';
}

function navigateToInventoryPage() {
    window.location.href = 'inventory.html';
}

// Logout function
function logout() {
    // Clear user session
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    sessionStorage.clear();
    
    // Show styled confirmation message
    showMessage('You have been logged out successfully.', 'success');
    
    // Redirect to login page after a short delay
    setTimeout(() => {
        window.location.href = '../html/index.html';
    }, 1500);
}

// Show message function (similar to other pages)
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
        font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        ${type === 'success' ? 'background-color: #2563eb;' : 'background-color: #ef4444;'}
        animation: slideIn 0.3s ease-out;
    `;

    document.body.appendChild(messageDiv);

    // Remove message after 3 seconds
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