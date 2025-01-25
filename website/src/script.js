import { initializeDashboard, initializeModal } from './js/components.js';
import { loadPatientsSection } from './js/patients.js';

console.log('Script loaded');

document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM loaded');
    
    try {
        // Initialize components
        await initializeDashboard();
        await initializeModal();

        // Now that components are loaded, attach event listeners
        attachEventListeners();
    } catch (error) {
        console.error('Error initializing components:', error);
    }

    const sidebarLinks = document.querySelectorAll('.nav-links li');
    console.log('Sidebar links found:', sidebarLinks.length);

    // Show dashboard by default
    document.getElementById('dashboard-section').style.display = 'block';
    // Set dashboard link as active by default
    document.querySelector('.nav-links li[data-section="dashboard"]').classList.add('active');

    sidebarLinks.forEach(link => {
        console.log('Adding listener to:', link.querySelector('span').textContent);
        link.addEventListener('click', async function(e) {
            console.log('Click event fired on:', this.querySelector('span').textContent);
            
            // Remove active class from all links
            document.querySelectorAll('.nav-links li').forEach(l => l.classList.remove('active'));
            // Add active class to clicked link
            this.classList.add('active');
            
            // Get section name
            const section = this.querySelector('span').textContent.toLowerCase();
            
            // Hide all sections
            document.querySelectorAll('.content-section').forEach(s => s.style.display = 'none');
            
            try {
                // Show selected section
                switch(section) {
                    case 'dashboard':
                        const dashboardSection = document.getElementById('dashboard-section');
                        if (dashboardSection) {
                            dashboardSection.style.display = 'block';
                            await initializeDashboard();
                        }
                        break;
                    case 'patients':
                        const patientsSection = document.getElementById('patients-section');
                        patientsSection.style.display = 'block';
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
    if (newPatientForm) {
        newPatientForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const patientData = {
                firstName: document.getElementById('firstName').value,
                lastName: document.getElementById('lastName').value,
                roomNumber: document.getElementById('roomNumber').value,
                insuranceId: document.getElementById('insuranceId').value,
                condition: document.getElementById('condition').value,
                status: document.getElementById('status').value,
                vitals: document.getElementById('vitals').value,
                lastVisit: document.getElementById('lastVisit').value,
                dateAdmitted: new Date().toISOString(),
            };

            console.log('Patient Data JSON:', JSON.stringify(patientData, null, 2));
            this.reset();
            alert('Patient data has been saved!');
        });
    }

    // Modal controls
    const addPatientBtn = document.getElementById('addPatientBtn');
    const closeModalBtn = document.querySelector('.close-modal');
    const modal = document.getElementById('addPatientModal');

    if (addPatientBtn && modal) {
        addPatientBtn.addEventListener('click', () => {
            modal.style.display = 'flex';
        });
    } else {
        console.error('Add patient button or modal not found', { addPatientBtn, modal });
    }

    if (closeModalBtn && modal) {
        closeModalBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    // Close modal when clicking outside
    if (modal) {
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
} 