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
                <tbody>
                    <tr>
                        <td>
                            <div class="patient-info">
                                <img src="../assets/placeholder-avatar.png" alt="Patient" class="patient-avatar">
                                <span>Linda Kaberski</span>
                            </div>
                        </td>
                        <td>02/11/2024</td>
                        <td>MRN24680</td>
                        <td>Major Depressive Disorder</td>
                        <td>
                            <div class="emotion-indicator anxious">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="12" cy="12" r="10" stroke="#7280ff" stroke-width="2" fill="#e6e9ff"/>
                                    <path d="M8 16C8.5 14.5 10 13 12 13C14 13 15.5 14.5 16 16" stroke="#7280ff" stroke-width="2" stroke-linecap="round"/>
                                    <circle cx="8" cy="9" r="1.5" fill="#7280ff"/>
                                    <circle cx="16" cy="9" r="1.5" fill="#7280ff"/>
                                </svg>
                                <span class="emotion-text anxious">Anxious</span>
                            </div>
                        </td>
                        <td class="actions">
                            <button class="icon-btn"><i class="material-icons">edit</i></button>
                            <button class="icon-btn"><i class="material-icons">delete</i></button>
                            <button class="icon-btn"><i class="material-icons">more_vert</i></button>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <div class="patient-info">
                                <img src="../assets/placeholder-avatar.png" alt="Patient" class="patient-avatar">
                                <span>James Wilson</span>
                            </div>
                        </td>
                        <td>02/11/2024</td>
                        <td>MRN24681</td>
                        <td>Generalized Anxiety Disorder</td>
                        <td>
                            <div class="emotion-indicator happy">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="12" cy="12" r="10" stroke="#FFB347" stroke-width="2" fill="#FFF2D9"/>
                                    <path d="M8 13C8.5 14.5 10 16 12 16C14 16 15.5 14.5 16 13" stroke="#FFB347" stroke-width="2" stroke-linecap="round"/>
                                    <circle cx="8" cy="9" r="1.5" fill="#FFB347"/>
                                    <circle cx="16" cy="9" r="1.5" fill="#FFB347"/>
                                </svg>
                                <span class="emotion-text happy">Happy</span>
                            </div>
                        </td>
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
    const dashboardHtml = await loadComponent('../components/dashboard.html');
    document.getElementById('dashboard-section').innerHTML = dashboardHtml;
}

export async function loadPatientModal() {
    const modalHtml = await loadComponent('../components/add-patient.html');
    document.getElementById('addPatientModal').innerHTML = modalHtml;
} 