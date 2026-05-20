// POS JavaScript - Full implementation with product display from products.html API
let products = [];
let cartItems = [];
let filteredProducts = [];

// DOM ready
document.addEventListener('DOMContentLoaded', function() {
    if (!localStorage.getItem('userEmail')) {
        window.location.href = '../html/index.html';
        return;
    }

    initializePOS();
    loadProducts();
    updateDateTime();
    setInterval(updateDateTime, 1000);
});

// Initialize POS
function initializePOS() {
    // Populate user email from localStorage
    const userEmail = localStorage.getItem('userEmail');
    if (userEmail) {
        const userEmailElement = document.getElementById('user-email');
        if (userEmailElement) {
            userEmailElement.textContent = userEmail;
        }
    }

    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            navigateTo(page);
        });
    });

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);

    // Search functionality
    const searchInput = document.getElementById('product-search');
    if (searchInput) {
        searchInput.addEventListener('input', filterPOSProducts);
    }

    // Checkout button
    const checkoutBtn = document.getElementById('checkout-btn');
    updateCheckoutButton();
}

// Navigation
function navigateTo(page) {
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.querySelector(`[data-page="${page}"]`).classList.add('active');

    const pages = {
        'dashboard': 'dashboard.html',
        'pos': 'pos.html',
        'products': 'products.html',
        'inventory': 'inventory.html',
        'sales': 'sales.html',
        'reports': 'reports.html'
    };
    if (pages[page]) window.location.href = pages[page];
}

// Logout
function logout() {
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    sessionStorage.clear();
    showMessage('Logged out successfully', 'success');
    setTimeout(() => window.location.href = '../html/index.html', 1500);
}

// Load products (same API as products.html)
async function loadProducts() {
    try {
        const response = await fetch('../api/api.php?action=products');
        products = await response.json();
        filteredProducts = [...products];
        displayPOSProducts(filteredProducts);
    } catch (error) {
        console.error('Error loading products:', error);
        showMessage('Failed to load products', 'error');
        document.getElementById('products-grid').innerHTML = '<div class="no-products"><i class="fas fa-box"></i><p>No products available</p></div>';
    }
}

// Display products as grid cards
function displayPOSProducts(productList) {
    const grid = document.getElementById('products-grid');
    if (!grid) return;

    if (productList.length === 0) {
        grid.innerHTML = '<div class="no-products"><i class="fas fa-box"></i><p>No products found</p></div>';
        return;
    }

    grid.innerHTML = productList.map(product => {
        const stockClass = product.stock_quantity <= 0 ? 'out-of-stock' : product.stock_quantity <= 10 ? 'low-stock' : 'in-stock';
        return `
            <div class="product-card" data-product-id="${product.id}">
                <div class="product-name">${product.name}</div>
                <div class="product-price">₱${parseFloat(product.price).toFixed(2)}</div>
                <div class="product-stock ${stockClass}">${product.stock_quantity || 0} in stock</div>
                <button class="add-to-cart-btn" onclick="addToCart(${product.id})">
                    <i class="fas fa-plus"></i> Add
                </button>
            </div>
        `;
    }).join('');
}

// Filter products
function filterPOSProducts() {
    const searchTerm = document.getElementById('product-search').value.toLowerCase();
    filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm)
    );
    displayPOSProducts(filteredProducts);
}

// Add to cart
function addToCart(productId) {
    const product = products.find(p => p.id == productId);
    if (!product || product.stock_quantity <= 0) {
        showMessage('Product out of stock', 'error');
        return;
    }

    const existingItem = cartItems.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cartItems.push({...product, quantity: 1});
    }

    // Visual feedback
    const card = document.querySelector(`[data-product-id="${productId}"]`);
    if (card) {
        card.classList.remove('selected');
        card.classList.add('added');
        setTimeout(() => card.classList.remove('added'), 600);
    }

    updateCartDisplay();
    updateCartTotal();
    showMessage(`${product.name} added to cart`, 'success');
}

// Update cart display
function updateCartDisplay() {
    const cartContainer = document.getElementById('cart-items');
    if (!cartContainer) return;

    if (cartItems.length === 0) {
        cartContainer.innerHTML = '<div class="empty-cart"><i class="fas fa-shopping-cart"></i><p>No items in cart</p></div>';
        return;
    }

    cartContainer.innerHTML = cartItems.map((item, index) => `
        <div class="cart-item">
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">₱${parseFloat(item.price).toFixed(2)}</div>
            </div>
            <div class="cart-item-controls">
                <button class="quantity-btn" onclick="updateQuantity(${index}, -1)">-</button>
                <span class="quantity-display">${item.quantity}</span>
                <button class="quantity-btn" onclick="updateQuantity(${index}, 1)">+</button>
                <button class="remove-item" onclick="removeFromCart(${index})">×</button>
            </div>
        </div>
    `).join('');
}

