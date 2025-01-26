// Emotional states definition
export const emotionalStates = {
    anxious: {
        color: '#FFE0B2',
        lightColor: '#FFF8F0',
        path: 'M 8 15 C 8 15, 12 12, 16 15'  // Wavy anxious mouth
    },
    depressed: {
        color: '#90CAF9',
        lightColor: '#E3F2FD',
        path: 'M 8 16 C 10 13, 14 13, 16 16'  // Proper rounded sad face
    },
    neutral: {
        color: '#7280ff',
        lightColor: '#F0F3FF',
        path: 'M 8 15 L 16 15'  // Straight line
    },
    positive: {
        color: '#A5D6A7',
        lightColor: '#E8F5E9',
        path: 'M 8 14 C 8 17, 16 17, 16 14'  // Wide smile
    },
    calm: {
        color: '#CE93D8',
        lightColor: '#F3E5F5',
        path: 'M 8 15 C 8 16, 16 16, 16 15'  // Gentle smile
    },
    frustrated: {
        color: '#EF9A9A',
        lightColor: '#FFEBEE',
        path: 'M 8 15 C 8 18, 12 19, 16 18'  // Stronger frown
    },
    hopeful: {
        color: '#FFCC80',
        lightColor: '#FFF3E0',
        path: 'M 8 14 C 8 16, 16 16, 16 14'  // Optimistic curve
    },
    confident: {
        color: '#80DEEA',
        lightColor: '#E0F7FA',
        path: 'M 8 13 C 8 17, 16 17, 16 13'  // Strong smile
    },
    tired: {
        color: '#BCAAA4',
        lightColor: '#EFEBE9',
        path: 'M 8 15 C 8 14, 16 14, 16 15'  // Slight droop
    },
    excited: {
        color: '#E6EE9C',
        lightColor: '#F9FBE7',
        path: 'M 8 13 C 8 18, 16 18, 16 13'  // Very wide smile
    },
    worried: {
        color: '#9FA8DA',
        lightColor: '#E8EAF6',
        path: 'M 8 15 C 8 13, 16 13, 16 15'  // Inverted gentle curve
    },
    grateful: {
        color: '#A5D6A7',
        lightColor: '#E8F5E9',
        path: 'M 8 14 C 8 17, 16 17, 16 14'  // Warm smile
    }
};

let patients = [];
let isLoading = true;

// Pagination settings
const PATIENTS_PER_PAGE = 5;

const ROOT_URL = "https://hoyahacks25.onrender.com/api";
const AUTH_TOKEN = "05d49692b755f99c4504b510418efeeeebfd466892540f27acf9a31a326d6504";

// Format date to MM/DD/YYYY
function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
    });
}

// export function addPatient(patientData) {
//     const newPatient = {
//         ...patientData,
//         dateAdmitted: new Date().toISOString(),
//         emotionalState: emotionalStates.neutral
//     };
//     patients.unshift(newPatient); // Add to beginning of array
//     return newPatient;
// }

export async function addPatient(patientData) {
    try {
        await fetch(`${ROOT_URL}/patients`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + AUTH_TOKEN,
            },
            body: JSON.stringify({
                'MRN': patientData.mrn,
                'firstName': patientData.firstName,
                'lastName': patientData.lastName,
                'diagnosis': patientData.diagnosis,
                'notes': patientData.notes || '',
                'medications': patientData.medications || '',
            })
        });
        const newPatient = {
            ...patientData,
            dateAdmitted: new Date().toISOString(),
            emotionalState: neutral
        };
        patients.unshift(newPatient); // Add to beginning of array
        return newPatient;
    } catch (error) {
        console.error('Error adding patient:', error);
        window.showNotification('Failed to add patient. Please try again.', 'error');
        return null;
    }
}

