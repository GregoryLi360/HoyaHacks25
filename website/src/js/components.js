import { addPatient, updatePatient, getPatients } from './patientData.js';
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
            <div class="form-error-message"></div>
            <form id="newPatientForm" novalidate>
                <div class="form-row">
                    <div class="form-group">
                        <label for="firstName">First Name</label>
                        <input type="text" id="firstName">
                        <div class="field-error-message">First name is required</div>
                    </div>
                    <div class="form-group">
                        <label for="lastName">Last Name</label>
                        <input type="text" id="lastName">
                        <div class="field-error-message">Last name is required</div>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="mrn">Medical Record Number</label>
                        <input type="text" id="mrn">
                        <div class="field-error-message">Medical Record Number is required</div>
                    </div>
                    <div class="form-group">
                        <label for="diagnosis">Diagnosis</label>
                        <input type="text" id="diagnosis">
                        <div class="field-error-message">Diagnosis is required</div>
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

    // Form validation and submission handler
    const form = document.getElementById('newPatientForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Clear previous errors
        clearErrors();

        const formData = {
            firstName: form.querySelector('#firstName').value.trim(),
            lastName: form.querySelector('#lastName').value.trim(),
            mrn: form.querySelector('#mrn').value.trim(),
            diagnosis: form.querySelector('#diagnosis').value.trim()
        };

        // Validate all fields
        let hasErrors = false;
        Object.entries(formData).forEach(([field, value]) => {
            if (!value) {
                showFieldError(field);
                hasErrors = true;
            }
        });

        // Check for duplicate MRN
        if (!hasErrors && formData.mrn) {
            const { patients } = getPatients();
            const isDuplicate = patients.some(p => {
                // In edit mode, ignore the current patient's MRN
                if (form.dataset.mode === 'edit') {
                    return p.mrn === formData.mrn && p.mrn !== form.dataset.originalMrn;
                }
                return p.mrn === formData.mrn;
            });

            if (isDuplicate) {
                showFieldError('mrn', 'This MRN already exists');
                showFormError('A patient with this MRN already exists. Please use a unique MRN.');
                return;
            }
        }

        if (hasErrors) {
            showFormError('Please fill in all required fields.');
            return;
        }

        try {
            if (form.dataset.mode === 'edit') {
                await updatePatient(form.dataset.originalMrn, formData);
                window.showNotification('edit');
            } else {
                await addPatient(formData);
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
            showFormError('An error occurred while saving the patient.');
        }
    });
}

// Helper functions for form validation
function clearErrors() {
    // Clear form error
    const formError = document.querySelector('.form-error-message');
    formError.textContent = '';
    formError.classList.remove('show');

    // Clear field errors
    document.querySelectorAll('.field-error-message').forEach(el => {
        el.classList.remove('show');
    });
    document.querySelectorAll('input').forEach(input => {
        input.classList.remove('error');
    });
}

function showFieldError(fieldId, message) {
    const input = document.querySelector(`#${fieldId}`);
    const errorDiv = input.parentElement.querySelector('.field-error-message');
    input.classList.add('error');
    if (message) {
        errorDiv.textContent = message;
    }
    errorDiv.classList.add('show');
}

function showFormError(message) {
    const formError = document.querySelector('.form-error-message');
    formError.textContent = message;
    formError.classList.add('show');
} 