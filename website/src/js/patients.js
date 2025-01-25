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
            <button class="icon-btn"><i class="material-icons">edit</i></button>
            <button class="icon-btn delete-btn"><i class="material-icons">delete</i></button>
            <button class="icon-btn"><i class="material-icons">more_vert</i></button>
        </td>
    `;

    // Add delete event listener
    const deleteBtn = row.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', () => deletePatientHandler(patient.mrn));

    return row;
}

// Refresh the patients list
export function refreshPatientsList() {
    const patientsSection = document.getElementById('patients-section');
    if (!patientsSection) return;

    const patients = getPatients();
    
    patientsSection.innerHTML = `
        <div class="section-header">
            <div class="header-actions">
                <button class="filter-btn">
                    <i class="material-icons">filter_list</i>
                    Filter
                </button>
                <button class="export-btn">
                    <i class="material-icons">sync</i>
                    Update from AI
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
            ${patients.length > 0 ? `
                <div class="pagination">
                    <button class="page-btn">Prev</button>
                    <button class="page-btn active">1</button>
                    <button class="page-btn">2</button>
                    <span>...</span>
                    <button class="page-btn">7</button>
                    <button class="page-btn">8</button>
                    <button class="page-btn">Next</button>
                    <span class="page-info">PAGE 1 OF 24</span>
                </div>
            ` : ''}
        </div>
    `;

    // Add patient rows
    const tbody = patientsSection.querySelector('#patients-tbody');
    patients.forEach(patient => {
        tbody.appendChild(createPatientRow(patient));
    });
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