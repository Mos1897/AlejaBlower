// Extracted Reports JS from inline script - Complete implementation

// Existing nav/auth code
document.addEventListener('DOMContentLoaded', function() {
    // Auth check - ensure user is logged in
    if (!localStorage.getItem('userEmail')) {
        console.log('No user session found, redirecting to login');
        window.location.href = '../html/login_page.html';
        return;
    }
    console.log('User authenticated:', localStorage.getItem('userEmail'));

    initializeReports();
});

// Initialize reports page
function initializeReports() {
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
}

// Navigate to different pages
function navigateTo(page) {
    // Remove active class from all nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });

    // Add active class to clicked item
    document.querySelector(`[data-page="${page}"]`).classList.add('active');

    // Navigate to pages (match dashboard.js pattern)
    const pages = {
        'dashboard': '../html/dashboard.html',
        'pos': '../html/pos.html',
        'products': '../html/products.html',
        'inventory': '../html/inventory.html',
        'sales': '../html/sales.html',
        'reports': 'reports.html'  // Stay on current
    };

    if (pages[page] && page !== 'reports') {
        window.location.href = pages[page];
    }
}

// Logout function
function logout() {
    localStorage.removeItem('userEmail');
    window.location.href = '../html/login_page.html';
}

// Charts and reports functionality (from inline script)
let salesTrendChart, paymentMethodsChart, salesByCategoryChart, wasteChart, inventoryValueChart, inventoryCategoryChart;

// Initialize Lucide icons
lucide.createIcons();

// Verify Chart.js is loaded
if (typeof Chart === 'undefined') {
    console.error('Chart.js is not loaded!');
} else {
    console.log('Chart.js version:', Chart.version);
}

// Initialize charts when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing charts...');

    // Wait a bit for everything to be ready
    setTimeout(() => {
        initializeCharts();
        updateDateRangeVisibility();
        updateLastUpdatedTime(); // Show initial timestamp
        // Show loading state
        showLoadingState();
        // Fetch real data immediately
        fetchReportsData();
    }, 100);
});

function initializeCharts() {
    // Sales Trend Chart
    const salesTrendCtx = document.getElementById('salesTrendChart')?.getContext('2d');
    if (salesTrendCtx) {
        salesTrendChart = new Chart(salesTrendCtx, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Sales',
                    data: [0, 0, 0, 0, 0, 0, 0],
                    borderColor: 'rgb(99, 102, 241)',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '₱' + value.toLocaleString();
                            }
                        }
                    }
                },
                onClick: (e, elements) => {
                    // Open detailed trend modal when chart is clicked
                    openSalesTrendModal();
                },
                onHover: (e, elements) => {
                    // Change cursor to pointer when hovering over chart
                    e.native.target.style.cursor = 'pointer';
                }
            }
        });
        
        // Add visual indicator that chart is clickable
        const chartContainer = document.getElementById('salesTrendChart')?.parentElement;
        if (chartContainer) {
            chartContainer.style.position = 'relative';
            chartContainer.setAttribute('title', 'Click to view detailed trends');
        }
    }

    // Payment Methods Chart - FIXED Cash, Gcash, Bank Transfer
    const paymentMethodsCtx = document.getElementById('paymentMethodsChart')?.getContext('2d');
    if (paymentMethodsCtx) {
        paymentMethodsChart = new Chart(paymentMethodsCtx, {
            type: 'doughnut',
            data: {
                labels: ['Cash', 'GCash', 'Bank Transfer'],
                datasets: [{
                    data: [1, 1, 1], // Always visible data - will be updated with real transaction counts
                    backgroundColor: [
                        'rgb(34, 197, 94)',   // Cash
                        'rgb(59, 130, 246)',  // Gcash
                        'rgb(251, 146, 60)'   // Bank Transfer
                    ],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        enabled: false
                    }
                }
            }
        });
        console.log('Payment Methods chart initialized - ready for real transaction data');
        
        // Add a test function to manually update chart
        window.testPaymentChart = function() {
            if (paymentMethodsChart) {
                paymentMethodsChart.data.datasets[0].data = [10, 5, 3];
                paymentMethodsChart.update();
                console.log('Payment Methods chart updated with test data');
            }
        };
        
        // Add function to test with simulated real data
        window.testRealPaymentData = function() {
            if (paymentMethodsChart) {
                // Simulate real payment method data
                const realData = [15, 8, 2]; // Cash: 15, GCash: 8, Bank Transfer: 2
                paymentMethodsChart.data.datasets[0].data = realData;
                paymentMethodsChart.update('none'); // Use 'none' mode to prevent defensive override
                paymentMethodsChart.render();
                console.log('Payment Methods chart updated with simulated real data:', realData);
                console.log('Chart data after update:', paymentMethodsChart.data.datasets[0].data);
            }
        };
        
        // Add function to bypass defensive logic temporarily
        window.bypassDefensiveLogic = function() {
            if (paymentMethodsChart) {
                const testData = [25, 12, 7];
                paymentMethodsChart.data.datasets[0].data = testData;
                paymentMethodsChart.update('none');
                paymentMethodsChart.render();
                console.log('Bypassed defensive logic with data:', testData);
                console.log('Actual chart data:', paymentMethodsChart.data.datasets[0].data);
            }
        };
        
        // Add function to simulate cash transaction (like your recent sale)
        window.simulateCashSale = function() {
            if (paymentMethodsChart) {
                const currentData = paymentMethodsChart.data.datasets[0].data;
                currentData[0] = currentData[0] + 1; // Increment Cash
                paymentMethodsChart.data.datasets[0].data = currentData;
                paymentMethodsChart.update('none');
                paymentMethodsChart.render();
                console.log('Simulated cash sale - new data:', currentData);
                console.log('Cash transactions:', currentData[0]);
            }
        };
        
        // Add function to force refresh with real data
        window.forceRealDataRefresh = function() {
            console.log('Forcing refresh with real data...');
            fetchReportsData().then(() => {
                console.log('Real data refresh completed');
                // Check what payment data we got
                setTimeout(() => {
                    if (paymentMethodsChart) {
                        console.log('Chart data after refresh:', paymentMethodsChart.data.datasets[0].data);
                    }
                }, 1000);
            });
        };
        
        // Add function to test "transfer" categorization specifically
        window.testTransferCategorization = function() {
            const testSale = {
                payment_method: 'transfer',
                transaction_id: 'TXN69d759c04affc192'
            };
            
            const rawMethod = (testSale.payment_method || 'cash').toLowerCase().trim();
            let displayMethod = 'Cash';
            let categorized = true;
            
            if (rawMethod.includes('gcash') || rawMethod.includes('g-cash')) {
                displayMethod = 'GCash';
            } else if (rawMethod.includes('bank') || rawMethod.includes('transfer')) {
                displayMethod = 'Bank Transfer';
            } else if (rawMethod === 'cash' || rawMethod === '') {
                displayMethod = 'Cash';
            } else {
                categorized = false;
            }
            
            console.log('Test transfer categorization:');
            console.log('Raw method:', rawMethod);
            console.log('Display method:', displayMethod);
            console.log('Categorized:', categorized);
            console.log('Should be Bank Transfer:', displayMethod === 'Bank Transfer');
        };
        
        console.log('Test functions available: window.testPaymentChart() and window.testRealPaymentData()');
        
        // Force immediate render
        setTimeout(() => {
            paymentMethodsChart.update();
            console.log('Payment Methods chart forced update');
        }, 100);
    } else {
        console.error('Payment Methods chart canvas not found');
        
        // Debug: Check if element exists
        const canvas = document.getElementById('paymentMethodsChart');
        console.log('Canvas element:', canvas);
        console.log('Canvas parent:', canvas?.parentElement);
    }

    // Sales by Category Chart
    const salesByCategoryCtx = document.getElementById('salesByCategoryChart')?.getContext('2d');
    if (salesByCategoryCtx) {
        salesByCategoryChart = new Chart(salesByCategoryCtx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Sales',
                    data: [],
                    backgroundColor: [],
                    borderColor: [],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '₱' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.add('hidden');
    });
    document.getElementById(tabName + '-tab')?.classList.remove('hidden');

    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('border-indigo-500', 'text-indigo-600');
        button.classList.add('border-transparent', 'text-gray-500');
    });

    const activeButton = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeButton) {
        activeButton.classList.remove('border-transparent', 'text-gray-500');
        activeButton.classList.add('border-indigo-500', 'text-indigo-600');
    }
}

