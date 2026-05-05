// Sales Records JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Auth check - ensure user is logged in
    if (!localStorage.getItem('userEmail')) {
        console.log('No user session found, redirecting to login');
        window.location.href = 'login_page.html';
        return;
    }
    console.log('User authenticated:', localStorage.getItem('userEmail'));

    initializeSales();
    loadSalesData();
    updateDateTime();
    setInterval(updateDateTime, 1000);
});

// Global variables
let currentSales = [];
let currentFilters = {
    search: '',
    date: '',
    sort: 'desc'
};

// Initialize sales page
function initializeSales() {
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
            currentFilters.search = this.value.trim();
            loadSalesData();
        });
    }

    // Date filter
    const dateFilter = document.getElementById('date-filter');
    if (dateFilter) {
        dateFilter.addEventListener('change', function() {
            currentFilters.date = this.value;
            loadSalesData();
        });
    }

    // Clear date filter
    const clearDateBtn = document.getElementById('clear-date');
    if (clearDateBtn) {
        clearDateBtn.addEventListener('click', function() {
            document.getElementById('date-filter').value = '';
            currentFilters.date = '';
            loadSalesData();
        });
    }

    // Sort functionality
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            currentFilters.sort = this.value;
            loadSalesData();
        });
    }

    // Modal close functionality
    const modal = document.getElementById('transaction-modal');
    const closeModal = document.querySelector('.close-modal');
    if (closeModal) {
        closeModal.addEventListener('click', function() {
            modal.style.display = 'none';
        });
    }

    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
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
        window.location.href = 'inventory.html';
    } else if (page === 'sales') {
        // Already on sales page
        return;
    } else if (page === 'reports') {
        window.location.href = 'reports.html';
    }
}

// Logout function
function logout() {
    localStorage.removeItem('userEmail');
    window.location.href = 'login_page.html';
}

// Update date and time
function updateDateTime() {
    const now = new Date();
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    };
    document.getElementById('date-time').textContent = now.toLocaleDateString('en-US', options);
}

// Load sales data from API
async function loadSalesData() {
    try {
        showLoadingState();

        // Get both stats and sales data
        const [statsResponse, salesResponse] = await Promise.all([
            fetch('../api/api.php?action=stats'),
            fetch(`../api/api.php?${new URLSearchParams({
                action: 'sales_history',
                search: currentFilters.search,
                date: currentFilters.date,
                sort: currentFilters.sort
            })}`)
        ]);

        const stats = await statsResponse.json();
        const data = await salesResponse.json();

        if (data.error) {
            throw new Error(data.error);
        }

        currentSales = data;
        displaySales(data);
        updateSalesSummary(data, stats);

    } catch (error) {
        console.error('Error loading sales data:', error);
        showErrorState('Error loading sales data: ' + error.message);
    }
}

// Show loading state
function showLoadingState() {
    document.getElementById('loading-state').style.display = 'block';
    document.getElementById('empty-state').style.display = 'none';
    document.getElementById('sales-table').style.display = 'none';
}

// Show error state
function showErrorState(message) {
    document.getElementById('loading-state').style.display = 'none';
    document.getElementById('empty-state').style.display = 'block';
    document.getElementById('empty-state').innerHTML = `
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Error</h3>
        <p>${message}</p>
    `;
    document.getElementById('sales-table').style.display = 'none';
}

