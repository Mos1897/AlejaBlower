//index-login/register fucntion animation 
const container = document.getElementById("container");
const registerButton = document.getElementById("register");
const loginButton = document.getElementById("login");

registerButton.addEventListener("click", () => {
  container.classList.add("active");
  clearSignInForm();
});

loginButton.addEventListener("click", () => {
  container.classList.remove("active");
  clearSignUpForm();
});

// Function to clear sign-in form
const clearSignInForm = () => {
  document.getElementById("signin-email").value = "";
  document.getElementById("signin-password").value = "";
  
  // Clear email validation
  const emailValidation = document.getElementById("signin-email-validation");
  emailValidation.classList.remove("valid", "invalid", "show");
  document.getElementById("signin-email").style.borderColor = "";
};

// Function to clear sign-up form
const clearSignUpForm = () => {
  document.getElementById('signup-name').value = "";
  document.getElementById("signup-email").value = "";
  document.getElementById("signup-password").value = "";
  document.getElementById("confirm-password").value = "";
  
  // Clear email validation
  const emailValidation = document.getElementById("signup-email-validation");
  emailValidation.classList.remove("valid", "invalid", "show");
  document.getElementById("signup-email").style.borderColor = "";
  
  // Clear password requirements
  const requirementsDiv = document.querySelector(".password-requirements");
  requirementsDiv.classList.remove("show");
  
  // Clear password match indicator
  const matchIndicator = document.getElementById("password-match-indicator");
  matchIndicator.classList.remove("show", "valid", "invalid");
  
  // Clear password field borders
  document.getElementById("signup-password").style.borderColor = "";
  document.getElementById("confirm-password").style.borderColor = "";
  
  // Reset all requirement indicators
  const requirements = ["length-req", "uppercase-req", "lowercase-req", "number-req", "special-req"];
  requirements.forEach(reqId => {
    const requirement = document.getElementById(reqId);
    const icon = requirement.querySelector("i");
    requirement.classList.remove("valid", "invalid");
    icon.classList.remove("fa-check");
    icon.classList.add("fa-times");
  });
}; 

// Password toggle functionality
const togglePassword = (inputId, iconId) => {
  const passwordInput = document.getElementById(inputId);
  const toggleIcon = document.getElementById(iconId);
  
  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    toggleIcon.classList.remove("fa-eye");
    toggleIcon.classList.add("fa-eye-slash");
  } else {
    passwordInput.type = "password";
    toggleIcon.classList.remove("fa-eye-slash");
    toggleIcon.classList.add("fa-eye");
  }
};

// Add event listeners for password toggles
document.getElementById("toggle-signup-password").addEventListener("click", () => {
  togglePassword("signup-password", "toggle-signup-password");
});

document.getElementById("toggle-confirm-password").addEventListener("click", () => {
  togglePassword("confirm-password", "toggle-confirm-password");
});

document.getElementById("toggle-signin-password").addEventListener("click", () => {
  togglePassword("signin-password", "toggle-signin-password");
});

// Password validation
const validatePassword = (password) => {
  const hasLength = password.length >= 12 && password.length <= 16;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  return { hasLength, hasUppercase, hasLowercase, hasNumber, hasSpecial };
};

const updateRequirementIndicator = (requirementId, isValid) => {
  const requirement = document.getElementById(requirementId);
  const icon = requirement.querySelector("i");
  
  if (isValid) {
    requirement.classList.remove("invalid");
    requirement.classList.add("valid");
    icon.classList.remove("fa-times");
    icon.classList.add("fa-check");
  } else {
    requirement.classList.remove("valid");
    requirement.classList.add("invalid");
    icon.classList.remove("fa-check");
    icon.classList.add("fa-times");
  }
};

