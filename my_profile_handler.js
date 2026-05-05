// My Profile Handler - manages profile page interactions including change password
document.addEventListener('DOMContentLoaded', function() {
    initMyProfileHandlers();
});

// Export as window function so index_script can call it
window.initMyProfileHandlers = initMyProfileHandlers;

function initMyProfileHandlers() {
    console.log('Initializing my profile handlers...');
    
    // Use a short delay to ensure DOM is ready
    setTimeout(function() {
        const changePasswordBtn = document.querySelector('.change-password');
        console.log('Change password button found:', !!changePasswordBtn);
        
        if (!changePasswordBtn) {
            console.warn('Change password button not found - retrying...');
            setTimeout(initMyProfileHandlers, 500);
            return;
        }

        // Create modal container if it doesn't exist
        let modal = document.getElementById('changePasswordModal');
        if (!modal) {
            modal = createChangePasswordModal();
            document.body.appendChild(modal);
            console.log('Modal created');
        }

        // Handle button click
        changePasswordBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Change password button clicked');
            modal.style.display = 'flex';
            // Focus on first input
            setTimeout(() => {
                const newPasswordInput = document.getElementById('modalNewPassword');
                if (newPasswordInput) newPasswordInput.focus();
            }, 100);
        });

        // Close modal on X button
        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                modal.style.display = 'none';
            });
        }

        // Close modal when clicking outside
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });

        // Handle form submission
        const form = modal.querySelector('form');
        if (form) {
            form.addEventListener('submit', handleChangePassword);
        }
    }, 100);
}

