// Remove the class and just keep the function
export function loadPatientsSection() {
    const patientsSection = document.getElementById('patients-section');
    patientsSection.innerHTML = `
        <div class="section-header">
            <div class="header-actions">
                <button class="filter-btn">
                    <i class="material-icons">filter_list</i>
                    Filter
                </button>
                <button class="export-btn">
                    <i class="material-icons">upload</i>
                    Export to AI
                </button>
            </div>
        </div>

        <div class="status-legend">
            <span class="status-item"><i class="status-dot ongoing"></i> Ongoing Treatment</span>
            <span class="status-item"><i class="status-dot new"></i> New Patient</span>
            <span class="status-item"><i class="status-dot followup"></i> Follow-up</span>
            <span class="status-item"><i class="status-dot ai-ready"></i> AI Ready</span>
        </div>

        <div class="patients-table">
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Date</th>
                        <th>Diagnosis</th>
                        <th>Condition</th>
                        <th>Status</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>
                            <div class="patient-info">
                                <img src="./assets/placeholder-avatar.png" alt="Patient" class="patient-avatar">
                                <span>Linda Kaberski</span>
                            </div>
                        </td>
                        <td>02/11/2024</td>
                        <td>Type 2 Diabetes</td>
                        <td>Chronic Management</td>
                        <td><span class="status ongoing">Ongoing Treatment</span></td>
                        <td class="actions">
                            <button class="icon-btn"><i class="material-icons">edit</i></button>
                            <button class="icon-btn"><i class="material-icons">delete</i></button>
                            <button class="icon-btn"><i class="material-icons">more_vert</i></button>
                        </td>
                    </tr>
                </tbody>
            </table>
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
        </div>
    `;
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
    const dashboardHtml = await loadComponent('/components/dashboard/dashboard.html');
    document.getElementById('dashboard-section').innerHTML = dashboardHtml;
}

export async function loadPatientModal() {
    const modalHtml = await loadComponent('/components/modals/add-patient.html');
    document.getElementById('addPatientModal').innerHTML = modalHtml;
} 