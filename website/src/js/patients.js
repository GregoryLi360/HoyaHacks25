import { getPatients, emotionalStates, deletePatient } from './patientData.js';

// Create emotion indicator SVG
function createEmotionSVG(emotionalState) {
    return `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="${emotionalState.color}" stroke-width="2" fill="${emotionalState.lightColor}"/>
            <path d="${emotionalState.path}" stroke="${emotionalState.color}" stroke-width="2" stroke-linecap="round"/>
            <circle cx="8" cy="9" r="1.5" fill="${emotionalState.color}"/>
            <circle cx="16" cy="9" r="1.5" fill="${emotionalState.color}"/>
        </svg>
    `;
}

// Format date for display
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
    });
}

// Delete patient handler
function deletePatientHandler(mrn) {
    if (confirm('Are you sure you want to delete this patient record? This action cannot be undone.')) {
        deletePatient(mrn);
        refreshPatientsList();
        window.showNotification('delete');
    }
}

// Edit patient handler
function editPatientHandler(patient) {
    // Get the modal and update its content
    const modal = document.getElementById('addPatientModal');
    const modalTitle = modal.querySelector('.modal-header h2');
    modalTitle.textContent = 'Edit Patient';

    // Fill in the form fields
    const form = document.getElementById('newPatientForm');
    
    // Set values and ensure cursor goes to end of input
    const inputs = {
        firstName: form.querySelector('#firstName'),
        lastName: form.querySelector('#lastName'),
        mrn: form.querySelector('#mrn'),
        diagnosis: form.querySelector('#diagnosis')
    };

    // Set values and fix cursor position
    Object.entries(inputs).forEach(([key, input]) => {
        input.value = patient[key];
        // Move cursor to end of input
        input.addEventListener('focus', function() {
            const len = this.value.length;
            this.setSelectionRange(len, len);
        }, { once: true });
    });

    // Show the modal
    modal.style.display = 'flex';
    modal.offsetHeight; // Force reflow
    modal.classList.add('show');

    // Update form submission to handle edit
    form.dataset.mode = 'edit';
    form.dataset.originalMrn = patient.mrn;
}