// Display sales in table
function displaySales(sales) {
    const tbody = document.getElementById('sales-tbody');
    const table = document.getElementById('sales-table');
    const loadingState = document.getElementById('loading-state');
    const emptyState = document.getElementById('empty-state');

    loadingState.style.display = 'none';

    if (sales.length === 0) {
        table.style.display = 'none';
        emptyState.style.display = 'block';
        emptyState.innerHTML = `
            <i class="fas fa-receipt"></i>
            <h3>No Sales Records Found</h3>
            <p>No sales transactions match your current filters.</p>
        `;
        return;
    }

    table.style.display = 'table';
    emptyState.style.display = 'none';

    tbody.innerHTML = sales.map(sale => {
        const paymentMethodClass = getPaymentMethodClass(sale.payment_method);
        const formattedDate = formatDateTime(sale.created_at);
        const itemsCount = sale.items_count || sale.items?.length || 0;

        return `
            <tr>
                <td>${sale.transaction_id}</td>
                <td>${formattedDate}</td>
                <td>${itemsCount} item${itemsCount !== 1 ? 's' : ''}</td>
                <td><span class="payment-method ${paymentMethodClass}">${formatPaymentMethod(sale.payment_method)}</span></td>
                <td>₱${parseFloat(sale.total_amount).toFixed(2)}</td>
                <td>
                    <button class="action-btn" onclick="viewTransactionDetails(${sale.id})" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Get payment method class for styling
// POS stores 'card' for GCash and 'transfer' for Bank Transfer
function getPaymentMethodClass(method) {
    const methodLower = method.toLowerCase().trim();
    if (methodLower === 'cash') return 'cash';
    if (methodLower === 'card' || methodLower === 'gcash') return 'gcash';
    if (methodLower === 'transfer' || methodLower === 'bank_transfer' || methodLower.includes('bank')) return 'transfer';
    return 'cash'; // default
}

// Format payment method for display
// POS stores 'card' for GCash and 'transfer' for Bank Transfer
function formatPaymentMethod(method) {
    const methodLower = (method || 'cash').toLowerCase().trim();
    if (methodLower === 'cash') return 'Cash';
    if (methodLower === 'card' || methodLower === 'gcash') return 'GCash';
    if (methodLower === 'transfer' || methodLower === 'bank_transfer' || methodLower.includes('bank')) return 'Bank Transfer';
    return method;
}

// Format date and time
function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Update sales summary statistics
function updateSalesSummary(sales, stats = {}) {
    // Use total_transactions from stats API if available, otherwise fall back to filtered count
    const totalTransactions = stats.total_transactions || sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + parseFloat(sale.total_amount), 0);
    const today = new Date().toISOString().split('T')[0];
    const todaySales = sales
        .filter(sale => sale.created_at.startsWith(today))
        .reduce((sum, sale) => sum + parseFloat(sale.total_amount), 0);
    const avgTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    document.getElementById('total-transactions').textContent = totalTransactions;
    document.getElementById('total-revenue').textContent = '₱' + totalRevenue.toFixed(2);
    document.getElementById('today-sales').textContent = '₱' + todaySales.toFixed(2);
    document.getElementById('avg-transaction').textContent = '₱' + avgTransaction.toFixed(2);
}

// View transaction details in modal
async function viewTransactionDetails(saleId) {
    try {
        const sale = currentSales.find(s => s.id === saleId);
        if (!sale) {
            alert('Transaction not found');
            return;
        }

        const modal = document.getElementById('transaction-modal');
        const modalBody = document.getElementById('transaction-details');

        modalBody.innerHTML = `
            <div class="transaction-info">
                <h3>Transaction #${sale.transaction_id}</h3>
                <div class="transaction-meta">
                    <div class="meta-item">
                        <div class="meta-label">Date & Time</div>
                        <div class="meta-value">${formatDateTime(sale.created_at)}</div>
                    </div>
                    <div class="meta-item">
                        <div class="meta-label">Payment Method</div>
                        <div class="meta-value">${formatPaymentMethod(sale.payment_method)}</div>
                    </div>
                    <div class="meta-item">
                        <div class="meta-label">Items Count</div>
                        <div class="meta-value">${sale.items?.length || 0}</div>
                    </div>
                    <div class="meta-item">
                        <div class="meta-label">Total Amount</div>
                        <div class="meta-value">₱${parseFloat(sale.total_amount).toFixed(2)}</div>
                    </div>
                </div>

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
                        ${sale.items?.map(item => `
                            <tr>
                                <td>${item.product_name || 'Unknown Product'}</td>
                                <td>${item.quantity}</td>
                                <td>₱${parseFloat(item.unit_price).toFixed(2)}</td>
                                <td>₱${parseFloat(item.total_price).toFixed(2)}</td>
                            </tr>
                        `).join('') || '<tr><td colspan="4">No items found</td></tr>'}
                        <tr class="total-row">
                            <td colspan="3"><strong>Total</strong></td>
                            <td><strong>₱${parseFloat(sale.total_amount).toFixed(2)}</strong></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;

        modal.style.display = 'block';

    } catch (error) {
        console.error('Error loading transaction details:', error);
        alert('Error loading transaction details: ' + error.message);
    }
}