// Add event listener for password validation
document.getElementById("signup-password").addEventListener("input", (e) => {
  const password = e.target.value;
  const requirementsDiv = document.querySelector(".password-requirements");
  const confirmPassword = document.getElementById("confirm-password").value;
  const matchIndicator = document.getElementById("password-match-indicator");
  
  // Show/hide requirements based on whether user has started typing
  if (password.length > 0) {
    requirementsDiv.classList.add("show");
  } else {
    requirementsDiv.classList.remove("show");
  }
  
  // Update password match indicator if confirm password has content
  if (confirmPassword.length > 0) {
    const icon = matchIndicator.querySelector("i");
    const span = matchIndicator.querySelector("span");
    
    matchIndicator.classList.add("show");
    
    if (password === confirmPassword) {
      matchIndicator.classList.remove("invalid");
      matchIndicator.classList.add("valid");
      icon.classList.remove("fa-times");
      icon.classList.add("fa-check");
      span.textContent = "Passwords match";
    } else {
      matchIndicator.classList.remove("valid");
      matchIndicator.classList.add("invalid");
      icon.classList.remove("fa-check");
      icon.classList.add("fa-times");
      span.textContent = "Passwords do not match";
    }
  }
  
  const validation = validatePassword(password);
  
  updateRequirementIndicator("length-req", validation.hasLength);
  updateRequirementIndicator("uppercase-req", validation.hasUppercase);
  updateRequirementIndicator("lowercase-req", validation.hasLowercase);
  updateRequirementIndicator("number-req", validation.hasNumber);
  updateRequirementIndicator("special-req", validation.hasSpecial);
});

// Confirm password validation
document.getElementById("confirm-password").addEventListener("input", (e) => {
  const confirmPassword = e.target.value;
  const originalPassword = document.getElementById("signup-password").value;
  const matchIndicator = document.getElementById("password-match-indicator");
  const icon = matchIndicator.querySelector("i");
  const span = matchIndicator.querySelector("span");
  
  if (confirmPassword.length > 0 && originalPassword.length > 0) {
    matchIndicator.classList.add("show");
    
    if (confirmPassword === originalPassword) {
      matchIndicator.classList.remove("invalid");
      matchIndicator.classList.add("valid");
      icon.classList.remove("fa-times");
      icon.classList.add("fa-check");
      span.textContent = "Passwords match";
      e.target.style.borderColor = "#10b981";
    } else {
      matchIndicator.classList.remove("valid");
      matchIndicator.classList.add("invalid");
      icon.classList.remove("fa-check");
      icon.classList.add("fa-times");
      span.textContent = "Passwords do not match";
      e.target.style.borderColor = "#ef4444";
    }
  } else {
    matchIndicator.classList.remove("show", "valid", "invalid");
    e.target.style.borderColor = "";
  }
});

// Email validation
const validateEmail = (email) => {
  const emailRegex = /^[^@]+@[^@]+\.[^@]+$/;
  return emailRegex.test(email);
};

const updateEmailValidation = (emailInputId, validationDivId) => {
  const emailInput = document.getElementById(emailInputId);
  const validationDiv = document.getElementById(validationDivId);
  const icon = validationDiv.querySelector("i");
  const span = validationDiv.querySelector("span");
  
  const email = emailInput.value;
  
  if (email.length === 0) {
    validationDiv.classList.remove("valid", "invalid");
    emailInput.style.borderColor = "";
  } else if (validateEmail(email)) {
    validationDiv.classList.remove("invalid");
    validationDiv.classList.add("valid");
    icon.classList.remove("fa-times");
    icon.classList.add("fa-check");
    span.textContent = "Valid email address";
    emailInput.style.borderColor = "#10b981";
  } else {
    validationDiv.classList.remove("valid");
    validationDiv.classList.add("invalid");
    icon.classList.remove("fa-check");
    icon.classList.add("fa-times");
    span.textContent = "Please enter a valid email address";
    emailInput.style.borderColor = "#ef4444";
  }
};