// Create patient row HTML
function createPatientRow(patient) {
    const initial = (patient.firstName[0] || '').toUpperCase();
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>
            <div class="patient-info">
                <div class="patient-avatar" style="background-color: ${patient.emotionalState.lightColor}">
                    ${initial}
                </div>
                <span>${patient.firstName} ${patient.lastName}</span>
            </div>
        </td>
        <td>${formatDate(patient.dateAdmitted)}</td>
        <td>${patient.mrn}</td>
        <td>${patient.diagnosis}</td>
        <td>
            <div class="emotion-indicator ${patient.emotionalState.state}">
                ${createEmotionSVG(patient.emotionalState)}
                <span class="emotion-text ${patient.emotionalState.state}">${patient.emotionalState.state.charAt(0).toUpperCase() + patient.emotionalState.state.slice(1)}</span>
            </div>
        </td>
        <td class="actions">
            <button class="icon-btn edit-btn" title="Edit patient"><i class="material-icons">edit</i></button>
            <button class="icon-btn delete-btn" title="Delete patient"><i class="material-icons">delete</i></button>
            <button class="icon-btn" title="More options"><i class="material-icons">more_vert</i></button>
        </td>
    `;

    // Add event listeners
    const deleteBtn = row.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', () => deletePatientHandler(patient.mrn));

    const editBtn = row.querySelector('.edit-btn');
    editBtn.addEventListener('click', () => editPatientHandler(patient));

    return row;
}

// Create pagination HTML
function createPaginationHTML(currentPage, totalPages) {
    if (totalPages <= 1) return '';

    let paginationHTML = '<div class="pagination">';
    
    // Previous button
    paginationHTML += `
        <button class="page-btn prev-btn" ${currentPage === 1 ? 'disabled' : ''}>
            Prev
        </button>
    `;

    // Page numbers
    const pagesToShow = [];
    // Always show first page
    pagesToShow.push(1);
    
    // Calculate middle pages
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pagesToShow.push(i);
    }
    
    // Always show last page
    if (totalPages > 1) {
        pagesToShow.push(totalPages);
    }

    // Add page numbers with ellipsis
    let previousPage = 0;
    pagesToShow.forEach(pageNum => {
        if (pageNum - previousPage > 1) {
            paginationHTML += '<span>...</span>';
        }
        paginationHTML += `
            <button class="page-btn number-btn ${pageNum === currentPage ? 'active' : ''}" 
                    data-page="${pageNum}">
                ${pageNum}
            </button>
        `;
        previousPage = pageNum;
    });

    // Next button
    paginationHTML += `
        <button class="page-btn next-btn" ${currentPage === totalPages ? 'disabled' : ''}>
            Next
        </button>
    `;

    // Jump to page
    paginationHTML += `
        <div class="jump-to-page">
            <input type="number" 
                   min="1" 
                   max="${totalPages}" 
                   value="${currentPage}"
                   class="jump-to-page-input"
                   title="Jump to page"
                   placeholder="Page">
            <span class="page-info">OF ${totalPages}</span>
        </div>
    `;

    paginationHTML += '</div>';
    return paginationHTML;
}

// Handle pagination clicks and jumps
function handlePaginationClick(e, currentPage, totalPages) {
    const target = e.target;
    let newPage = currentPage;

    if (target.classList.contains('prev-btn') && currentPage > 1) {
        newPage = currentPage - 1;
    } else if (target.classList.contains('next-btn') && currentPage < totalPages) {
        newPage = currentPage + 1;
    } else if (target.classList.contains('number-btn')) {
        newPage = parseInt(target.dataset.page);
    }

    if (newPage !== currentPage) {
        refreshPatientsList(newPage);
    }
}

// Handle jump to page
function handleJumpToPage(input, totalPages) {
    let page = parseInt(input.value);
    
    // Validate input
    if (isNaN(page)) return;
    
    // Ensure page is within bounds
    page = Math.max(1, Math.min(page, totalPages));
    
    // Update input value if it was out of bounds
    input.value = page;
    
    refreshPatientsList(page);
}

// Refresh the patients list
export function refreshPatientsList(page = 1) {
    const patientsSection = document.getElementById('patients-section');
    if (!patientsSection) return;

    const { patients, totalPages, currentPage } = getPatients(page);
    
    patientsSection.innerHTML = `
        <div class="section-header">
            <div class="header-actions">
                <button class="filter-btn">
                    <i class="material-icons">filter_list</i>
                    Filter
                </button>
                <button class="export-btn">
                    <i class="material-icons">sync</i>
                    <span>Update</span>
                </button>
            </div>
        </div>

        <div class="patients-table">
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Date</th>
                        <th>MRN</th>
                        <th>Diagnosis</th>
                        <th>Emotional State</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody id="patients-tbody">
                </tbody>
            </table>
            ${createPaginationHTML(currentPage, totalPages)}
        </div>
    `;

    // Add patient rows
    const tbody = patientsSection.querySelector('#patients-tbody');
    patients.forEach(patient => {
        tbody.appendChild(createPatientRow(patient));
    });

    // Add pagination event listeners
    const pagination = patientsSection.querySelector('.pagination');
    if (pagination) {
        pagination.addEventListener('click', (e) => handlePaginationClick(e, currentPage, totalPages));
        
        // Add jump to page handler
        const jumpInput = pagination.querySelector('.jump-to-page-input');
        if (jumpInput) {
            jumpInput.addEventListener('change', () => handleJumpToPage(jumpInput, totalPages));
            jumpInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    handleJumpToPage(jumpInput, totalPages);
                }
            });
        }
    }
}

// Initial load of patients section
export function loadPatientsSection() {
    refreshPatientsList();
}

async function loadComponent(path) {
    try {
        const response = await fetch(path);
        return await response.text();
    } catch (error) {
        console.error('Error loading component:', error);
        return '';
    }
}

export async function loadDashboardSection() {
    const dashboardHtml = await loadComponent('../components/dashboard.html');
    document.getElementById('dashboard-section').innerHTML = dashboardHtml;
}

export async function loadPatientModal() {
    const modalHtml = await loadComponent('../components/add-patient.html');
    document.getElementById('addPatientModal').innerHTML = modalHtml;
} 