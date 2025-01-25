// Component loader utility
export async function loadComponent(path) {
    try {
        const response = await fetch(`/src${path}.html`);
        const html = await response.text();
        return html;
    } catch (error) {
        console.error(`Error loading component from ${path}:`, error);
        return '';
    }
}

// Component initialization functions
export async function initializeDashboard() {
    const dashboardHtml = await loadComponent('/components/dashboard/dashboard');
    document.getElementById('dashboard-section').innerHTML = dashboardHtml;
}

export async function initializeModal() {
    const modalHtml = await loadComponent('/components/modals/add-patient');
    const modalContainer = document.getElementById('addPatientModal');
    if (!modalContainer) {
        console.error('Modal container not found');
        return;
    }
    
    const modalContent = modalContainer.querySelector('.modal-content');
    if (!modalContent) {
        console.error('Modal content container not found');
        return;
    }
    
    modalContent.innerHTML = modalHtml;
    
    // Re-attach modal event listeners
    const closeBtn = modalContainer.querySelector('.close-modal');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            console.log('Close button clicked');
            modalContainer.style.display = 'none';
        });
    }
    
    // Re-attach form submission handler
    const form = modalContainer.querySelector('#newPatientForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
}

function handleFormSubmit(e) {
    e.preventDefault();
    // ... existing form submission logic ...
} 