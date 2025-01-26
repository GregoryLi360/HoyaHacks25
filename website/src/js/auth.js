import notificationManager from './notifications.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const togglePassword = document.querySelector('.toggle-password');
    const passwordInput = document.getElementById('password');
    const usernameInput = document.getElementById('username');

    // Toggle password visibility
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            togglePassword.querySelector('i').textContent = type === 'password' ? 'visibility_off' : 'visibility';
        });
    }

    // Show error message
    function showError(input, message) {
        const formGroup = input.closest('.form-group');
        const errorMessage = formGroup.querySelector('.error-message');
        input.classList.add('error');
        if (errorMessage) {
            errorMessage.querySelector('span').textContent = message;
            errorMessage.classList.add('show');
        }
    }

    // Hide error message
    function hideError(input) {
        const formGroup = input.closest('.form-group');
        const errorMessage = formGroup.querySelector('.error-message');
        input.classList.remove('error');
        if (errorMessage) {
            errorMessage.classList.remove('show');
        }
    }

    // Input validation handlers
    if (usernameInput) {
        usernameInput.addEventListener('input', () => {
            if (!usernameInput.value.trim()) {
                showError(usernameInput, 'Username is required');
            } else {
                hideError(usernameInput);
            }
        });

        usernameInput.addEventListener('blur', () => {
            if (!usernameInput.value.trim()) {
                showError(usernameInput, 'Username is required');
            }
        });
    }

    if (passwordInput) {
        passwordInput.addEventListener('input', () => {
            if (!passwordInput.value) {
                showError(passwordInput, 'Password is required');
            } else {
                hideError(passwordInput);
            }
        });

        passwordInput.addEventListener('blur', () => {
            if (!passwordInput.value) {
                showError(passwordInput, 'Password is required');
            }
        });
    }

    // Handle form submission
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = usernameInput.value.trim();
            const password = passwordInput.value;
            const remember = document.getElementById('remember').checked;

            // Validate inputs
            let hasErrors = false;
            
            if (!username) {
                showError(usernameInput, 'Username is required');
                hasErrors = true;
            }

            if (!password) {
                showError(passwordInput, 'Password is required');
                hasErrors = true;
            }

            if (hasErrors) return;

            try {
                // Add loading state
                const submitBtn = loginForm.querySelector('button[type="submit"]');
                submitBtn.classList.add('loading');
                submitBtn.disabled = true;

                // Simulate API call
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // For demo purposes, check if username/password match
                if (username === 'admin' && password === 'admin') {
                    // Store auth token
                    const token = 'dummy_token';
                    if (remember) {
                        localStorage.setItem('auth_token', token);
                    } else {
                        sessionStorage.setItem('auth_token', token);
                    }

                    // Show success notification
                    notificationManager.show('Login successful! Redirecting...', 'success');

                    // Redirect to dashboard after a short delay
                    setTimeout(() => {
                        window.location.href = '/dashboard.html';
                    }, 1000);
                } else {
                    throw new Error('Invalid username or password');
                }
            } catch (error) {
                console.error('Login failed:', error);
                notificationManager.show(error.message || 'Login failed. Please try again.', 'error');
                
                // Remove loading state
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;
            }
        });
    }
});

// Handle user logout
window.handleLogout = function() {
    // Clear auth tokens
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
    
    // Redirect to auth page
    window.location.href = '/auth.html';
} 