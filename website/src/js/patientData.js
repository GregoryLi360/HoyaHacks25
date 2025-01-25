// In-memory storage for patients (in a real app, this would be a database)
//TODO: Add database
let patients = [];

// Format date to MM/DD/YYYY
function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
    });
}

export function addPatient(patientData) {
    const newPatient = {
        ...patientData,
        dateAdmitted: new Date().toISOString(),
        emotionalState: {
            state: 'neutral',
            color: '#7280ff',
            lightColor: '#e6e9ff'
        }
    };
    patients.unshift(newPatient); // Add to beginning of array
    return newPatient;
}

export function getPatients() {
    return patients;
}

export function deletePatient(mrn) {
    const index = patients.findIndex(p => p.mrn === mrn);
    if (index !== -1) {
        patients.splice(index, 1);
        return true;
    }
    return false;
}

export function updatePatientEmotion(mrn, emotionalState) {
    const patient = patients.find(p => p.mrn === mrn);
    if (patient) {
        patient.emotionalState = emotionalState;
    }
}

// Emotional state definitions
export const emotionalStates = {
    neutral: {
        state: 'neutral',
        color: '#7280ff',
        lightColor: '#e6e9ff',
        path: 'M8 14.5h8'
    },
    anxious: {
        state: 'anxious',
        color: '#7ac555',  // Pastel green
        lightColor: '#e8f5e4',  // Light pastel green
        path: 'M8 16C8.5 14.5 10 13 12 13C14 13 15.5 14.5 16 16'
    },
    happy: {
        state: 'happy',
        color: '#FFB347',
        lightColor: '#FFF2D9',
        path: 'M8 13C8.5 14.5 10 16 12 16C14 16 15.5 14.5 16 13'
    },
    depressed: {
        state: 'depressed',
        color: '#6495ED',
        lightColor: '#E6F0FF',
        path: 'M8 15C8.5 13.5 10 12 12 12C14 12 15.5 13.5 16 15'
    }
}; 