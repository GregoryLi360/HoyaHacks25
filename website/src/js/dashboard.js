import { initializeModal } from './modal.js';
import notificationManager from './notifications.js';
import { initializeSidebar } from './components.js';

function setupModalControls() {
    const addPatientBtn = document.getElementById('addPatientBtn');
    const modal = document.getElementById('addPatientModal');

    if (addPatientBtn && modal) {
        addPatientBtn.addEventListener('click', () => {
            modal.style.display = 'flex';
            modal.offsetHeight; // Force reflow
            modal.classList.add('show');
        });
    }

    // Close modal handlers
    window.closeModal = () => {
        if (!modal) return;
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
            const form = document.getElementById('newPatientForm');
            if (form) form.reset();
        }, 300);
    };

    // Close on outside click
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            window.closeModal();
        }
    });

    // Close on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal?.classList.contains('show')) {
            window.closeModal();
        }
    });

    // Close buttons
    const closeButtons = document.querySelectorAll('.close-modal');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', window.closeModal);
    });
}

// Initialize the dashboard when the DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Initializing dashboard...');
    
    // Initialize sidebar
    await initializeSidebar('dashboard');
    
    // Initialize modal
    await initializeModal();
    
    // Setup modal controls
    setupModalControls();

    // Set up navigation
    const navLinks = document.querySelectorAll('.nav-links li');

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            const sectionId = link.dataset.section;
            if (!sectionId) return;

            console.log(`Navigating to section: ${sectionId}`);

            // Navigate to the appropriate page
            switch(sectionId) {
                case 'dashboard':
                    window.location.href = '/dashboard.html';
                    break;
                case 'patients':
                    window.location.href = '/patients.html';
                    break;
                case 'settings':
                    window.location.href = '/settings.html';
                    break;
            }
        });
    });

    // Initialize notifications
    window.showNotification = (type = 'add') => {
        const message = type === 'delete' ? 
            'Patient deleted successfully' : 
            'Patient data saved successfully';
        notificationManager.show(message, type);
    };

    // Handle logout
    window.handleLogout = () => {
        // Clear auth tokens
        localStorage.removeItem('auth_token');
        sessionStorage.removeItem('auth_token');
        // Redirect to auth page
        window.location.href = '/auth.html';
    };
}); 