export async function getPatientsFromDatabase() {
    try {
        isLoading = true;
        const response = await fetch(`${ROOT_URL}/patients`, {
            method: "GET",
            headers: {
                'Authorization': 'Bearer ' + AUTH_TOKEN,
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch patients');
        }

        const data = await response.json();
        patients = data.map(patient => {
            const latestLog = patient.logs[0] || {};
            return {
                firstName: latestLog.firstName || '',
                lastName: latestLog.lastName || '',
                mrn: patient.MRN,
                diagnosis: latestLog.diagnosis || '',
                dateAdmitted: latestLog.createdAt || new Date().toISOString(),
                emotionalState: latestLog.emotionalState || emotionalStates.neutral,
                startTime: latestLog.startTime || '',
                interactionTime: latestLog.interactionTime || '',
                notes: latestLog.notes || '',
                medications: latestLog.medications || ''
            };
        });
        
        isLoading = false;
        return patients;
    } catch(error) {
        console.error('Error getting database patients:', error);
        window.showNotification('Failed to get database patients. Please try again.', 'error');
        isLoading = false;
        return [];
    }
}

export function getPatients(page = 1) {
    const startIndex = (page - 1) * PATIENTS_PER_PAGE;
    const endIndex = startIndex + PATIENTS_PER_PAGE;
    return {
        patients: patients.slice(startIndex, endIndex),
        totalPatients: patients.length,
        totalPages: Math.ceil(patients.length / PATIENTS_PER_PAGE),
        currentPage: page,
        patientsPerPage: PATIENTS_PER_PAGE,
        isLoading
    };
}

export async function deletePatient(mrn) {
    const index = patients.findIndex(p => p.mrn === mrn);
    try {
        await fetch(`${ROOT_URL}/patients/${mrn}`, {
            method: "DELETE",
            headers: {
                'Authorization': 'Bearer ' + AUTH_TOKEN,
            },
        });
        if (index !== -1) {
            patients.splice(index, 1);
            return true;
        }
    } catch(error) {
        console.error('Error deleting patient:', error);
        window.showNotification('Failed to delete patient. Please try again.', 'error');
    }
    return false;
}

export function updatePatientEmotion(mrn, emotionalState) {
    const patient = patients.find(p => p.mrn === mrn);
    if (patient) {
        patient.emotionalState = emotionalState;
    }
}

export async function updatePatient(originalMrn, updatedData) {
    const index = patients.findIndex(p => p.mrn === originalMrn);
    if (index !== -1) {
        // Preserve the original dateAdmitted and emotionalState
        const originalPatient = patients[index];

        await fetch(`${ROOT_URL}/patients`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + AUTH_TOKEN,
            },
            body: JSON.stringify({
                'MRN': originalMrn,
                'firstName': updatedData.firstName,
                'lastName': updatedData.lastName,
                'diagnosis': updatedData.diagnosis,
                'notes': updatedData.notes || '',
                'medications': updatedData.medications || '',
                'emotionalState': updatedData.emotionalState
            })
        });
        patients[index] = {
            ...updatedData,
            dateAdmitted: originalPatient.dateAdmitted,
            emotionalState: originalPatient.emotionalState
        };
        return true;
    }
    return false;
}

export async function searchPatients(query, page = 1) {
    query = query.toLowerCase().trim();
    
    // If no query, return all patients
    if (!query) {
        return getPatients(page);
    }

    // Filter patients by name or MRN
    const filteredPatients = patients.filter(patient => {
        const fullName = `${patient.firstName} ${patient.lastName}`.toLowerCase();
        const mrn = patient.mrn.toLowerCase();
        
        return fullName.includes(query) || mrn.includes(query);
    });

    // Apply pagination to filtered results
    const startIndex = (page - 1) * PATIENTS_PER_PAGE;
    const endIndex = startIndex + PATIENTS_PER_PAGE;
    
    return {
        patients: filteredPatients.slice(startIndex, endIndex),
        totalPatients: filteredPatients.length,
        totalPages: Math.ceil(filteredPatients.length / PATIENTS_PER_PAGE),
        currentPage: page,
        patientsPerPage: PATIENTS_PER_PAGE
    };
} 