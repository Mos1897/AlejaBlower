// OTP Verification - Cleaned & Fixed - v3.0
document.addEventListener('DOMContentLoaded', () => {
  const otpInputs = document.querySelectorAll('.otp-input');
  const errorMessage = document.getElementById('errorMessage');
  const successMessage = document.getElementById('successMessage');
  const resendLink = document.getElementById('resendLink');
  const otpForm = document.getElementById('otpForm');

  // ---- helpers (safe UI) ----
  function showErrorMessage(message) {
    const errorText = String(message || 'An unknown error occurred');
    if (!errorMessage) {
      alert('Error: ' + errorText);
      return;
    }
    errorMessage.textContent = errorText;
    errorMessage.style.display = 'block';

    if (successMessage) successMessage.style.display = 'none';

    setTimeout(() => {
      if (errorMessage) errorMessage.style.display = 'none';
    }, 5000);
  }

  function showSuccessMessage(message) {
    if (successMessage) {
      successMessage.textContent = message;
      successMessage.style.display = 'block';
    }
    if (errorMessage) errorMessage.style.display = 'none';
  }

  function clearOtpInputs() {
    otpInputs.forEach(i => (i.value = ''));
    if (otpInputs[0]) otpInputs[0].focus();
  }

  function applyPageCopy(type) {
    if (type === 'reset') {
      document.title = 'Password Reset - TigerTrack';
      const h1 = document.querySelector('h1');
      const p = document.querySelector('.header p');
      if (h1) h1.textContent = 'Reset your password';
      if (p) p.textContent = 'Enter the code sent to your email to reset your password';
    } else if (type === 'change_password') {
      document.title = 'Change Password Verification - TigerTrack';
      const h1 = document.querySelector('h1');
      const p = document.querySelector('.header p');
      if (h1) h1.textContent = 'Change your password';
      if (p) p.textContent = 'Enter the code sent to your email to change your password';
    }
  }

  // ---- get URL params ----
  const urlParams = new URLSearchParams(window.location.search);
  const emailFromUrl = urlParams.get('email');
  let type = urlParams.get('type'); // reset | register | login | change_password

  // default type
  if (!type) {
    type = emailFromUrl ? 'login' : 'register';
  }

  applyPageCopy(type);

  // focus first box
  if (otpInputs.length > 0) otpInputs[0].focus();

  // ---- OTP input behavior ----
  otpInputs.forEach((input, index) => {
    input.addEventListener('input', (e) => {
      const value = e.target.value;

      // only 1 digit
      if (!/^\d$/.test(value)) {
        e.target.value = '';
        return;
      }

      if (value && index < otpInputs.length - 1) {
        otpInputs[index + 1].focus();
      }

      checkOTPComplete();
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !e.target.value && index > 0) {
        otpInputs[index - 1].focus();
      }
      if (e.key === 'ArrowLeft' && index > 0) otpInputs[index - 1].focus();
      if (e.key === 'ArrowRight' && index < otpInputs.length - 1) otpInputs[index + 1].focus();
    });

    input.addEventListener('paste', (e) => {
      e.preventDefault();
      const pastedData = e.clipboardData.getData('text');
      const digits = pastedData.replace(/\D/g, '').slice(0, otpInputs.length);

      digits.split('').forEach((digit, i) => {
        if (otpInputs[i]) otpInputs[i].value = digit;
      });

      const nextIndex = Math.min(digits.length, otpInputs.length - 1);
      otpInputs[nextIndex].focus();

      checkOTPComplete();
    });
  });

  function getOtpValue() {
    return Array.from(otpInputs).map(i => i.value).join('');
  }

  function checkOTPComplete() {
    const allFilled = Array.from(otpInputs).every(i => i.value !== '');
    if (allFilled) verifyOTP(getOtpValue());
  }

 function handleSuccessRedirect(verificationType, normalizedEmail, rawEmail) {
  if (verificationType === 'login') {
    localStorage.setItem('userEmail', normalizedEmail);
    setTimeout(() => {
      console.log('OTP verified (login) - Redirecting to dashboard...');
      window.location.href = 'dashboard.html';
    }, 1000);
    return;
  }

  if (verificationType === 'reset' || verificationType === 'change_password') {
    sessionStorage.setItem('otpVerified', 'true');
    sessionStorage.setItem('otpVerifiedEmail', normalizedEmail);

    if (verificationType === 'change_password') {
      sessionStorage.setItem('cameFromProfile', 'true');
    }

    setTimeout(() => {
      console.log('OTP verified - Redirecting to change_password...');
      window.location.href = `change_password.html?email=${encodeURIComponent(rawEmail)}`;
    }, 1000);
    return;
  }

  // register (default)
  localStorage.setItem('userEmail', normalizedEmail);
  sessionStorage.removeItem('pendingEmail');
  setTimeout(() => {
    console.log('OTP verified (register) - Redirecting to dashboard...');
    window.location.href = 'dashboard.html';
  }, 1000);
}


  // ---- Verify OTP ----
  async function verifyOTP(otp) {
    // define these OUTSIDE try so catch can access safely
    const verificationType = type || 'register';
    let rawEmail = null;
    let normalizedEmail = null;

    try {
      // resolve email source
      if (verificationType === 'reset' || verificationType === 'login' || verificationType === 'change_password') {
        rawEmail = emailFromUrl;
        if (!rawEmail) {
          showErrorMessage('No email found. Please try again.');
          return;
        }
      } else {
        rawEmail = sessionStorage.getItem('pendingEmail');
        if (!rawEmail) {
          showErrorMessage('No pending email found. Please register again.');
          return;
        }
      }

      normalizedEmail = rawEmail.toLowerCase().trim();

      const requestData = {
        otp: otp.trim(),
        email: normalizedEmail,
        type: verificationType
      };

      console.log('=== OTP VERIFICATION REQUEST ===', requestData);

      const response = await fetch('/laundry/api/config/verify_otp.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      const responseText = await response.text();
      console.log('=== RESPONSE RECEIVED ===', response.status, responseText);

      let data = null;
      if (responseText && responseText.trim() !== '') {
        try {
          data = JSON.parse(responseText);
        } catch {
          throw new Error('Server returned invalid JSON.');
        }
      }

      if (!response.ok) {
        const msg = (data && (data.message || data.error)) || responseText || `Server error (Status: ${response.status})`;
        throw new Error(msg);
      }

      if (!data || !data.success) {
        throw new Error((data && (data.message || data.error)) || 'OTP verification failed');
      }

      showSuccessMessage(data.message || 'Verification successful!');
      handleSuccessRedirect(verificationType, normalizedEmail, rawEmail);

    } catch (error) {
      const msg = (error && error.message) ? error.message : 'Network error. Please try again.';
      showErrorMessage(msg);
      clearOtpInputs();
      console.error('OTP verify error:', error);
    }
  }

  // ---- Resend OTP ----
  if (resendLink) {
    resendLink.addEventListener('click', async () => {
      try {
        let userEmail;

        if (type === 'reset' || type === 'login' || type === 'change_password') {
          userEmail = emailFromUrl;
          if (!userEmail) {
            showErrorMessage('No email found. Please try again.');
            return;
          }
        } else {
          userEmail = sessionStorage.getItem('pendingEmail');
          if (!userEmail) {
            showErrorMessage('No pending email found. Please register again.');
            return;
          }
        }

        resendLink.style.pointerEvents = 'none';
        resendLink.textContent = 'Sending...';

        const response = await fetch('../api/config/resend_otp.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: userEmail })
        });

        const data = await response.json();

        if (data.success) showSuccessMessage('New code sent to your email');
        else showErrorMessage(data.message || 'Failed to resend code.');

        setTimeout(() => {
          if (successMessage) successMessage.style.display = 'none';
        }, 5000);

      } catch (error) {
        showErrorMessage('Failed to resend code. Please try again.');
        console.error('Resend error:', error);
      } finally {
        resendLink.style.pointerEvents = 'auto';
        resendLink.textContent = 'Resend now';
      }
    });
  }

  // Prevent form submit
  if (otpForm) {
    otpForm.addEventListener('submit', (e) => e.preventDefault());
  }
});