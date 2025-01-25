import { initializeDashboard, initializeModal } from './js/components.js';
import { loadPatientsSection } from './js/patients.js';
import notificationManager from './js/notifications.js';

console.log('Script loaded');

document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM loaded');
    
    try {
        // Initialize components
        await initializeDashboard();
        await initializeModal();

        // Define utility functions
        window.closeModal = () => {
            const modal = document.getElementById('addPatientModal');
            console.log('Closing modal');
            if (!modal || modal.style.display === 'none') return;
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
                const form = document.getElementById('newPatientForm');
                if (form) form.reset();
            }, 300);
        };

        // Add escape key handler
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                window.closeModal();
            }
        });

        // Replace the old notification function with the new one
        window.showNotification = (type = 'add') => {
            const message = type === 'delete' ? 
                'Patient deleted successfully' : 
                'Patient data saved successfully';
            notificationManager.show(message, type);
        };

        // Now that components are loaded, attach event listeners
        attachEventListeners();
    } catch (error) {
        console.error('Error initializing components:', error);
    }

    const sidebarLinks = document.querySelectorAll('.nav-links li');
    console.log('Sidebar links found:', sidebarLinks.length);

    // Show dashboard by default
    const dashboardSection = document.getElementById('dashboard-section');
    if (dashboardSection) {
        dashboardSection.style.display = 'block';
        // Add small delay to trigger animation
        setTimeout(() => {
            dashboardSection.classList.add('active');
        }, 10);
    }
    
    // Set dashboard link as active by default
    document.querySelector('.nav-links li[data-section="dashboard"]').classList.add('active');

    sidebarLinks.forEach(link => {
        console.log('Adding listener to:', link.querySelector('span').textContent);
        link.addEventListener('click', async function(e) {
            console.log('Click event fired on:', this.querySelector('span').textContent);
            
            // Remove active class from all links
            document.querySelectorAll('.nav-links li').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            const section = this.querySelector('span').textContent.toLowerCase();
            
            // Get current active section
            const currentSection = document.querySelector('.content-section.active');
            
            // Hide current section with transition
            if (currentSection) {
                currentSection.classList.remove('active');
                await new Promise(resolve => setTimeout(resolve, 300)); // Wait for transition
            }
            
            document.querySelectorAll('.content-section').forEach(s => {
                s.style.display = 'none';
            });
            
            try {
                // Show selected section
                switch(section) {
                    case 'dashboard':
                        const dashboardSection = document.getElementById('dashboard-section');
                        if (dashboardSection) {
                            dashboardSection.style.display = 'block';
                            requestAnimationFrame(() => {
                                dashboardSection.classList.add('active');
                            });
                        }
                        break;
                    case 'patients':
                        const patientsSection = document.getElementById('patients-section');
                        patientsSection.style.display = 'block';
                        setTimeout(() => {
                            patientsSection.classList.add('active');
                        }, 10);
                        loadPatientsSection();
                        break;
                    case 'doctors':
                        document.getElementById('doctors-section').style.display = 'block';
                        break;
                    case 'analytics':
                        document.getElementById('analytics-section').style.display = 'block';
                        break;
                    case 'settings':
                        document.getElementById('settings-section').style.display = 'block';
                        break;
                }
            } catch (error) {
                console.error(`Error handling section ${section}:`, error);
            }
        });
    });
});

function attachEventListeners() {
    // Modal controls
    const addPatientBtn = document.getElementById('addPatientBtn');
    const modal = document.getElementById('addPatientModal');

    if (addPatientBtn && modal) {
        addPatientBtn.addEventListener('click', () => {
            modal.style.display = 'flex';
            modal.offsetHeight;
            modal.classList.add('show');
        });
    }

    // Modal close handlers
    if (modal) {
        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                window.closeModal();
            }
        });

        // Close modal with escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.style.display === 'flex') {
                window.closeModal();
            }
        });
    }

    // Handle notification close button
    const notification = document.querySelector('.notification-banner');
    const closeNotificationBtn = notification?.querySelector('.close-notification');
    if (closeNotificationBtn) {
        closeNotificationBtn.addEventListener('click', () => {
            notification.classList.remove('show');
        });
    }

    // Handle all modal close buttons (both X and Cancel)
    const closeModalBtns = modal?.querySelectorAll('.close-modal');
    if (closeModalBtns) {
        closeModalBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                window.closeModal();
            });
        });
    }
} 