function createChangePasswordModal() {
    const modal = document.createElement('div');
    modal.id = 'changePasswordModal';
    modal.className = 'modal';
    modal.style.cssText = `
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 2000;
        justify-content: center;
        align-items: center;
        flex-direction: column;
    `;

    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    modalContent.style.cssText = `
        background: white;
        padding: 30px;
        border-radius: 10px;
        width: 90%;
        max-width: 500px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        animation: slideIn 0.3s ease-out;
    `;

    modalContent.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="margin: 0; font-size: 1.5em;">Change Password</h2>
            <button type="button" class="modal-close" style="background: none; border: none; font-size: 1.5em; cursor: pointer; color: #666;">
                <i class="fas fa-times"></i>
            </button>
        </div>

        <form id="inlineChangePasswordForm">
            <div style="margin-bottom: 20px;">
                <label for="modalNewPassword" style="display: block; margin-bottom: 8px; font-weight: 600;">New Password</label>
                <div style="position: relative;">
                    <input type="password" id="modalNewPassword" placeholder="Enter new password" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 1em; box-sizing: border-box;" />
                    <i class="fas fa-eye" id="modalToggleNewPassword" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); cursor: pointer; color: #666;"></i>
                </div>
            </div>

            <div style="margin-bottom: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 5px; border-left: 4px solid #007bff;">
                <h4 style="margin: 0 0 10px 0; font-size: 0.9em;">Password Requirements:</h4>
                <div id="modalPasswordRequirements" style="font-size: 0.85em;">
                    <div id="modalLength-req" style="margin-bottom: 5px; color: #dc3545;"><i class="fas fa-times" style="margin-right: 5px;"></i><span>12-16 characters long</span></div>
                    <div id="modalUppercase-req" style="margin-bottom: 5px; color: #dc3545;"><i class="fas fa-times" style="margin-right: 5px;"></i><span>One uppercase letter</span></div>
                    <div id="modalLowercase-req" style="margin-bottom: 5px; color: #dc3545;"><i class="fas fa-times" style="margin-right: 5px;"></i><span>One lowercase letter</span></div>
                    <div id="modalNumber-req" style="margin-bottom: 5px; color: #dc3545;"><i class="fas fa-times" style="margin-right: 5px;"></i><span>One number</span></div>
                    <div id="modalSpecial-req" style="margin-bottom: 0; color: #dc3545;"><i class="fas fa-times" style="margin-right: 5px;"></i><span>One special character</span></div>
                </div>
            </div>

            <div style="margin-bottom: 20px;">
                <label for="modalConfirmPassword" style="display: block; margin-bottom: 8px; font-weight: 600;">Confirm Password</label>
                <div style="position: relative;">
                    <input type="password" id="modalConfirmPassword" placeholder="Confirm new password" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 1em; box-sizing: border-box;" />
                    <i class="fas fa-eye" id="modalToggleConfirmPassword" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); cursor: pointer; color: #666;"></i>
                </div>
            </div>

            <div id="modalPasswordMatch" style="display: none; margin-bottom: 20px; padding: 10px; border-radius: 5px; color: #dc3545; background-color: #f8d7da; border: 1px solid #f5c6cb;">
                <i class="fas fa-times" style="margin-right: 5px;"></i><span>Passwords do not match</span>
            </div>

            <div style="display: flex; gap: 10px;">
                <button type="submit" style="flex: 1; padding: 12px; background-color: #28a745; color: white; border: none; border-radius: 5px; font-weight: 600; cursor: pointer; font-size: 1em;">Change Password</button>
                <button type="button" class="modal-cancel" style="flex: 1; padding: 12px; background-color: #6c757d; color: white; border: none; border-radius: 5px; font-weight: 600; cursor: pointer; font-size: 1em;">Cancel</button>
            </div>
        </form>
    `;

    modal.appendChild(modalContent);

    // Add event listeners for toggle visibility and validation
    const newPassInput = modal.querySelector('#modalNewPassword');
    const confirmPassInput = modal.querySelector('#modalConfirmPassword');
    const toggleNewPass = modal.querySelector('#modalToggleNewPassword');
    const toggleConfirmPass = modal.querySelector('#modalToggleConfirmPassword');
    const cancelBtn = modal.querySelector('.modal-cancel');

    if (toggleNewPass) {
        toggleNewPass.addEventListener('click', function() {
            if (newPassInput.type === 'password') {
                newPassInput.type = 'text';
                toggleNewPass.classList.remove('fa-eye');
                toggleNewPass.classList.add('fa-eye-slash');
            } else {
                newPassInput.type = 'password';
                toggleNewPass.classList.remove('fa-eye-slash');
                toggleNewPass.classList.add('fa-eye');
            }
        });
    }

    if (toggleConfirmPass) {
        toggleConfirmPass.addEventListener('click', function() {
            if (confirmPassInput.type === 'password') {
                confirmPassInput.type = 'text';
                toggleConfirmPass.classList.remove('fa-eye');
                toggleConfirmPass.classList.add('fa-eye-slash');
            } else {
                confirmPassInput.type = 'password';
                toggleConfirmPass.classList.remove('fa-eye-slash');
                toggleConfirmPass.classList.add('fa-eye');
            }
        });
    }

    if (newPassInput) {
        newPassInput.addEventListener('input', function() {
            validatePassword(this.value, modal);
            checkPasswordMatch(modal);
        });
    }

    if (confirmPassInput) {
        confirmPassInput.addEventListener('input', function() {
            checkPasswordMatch(modal);
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            modal.style.display = 'none';
        });
    }

    return modal;
}

function validatePassword(password, modal) {
    const lengthReq = modal.querySelector('#modalLength-req');
    const uppercaseReq = modal.querySelector('#modalUppercase-req');
    const lowercaseReq = modal.querySelector('#modalLowercase-req');
    const numberReq = modal.querySelector('#modalNumber-req');
    const specialReq = modal.querySelector('#modalSpecial-req');

    // Length check
    if (password.length >= 12 && password.length <= 16) {
        updateReq(lengthReq, true);
    } else {
        updateReq(lengthReq, false);
    }

    // Uppercase check
    updateReq(uppercaseReq, /[A-Z]/.test(password));

    // Lowercase check
    updateReq(lowercaseReq, /[a-z]/.test(password));

    // Number check
    updateReq(numberReq, /[0-9]/.test(password));

    // Special character check
    updateReq(specialReq, /[!@#$%^&*(),.?":{}|<>]/.test(password));
}

function updateReq(element, isValid) {
    const icon = element.querySelector('i');
    if (isValid) {
        icon.classList.remove('fa-times');
        icon.classList.add('fa-check');
        element.style.color = '#28a745';
    } else {
        icon.classList.remove('fa-check');
        icon.classList.add('fa-times');
        element.style.color = '#dc3545';
    }
}

function checkPasswordMatch(modal) {
    const newPassInput = modal.querySelector('#modalNewPassword');
    const confirmPassInput = modal.querySelector('#modalConfirmPassword');
    const matchIndicator = modal.querySelector('#modalPasswordMatch');

    if (confirmPassInput.value && newPassInput.value !== confirmPassInput.value) {
        matchIndicator.style.display = 'block';
        matchIndicator.style.backgroundColor = '#f8d7da';
        matchIndicator.style.color = '#dc3545';
        matchIndicator.style.borderColor = '#f5c6cb';
        matchIndicator.querySelector('i').classList.remove('fa-check');
        matchIndicator.querySelector('i').classList.add('fa-times');
        matchIndicator.querySelector('span').textContent = 'Passwords do not match';
    } else if (confirmPassInput.value && newPassInput.value === confirmPassInput.value) {
        matchIndicator.style.display = 'block';
        matchIndicator.style.backgroundColor = '#d4edda';
        matchIndicator.style.color = '#28a745';
        matchIndicator.style.borderColor = '#c3e6cb';
        matchIndicator.querySelector('i').classList.remove('fa-times');
        matchIndicator.querySelector('i').classList.add('fa-check');
        matchIndicator.querySelector('span').textContent = 'Passwords match';
    } else {
        matchIndicator.style.display = 'none';
    }
}

async function handleChangePassword(e) {
    e.preventDefault();

    const modal = document.getElementById('changePasswordModal');
    const newPassword = modal.querySelector('#modalNewPassword').value;
    const confirmPassword = modal.querySelector('#modalConfirmPassword').value;

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

    // Get user email from localStorage
    const userEmail = localStorage.getItem('userEmail') || sessionStorage.getItem('userEmail');
    if (!userEmail) {
        showMessage('User email not found. Please log in again.', 'error');
        return;
    }

    const submitButton = modal.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Changing Password...';

    try {
        // Try multiple API paths (similar to forgot_password_script.js)
        const apiCandidates = [
            '/laundry/api/reset_password.php',
            '../../api/reset_password.php',
            '../api/reset_password.php',
            '/api/reset_password.php'
        ];

        async function tryFetchCandidates(candidates, options) {
            for (const url of candidates) {
                try {
                    console.log('Attempting API:', url);
                    const resp = await fetch(url, options);
                    console.log('Response from', url, 'status', resp.status);
                    if (resp && resp.status < 500) return resp;
                } catch (e) {
                    console.warn('Fetch failed for', url, e);
                }
            }
            throw new Error('All API endpoints returned error');
        }

        const response = await tryFetchCandidates(apiCandidates, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: userEmail,
                newPassword: newPassword,
                confirmPassword: confirmPassword
            })
        });

        const data = await response.json();

        if (data.success) {
            showMessage('Password successfully changed!', 'success');
            // Clear form
            modal.querySelector('form').reset();
            // Close modal after 1.5s
            setTimeout(() => {
                modal.style.display = 'none';
                submitButton.disabled = false;
                submitButton.textContent = 'Change Password';
            }, 1500);
        } else {
            showMessage(data.message || 'Failed to change password. Please try again.', 'error');
            submitButton.disabled = false;
            submitButton.textContent = 'Change Password';
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage(error.message || 'Network error. Please try again.', 'error');
        submitButton.disabled = false;
        submitButton.textContent = 'Change Password';
    }
}

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
        border-radius: 5px;
        color: white;
        font-weight: bold;
        z-index: 3000;
        max-width: 300px;
        word-wrap: break-word;
        ${type === 'success' ? 'background-color: #28a745;' : 'background-color: #dc3545;'}
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
