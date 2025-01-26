document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const togglePassword = document.querySelector('.toggle-password');
    const passwordInput = document.getElementById('password');

    // Toggle password visibility
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            togglePassword.querySelector('i').textContent = type === 'password' ? 'visibility_off' : 'visibility';
        });
    }

    // Handle form submission
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const remember = document.getElementById('remember').checked;

            try {
                // TODO: Replace with actual authentication
                // For now, just redirect to dashboard
                console.log('Login attempt:', { email, remember });
                
                // Simulate API call
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // Store auth token (replace with actual token)
                if (remember) {
                    localStorage.setItem('auth_token', 'dummy_token');
                } else {
                    sessionStorage.setItem('auth_token', 'dummy_token');
                }

                // Redirect to dashboard
                window.location.href = '/dashboard.html';
            } catch (error) {
                console.error('Login failed:', error);
                // TODO: Show error message to user
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