import { initializeSidebar } from './components.js';
import notificationManager from './notifications.js';

// Initialize the page
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize sidebar with current page
    await initializeSidebar('config');

    // Set up event listeners
    setupEventListeners();
});

function setupEventListeners() {
    // Temperature range input
    const temperatureInput = document.getElementById('modelTemperature');
    const temperatureValue = temperatureInput.nextElementSibling;
    
    temperatureInput.addEventListener('input', (e) => {
        const value = e.target.value / 100;
        temperatureValue.textContent = value.toFixed(1);
    });

    // Save button
    const saveButton = document.getElementById('saveConfigBtn');
    saveButton.addEventListener('click', () => {
        // Show success animation
        saveButton.classList.add('save-success');
        setTimeout(() => saveButton.classList.remove('save-success'), 300);

        notificationManager.show('Configuration saved successfully', 'success');
        hasUnsavedChanges = false;
    });

    // Setup change tracking
    setupChangeTracking();
}

// Handle beforeunload event to warn about unsaved changes
let hasUnsavedChanges = false;

function setupChangeTracking() {
    const forms = document.querySelectorAll('input, select');
    forms.forEach(input => {
        input.addEventListener('change', () => {
            hasUnsavedChanges = true;
        });
    });
}

window.addEventListener('beforeunload', (e) => {
    if (hasUnsavedChanges) {
        e.preventDefault();
        return 'You have unsaved changes. Are you sure you want to leave?';
    }
}); 