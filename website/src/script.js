import { initializeDashboard, initializeModal } from './js/components.js';
import { loadPatientsSection } from './js/patients.js';

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
            if (!modal || modal.style.display === 'none') return;
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
                const form = document.getElementById('newPatientForm');
                if (form) form.reset();
            }, 300);
        };

        window.showNotification = () => {
            const notification = document.querySelector('.notification-banner');
            notification.classList.add('show');
            setTimeout(() => {
                notification.classList.remove('show');
            }, 3000);
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
    // Form submission handler
    const newPatientForm = document.getElementById('newPatientForm');
    console.log('Found form:', newPatientForm);

    if (newPatientForm) {
        newPatientForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            console.log('Form submitted');
            
            // Get all form fields
            const formFields = {
                firstName: document.getElementById('firstName'),
                lastName: document.getElementById('lastName'),
                diagnosis: document.getElementById('diagnosis'),
                treatmentPhase: document.getElementById('treatmentPhase'),
                notes: document.getElementById('notes'),
                vitals: document.getElementById('vitals'),
                medications: document.getElementById('medications')
            };
            
            // Debug log available fields
            console.log('Available form fields:', formFields);
            
            const patientData = {
                firstName: formFields.firstName?.value || '',
                lastName: formFields.lastName?.value || '',
                diagnosis: formFields.diagnosis?.value || '',
                treatmentPhase: formFields.treatmentPhase?.value || '',
                notes: formFields.notes?.value || '',
                vitals: formFields.vitals?.value || '',
                medications: formFields.medications?.value || '',
                dateAdmitted: new Date().toISOString(),
            };

            console.log('Patient Data JSON:', JSON.stringify(patientData, null, 2));
            console.log('Attempting to close modal...');
            window.closeModal();
            console.log('Attempting to show notification...');
            window.showNotification();
        });
    }

    // Modal controls
    const addPatientBtn = document.getElementById('addPatientBtn');
    const closeModalBtn = document.querySelector('.close-modal');
    const modal = document.getElementById('addPatientModal');
    const cancelBtn = document.querySelector('.btn-secondary');

    console.log('Modal elements:', {
        addPatientBtn,
        closeModalBtn,
        modal,
        cancelBtn
    });

    if (addPatientBtn && modal) {
        addPatientBtn.addEventListener('click', () => {
            console.log('Opening modal...');
            modal.style.display = 'flex';
            modal.offsetHeight;
            modal.classList.add('show');
        });
    }

    // Close modal when clicking outside
    if (modal) {
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                console.log('Clicked outside modal, closing...');
                window.closeModal();
            }
        });
    }

    // Handle notification
    const notification = document.querySelector('.notification-banner');
    console.log('Found notification banner:', notification);

    window.closeModal = () => {
        const modal = document.getElementById('addPatientModal');
        console.log('Closing modal:', modal);
        if (!modal || modal.style.display === 'none') return;
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
            const form = document.getElementById('newPatientForm');
            if (form) form.reset();
            console.log('Modal closed and form reset');
        }, 300);
    };

    window.showNotification = () => {
        const notification = document.querySelector('.notification-banner');
        console.log('Showing notification:', notification);
        notification.classList.add('show');
        setTimeout(() => {
            notification.classList.remove('show');
            console.log('Notification hidden');
        }, 3000);
    };
} 