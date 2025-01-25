// Component loader utility
export async function loadComponent(path) {
    try {
        const response = await fetch(`${path}.html`);
        const html = await response.text();
        return html;
    } catch (error) {
        console.error(`Error loading component from ${path}:`, error);
        return '';
    }
}

// Component initialization functions
export async function initializeDashboard() {
    try {
        const dashboardHtml = await loadComponent('/components/dashboard/dashboard');
        document.getElementById('dashboard-section').innerHTML = dashboardHtml;
    } catch (error) {
        console.error('Error initializing dashboard:', error);
    }
}

export async function initializeModal() {
    try {
        const modalHtml = await loadComponent('/components/modals/add-patient');
        const modalContainer = document.getElementById('addPatientModal');
        
        if (!modalContainer) {
            throw new Error('Modal container element not found');
        }

        const modalContent = modalContainer.querySelector('.modal-content');
        if (!modalContent) {
            throw new Error('Modal content container not found');
            return;
        }

        // Inject the HTML content
        modalContent.innerHTML = modalHtml;

        // Add event listeners for close buttons
        const closeButtons = modalContainer.querySelectorAll('.close-modal');
        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                window.closeModal();
            });
        });

        // Close modal when clicking outside
        modalContainer.addEventListener('click', (event) => {
            if (event.target === modalContainer) {
                window.closeModal();
            }
        });

        // Initialize form submission
        const form = modalContainer.querySelector('#newPatientForm');
        if (form) {
            form.addEventListener('submit', handleFormSubmit);
        }

    } catch (error) {
        console.error('Error initializing modal:', error);
    }
}

// Form submission handler
function handleFormSubmit(e) {
    e.preventDefault();
    
    console.log('Form submitted, closing modal and showing notification');
    
    const formFields = {
        firstName: document.getElementById('firstName'),
        lastName: document.getElementById('lastName'),
        diagnosis: document.getElementById('diagnosis'),
        treatmentPhase: document.getElementById('treatmentPhase'),
        notes: document.getElementById('notes'),
        vitals: document.getElementById('vitals'),
        medications: document.getElementById('medications')
    };
    
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
    // TODO: Add patient data to database

    window.closeModal();
    window.showNotification();
} 