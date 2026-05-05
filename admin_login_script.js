// Admin Login Validation System
document.addEventListener('DOMContentLoaded', function() {
    // Valid admin emails array
    const adminEmails = [
        "admin1@example.com",
        "admin2@example.com",
        "admin3@example.com",
        "admin4@example.com",
        "admin5@example.com",
        "admin6@example.com",
        "admin7@example.com",
        "admin8@example.com"
    ];

    // Correct admin password
    const adminPassword = "Admin_coding@123";

    // Get form elements
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const signInBtn = document.querySelector('.signin-btn');
    const form = document.querySelector('form');

    // Email validation function
    function validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Show message function
    function showMessage(element, message, isError = false) {
        // Remove existing message
        const existingMessage = element.parentNode.querySelector('.validation-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        // Create new message element
        const messageDiv = document.createElement('div');
        messageDiv.className = 'validation-message';
        messageDiv.style.cssText = `
            font-size: 12px;
            margin-top: 5px;
            padding: 5px;
            border-radius: 4px;
            color: ${isError ? '#dc3545' : '#28a745'};
            background-color: ${isError ? '#f8d7da' : '#d4edda'};
            border: 1px solid ${isError ? '#f5c6cb' : '#c3e6cb'};
            display: block;
        `;
        messageDiv.textContent = message;

        // Insert message after the input
        element.parentNode.insertBefore(messageDiv, element.nextSibling);

        // Auto-hide after 3 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 3000);
    }

    // Email input validation
    emailInput.addEventListener('blur', function() {
        const email = this.value.trim();
        
        if (email === '') {
            return; // Don't show message for empty field
        }

        if (!validateEmail(email)) {
            showMessage(this, 'Please enter a valid email address.', true);
            return;
        }

        if (adminEmails.includes(email)) {
            showMessage(this, 'Valid admin email.', false);
        } else {
            showMessage(this, 'Email not found.', true);
        }
    });

    // Real-time email validation as user types
    emailInput.addEventListener('input', function() {
        const email = this.value.trim();
        
        if (email === '') {
            // Remove existing message if field is empty
            const existingMessage = this.parentNode.querySelector('.validation-message');
            if (existingMessage) {
                existingMessage.remove();
            }
            return;
        }

        if (!validateEmail(email)) {
            showMessage(this, 'Please enter a valid email address.', true);
            return;
        }

        if (adminEmails.includes(email)) {
            showMessage(this, 'Valid admin email.', false);
        } else {
            showMessage(this, 'Email not found.', true);
        }
    });

    // Form submission validation
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        // Check if fields are empty
        if (email === '' || password === '') {
            showMessage(emailInput, 'Please fill in all fields.', true);
            return;
        }

        // Validate email format
        if (!validateEmail(email)) {
            showMessage(emailInput, 'Please enter a valid email address.', true);
            return;
        }

        // Check if email is in admin list
        if (!adminEmails.includes(email)) {
            showMessage(emailInput, 'Email not found.', true);
            return;
        }

        // Check password
        if (password !== adminPassword) {
            showMessage(passwordInput, 'Incorrect password.', true);
            return;
        }
x
        // Set authentication flag in localStorage
        localStorage.setItem('adminLoggedIn', 'true');
        
        // If all validations pass, redirect to dashboard
        console.log('Admin login successful, redirecting to admin dashboard...');
       const adminDashboardUrl = '/laundry/dashboard/html/index.html';

        console.log('Redirect URL:', adminDashboardUrl);
        window.location.href = adminDashboardUrl;
    });

    // Password toggle functionality (keep existing)
    const passwordToggle = document.getElementById('passwordToggle');
    if (passwordToggle) {
        passwordToggle.addEventListener('click', function() {
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                passwordToggle.classList.remove('fa-eye');
                passwordToggle.classList.add('fa-eye-slash');
            } else {
                passwordInput.type = 'password';
                passwordToggle.classList.remove('fa-eye-slash');
                passwordToggle.classList.add('fa-eye');
            }
        });
    }
});
