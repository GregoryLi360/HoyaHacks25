// In-memory storage for patients (in a real app, this would be a database)
//TODO: Add database
let patients = [];

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
            emotionalState: {
                state: 'neutral',
                color: '#7280ff',
                lightColor: '#e6e9ff'
            }
        };
        patients.unshift(newPatient); // Add to beginning of array
        return newPatient;
    } catch (error) {
        console.error('Error adding patient:', error);
        return null;
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
        patientsPerPage: PATIENTS_PER_PAGE
    };
}

export function deletePatient(mrn) {
    const index = patients.findIndex(p => p.mrn === mrn);
    fetch(`${ROOT_URL}/${mrn}`, {
        method: "DELETE",
    })
        .then(response => response.json())
        .then(data => console.log(data))
        .catch(error => console.error('Error:', error));
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