// Update cart total
function updateCartTotal() {
    const total = cartItems.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
    document.getElementById('cart-total').textContent = `₱${total.toFixed(2)}`;
    updateCheckoutButton();
}

// Update quantity
function updateQuantity(index, change) {
    cartItems[index].quantity += change;
    if (cartItems[index].quantity <= 0) {
        cartItems.splice(index, 1);
    }
    updateCartDisplay();
    updateCartTotal();
}

// Remove from cart
function removeFromCart(index) {
    cartItems.splice(index, 1);
    updateCartDisplay();
    updateCartTotal();
}

// Clear cart
function clearCart() {
    cartItems = [];
    updateCartDisplay();
    updateCartTotal();
    showMessage('🛒 Cart cleared successfully', 'success');
}

// Update checkout button state
function updateCheckoutButton() {
    const checkoutBtn = document.getElementById('checkout-btn');
    const hasItems = cartItems.length > 0;
    if (checkoutBtn) {
        checkoutBtn.disabled = !hasItems;
    }
}

// Process sale
async function processSale() {
    if (cartItems.length === 0) return;

    const paymentMethod = document.getElementById('payment-method').value;
    const total = cartItems.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
    
    try {
        const response = await fetch('../api/api.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'process_sale',
                cart: cartItems,
                payment_method: paymentMethod,
                total: total
            })
        });

        const result = await response.json();
        
        // Extract sale data from the API response structure
        const saleResult = result.sale || result;
        
        // Create sale data with proper structure
        const saleData = {
            transaction_id: saleResult.transaction_id || 'TXN-' + Date.now(),
            total: saleResult.total_amount || total,
            payment_method: saleResult.payment_method || paymentMethod,
            items: cartItems.map(item => ({
                name: item.name,
                quantity: item.quantity,
                price: parseFloat(item.price),
                total_price: parseFloat(item.price) * item.quantity
            }))
        };
        
        showReceipt(saleData);
        cartItems = [];
        updateCartDisplay();
        updateCartTotal();
        showMessage(`✅ Sale completed! Transaction: ${saleData.transaction_id}`, 'success');
        
        // Notify dashboard and reports of sale update with timestamp and payment method
        const saleUpdateInfo = JSON.stringify({
            timestamp: Date.now().toString(),
            payment_method: paymentMethod
        });
        localStorage.setItem('salesDataUpdated', saleUpdateInfo);
        localStorage.setItem('reportsDataUpdated', saleUpdateInfo);
        
        // Also trigger a direct refresh if dashboard is open in same tab
        if (window.opener && window.opener.loadDashboardData) {
            window.opener.loadDashboardData();
        }
        
    } catch (error) {
        console.error('Sale error:', error);
        // Check if it's a network error but DB might have succeeded
        const isNetworkError = error.name === 'TypeError' || error.message.includes('fetch');
        
        if (isNetworkError) {
            // For network errors, assume sale might have gone through and try to refresh dashboard
            localStorage.setItem('salesDataUpdated', Date.now().toString());
            showMessage('⚠️ Network error - sale may have completed. Check dashboard.', 'warning');
        } else {
            showMessage('❌ Sale processing failed', 'error');
        }
        
        // Still show receipt on client-side error (DB likely succeeded)
        const saleData = {
            transaction_id: 'TXN-' + Date.now(),
            total: total,
            payment_method: paymentMethod,
            items: cartItems.map(item => ({
                name: item.name,
                quantity: item.quantity,
                price: parseFloat(item.price),
                total_price: parseFloat(item.price) * item.quantity
            }))
        };
        showReceipt(saleData);
        cartItems = [];
        updateCartDisplay();
        updateCartTotal();
    }
}