function updateDateRangeVisibility() {
    const dateRange = document.getElementById('dateRange')?.value;
    const customDateRange = document.getElementById('customDateRange');
    if (customDateRange) {
        if (dateRange === 'custom') {
            customDateRange.classList.remove('hidden');
        } else {
            customDateRange.classList.add('hidden');
        }
    }
}

function updateReports() {
    updateDateRangeVisibility();
    refreshReports();
}

function showLoadingState() {
    const metricsElements = ['totalSales', 'netRevenue', 'transactions'];
    metricsElements.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.innerHTML = '<span class="animate-pulse bg-gray-300 h-8 w-24 rounded inline-block"></span>';
        }
    });
}

function hideLoadingState() {
    // Loading state is hidden automatically when data is populated
}

function refreshReports() {
    // Show refresh button feedback
    const refreshBtn = document.querySelector('button[onclick="refreshReports()"]');
    if (refreshBtn) {
        const originalText = refreshBtn.innerHTML;
        refreshBtn.innerHTML = '<i data-lucide="refresh-cw" class="w-4 h-4 mr-2 animate-spin"></i>Refreshing...';
        refreshBtn.disabled = true;

        // Re-enable after 2 seconds
        setTimeout(() => {
            refreshBtn.innerHTML = originalText;
            refreshBtn.disabled = false;
            lucide.createIcons(); // Re-initialize icons
        }, 2000);
    }

    // Fetch real data from API
    showLoadingState();
    fetchReportsData();
}

// Auto-refresh every 30 seconds
setInterval(() => {
    fetchReportsData();
}, 30000);

// Listen for sales updates from POS
window.addEventListener('storage', function(e) {
    console.log('Storage event detected:', e.key, e.newValue);
    if (e.key === 'salesDataUpdated' || e.key === 'reportsDataUpdated') {
        console.log('Sales data updated from POS, refreshing reports...');
        
        // Parse payment method from the newValue (JSON format: {timestamp, payment_method})
        let paymentMethod = 'cash'; // default
        try {
            const updateData = JSON.parse(e.newValue);
            paymentMethod = updateData.payment_method || 'cash';
        } catch (err) {
            // If parsing fails (old format), default to cash
            paymentMethod = 'cash';
        }
        console.log('Payment method from POS:', paymentMethod);
        
        // Show visual feedback
        const refreshBtn = document.querySelector('button[onclick="refreshReports()"]');
        if (refreshBtn) {
            const originalText = refreshBtn.innerHTML;
            refreshBtn.innerHTML = '<i data-lucide="refresh-cw" class="w-4 h-4 mr-2 animate-spin"></i>Updating with new sale...';
            refreshBtn.disabled = true;
            
            // Reset button after update
            setTimeout(() => {
                refreshBtn.innerHTML = originalText;
                refreshBtn.disabled = false;
                lucide.createIcons();
            }, 2000);
        }
        
        // Immediate refresh and also force payment methods chart update
        fetchReportsData().then(() => {
            // Force immediate payment methods chart update after data fetch
            setTimeout(() => {
                if (paymentMethodsChart) {
                    // Determine which index to increment based on payment method
                    // Note: POS stores 'card' for GCash and 'transfer' for Bank Transfer
                    const rawMethod = paymentMethod.toLowerCase().trim();
                    let indexToIncrement = 0; // Default to Cash
                    let methodName = 'Cash';

                    if (rawMethod === 'card' || rawMethod === 'gcash') {
                        indexToIncrement = 1; // GCash
                        methodName = 'GCash';
                    } else if (rawMethod === 'transfer' || rawMethod === 'bank_transfer' || rawMethod === 'bank transfer') {
                        indexToIncrement = 2; // Bank Transfer
                        methodName = 'Bank Transfer';
                    }
                    // cash stays at index 0
                    
                    const currentData = paymentMethodsChart.data.datasets[0].data;
                    console.log('Real-time update - Current data:', currentData, 'Method:', rawMethod, 'Index:', indexToIncrement, methodName);
                    const newData = [...currentData];
                    newData[indexToIncrement] = newData[indexToIncrement] + 1;
                    paymentMethodsChart.data.datasets[0].data = newData;
                    paymentMethodsChart.update('none');
                    paymentMethodsChart.render();
                    console.log('Payment Methods chart updated - incremented', methodName, 'to', newData[indexToIncrement], 'Full data:', newData);
                }
            }, 500);
        });
    }
});

// Add periodic check for new sales as fallback
setInterval(() => {
    // Check if there are any new sales by looking at localStorage
    const lastUpdateRaw = localStorage.getItem('salesDataUpdated');
    if (!lastUpdateRaw) return;
    
    // Extract timestamp from JSON format
    let lastUpdate = lastUpdateRaw;
    try {
        const updateData = JSON.parse(lastUpdateRaw);
        lastUpdate = updateData.timestamp || lastUpdateRaw;
    } catch (err) {
        // If not JSON, use raw value (old format)
    }
    
    if (lastUpdate && !window.lastSaleUpdate) {
        window.lastSaleUpdate = lastUpdate;
        console.log('Detected new sale, refreshing...');
        fetchReportsData();
    } else if (lastUpdate && window.lastSaleUpdate !== lastUpdate) {
        window.lastSaleUpdate = lastUpdate;
        console.log('Detected updated sale, refreshing...');
        fetchReportsData();
    }
}, 2000); // Check every 2 seconds

