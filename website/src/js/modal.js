import { addPatient, updatePatient, getPatients } from './patientData.js';
import { refreshPatientsList } from './patients.js';

// Initialize the add/edit patient modal
export async function initializeModal() {
    try {
        console.log('Initializing modal...');
        
        // Check if modal container exists
        const modalContent = document.querySelector('#addPatientModal .modal-content');
        if (!modalContent) {
            console.log('Modal container not found - skipping initialization');
            return; // Exit silently if modal container doesn't exist
        }
        
        // Load modal content
        const response = await fetch('./src/components/add-patient.html');
        if (!response.ok) {
            console.error('Failed to load modal content');
            window.showNotification('error');
            return;
        }
        const html = await response.text();
        
        // Insert modal content
        modalContent.innerHTML = html;
        
        // Initialize form
        const form = document.getElementById('newPatientForm');
        if (!form) {
            console.error('Form not found in modal');
            window.showNotification('error');
            return;
        }
        console.log('Form found and ready for initialization');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Clear previous errors
            clearErrors();

            const formData = {
                firstName: form.querySelector('#firstName').value.trim(),
                lastName: form.querySelector('#lastName').value.trim(),
                mrn: form.querySelector('#mrn').value.trim(),
                diagnosis: form.querySelector('#diagnosis').value.trim(),
                notes: form.querySelector('#clinicalNotes').value.trim(),
                medications: form.querySelector('#medications').value.trim()
            };

            // Validate required fields
            let hasErrors = false;
            const requiredFields = ['firstName', 'lastName', 'mrn', 'diagnosis'];
            requiredFields.forEach(field => {
                if (!formData[field]) {
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

        console.log('Modal initialized successfully');
    } catch (error) {
        console.error('Error initializing modal:', error);
        throw error;
    }
}

// Helper functions for form validation
function clearErrors() {
    // Clear form error
    const formError = document.querySelector('.form-error-message');
    if (formError) {
        formError.textContent = '';
        formError.classList.remove('show');
    }

    // Clear field errors
    document.querySelectorAll('.error-message').forEach(el => {
        el.textContent = '';
    });
    document.querySelectorAll('input').forEach(input => {
        input.classList.remove('error');
    });
}

function showFieldError(fieldId, message = 'This field is required') {
    const input = document.querySelector(`#${fieldId}`);
    if (!input) return;
    
    const errorSpan = input.parentElement.querySelector('.error-message');
    if (!errorSpan) return;
    
    input.classList.add('error');
    errorSpan.textContent = message;
}

function showFormError(message) {
    const formError = document.querySelector('.form-error-message');
    if (!formError) {
        console.error('Form error element not found');
        return;
    }
    formError.textContent = message;
    formError.classList.add('show');
} 