// Show receipt modal
function showReceipt(sale) {
    const receiptContent = document.getElementById('receipt-content');
    const receiptModal = document.getElementById('receipt-modal');
    
    if (!receiptContent || !receiptModal) {
        console.error('Modal elements not found!');
        return;
    }
    
    const now = new Date();
    const transactionId = sale.transaction_id || 'TXN-' + Date.now();
    const subtotal = sale.total;
    const tax = 0; // No tax for now, can be calculated later
    const total = sale.total;
    
    receiptContent.innerHTML = `
        <div class="thermal-receipt">
            <!-- Header -->
            <div class="receipt-header">
                <div class="store-name">ALEJA BLOWER</div>
                <div class="receipt-label">OFFICIAL RECEIPT</div>
                <div class="divider">═══════════════════════════════</div>
            </div>
            
            <!-- Transaction Details -->
            <div class="transaction-details">
                <div class="detail-row">
                    <span>Transaction ID:</span>
                    <span>${transactionId}</span>
                </div>
                <div class="detail-row">
                    <span>Date:</span>
                    <span>${now.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                </div>
                <div class="detail-row">
                    <span>Time:</span>
                    <span>${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                </div>
                <div class="divider">═══════════════════════════════</div>
            </div>
            
            <!-- Items Table -->
            <div class="items-table">
                <div class="table-header">
                    <span class="col-item">Item</span>
                    <span class="col-qty">Qty</span>
                    <span class="col-price">Price</span>
                    <span class="col-subtotal">Subtotal</span>
                </div>
                <div class="divider">───────────────────────────────</div>
                ${sale.items.map(item => `
                    <div class="item-row">
                        <span class="col-item">${item.name}</span>
                        <span class="col-qty">${item.quantity}</span>
                        <span class="col-price">₱${parseFloat(item.price).toFixed(2)}</span>
                        <span class="col-subtotal">₱${(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
                    </div>
                `).join('')}
                <div class="divider">═══════════════════════════════</div>
            </div>
            
            <!-- Summary -->
            <div class="summary-section">
                <div class="summary-row">
                    <span>Subtotal:</span>
                    <span>₱${subtotal.toFixed(2)}</span>
                </div>
                <div class="summary-row">
                    <span>Tax:</span>
                    <span>₱${tax.toFixed(2)}</span>
                </div>
                <div class="divider">───────────────────────────────</div>
                <div class="total-row">
                    <span class="total-label">TOTAL:</span>
                    <span class="total-amount">₱${total.toFixed(2)}</span>
                </div>
                <div class="divider">═══════════════════════════════</div>
            </div>
            
            <!-- Payment Details -->
            <div class="payment-details">
                <div class="payment-row">
                    <span>Payment Method:</span>
                    <span>${formatPaymentMethodDisplay(sale.payment_method)}</span>
                </div>
                <div class="payment-row">
                    <span>Amount Paid:</span>
                    <span>₱${total.toFixed(2)}</span>
                </div>
                ${sale.payment_method === 'cash' ? `
                <div class="payment-row">
                    <span>Change:</span>
                    <span>₱0.00</span>
                </div>
                ` : ''}
                <div class="divider">═══════════════════════════════</div>
            </div>
            
            <!-- Footer -->
            <div class="receipt-footer">
                <div class="thank-you">Thank you for your purchase!</div>
                <div class="warranty-note">Please keep this receipt for warranty purposes.</div>
                <div class="divider">═══════════════════════════════</div>
                <div class="store-info">
                    <div>Aleja Blower</div>
                    <div>Quality Blowers & Equipment</div>
                </div>
            </div>
        </div>
    `;
    
    receiptModal.style.display = 'block';
}

// Close receipt
// Format payment method for display on receipt
// POS stores 'card' for GCash and 'transfer' for Bank Transfer
function formatPaymentMethodDisplay(method) {
    const raw = (method || 'cash').toLowerCase().trim();
    if (raw === 'card') return 'GCASH';
    if (raw === 'transfer') return 'BANK TRANSFER';
    if (raw === 'cash') return 'CASH';
    if (raw === 'gcash') return 'GCASH';
    if (raw === 'bank_transfer') return 'BANK TRANSFER';
    return raw.toUpperCase();
}

function closeReceiptModal() {
    document.getElementById('receipt-modal').style.display = 'none';
}

// Print receipt
function printReceipt() {
    // Get the receipt content
    const receiptContent = document.querySelector('.thermal-receipt');
    if (!receiptContent) {
        console.error('Receipt content not found');
        return;
    }
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        // If popup is blocked, fallback to window.print()
        window.print();
        return;
    }
    
    // Write the receipt HTML to the new window
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Aleja Blower - Receipt</title>
            <style>
                body {
                    font-family: 'Courier New', 'Lucida Console', monospace;
                    font-size: 12px;
                    line-height: 1.4;
                    color: #000;
                    background: white;
                    margin: 0;
                    padding: 15px;
                    width: 100%;
                }
                
                .thermal-receipt {
                    width: 100%;
                    max-width: none;
                    background: white;
                    border: none;
                    box-shadow: none;
                    padding: 0;
                    margin: 0;
                }
                
                .receipt-header {
                    text-align: center;
                    margin-bottom: 15px;
                }
                
                .store-name {
                    font-size: 18px;
                    font-weight: bold;
                    letter-spacing: 2px;
                    margin-bottom: 5px;
                }
                
                .receipt-label {
                    font-size: 10px;
                    font-weight: bold;
                    margin-bottom: 10px;
                    opacity: 0.8;
                }
                
                .divider {
                    font-size: 10px;
                    letter-spacing: 2px;
                    margin: 8px 0;
                    opacity: 0.6;
                }
                
                .transaction-details {
                    margin-bottom: 15px;
                }
                
                .detail-row {
                    display: flex;
                    justify-content: space-between;
                    margin: 3px 0;
                    font-size: 11px;
                }
                
                .items-table {
                    margin-bottom: 15px;
                }
                
                .table-header {
                    display: flex;
                    justify-content: space-between;
                    font-weight: bold;
                    font-size: 11px;
                    margin-bottom: 5px;
                }
                
                .item-row {
                    display: flex;
                    justify-content: space-between;
                    margin: 3px 0;
                    font-size: 11px;
                }
                
                .col-item {
                    flex: 2;
                    text-align: left;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                
                .col-qty {
                    flex: 0.5;
                    text-align: center;
                }
                
                .col-price {
                    flex: 1;
                    text-align: right;
                }
                
                .col-subtotal {
                    flex: 1;
                    text-align: right;
                    font-weight: bold;
                }
                
                .summary-section {
                    margin-bottom: 15px;
                }
                
                .summary-row {
                    display: flex;
                    justify-content: space-between;
                    margin: 3px 0;
                    font-size: 11px;
                }
                
                .total-row {
                    display: flex;
                    justify-content: space-between;
                    margin: 5px 0;
                    font-size: 14px;
                    font-weight: bold;
                }
                
                .total-label {
                    font-weight: bold;
                }
                
                .total-amount {
                    font-weight: bold;
                    font-size: 16px;
                }
                
                .payment-details {
                    margin-bottom: 15px;
                }
                
                .payment-row {
                    display: flex;
                    justify-content: space-between;
                    margin: 3px 0;
                    font-size: 11px;
                }
                
                .receipt-footer {
                    text-align: center;
                    margin-top: 15px;
                }
                
                .thank-you {
                    font-size: 12px;
                    font-weight: bold;
                    margin-bottom: 5px;
                }
                
                .warranty-note {
                    font-size: 9px;
                    opacity: 0.7;
                    margin-bottom: 10px;
                    line-height: 1.3;
                }
                
                .store-info {
                    font-size: 9px;
                    opacity: 0.6;
                }
                
                @page {
                    margin: 0.5in;
                    size: auto;
                }
                
                @media print {
                    body {
                        margin: 0;
                        padding: 15px;
                    }
                }
            </style>
        </head>
        <body>
            ${receiptContent.innerHTML}
        </body>
        </html>
    `);
    
    printWindow.document.close();
    
    // Wait for the content to load, then print
    printWindow.onload = function() {
        printWindow.print();
        printWindow.close();
    };
}

// Update date/time
function updateDateTime() {
    const now = new Date();
    const dateEl = document.getElementById('current-date');
    const timeEl = document.getElementById('current-time');
    if (dateEl) dateEl.textContent = now.toLocaleDateString('en-US', {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'});
    if (timeEl) timeEl.textContent = now.toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'});
}

// Message helper (same as products.js)
function showMessage(message, type = 'success') {
    const existing = document.querySelectorAll('.message-toast');
    existing.forEach(el => el.remove());
    
    const toast = document.createElement('div');
    toast.className = `message-toast ${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed; top: 20px; right: 20px; padding: 15px 20px;
        border-radius: 8px; color: white; font-weight: 600; z-index: 10000;
        max-width: 350px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        font-family: 'Segoe UI', sans-serif;
        ${type === 'success' ? 'background: linear-gradient(135deg, #10b981, #059669);' : 'background: linear-gradient(135deg, #ef4444, #dc2626);'}
    `;
    document.body.appendChild(toast);
    
    // Animate entrance
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'transform 0.3s ease';
    setTimeout(() => toast.style.transform = 'translateX(0)', 10);
    
    setTimeout(() => {
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Close modals on outside click
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
};