// Add email validation event listeners
document.getElementById("signup-email").addEventListener("input", () => {
  updateEmailValidation("signup-email", "signup-email-validation");
});

document.getElementById("signin-email").addEventListener("input", () => {
  updateEmailValidation("signin-email", "signin-email-validation");
});

// Form submission handlers
document.addEventListener('DOMContentLoaded', function() {
  // Load saved credentials if remember me was checked
  const rememberedEmail = localStorage.getItem('rememberedEmail');
  const rememberedPassword = localStorage.getItem('rememberedPassword');
  const rememberMeChecked = localStorage.getItem('rememberMe') === 'true';

  if (rememberedEmail && rememberedPassword && rememberMeChecked) {
    document.getElementById('signin-email').value = rememberedEmail;
    document.getElementById('signin-password').value = rememberedPassword;
    document.getElementById('remember-me').checked = true;
  }

  // Sign up form submission
  const signUpForm = document.querySelector('.sign-up form');

  if (!signUpForm) {
    console.error('Sign up form not found!');
    return;
  }
  
  signUpForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    // Validate form
    if (!name || !email || !password || !confirmPassword) {
      showMessage('Please fill in all fields', 'error');
      return;
    }
    
    if (!validateEmail(email)) {
      showMessage('Please enter a valid email address', 'error');
      return;
    }
    
    if (password !== confirmPassword) {
      showMessage('Passwords do not match', 'error');
      return;
    }
    
    const validation = validatePassword(password);
    if (!validation.hasLength || !validation.hasUppercase || !validation.hasLowercase || !validation.hasNumber || !validation.hasSpecial) {
      showMessage('Password does not meet requirements', 'error');
      return;
    }
    
    try {
      // Adjusted API path to match project structure: /laundry/api/register.php
      const response = await fetch('/laundry/api/register.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name,
          email: email,
          password: password,
          confirmPassword: confirmPassword
        })
      });
      
      const data = await response.json();

      // Check if response is ok
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }
      
      if (data.success) {
        showMessage(data.message, 'success');
        // Store email for OTP verification
        sessionStorage.setItem('pendingEmail', data.data.email);

        // Redirect to OTP page
        setTimeout(() => {
          window.location.href = 'otp.html?type=register';
        }, 1000);
      } else {
        showMessage(data.message, 'error');
      }
    } catch (error) {
      console.error('Registration error:', error);
      showMessage(error.message || 'Network error. Please try again.', 'error');
    }
  });
  
  // Sign in form submission
  const signInForm = document.querySelector('.sign-in form');
  signInForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('signin-email').value;
    const password = document.getElementById('signin-password').value;
    const rememberMe = document.getElementById('remember-me').checked;
    
    // Validate form
    if (!email || !password) {
      showMessage('Please fill in all fields', 'error');
      return;
    }
    
    if (!validateEmail(email)) {
      showMessage('Please enter a valid email address', 'error');
      return;
    }
    
    // Save credentials if remember me is checked
    if (rememberMe) {
      localStorage.setItem('rememberedEmail', email);
      localStorage.setItem('rememberedPassword', password);
      localStorage.setItem('rememberMe', 'true');
    } else {
      // Clear saved credentials
      localStorage.removeItem('rememberedEmail');
      localStorage.removeItem('rememberedPassword');
      localStorage.removeItem('rememberMe');
    }
    
    try {
      const response = await fetch('/laundry/api/login.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password
        })
      });
      
      const data = await response.json();

      if (data.success) {
        showMessage(data.message, 'success');
        // Redirect to OTP verification page for login
        setTimeout(() => {
          // Pass email in URL for OTP verification
          window.location.href = 'otp.html?type=login&email=' + encodeURIComponent(data.data.email);
        }, 1000);
      } else {
        showMessage(data.message, 'error');
      }
    } catch (error) {
      showMessage('Network error. Please try again.', 'error');
      console.error('Error:', error);
    }
  });
});

// Message display function
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