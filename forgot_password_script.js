// Forgot Password Script - Fixed and Improved
// version 2 – logs a message so we can verify it's the updated file
console.log('forgot_password_script.js loaded (v2)');
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('forgotPasswordForm') || document.querySelector('form');
    const emailInput = document.getElementById('email');
    
    if (!form || !emailInput) {
        console.error('Form or email input not found!');
        return;
    }
    
    // Get button
    const submitButton = document.getElementById('sendResetButton') || form.querySelector('button[type="button"]') || form.querySelector('button[type="submit"]');
    
    // Store the email value - simplified approach
    let lastEmailValue = emailInput.value ? emailInput.value.trim() : '';
    let isSubmitting = false;
    
    // Simple backup mechanism - just save the value when user types
    emailInput.addEventListener('input', function() {
        lastEmailValue = this.value.trim();
    });
    
    // Prevent form reset from clearing email
    form.addEventListener('reset', function(e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        emailInput.value = lastEmailValue;
        return false;
    });
    
    // Handle button click - primary submission method
    submitButton.addEventListener('click', async function(e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        // Get email value - from input first, then fallback to stored value
        let email = emailInput.value.trim();
        
        // If input is empty, try stored value
        if (!email && lastEmailValue) {
            email = lastEmailValue;
            emailInput.value = email;
        }
        
        // Check if email is empty
        if (!email) {
            showMessage('Please enter your email address', 'error');
            return;
        }
        
        // Normalize email - lowercase and trim
        email = email.toLowerCase().trim();
        lastEmailValue = email;
        
        // Skip aggressive client-side validation – rely on the server.
        // This avoids false negatives when users paste emails containing
        // non‑standard whitespace or unusual but valid characters.
        // However we still make sure there is at least an '@' symbol.
        if (!email.includes('@')) {
            showMessage('Please enter a valid email address.', 'error');
            return;
        }
        
        // Disable button and show loading state
        submitButton.disabled = true;
        submitButton.textContent = 'Sending...';
        isSubmitting = true;
        
        // Ensure email stays visible
        emailInput.value = email;
        
        try {
            // Try multiple possible API locations
            const apiCandidates = [
                '/laundry/api/forgot_password.php',
                '../../api/forgot_password.php',
                '../api/forgot_password.php',
                '/api/forgot_password.php'
            ];

            async function tryFetchCandidates(candidates, options) {
                for (const url of candidates) {
                    try {
                        console.log('Attempting API:', url);
                        const resp = await fetch(url, options);
                        console.log('Response from', url, 'status', resp.status);
                        
                        if (resp && resp.status < 500) {
                            return resp;
                        }
                    } catch (e) {
                        console.warn('Fetch failed for', url, e);
                    }
                }
                throw new Error('Unable to connect to server. Please try again.');
            }

            const response = await tryFetchCandidates(apiCandidates, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email })
            });

            // Get response
            const responseText = await response.text();
            console.log('Response status:', response.status);
            console.log('Response text:', responseText);
            
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error('Failed to parse JSON:', parseError);
                throw new Error('Server returned an invalid response. Please try again.');
            }
            
            // Keep email visible
            emailInput.value = email;
            
            if (data.success) {
                showMessage(data.message, 'success');
                // Redirect to OTP page
                setTimeout(() => {
                    window.location.href = `otp.html?type=reset&email=${encodeURIComponent(email)}`;
                }, 1500);
            } else {
                // Show the specific error from server
                // Map server errors to user-friendly messages
                let errorMessage = data.message || 'Failed to send reset code. Please try again.';
                
                // Customize messages for common errors
                if (errorMessage.includes('No account found') || errorMessage.includes('Email not found')) {
                    errorMessage = 'No account found with this email address. Please check your typing or register first.';
                } else if (errorMessage.includes('not verified')) {
                    errorMessage = 'Your account is not verified. Please verify your email first.';
                } else if (errorMessage.includes('Invalid email format')) {
                    errorMessage = 'The email format appears invalid. Please check and try again.';
                }
                
                showMessage(errorMessage, 'error');
                emailInput.focus();
            }
        } catch (error) {
            console.error('Error:', error);
            showMessage(error.message || 'Network error. Please check your connection and try again.', 'error');
            emailInput.focus();
        } finally {
            // Re-enable button
            submitButton.disabled = false;
            submitButton.textContent = 'Send Reset Link';
            isSubmitting = false;
            emailInput.value = email;
        }
    });
    
    // Prevent default form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
    }, { capture: true });

    // Show message function - improved with better styling
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
            max-width: 350px;
            word-wrap: break-word;
            font-family: "Josefin Sans", sans-serif;
            ${type === 'success' ? 'background-color: #2563eb;' : 'background-color: #ef4444;'}
            animation: slideIn 0.3s ease-out;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;

        document.body.appendChild(messageDiv);

        // Remove message after 5 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.style.animation = 'slideIn 0.3s ease-out reverse';
                setTimeout(() => {
                    if (messageDiv.parentNode) {
                        messageDiv.parentNode.removeChild(messageDiv);
                    }
                }, 300);
            }
        }, 5000);
    }
});

