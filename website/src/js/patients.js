import { getPatients, emotionalStates, deletePatient, searchPatients, getPatientsFromDatabase } from './patientData.js';
import { initializeModal } from './modal.js';
import notificationManager from './notifications.js';
import { initializeSidebar } from './components.js';

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
async function deletePatientHandler(mrn) {
    if (confirm('Are you sure you want to delete this patient record? This action cannot be undone.')) {
        await deletePatient(mrn);
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
        diagnosis: form.querySelector('#diagnosis'),
        medications: form.querySelector('#medications')
    };

    // Handle regular inputs
    Object.entries(inputs).forEach(([key, input]) => {
        if (!input) return; // Skip if input doesn't exist
        input.value = patient[key] || '';
        // Move cursor to end of input
        input.addEventListener('focus', function() {
            const len = this.value.length;
            this.setSelectionRange(len, len);
        }, { once: true });
    });

    // Handle textarea separately
    const clinicalNotes = form.querySelector('#clinicalNotes');
    if (clinicalNotes) {
        clinicalNotes.textContent = patient.notes || '';
    }

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
    if (!patient) return null;
    
    // Safely get the first letter of first name, defaulting to '?'
    const initial = patient.firstName ? patient.firstName[0].toUpperCase() : '?';
    const emotionKey = patient.emotionalState || 'neutral';
    const emotionalState = emotionalStates[emotionKey];
    
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>
            <div class="patient-info">
                <div class="patient-avatar" style="background-color: ${emotionalState.lightColor}">
                    ${initial}
                </div>
                <span>${patient.firstName || ''} ${patient.lastName || ''}</span>
            </div>
        </td>
        <td>${formatDate(patient.dateAdmitted || new Date())}</td>
        <td>${patient.mrn || ''}</td>
        <td>${patient.diagnosis || ''}</td>
        <td>
            <div class="emotion-indicator ${emotionKey}">
                ${createEmotionSVG(emotionalState)}
                <span class="emotion-text ${emotionKey}">
                    ${emotionKey.charAt(0).toUpperCase() + emotionKey.slice(1)}
                </span>
            </div>
        </td>
        <td class="actions">
            <button class="icon-btn edit-btn" title="Edit patient"><i class="material-icons">edit</i></button>
            <button class="icon-btn delete-btn" title="Delete patient"><i class="material-icons">delete</i></button>
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
        const searchQuery = document.querySelector('#header-search')?.value || '';
        refreshPatientsList(newPage, searchQuery);
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
    
    const searchQuery = document.querySelector('#header-search')?.value || '';
    refreshPatientsList(page, searchQuery);
}

// Keep only this sorting code at the top level, before the DOMContentLoaded event
let currentSortField = 'name';
let isAscending = true;

function sortPatients(field) {
    // Only toggle direction if clicking the same field
    if (field === currentSortField) {
        isAscending = !isAscending;
    } else {
        // When switching to a new field, default to ascending
        currentSortField = field;
        isAscending = true;
    }
    
    const buttons = document.querySelectorAll('.sort-dropdown button');
    buttons.forEach(btn => {
        const isCurrentField = btn.getAttribute('onclick').includes(field);
        if (isCurrentField) {
            const displayName = field === 'dateAdmitted' ? 'Date' : 
                              field === 'mrn' ? 'MRN' : 
                              field.charAt(0).toUpperCase() + field.slice(1);
            btn.innerHTML = `Sort by ${displayName}<span>${isAscending ? '↓' : '↑'}</span>`;
        } else {
            const fieldName = btn.getAttribute('onclick').match(/sortPatients\('(.+?)'\)/)[1];
            const displayName = fieldName === 'dateAdmitted' ? 'Date' : 
                              fieldName === 'mrn' ? 'MRN' : 
                              fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
            btn.innerHTML = `Sort by ${displayName}`;
        }
    });
    
    refreshPatientsList();
    document.querySelector('.sort-dropdown').classList.remove('show');
}

