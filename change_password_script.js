// Change Password Script
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('changePasswordForm');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const toggleNewPassword = document.getElementById('toggleNewPassword');
    const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
    
    // Get email from URL
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get('email');
    
    // Check if OTP was verified (allow both 'reset' and 'change_password' flows)
    const otpVerified = sessionStorage.getItem('otpVerified');
    const otpVerifiedEmail = sessionStorage.getItem('otpVerifiedEmail');

    // If OTP is not verified, send user back to forgot password flow
    if (!otpVerified || otpVerified !== 'true') {
        alert('Please verify your email with OTP first.');
        window.location.href = 'forgot_password.html';
        return;
    }

    // Verify email matches if available
    if (otpVerifiedEmail && email && email.toLowerCase() !== otpVerifiedEmail.toLowerCase()) {
    alert('Email mismatch. Please try again.');
    window.location.href = '/laundry/html/index.html';
    return;
}

if (!email && !otpVerifiedEmail) {
    alert('Email not found. Please try again.');
    window.location.href = '/laundry/html/index.html';
    return;
}
    // Use email from URL or from sessionStorage
    const userEmail = email || otpVerifiedEmail;

    // Password toggle functionality
    if (toggleNewPassword) {
        toggleNewPassword.addEventListener('click', function() {
            if (newPasswordInput.type === 'password') {
                newPasswordInput.type = 'text';
                toggleNewPassword.classList.remove('fa-eye');
                toggleNewPassword.classList.add('fa-eye-slash');
            } else {
                newPasswordInput.type = 'password';
                toggleNewPassword.classList.remove('fa-eye-slash');
                toggleNewPassword.classList.add('fa-eye');
            }
        });
    }
    
    if (toggleConfirmPassword) {
        toggleConfirmPassword.addEventListener('click', function() {
            if (confirmPasswordInput.type === 'password') {
                confirmPasswordInput.type = 'text';
                toggleConfirmPassword.classList.remove('fa-eye');
                toggleConfirmPassword.classList.add('fa-eye-slash');
            } else {
                confirmPasswordInput.type = 'password';
                toggleConfirmPassword.classList.remove('fa-eye-slash');
                toggleConfirmPassword.classList.add('fa-eye');
            }
        });
    }

    // Real-time password validation
    newPasswordInput.addEventListener('input', function() {
        validatePassword(this.value);
        checkPasswordMatch();
    });

    confirmPasswordInput.addEventListener('input', function() {
        checkPasswordMatch();
    });

    function validatePassword(password) {
        const lengthReq = document.getElementById('length-req');
        const uppercaseReq = document.getElementById('uppercase-req');
        const lowercaseReq = document.getElementById('lowercase-req');
        const numberReq = document.getElementById('number-req');
        const specialReq = document.getElementById('special-req');

        // Length check
        if (password.length >= 12 && password.length <= 16) {
            lengthReq.querySelector('i').classList.remove('fa-times');
            lengthReq.querySelector('i').classList.add('fa-check');
            lengthReq.style.color = '#28a745';
        } else {
            lengthReq.querySelector('i').classList.remove('fa-check');
            lengthReq.querySelector('i').classList.add('fa-times');
            lengthReq.style.color = '#dc3545';
        }

        // Uppercase check
        if (/[A-Z]/.test(password)) {
            uppercaseReq.querySelector('i').classList.remove('fa-times');
            uppercaseReq.querySelector('i').classList.add('fa-check');
            uppercaseReq.style.color = '#28a745';
        } else {
            uppercaseReq.querySelector('i').classList.remove('fa-check');
            uppercaseReq.querySelector('i').classList.add('fa-times');
            uppercaseReq.style.color = '#dc3545';
        }

        // Lowercase check
        if (/[a-z]/.test(password)) {
            lowercaseReq.querySelector('i').classList.remove('fa-times');
            lowercaseReq.querySelector('i').classList.add('fa-check');
            lowercaseReq.style.color = '#28a745';
        } else {
            lowercaseReq.querySelector('i').classList.remove('fa-check');
            lowercaseReq.querySelector('i').classList.add('fa-times');
            lowercaseReq.style.color = '#dc3545';
        }

        // Number check
        if (/[0-9]/.test(password)) {
            numberReq.querySelector('i').classList.remove('fa-times');
            numberReq.querySelector('i').classList.add('fa-check');
            numberReq.style.color = '#28a745';
        } else {
            numberReq.querySelector('i').classList.remove('fa-check');
            numberReq.querySelector('i').classList.add('fa-times');
            numberReq.style.color = '#dc3545';
        }

        // Special character check
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            specialReq.querySelector('i').classList.remove('fa-times');
            specialReq.querySelector('i').classList.add('fa-check');
            specialReq.style.color = '#28a745';
        } else {
            specialReq.querySelector('i').classList.remove('fa-check');
            specialReq.querySelector('i').classList.add('fa-times');
            specialReq.style.color = '#dc3545';
        }
    }

    function checkPasswordMatch() {
        const passwordMatch = document.getElementById('passwordMatch');
        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        if (confirmPassword && newPassword !== confirmPassword) {
            passwordMatch.style.display = 'block';
            passwordMatch.querySelector('i').classList.remove('fa-check');
            passwordMatch.querySelector('i').classList.add('fa-times');
            passwordMatch.style.color = '#dc3545';
        } else if (confirmPassword && newPassword === confirmPassword) {
            passwordMatch.style.display = 'block';
            passwordMatch.querySelector('i').classList.remove('fa-times');
            passwordMatch.querySelector('i').classList.add('fa-check');
            passwordMatch.style.color = '#28a745';
            passwordMatch.querySelector('span').textContent = 'Passwords match';
        } else {
            passwordMatch.style.display = 'none';
        }
    }

    // Form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        // Validate passwords match
        if (newPassword !== confirmPassword) {
            showMessage('Passwords do not match', 'error');
            return;
        }

        // Validate password strength
        if (newPassword.length < 12 || newPassword.length > 16) {
            showMessage('Password must be 12-16 characters long', 'error');
            return;
        }

        if (!/[A-Z]/.test(newPassword)) {
            showMessage('Password must contain at least one uppercase letter', 'error');
            return;
        }

        if (!/[a-z]/.test(newPassword)) {
            showMessage('Password must contain at least one lowercase letter', 'error');
            return;
        }

        if (!/[0-9]/.test(newPassword)) {
            showMessage('Password must contain at least one number', 'error');
            return;
        }

        if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
            showMessage('Password must contain at least one special character', 'error');
            return;
        }

        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Changing Password...';

        try {
            const response = await fetch('../api/reset_password.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: userEmail,
                    newPassword: newPassword,
                    confirmPassword: confirmPassword
                })
            });

            const data = await response.json();

            if (data.success) {
                // Check if user came from profile page
                const cameFromProfile = sessionStorage.getItem('cameFromProfile') === 'true';
                
                // Clear OTP verification data but keep authentication
                sessionStorage.removeItem('otpVerified');
                sessionStorage.removeItem('otpVerifiedEmail');
                sessionStorage.removeItem('cameFromProfile');
                
                // Keep userEmail in localStorage so user stays logged in
                // Only clear OTP-related session data
                
                // Show success message
                showMessage('Password successfully changed!', 'success');
                
                // If user came from profile, redirect back to profile page with success flag
                if (cameFromProfile) {
                    // Set a flag to show success message on profile page
                    sessionStorage.setItem('passwordChangeSuccess', 'true');
                    setTimeout(() => {
                        window.location.href = '/laundry/dashboard/html/index.html';

                    }, 2000);
                } else {
                    // If coming from forgot password flow, redirect to login page
                    setTimeout(() => {
                        window.location.href = '/laundry/html/index.html';
                    }, 2000);
                }
            } else {
                showMessage(data.message || 'Failed to change password. Please try again.', 'error');
                submitButton.disabled = false;
                submitButton.textContent = 'Change Password';
            }
        } catch (error) {
            console.error('Error:', error);
            showMessage('Network error. Please try again.', 'error');
            submitButton.disabled = false;
            submitButton.textContent = 'Change Password';
        }
    });

    // Show message function
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
            animation: slideIn 0.3s ease-out;
        `;

        document.body.appendChild(messageDiv);

        // Remove message after 5 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.style.animation = 'slideIn 0.3s ease-out reverse';
                setTimeout(() => {
                    messageDiv.parentNode.removeChild(messageDiv);
                }, 300);
            }
        }, 5000);
    }
});