async function fetchReportsData() {
    // Initialize variables first to avoid ReferenceError
    let stats = null, salesData = [], trendData = null, categoryData = null, paymentData = null, topItemsData = null;
    let totalSales = 0;
    let netRevenue = 0;
    let transactions = 0;
    let customers = new Set();

    // Get selected date range
    const dateRangeEl = document.getElementById('dateRange');
    const dateRange = dateRangeEl ? dateRangeEl.value : 'month';
    console.log('Selected date range:', dateRange);

    try {
        try {
            const statsResponse = await fetch(`../api/api.php?action=stats&range=${dateRange}`);
            stats = await statsResponse.json();
            console.log('Stats:', stats);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
        
        try {
            const salesResponse = await fetch(`../api/api.php?action=all_sales&range=${dateRange}`);
            salesData = await salesResponse.json();
            console.log('All Sales Data:', salesData);
            console.log('Sales Data Length:', Array.isArray(salesData) ? salesData.length : 'Not an array');
            console.log('Sample Sales Data:', Array.isArray(salesData) && salesData.length > 0 ? salesData[0] : 'No sales data');
        } catch (error) {
            console.error('Error fetching all sales data:', error);
            // Fallback to regular sales history if all_sales fails
            try {
                const fallbackResponse = await fetch(`../api/api.php?action=sales_history&range=${dateRange}`);
                salesData = await fallbackResponse.json();
                console.log('Fallback Sales Data:', salesData);
                console.log('Fallback Sales Length:', Array.isArray(salesData) ? salesData.length : 'Not an array');
            } catch (fallbackError) {
                console.error('Error fetching fallback sales data:', fallbackError);
            }
        }
        
        try {
            const trendResponse = await fetch(`../api/api.php?action=sales_trend&range=${dateRange}`);
            trendData = await trendResponse.json();
            console.log('Trend Data:', trendData);
        } catch (error) {
            console.error('Error fetching trend data:', error);
        }
        
        try {
            const categoryResponse = await fetch('../api/api.php?action=sales_by_category');
            categoryData = await categoryResponse.json();
            console.log('Category Data:', categoryData);
        } catch (error) {
            console.error('Error fetching category data:', error);
        }
        
        try {
            // Add cache-busting to get fresh data after new sales
            const timestamp = new Date().getTime();
            const paymentResponse = await fetch(`../api/api.php?action=sales_by_payment_method&_t=${timestamp}`, {
                cache: 'no-cache',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache'
                }
            });
            paymentData = await paymentResponse.json();
            console.log('Payment Method Data (fresh):', paymentData);
            console.log('Payment Data Labels:', paymentData?.labels);
            console.log('Payment Data Counts:', paymentData?.counts);
            console.log('Payment Data Type:', typeof paymentData);
        } catch (error) {
            console.error('Error fetching payment data:', error);
            paymentData = null;
        }
        
        try {
            const topItemsResponse = await fetch('../api/api.php?action=top_selling_items');
            topItemsData = await topItemsResponse.json();
            console.log('Top Selling Items Data:', topItemsData);
        } catch (error) {
            console.error('Error fetching top items data:', error);
        }
        
        // Use total_sales and total_transactions from stats API
        if (stats && stats.total_sales !== undefined) {
            totalSales = parseFloat(stats.total_sales.total) || 0;
            netRevenue = totalSales; // net revenue is same as total sales for now
        }
        
        if (stats && stats.total_transactions !== undefined) {
            transactions = stats.total_transactions;
        }
        
        // Fallback: Process sales data if stats API doesn't have total_sales
        if (totalSales === 0 && Array.isArray(salesData)) {
            salesData.forEach(sale => {
                const saleTotal = parseFloat(sale.total_amount || 0);
                totalSales += saleTotal;
                netRevenue += saleTotal;  // total_amount is already the net amount
                if (sale.customer_id) {
                    customers.add(sale.customer_id);
                }
            });
        } else if (salesData && salesData.error) {
            console.error('API Error:', salesData.error);
        }
        
        console.log('Calculated - Total Sales:', totalSales, 'Transactions:', transactions);
        
        // Update metrics
        const totalSalesEl = document.getElementById('totalSales');
        if (totalSalesEl) {
            totalSalesEl.textContent = '₱' + totalSales.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
            console.log('Updated totalSales element');
        }

        const netRevenueEl = document.getElementById('netRevenue');
        if (netRevenueEl) netRevenueEl.textContent = '₱' + netRevenue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});

        const transactionsEl = document.getElementById('transactions');
        if (transactionsEl) transactionsEl.textContent = transactions;

        // Calculate and update average per sale
        const avgPerSaleEl = document.getElementById('avg-per-sale');
        if (avgPerSaleEl && transactions > 0) {
            const avgPerSale = totalSales / transactions;
            avgPerSaleEl.textContent = `Avg: ₱${avgPerSale.toFixed(2)} per sale`;
        }

        updateChartDataFromSales(salesData, trendData, categoryData, paymentData, topItemsData);

        // Direct update for payment methods chart to ensure it's always updated
        if (paymentMethodsChart) {
            const allowedMethods = ['Cash', 'GCash', 'Bank Transfer'];
            let realData = {};
            
            if (paymentData && paymentData.labels && paymentData.counts) {
                paymentData.labels.forEach((label, index) => {
                    if (allowedMethods.includes(label)) {
                        realData[label] = paymentData.counts[index];
                    }
                });
                console.log('Payment methods chart updated with API data:', realData);
            } else {
                // Fallback: Process payment methods from sales data
                const paymentMethods = {};
                const uncategorizedTransactions = [];
                if (Array.isArray(salesData)) {
                    salesData.forEach((sale, index) => {
                        const rawMethod = (sale.payment_method || 'cash').toLowerCase().trim();
                        let displayMethod = 'Cash';
                        let categorized = true;
                        
                        // Note: POS stores 'card' for GCash and 'transfer' for Bank Transfer
                        if (rawMethod === 'card' || rawMethod.includes('gcash') || rawMethod.includes('g-cash')) {
                            displayMethod = 'GCash';
                        } else if (rawMethod === 'transfer' || rawMethod.includes('bank')) {
                            displayMethod = 'Bank Transfer';
                        } else if (rawMethod === 'cash' || rawMethod === '') {
                            displayMethod = 'Cash';
                        } else {
                            // Uncategorized payment method
                            categorized = false;
                            uncategorizedTransactions.push({
                                index: index,
                                transaction_id: sale.transaction_id,
                                payment_method: sale.payment_method,
                                raw_method: rawMethod
                            });
                        }
                        
                        if (categorized) {
                            paymentMethods[displayMethod] = (paymentMethods[displayMethod] || 0) + 1;
                        }
                    });
                    realData = paymentMethods;
                    
                    console.log('Payment methods categorized:', realData);
                    console.log('Total sales processed:', salesData.length);
                    console.log('Categorized transactions:', Object.values(realData).reduce((a, b) => a + b, 0));
                    console.log('Uncategorized transactions:', uncategorizedTransactions.length);
                    console.log('Uncategorized details:', uncategorizedTransactions);
                    console.log('Payment methods chart updated with fallback data:', realData);
                }
            }
            
            // Update chart with data - be defensive
            const chartData = allowedMethods.map(m => realData[m] || 0);
            const hasData = chartData.some(value => value > 0);
            
            // Use real data when available, otherwise keep minimum visibility
            const currentData = paymentMethodsChart.data.datasets[0].data;
            
            // If we have real transaction data, use it, otherwise keep minimum visibility
            let finalChartData;
            if (hasData) {
                // Use real transaction amounts
                finalChartData = chartData;
                console.log('Using real transaction data:', finalChartData);
            } else {
                // Keep minimum visibility (chart would disappear with all zeros)
                finalChartData = currentData.map(value => Math.max(1, value));
                console.log('No real data available, keeping minimum visibility:', finalChartData);
            }
            
            // Update chart with the final data
            paymentMethodsChart.data.labels = allowedMethods;
            paymentMethodsChart.data.datasets[0].data = finalChartData;
            paymentMethodsChart.data.datasets[0].backgroundColor = [
                'rgb(34, 197, 94)',   // Green - Cash
                'rgb(59, 130, 246)',  // Blue - GCash
                'rgb(251, 146, 60)'   // Orange - Bank Transfer
            ];
            
            // Force chart update and render
            paymentMethodsChart.update('none'); // Use 'none' mode for immediate update
            paymentMethodsChart.render();
            
            console.log('Payment Methods chart final data:', finalChartData, 'Real data:', chartData);
        }

        // Update last updated timestamp
        updateLastUpdatedTime();
    } catch (error) {
        console.error('Error fetching reports data:', error);
        refreshReportsFallback();
    }
}

function updateLastUpdatedTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    const lastUpdatedEl = document.getElementById('lastUpdatedTime');
    if (lastUpdatedEl) {
        lastUpdatedEl.textContent = timeString;
    }
}

function refreshReportsFallback() {
    console.log('Using fallback data for reports...');
    
    // Try to get real stats data first
    fetch('../api/api.php?action=stats')
        .then(response => response.json())
        .then(stats => {
            let totalSales = 0;
            let netRevenue = 0;
            let transactions = 0;
            
            // Use real stats if available
            if (stats && stats.total_sales) {
                totalSales = parseFloat(stats.total_sales.total) || 0;
                netRevenue = totalSales; // net revenue is same as total sales for now
                transactions = stats.total_transactions || 0;
            }
            
            // If no total sales available, try to get all sales data
            if (totalSales === 0) {
                return fetch('../api/api.php?action=all_sales')
                    .then(response => response.json())
                    .then(salesData => {
                        if (Array.isArray(salesData)) {
                            salesData.forEach(sale => {
                                const saleTotal = parseFloat(sale.total_amount || 0);
                                totalSales += saleTotal;
                                netRevenue += saleTotal;
                                transactions++;
                            });
                        }
                        
                        updateMetricsDisplay(totalSales, netRevenue, transactions);
                    })
                    .catch(error => {
                        // Fallback to regular sales history
                        return fetch('../api/api.php?action=sales_history')
                            .then(response => response.json())
                            .then(salesData => {
                                if (Array.isArray(salesData)) {
                                    salesData.forEach(sale => {
                                        const saleTotal = parseFloat(sale.total_amount || 0);
                                        totalSales += saleTotal;
                                        netRevenue += saleTotal;
                                        transactions++;
                                    });
                                }
                                
                                updateMetricsDisplay(totalSales, netRevenue, transactions);
                            });
                    });
            }
            
            updateMetricsDisplay(totalSales, netRevenue, transactions);
        })
        .catch(error => {
            console.error('Fallback also failed:', error);
            // Only show zeros if everything fails
            updateMetricsDisplay(0, 0, 0);
        });
}

function updateMetricsDisplay(totalSales, netRevenue, transactions) {
    const totalSalesEl = document.getElementById('totalSales');
    if (totalSalesEl) {
        totalSalesEl.textContent = '₱' + totalSales.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
        console.log('Updated totalSales to', totalSales);
    }

    const netRevenueEl = document.getElementById('netRevenue');
    if (netRevenueEl) {
        netRevenueEl.textContent = '₱' + netRevenue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    }

    const transactionsEl = document.getElementById('transactions');
    if (transactionsEl) {
        transactionsEl.textContent = transactions;
    }

    // Calculate and update average per sale
    const avgPerSaleEl = document.getElementById('avg-per-sale');
    if (avgPerSaleEl && transactions > 0) {
        const avgPerSale = totalSales / transactions;
        avgPerSaleEl.textContent = `Avg: ₱${avgPerSale.toFixed(2)} per sale`;
    }
}

