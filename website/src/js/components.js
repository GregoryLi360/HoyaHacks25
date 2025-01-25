import { addPatient, updatePatient } from './patientData.js';
import { refreshPatientsList } from './patients.js';

// Component loader utility
export async function loadComponent(path) {
    try {
        console.log(`Attempting to load component from: ../components/${path}.html`);
        const response = await fetch(`../components/${path}.html`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const html = await response.text();
        console.log(`Successfully loaded component: ${path}`);
        return html;
    } catch (error) {
        console.error(`Error loading component from ${path}:`, error);
        return '';
    }
}

// Component initialization functions
export async function initializeDashboard() {
    try {
        const dashboardHtml = await loadComponent('dashboard');
        document.getElementById('dashboard-section').innerHTML = dashboardHtml;
    } catch (error) {
        console.error('Error initializing dashboard:', error);
    }
}

export async function initializeModal() {
    const modalHtml = `
        <div class="modal-header">
            <h2>Add New Patient</h2>
            <button class="close-modal">
                <i class="material-icons">close</i>
            </button>
        </div>
        <div class="modal-body">
            <form id="newPatientForm">
                <div class="form-row">
                    <div class="form-group">
                        <label for="firstName">First Name</label>
                        <input type="text" id="firstName" required>
                    </div>
                    <div class="form-group">
                        <label for="lastName">Last Name</label>
                        <input type="text" id="lastName" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="mrn">MRN</label>
                        <input type="text" id="mrn" required>
                    </div>
                    <div class="form-group">
                        <label for="diagnosis">Diagnosis</label>
                        <input type="text" id="diagnosis" required>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-secondary close-modal">Cancel</button>
                    <button type="submit" class="btn-primary">Save Patient</button>
                </div>
            </form>
        </div>
    `;

    const modalContent = document.querySelector('#addPatientModal .modal-content');
    if (modalContent) {
        modalContent.innerHTML = modalHtml;
    }

    // Form submission handler
    const form = document.getElementById('newPatientForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const patientData = {
            firstName: form.querySelector('#firstName').value,
            lastName: form.querySelector('#lastName').value,
            mrn: form.querySelector('#mrn').value,
            diagnosis: form.querySelector('#diagnosis').value
        };

        try {
            if (form.dataset.mode === 'edit') {
                // Update existing patient
                await updatePatient(form.dataset.originalMrn, patientData);
                window.showNotification('edit');
            } else {
                // Add new patient
                await addPatient(patientData);
                window.showNotification('add');
            }

            // Reset form and close modal
            form.reset();
            delete form.dataset.mode;
            delete form.dataset.originalMrn;
            window.closeModal();

            // Refresh the patients list
            refreshPatientsList();
        } catch (error) {
            console.error('Error saving patient:', error);
            // TODO: Show error notification
        }
    });
} 