// Add this sorting function
function sortPatientsList(patients, field) {
    return [...patients].sort((a, b) => {
        let valueA, valueB;
        
        switch(field) {
            case 'name':
                valueA = `${a.firstName} ${a.lastName}`.toLowerCase();
                valueB = `${b.firstName} ${b.lastName}`.toLowerCase();
                break;
            case 'dateAdmitted':
                valueA = new Date(a.dateAdmitted);
                valueB = new Date(b.dateAdmitted);
                break;
            case 'mrn':
                valueA = a.mrn.toLowerCase();
                valueB = b.mrn.toLowerCase();
                break;
            default:
                return 0;
        }

        if (valueA < valueB) return isAscending ? -1 : 1;
        if (valueA > valueB) return isAscending ? 1 : -1;
        return 0;
    });
}

// Modify the refreshPatientsList function to include sorting
export async function refreshPatientsList(page = 1, searchQuery = '') {
    try {
        console.log('Refreshing patients list...');
        
        // Show loading state
        const tbody = document.getElementById('patients-tbody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 20px;">
                        <div>Loading patients...</div>
                    </td>
                </tr>
            `;
        }

        // Get patients data
        console.log('Getting patients data...');
        let { patients, totalPages, currentPage } = searchQuery ? 
            await searchPatients(searchQuery, page) : 
            getPatients(page);
        
        // Sort patients if a sort field is selected
        if (currentSortField) {
            patients = sortPatientsList(patients, currentSortField);
        }
        
        console.log('Retrieved patients:', patients);

        // Add patient rows
        if (tbody) {
            tbody.innerHTML = '';
            if (patients.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" style="text-align: center; padding: 20px;">
                            <div>No patients found</div>
                        </td>
                    </tr>
                `;
            } else {
                patients.forEach(patient => {
                    tbody.appendChild(createPatientRow(patient));
                });
            }
            console.log('Patient rows added to table');
        }

        // Update pagination
        const paginationContainer = document.getElementById('pagination-container');
        if (paginationContainer) {
            paginationContainer.innerHTML = createPaginationHTML(currentPage, totalPages);
            
            // Add pagination event listeners
            paginationContainer.addEventListener('click', (e) => handlePaginationClick(e, currentPage, totalPages));
            
            // Add jump to page handler
            const jumpInput = paginationContainer.querySelector('.jump-to-page-input');
            if (jumpInput) {
                jumpInput.addEventListener('change', () => handleJumpToPage(jumpInput, totalPages));
                jumpInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        handleJumpToPage(jumpInput, totalPages);
                    }
                });
            }
        }
    } catch (error) {
        console.error('Error refreshing patients:', error);
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 20px;">
                        <div>Error loading patients. Please try again.</div>
                    </td>
                </tr>
            `;
        }
    }
}

function setupModalControls() {
    const addPatientBtn = document.getElementById('addPatientBtn');
    const modal = document.getElementById('addPatientModal');

    if (addPatientBtn && modal) {
        addPatientBtn.addEventListener('click', () => {
            // Reset form and title
            const form = document.getElementById('newPatientForm');
            const modalTitle = modal.querySelector('.modal-header h2');
            if (form) {
                form.reset();
                form.dataset.mode = 'add';
                delete form.dataset.originalMrn;
                // Explicitly clear clinical notes
                const clinicalNotes = form.querySelector('#clinicalNotes');
                if (clinicalNotes) {
                    clinicalNotes.value = '';
                    clinicalNotes.textContent = '';
                }
            }
            if (modalTitle) {
                modalTitle.textContent = 'Add New Patient';
            }
            
            // Show modal
            modal.style.display = 'flex';
            modal.offsetHeight; // Force reflow
            modal.classList.add('show');
        });
    }

    // Close modal handlers
    window.closeModal = () => {
        if (!modal) return;
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
            const form = document.getElementById('newPatientForm');
            if (form) {
                form.reset();
                // Explicitly clear clinical notes
                const clinicalNotes = form.querySelector('#clinicalNotes');
                if (clinicalNotes) {
                    clinicalNotes.value = '';
                    clinicalNotes.textContent = '';
                }
                // Reset form mode
                form.dataset.mode = 'add';
                delete form.dataset.originalMrn;
            }
        }, 300);
    };

    // Close on outside click
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            window.closeModal();
        }
    });

    // Close on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal?.classList.contains('show')) {
            window.closeModal();
        }
    });

    // Close buttons
    const closeButtons = document.querySelectorAll('.close-modal');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', window.closeModal);
    });
}

// Initialize the patients page
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Initializing patients page...');
    
    try {
        // Initialize sidebar first
        await initializeSidebar('patients');
        console.log('Sidebar initialized');
        
        // Only check for table if we're on the patients page
        if (window.location.pathname.includes('patients.html')) {
            const tbody = document.getElementById('patients-tbody');
            if (!tbody) {
                throw new Error('Patients table body not found');
            }
            console.log('Found patients table structure');

            // Load initial patients data
            await getPatientsFromDatabase();
            
            // Update sort button text to reflect default sort
            const sortButtons = document.querySelectorAll('.sort-dropdown button');
            sortButtons.forEach(btn => {
                if (btn.getAttribute('onclick').includes('name')) {
                    btn.innerHTML = `Sort by Name<span>↓</span>`;
                }
            });
            
            await refreshPatientsList();
            console.log('Initial patients list loaded');

            // Setup update button
            const updateBtn = document.querySelector('.update-btn');
            if (updateBtn) {
                updateBtn.addEventListener('click', async () => {
                    try {
                        await getPatientsFromDatabase();
                        await refreshPatientsList();
                    } catch (error) {
                        window.showNotification('Failed to update patient list', 'error');
                    }
                });
            }
        }
        
        // Initialize modal
        await initializeModal();
        console.log('Modal initialized');
        
        // Setup modal controls
        if (document.getElementById('addPatientModal')) {
            setupModalControls();
            console.log('Modal controls set up');
        }
        
        // Initialize search with debounce
        const searchInput = document.getElementById('header-search');
        if (searchInput) {
            let debounceTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(debounceTimeout);
                debounceTimeout = setTimeout(() => {
                    refreshPatientsList(1, e.target.value);
                }, 300);
            });
            console.log('Search initialized with debounce');
        }

        // Initialize notifications
        window.showNotification = (type = 'add') => {
            const message = type === 'delete' ? 
                'Patient deleted successfully' : 
                'Patient data saved successfully';
            notificationManager.show(message, type);
        };
        console.log('Notifications initialized');

        // Handle logout
        window.handleLogout = () => {
            localStorage.removeItem('auth_token');
            sessionStorage.removeItem('auth_token');
            window.location.href = '/auth.html';
        };
        console.log('Logout handler initialized');
        
        // Initialize sort button dropdown
        const sortBtn = document.querySelector('.sort-btn');
        if (sortBtn) {
            sortBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                document.querySelector('.sort-dropdown').classList.toggle('show');
            });
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            document.querySelector('.sort-dropdown')?.classList.remove('show');
        });
        
        console.log('Page initialization complete');
    } catch (error) {
        console.error('Error initializing patients page:', error);
        // Only show error message if we're on the patients page
        if (window.location.pathname.includes('patients.html')) {
            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                mainContent.innerHTML = `
                    <div class="error-message" style="padding: 20px; color: #721c24; background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; margin: 20px;">
                        <h3>Error Loading Patients Page</h3>
                        <p>${error.message}</p>
                        <p>Please try refreshing the page. If the problem persists, contact support.</p>
                    </div>
                `;
            }
        }
    }
});

// Make sortPatients available globally for the onclick handlers
window.sortPatients = sortPatients; 