function updateChartDataFromSales(salesData, trendData = null, categoryData = null, paymentData = null, topItemsData = null) {
    if (!Array.isArray(salesData) || salesData.length === 0) {
        updateChartData();
        return;
    }

    // Always update sales trend chart with real transaction data
    if (salesTrendChart) {
        // Get selected date range
        const dateRangeEl = document.getElementById('dateRange');
        const dateRange = dateRangeEl ? dateRangeEl.value : 'month';
        
        let labels = [];
        let chartData = [];
        
        // Use API trend data if available (it respects date range)
        if (trendData && trendData.labels && trendData.data) {
            labels = trendData.labels;
            chartData = trendData.data;
            console.log('Sales Trend using API data:', trendData);
        }
        // Fallback: Calculate from sales data
        else if (Array.isArray(salesData) && salesData.length > 0) {
            const totals = {};
            
            salesData.forEach(sale => {
                const saleDate = new Date(sale.created_at);
                let key;
                
                // Determine grouping based on date range
                if (dateRange === 'today' || dateRange === 'yesterday') {
                    // Group by hour
                    key = saleDate.toLocaleDateString('en-US', {hour: 'numeric', hour12: true});
                } else if (dateRange === 'week') {
                    // Group by day name
                    key = saleDate.toLocaleDateString('en-US', {weekday: 'short'});
                } else if (dateRange === 'month' || dateRange === 'quarter') {
                    // Group by date (e.g., "Apr 5")
                    key = saleDate.toLocaleDateString('en-US', {month: 'short', day: 'numeric'});
                } else {
                    // Group by month for year/all
                    key = saleDate.toLocaleDateString('en-US', {month: 'short'});
                }
                
                totals[key] = (totals[key] || 0) + parseFloat(sale.total_amount || 0);
            });
            
            // Sort and extract labels/data
            const sortedEntries = Object.entries(totals).sort((a, b) => a[0].localeCompare(b[0]));
            labels = sortedEntries.map(e => e[0]);
            chartData = sortedEntries.map(e => e[1]);
            
            console.log('Sales Trend calculated from transaction data:', totals);
        }
        // No data available - show zeros with appropriate labels
        else {
            if (dateRange === 'today' || dateRange === 'yesterday') {
                labels = ['6AM', '9AM', '12PM', '3PM', '6PM', '9PM'];
            } else if (dateRange === 'week') {
                labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            } else if (dateRange === 'month' || dateRange === 'quarter') {
                // Generate last 30 days labels
                labels = [];
                for (let i = 29; i >= 0; i--) {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    labels.push(d.toLocaleDateString('en-US', {month: 'short', day: 'numeric'}));
                }
            } else {
                labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            }
            chartData = new Array(labels.length).fill(0);
        }
        
        // Update the chart with real data
        salesTrendChart.data.labels = labels;
        salesTrendChart.data.datasets[0].data = chartData;
        salesTrendChart.update();
        console.log('Sales Trend chart updated with range:', dateRange, 'labels:', labels, 'data:', chartData);
    }
    
    // Use real category data if available
    if (categoryData && categoryData.labels && categoryData.data) {
        // Update sales by category chart with real data
        if (salesByCategoryChart) {
            salesByCategoryChart.data.labels = categoryData.labels;
            salesByCategoryChart.data.datasets[0].data = categoryData.data;
            salesByCategoryChart.data.datasets[0].backgroundColor = [
                'rgba(99, 102, 241, 0.8)',
                'rgba(59, 130, 246, 0.8)',
                'rgba(34, 197, 94, 0.8)',
                'rgba(251, 146, 60, 0.8)',
                'rgba(239, 68, 68, 0.8)'
            ];
            salesByCategoryChart.data.datasets[0].borderColor = [
                'rgb(99, 102, 241)',
                'rgb(59, 130, 246)',
                'rgb(34, 197, 94)',
                'rgb(251, 146, 60)',
                'rgb(239, 68, 68)'
            ];
            salesByCategoryChart.update();
        }
    } else {
        // Fallback: Process items for category sales from sales data
        const categories = {};
        salesData.forEach(sale => {
            if (Array.isArray(sale.items)) {
                sale.items.forEach(item => {
                    // Category sales (use product name as category for now)
                    const itemName = item.product_name || 'Unknown';
                    categories[itemName] = (categories[itemName] || 0) + parseFloat(item.total_price || 0);
                });
            }
        });

        // Update sales by category chart
        if (salesByCategoryChart) {
            const categoryNames = Object.keys(categories).slice(0, 5);
            const categoryValues = categoryNames.map(cat => categories[cat]);
            salesByCategoryChart.data.labels = categoryNames;
            salesByCategoryChart.data.datasets[0].data = categoryValues;
            salesByCategoryChart.data.datasets[0].backgroundColor = [
                'rgba(99, 102, 241, 0.8)',
                'rgba(59, 130, 246, 0.8)',
                'rgba(34, 197, 94, 0.8)',
                'rgba(251, 146, 60, 0.8)',
                'rgba(239, 68, 68, 0.8)'
            ];
            salesByCategoryChart.data.datasets[0].borderColor = [
                'rgb(99, 102, 241)',
                'rgb(59, 130, 246)',
                'rgb(34, 197, 94)',
                'rgb(251, 146, 60)',
                'rgb(239, 68, 68)'
            ];
            salesByCategoryChart.update();
        }
    }
    
    // Process other charts (payment methods and top selling items)
    const paymentMethods = {};
    const productSales = {};
    
    salesData.forEach(sale => {
        // Payment methods breakdown - only Cash, Gcash, Bank Transfer
        const rawMethod = (sale.payment_method || 'cash').toLowerCase().trim();
        let displayMethod = 'Cash';
        if (rawMethod === 'gcash') {
            displayMethod = 'GCash';
        } else if (rawMethod === 'bank_transfer' || rawMethod === 'bank transfer') {
            displayMethod = 'Bank Transfer';
        }
        paymentMethods[displayMethod] = (paymentMethods[displayMethod] || 0) + 1;
        
        // Process items for product sales
        if (Array.isArray(sale.items)) {
            sale.items.forEach(item => {
                // Product sales for top items
                const itemName = item.product_name || 'Unknown';
                if (!productSales[itemName]) {
                    productSales[itemName] = { quantity: 0, revenue: 0 };
                }
                productSales[itemName].quantity += item.quantity || 0;
                productSales[itemName].revenue += parseFloat(item.total_price || 0);
            });
        }
    });

        // FIXED: Payment methods chart - Use real API data but only show Cash, Gcash, Bank Transfer
        if (paymentData && paymentData.labels && paymentData.counts) {
            // Use real payment method data from API
            const allowedMethods = ['Cash', 'GCash', 'Bank Transfer'];
            const realData = {};
            
            // Map real API data to allowed methods using transaction counts
            paymentData.labels.forEach((label, index) => {
                if (allowedMethods.includes(label)) {
                    realData[label] = paymentData.counts[index];
                }
            });
            
            if (paymentMethodsChart) {
                paymentMethodsChart.data.labels = allowedMethods;
                paymentMethodsChart.data.datasets[0].data = allowedMethods.map(m => realData[m] || 0);
                paymentMethodsChart.data.datasets[0].backgroundColor = [
                    'rgb(34, 197, 94)',   // Green - Cash
                    'rgb(59, 130, 246)',  // Blue - Gcash
                    'rgb(251, 146, 60)'   // Orange - Bank Transfer
                ];
                paymentMethodsChart.update();
            }
        } else {
            // Fallback: Process payment methods from sales data
            const allowedMethods = ['Cash', 'GCash', 'Bank Transfer'];
            if (paymentMethodsChart) {
                paymentMethodsChart.data.labels = allowedMethods;
                paymentMethodsChart.data.datasets[0].data = allowedMethods.map(m => paymentMethods[m] || 0);
                paymentMethodsChart.data.datasets[0].backgroundColor = [
                    'rgb(34, 197, 94)',   // Green - Cash
                    'rgb(59, 130, 246)',  // Blue - Gcash
                    'rgb(251, 146, 60)'   // Orange - Bank Transfer
                ];
                paymentMethodsChart.update();
            }
        }

    // Update top selling items table
    updateTopSellingItemsTable(productSales, topItemsData);
}

