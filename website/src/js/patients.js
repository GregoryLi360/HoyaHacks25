// Remove the class and just keep the function
export function loadPatientsSection() {
    console.log('Loading patients section...');
    const patientsHtml = `
        <div class="section-header">
            <div class="tab-navigation">
                <button class="tab-btn active">Overview</button>
                <button class="tab-btn">Patients</button>
                <button class="tab-btn">Hospital</button>
                <button class="tab-btn">Doctors</button>
            </div>
            <div class="header-actions">
                <button class="download-btn">
                    <i class="material-icons">download</i>
                    Download Report
                </button>
                <button class="filter-btn">
                    <i class="material-icons">filter_list</i>
                    Filter
                </button>
                <button class="more-btn">
                    <i class="material-icons">more_vert</i>
                </button>
            </div>
        </div>

        <div class="status-legend">
            <span class="status-item"><i class="status-dot discharged"></i> Discharged</span>
            <span class="status-item"><i class="status-dot expected"></i> Supposed time of hospitalization</span>
            <span class="status-item"><i class="status-dot extra"></i> Extra hospitalization</span>
            <span class="status-item"><i class="status-dot surgery"></i> Surgical intervention</span>
            <span class="status-item"><i class="status-dot in-surgery"></i> In surgery</span>
            <span class="status-item"><i class="status-dot unavailable"></i> Unavailable</span>
        </div>

        <div class="patients-table">
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Date</th>
                        <th>Room</th>
                        <th>Condition</th>
                        <th>Insurance ID</th>
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
                        <td>02/11/2020</td>
                        <td>Room 101</td>
                        <td>Phase I Clinical Trial</td>
                        <td>5678 1234-A</td>
                        <td><span class="status extra">Ext. hospitalization</span></td>
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
    
    document.getElementById('patients-section').innerHTML = patientsHtml;
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