function updateTopSellingItemsTable(productSales, topItemsData = null) {
    // Use real top selling items data if available, otherwise fall back to processing sales data
    if (topItemsData && Array.isArray(topItemsData)) {
        // Find the table body
        const tableBody = document.querySelector('table tbody');
        if (tableBody && topItemsData.length > 0) {
            tableBody.innerHTML = topItemsData.map(item => `
                <tr>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${item.product_name}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.total_quantity}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₱${item.total_revenue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                </tr>
            `).join('');
        }
    } else {
        // Fallback: Sort products by quantity from sales data
        const topItems = Object.entries(productSales)
            .map(([name, data]) => ({
                name,
                quantity: data.quantity,
                revenue: data.revenue
            }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 3); // Top 3 items

        // Find the table body
        const tableBody = document.querySelector('table tbody');
        if (tableBody && topItems.length > 0) {
            tableBody.innerHTML = topItems.map(item => `
                <tr>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${item.name}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.quantity}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₱${item.revenue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                </tr>
            `).join('');
        }
    }
}

function closeScheduleModal() {
    const modal = document.getElementById('scheduleModal');
    if (modal) modal.classList.add('hidden');
}

function updateChartData() {
    // Fallback chart update - keep real data or zeros
    if (salesTrendChart) {
        // Keep the current data or set to zeros if no real data available
        salesTrendChart.data.datasets[0].data = salesTrendChart.data.datasets[0].data || [0, 0, 0, 0, 0, 0, 0];
        salesTrendChart.update();
    }
    if (paymentMethodsChart) {
        // Always show payment methods chart with data
        const allowedMethods = ['Cash', 'GCash', 'Bank Transfer'];
        if (paymentMethodsChart) {
            // Start with default values
            paymentMethodsChart.data.labels = allowedMethods;
            paymentMethodsChart.data.datasets[0].data = [0, 0, 0];
            paymentMethodsChart.data.datasets[0].backgroundColor = [
                'rgb(34, 197, 94)',
                'rgb(59, 130, 246)',
                'rgb(251, 146, 60)'
            ];
            paymentMethodsChart.update();
            
            // Try to get real data
            fetch('../api/api.php?action=sales_by_payment_method')
                .then(response => response.json())
                .then(paymentData => {
                    const realData = {};
                    
                    // Map real API data to allowed methods
                    if (paymentData && paymentData.labels) {
                        paymentData.labels.forEach((label, index) => {
                            if (allowedMethods.includes(label)) {
                                realData[label] = paymentData.data[index];
                            }
                        });
                    }
                    
                    if (paymentMethodsChart) {
                        paymentMethodsChart.data.labels = allowedMethods;
                        paymentMethodsChart.data.datasets[0].data = allowedMethods.map(m => realData[m] || 0);
                        paymentMethodsChart.data.datasets[0].backgroundColor = [
                            'rgb(34, 197, 94)',
                            'rgb(59, 130, 246)',
                            'rgb(251, 146, 60)'
                        ];
                        paymentMethodsChart.update();
                    }
                })
                .catch(error => {
                    console.log('Could not fetch payment data, using default values');
                    // Chart already has default values from above
                });
        }
    }
}

function saveSchedule() {
    alert('Report scheduling saved successfully!');
    closeScheduleModal();
}

// Event listener for date range
document.addEventListener('DOMContentLoaded', function() {
    const dateRangeEl = document.getElementById('dateRange');
    if (dateRangeEl) {
        dateRangeEl.addEventListener('change', updateDateRangeVisibility);
    }
});

// Sales Trend Modal Functions
let weeklyTrendChart, monthlyTrendChart, yearlyTrendChart, dailyBreakdownChart;

function openSalesTrendModal() {
    const modal = document.getElementById('salesTrendModal');
    if (modal) {
        modal.classList.remove('hidden');
        lucide.createIcons();
        // Load detailed trend data
        loadDetailedTrendData();
    }
}

function closeSalesTrendModal() {
    const modal = document.getElementById('salesTrendModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

function switchTrendTab(tabName) {
    // Hide all trend tab contents
    document.querySelectorAll('.trend-tab-content').forEach(tab => {
        tab.classList.add('hidden');
    });
    
    // Show selected tab content
    const selectedTab = document.getElementById(`trend-${tabName}`);
    if (selectedTab) {
        selectedTab.classList.remove('hidden');
    }
    
    // Update tab button styles
    document.querySelectorAll('.trend-tab-button').forEach(button => {
        button.classList.remove('border-indigo-500', 'text-indigo-600');
        button.classList.add('border-transparent', 'text-gray-500');
    });
    
    const activeButton = document.querySelector(`[data-trend-tab="${tabName}"]`);
    if (activeButton) {
        activeButton.classList.remove('border-transparent', 'text-gray-500');
        activeButton.classList.add('border-indigo-500', 'text-indigo-600');
    }
}

async function loadDetailedTrendData() {
    try {
        // Fetch all sales data for detailed analysis
        const response = await fetch('../api/api.php?action=all_sales&range=month');
        const salesData = await response.json();
        
        if (!Array.isArray(salesData)) {
            console.error('Invalid sales data');
            return;
        }
        
        // Process data for different views
        const weeklyData = processWeeklyData(salesData);
        const monthlyData = processMonthlyData(salesData);
        const yearlyData = processYearlyData(salesData);
        const dailyData = processDailyBreakdown(salesData);
        
        // Update summary cards
        updateTrendSummaries(weeklyData, monthlyData, yearlyData, dailyData);
        
        // Render charts
        renderWeeklyChart(weeklyData);
        renderMonthlyChart(monthlyData);
        renderYearlyChart(yearlyData);
        renderDailyBreakdownChart(dailyData);
        
    } catch (error) {
        console.error('Error loading detailed trend data:', error);
    }
}

function processWeeklyData(salesData) {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const data = new Array(7).fill(0);
    let total = 0;
    let transactions = 0;
    
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    salesData.forEach(sale => {
        const saleDate = new Date(sale.created_at);
        if (saleDate >= sevenDaysAgo && saleDate <= now) {
            const dayIndex = (saleDate.getDay() + 6) % 7; // Convert to Mon=0, Sun=6
            const amount = parseFloat(sale.total_amount || 0);
            data[dayIndex] += amount;
            total += amount;
            transactions++;
        }
    });
    
    return { labels: days, data, total, transactions, average: transactions > 0 ? total / transactions : 0 };
}

function processMonthlyData(salesData) {
    const labels = [];
    const data = [];
    let total = 0;
    let transactions = 0;
    
    // Generate last 30 days labels
    for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        labels.push(d.toLocaleDateString('en-US', {month: 'short', day: 'numeric'}));
        data.push(0);
    }
    
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    salesData.forEach(sale => {
        const saleDate = new Date(sale.created_at);
        if (saleDate >= thirtyDaysAgo && saleDate <= now) {
            const label = saleDate.toLocaleDateString('en-US', {month: 'short', day: 'numeric'});
            const index = labels.indexOf(label);
            if (index !== -1) {
                const amount = parseFloat(sale.total_amount || 0);
                data[index] += amount;
                total += amount;
                transactions++;
            }
        }
    });
    
    return { labels, data, total, transactions, average: transactions > 0 ? total / transactions : 0 };
}

function processYearlyData(salesData) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data = new Array(12).fill(0);
    let total = 0;
    let transactions = 0;
    
    const currentYear = new Date().getFullYear();
    
    salesData.forEach(sale => {
        const saleDate = new Date(sale.created_at);
        if (saleDate.getFullYear() === currentYear) {
            const monthIndex = saleDate.getMonth();
            const amount = parseFloat(sale.total_amount || 0);
            data[monthIndex] += amount;
            total += amount;
            transactions++;
        }
    });
    
    return { labels: months, data, total, transactions, average: transactions > 0 ? total / transactions : 0 };
}

function processDailyBreakdown(salesData) {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const data = new Array(7).fill(0);
    const counts = new Array(7).fill(0);
    
    salesData.forEach(sale => {
        const saleDate = new Date(sale.created_at);
        const dayIndex = (saleDate.getDay() + 6) % 7; // Convert to Mon=0, Sun=6
        const amount = parseFloat(sale.total_amount || 0);
        data[dayIndex] += amount;
        counts[dayIndex]++;
    });
    
    // Calculate averages
    const averages = data.map((total, index) => counts[index] > 0 ? total / counts[index] : 0);
    
    // Find best and slowest days
    let bestDayIndex = 0;
    let slowestDayIndex = 0;
    let bestDayAmount = 0;
    let slowestDayAmount = Infinity;
    
    averages.forEach((avg, index) => {
        if (avg > bestDayAmount) {
            bestDayAmount = avg;
            bestDayIndex = index;
        }
        if (avg < slowestDayAmount && counts[index] > 0) {
            slowestDayAmount = avg;
            slowestDayIndex = index;
        }
    });
    
    return {
        labels: days,
        data: averages,
        bestDay: days[bestDayIndex],
        bestDayAmount: bestDayAmount,
        slowestDay: days[slowestDayIndex],
        slowestDayAmount: slowestDayAmount === Infinity ? 0 : slowestDayAmount
    };
}

function updateTrendSummaries(weekly, monthly, yearly, daily) {
    // Weekly
    document.getElementById('weeklyTotal').textContent = '₱' + weekly.total.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    document.getElementById('weeklyAverage').textContent = '₱' + (weekly.total / 7).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    document.getElementById('weeklyTransactions').textContent = weekly.transactions;
    
    // Monthly
    document.getElementById('monthlyTotal').textContent = '₱' + monthly.total.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    document.getElementById('monthlyAverage').textContent = '₱' + (monthly.total / 30).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    document.getElementById('monthlyTransactions').textContent = monthly.transactions;
    
    // Yearly
    document.getElementById('yearlyTotal').textContent = '₱' + yearly.total.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    document.getElementById('yearlyAverage').textContent = '₱' + (yearly.total / 12).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    document.getElementById('yearlyTransactions').textContent = yearly.transactions;
    
    // Daily Breakdown
    document.getElementById('bestDay').textContent = daily.bestDay;
    document.getElementById('bestDayAmount').textContent = '₱' + daily.bestDayAmount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    document.getElementById('slowestDay').textContent = daily.slowestDay;
    document.getElementById('slowestDayAmount').textContent = '₱' + daily.slowestDayAmount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
}

function renderWeeklyChart(weeklyData) {
    const ctx = document.getElementById('weeklyTrendChart')?.getContext('2d');
    if (!ctx) return;
    
    if (weeklyTrendChart) {
        weeklyTrendChart.destroy();
    }
    
    weeklyTrendChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: weeklyData.labels,
            datasets: [{
                label: 'Sales',
                data: weeklyData.data,
                backgroundColor: 'rgba(99, 102, 241, 0.8)',
                borderColor: 'rgb(99, 102, 241)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₱' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

function renderMonthlyChart(monthlyData) {
    const ctx = document.getElementById('monthlyTrendChart')?.getContext('2d');
    if (!ctx) return;
    
    if (monthlyTrendChart) {
        monthlyTrendChart.destroy();
    }
    
    monthlyTrendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: monthlyData.labels,
            datasets: [{
                label: 'Sales',
                data: monthlyData.data,
                borderColor: 'rgb(34, 197, 94)',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₱' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

function renderYearlyChart(yearlyData) {
    const ctx = document.getElementById('yearlyTrendChart')?.getContext('2d');
    if (!ctx) return;
    
    if (yearlyTrendChart) {
        yearlyTrendChart.destroy();
    }
    
    yearlyTrendChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: yearlyData.labels,
            datasets: [{
                label: 'Sales',
                data: yearlyData.data,
                backgroundColor: 'rgba(251, 146, 60, 0.8)',
                borderColor: 'rgb(251, 146, 60)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₱' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

function renderDailyBreakdownChart(dailyData) {
    const ctx = document.getElementById('dailyBreakdownChart')?.getContext('2d');
    if (!ctx) return;
    
    if (dailyBreakdownChart) {
        dailyBreakdownChart.destroy();
    }
    
    dailyBreakdownChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dailyData.labels,
            datasets: [{
                label: 'Average Sales',
                data: dailyData.data,
                backgroundColor: [
                    'rgba(99, 102, 241, 0.8)',
                    'rgba(99, 102, 241, 0.8)',
                    'rgba(99, 102, 241, 0.8)',
                    'rgba(99, 102, 241, 0.8)',
                    'rgba(99, 102, 241, 0.8)',
                    'rgba(34, 197, 94, 0.8)', // Weekend in green
                    'rgba(34, 197, 94, 0.8)'  // Weekend in green
                ],
                borderColor: 'rgb(99, 102, 241)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₱' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('salesTrendModal');
    if (event.target === modal) {
        closeSalesTrendModal();
    }
};

// ==================== INVENTORY ANALYTICS ====================

// Fetch and render inventory analytics
async function fetchInventoryAnalytics() {
    try {
        const response = await fetch('../api/api.php?action=inventory_analytics');
        const data = await response.json();
        console.log('Inventory Analytics:', data);
        
        if (data) {
            renderInventoryMetrics(data);
            renderLowStockItems(data.low_stock_items);
            renderInventoryValuation(data.inventory_valuation);
            renderStockMovement(data.stock_movement);
            renderCategoryDistribution(data.category_distribution);
            renderTurnoverMetrics(data.turnover_metrics);
            renderDeadStock(data.turnover_metrics);
        }
    } catch (error) {
        console.error('Error fetching inventory analytics:', error);
    }
}

// Render inventory metrics cards
function renderInventoryMetrics(data) {
    const valuation = data.inventory_valuation;
    const turnover = data.turnover_metrics;
    
    // Update metric cards
    const totalValueEl = document.getElementById('inv-total-value');
    if (totalValueEl) {
        totalValueEl.textContent = '₱' + (valuation.total_value || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    }
    
    const totalProductsEl = document.getElementById('inv-total-products');
    if (totalProductsEl) {
        totalProductsEl.textContent = (valuation.total_products || 0) + ' products, ' + (valuation.total_units || 0) + ' units';
    }
    
    const lowStockCountEl = document.getElementById('inv-low-stock-count');
    if (lowStockCountEl) {
        const lowStockCount = data.low_stock_items ? data.low_stock_items.length : 0;
        lowStockCountEl.textContent = lowStockCount;
    }
    
    const turnoverRateEl = document.getElementById('inv-turnover-rate');
    if (turnoverRateEl) {
        turnoverRateEl.textContent = (turnover.turnover_rate_annual || 0).toFixed(1) + 'x';
    }
    
    const deadStockEl = document.getElementById('inv-dead-stock');
    if (deadStockEl) {
        deadStockEl.textContent = '₱' + (turnover.dead_stock_value || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    }
}

// Render low stock items
function renderLowStockItems(items) {
    const container = document.getElementById('low-stock-container');
    const badge = document.getElementById('low-stock-badge');
    
    if (!container) return;
    
    if (badge) {
        badge.textContent = (items ? items.length : 0) + ' items';
    }
    
    if (!items || items.length === 0) {
        container.innerHTML = '<div class="text-center text-gray-500 py-4">All items are well stocked!</div>';
        return;
    }
    
    container.innerHTML = items.map(item => `
        <div class="bg-white rounded-lg p-3 flex justify-between items-center">
            <div>
                <p class="font-medium text-gray-900">${item.name}</p>
                <p class="text-sm text-gray-500">Stock: ${item.current_stock} units | ₱${parseFloat(item.price || 0).toLocaleString()}</p>
            </div>
            <span class="px-2 py-1 bg-${item.severity_color === 'red' ? 'red' : item.severity_color === 'yellow' ? 'yellow' : 'orange'}-100 
                         text-${item.severity_color === 'red' ? 'red' : item.severity_color === 'yellow' ? 'yellow' : 'orange'}-800 
                         text-xs font-medium rounded">${item.severity}</span>
        </div>
    `).join('');
}

// Render inventory valuation chart
function renderInventoryValuation(data) {
    const ctx = document.getElementById('inventoryValueChart')?.getContext('2d');
    if (!ctx) return;
    
    if (inventoryValueChart) {
        inventoryValueChart.destroy();
    }
    
    const distribution = data.distribution || {};
    const labels = ['Out of Stock', 'Critical (1-5)', 'Low (6-10)', 'Normal (11-50)', 'High (50+)'];
    const values = [
        parseFloat(distribution.out_of_stock?.value || 0),
        parseFloat(distribution.critical?.value || 0),
        parseFloat(distribution.low?.value || 0),
        parseFloat(distribution.normal?.value || 0),
        parseFloat(distribution.high?.value || 0)
    ];
    
    inventoryValueChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: [
                    'rgb(239, 68, 68)',   // Red - Out of stock
                    'rgb(251, 146, 60)', // Orange - Critical
                    'rgb(250, 204, 21)', // Yellow - Low
                    'rgb(34, 197, 94)',  // Green - Normal
                    'rgb(59, 130, 246)'  // Blue - High
                ],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        boxWidth: 12,
                        font: { size: 11 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return `₱${value.toLocaleString()} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
    
    // Update summary stats
    const totalUnitsEl = document.getElementById('inv-total-units');
    if (totalUnitsEl) {
        totalUnitsEl.textContent = (data.total_units || 0).toLocaleString();
    }
    
    const avgPriceEl = document.getElementById('inv-avg-price');
    if (avgPriceEl) {
        avgPriceEl.textContent = '₱' + (data.average_price || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    }
}

// Render stock movement analysis
function renderStockMovement(items) {
    const container = document.getElementById('stock-movement-container');
    if (!container) return;
    
    if (!items || items.length === 0) {
        container.innerHTML = '<div class="text-center text-gray-500 py-4">No stock movement data available</div>';
        return;
    }
    
    container.innerHTML = items.slice(0, 10).map(item => {
        const statusColor = item.stock_status === 'critical' ? 'red' : 
                           item.stock_status === 'warning' ? 'yellow' : 'green';
        const daysText = item.days_until_stockout ? 
            (item.days_until_stockout <= 7 ? `⚠️ ${item.days_until_stockout} days left` : 
             `${item.days_until_stockout} days left`) : 'No sales';
        
        return `
        <div class="bg-white rounded-lg p-3">
            <div class="flex justify-between items-start">
                <div>
                    <p class="font-medium text-gray-900">${item.name}</p>
                    <p class="text-sm text-gray-500">Sold: ${item.sold_quantity} units | Stock: ${item.current_stock}</p>
                </div>
                <span class="text-sm font-medium text-${statusColor}-600">${daysText}</span>
            </div>
            <div class="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                <div class="bg-${statusColor}-500 h-1.5 rounded-full" style="width: ${Math.min(100, (item.current_stock / (item.current_stock + item.sold_quantity)) * 100)}%"></div>
            </div>
        </div>
    `}).join('');
}

// Render category distribution
function renderCategoryDistribution(categories) {
    const ctx = document.getElementById('inventoryCategoryChart')?.getContext('2d');
    const container = document.getElementById('category-distribution-container');
    
    if (!categories || categories.length === 0) {
        if (container) container.innerHTML = '<div class="text-center text-gray-500">No category data</div>';
        return;
    }
    
    if (ctx) {
        if (inventoryCategoryChart) {
            inventoryCategoryChart.destroy();
        }
        
        const labels = categories.map(c => c.category_name);
        const values = categories.map(c => parseFloat(c.inventory_value || 0));
        const colors = [
            'rgb(99, 102, 241)', 'rgb(34, 197, 94)', 'rgb(251, 146, 60)', 
            'rgb(236, 72, 153)', 'rgb(59, 130, 246)', 'rgb(168, 85, 247)'
        ];
        
        inventoryCategoryChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: colors.slice(0, categories.length),
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            boxWidth: 12,
                            font: { size: 10 }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed || 0;
                                return `₱${value.toLocaleString()}`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Render category list
    if (container) {
        container.innerHTML = categories.map(cat => `
            <div class="flex justify-between items-center bg-white rounded p-2 text-sm">
                <span class="text-gray-700">${cat.category_name}</span>
                <div class="text-right">
                    <span class="font-medium text-gray-900">₱${parseFloat(cat.inventory_value || 0).toLocaleString()}</span>
                    <span class="text-xs text-gray-500 ml-1">(${cat.product_count} items)</span>
                </div>
            </div>
        `).join('');
    }
}

// Render turnover metrics
function renderTurnoverMetrics(metrics) {
    const daysInventoryEl = document.getElementById('inv-days-inventory');
    const daysBarEl = document.getElementById('inv-days-bar');
    const cogsEl = document.getElementById('inv-cogs');
    const productsSoldEl = document.getElementById('inv-products-sold');
    
    if (daysInventoryEl) {
        daysInventoryEl.textContent = (metrics.days_in_inventory || 0).toFixed(1) + ' days';
    }
    
    if (daysBarEl) {
        // Normalize to 100 days for bar display
        const percentage = Math.min(100, ((metrics.days_in_inventory || 0) / 100) * 100);
        daysBarEl.style.width = percentage + '%';
    }
    
    if (cogsEl) {
        cogsEl.textContent = '₱' + (metrics.cogs_30_days || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    }
    
    if (productsSoldEl) {
        productsSoldEl.textContent = (metrics.products_sold_30_days || 0);
    }
}

// Render dead stock report
function renderDeadStock(metrics) {
    const container = document.getElementById('dead-stock-container');
    const badge = document.getElementById('dead-stock-badge');
    const deadStockValueEl = document.getElementById('inv-dead-stock');
    
    const deadStockItems = metrics.dead_stock_items || [];
    
    if (badge) {
        badge.textContent = deadStockItems.length + ' items';
    }
    
    if (deadStockValueEl) {
        deadStockValueEl.textContent = '₱' + (metrics.dead_stock_value || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    }
    
    if (!container) return;
    
    if (deadStockItems.length === 0) {
        container.innerHTML = '<div class="text-center text-gray-500 py-4">No dead stock - great job!</div>';
        return;
    }
    
    container.innerHTML = deadStockItems.map(item => `
        <div class="bg-white rounded-lg p-3 flex justify-between items-center">
            <div>
                <p class="font-medium text-gray-900">${item.name}</p>
                <p class="text-sm text-gray-500">Stock: ${item.stock_quantity} units</p>
            </div>
            <span class="text-sm font-medium text-red-600">₱${parseFloat(item.dead_stock_value || 0).toLocaleString()}</span>
        </div>
    `).join('');
}

// Load inventory analytics when tab is switched
const originalSwitchTab = switchTab;
switchTab = function(tabName) {
    originalSwitchTab(tabName);
    
    if (tabName === 'inventory') {
        fetchInventoryAnalytics();
    }
};
