// Emotional states definition
export const emotionalStates = {
    anxious: {
        state: 'anxious',
        color: '#90EE90',  // Light pastel green
        lightColor: '#F0FFF0',  // Very light pastel green
        path: 'M 8 15 C 8 15, 12 12, 16 15'  // Anxious mouth curve
    },
    happy: {
        state: 'happy',
        color: '#FFB347',
        lightColor: '#FFF3E0',
        path: 'M 8 13 C 8 13, 12 16, 16 13'
    },
    depressed: {
        state: 'depressed',
        color: '#6495ED',  // Cornflower blue
        lightColor: '#F0F8FF',  // Light pastel blue
        path: 'M 8 16 C 8 16, 12 13, 16 16'
    },
    angry: {
        state: 'angry',
        color: '#FF6961',
        lightColor: '#FFF0F0',
        path: 'M 8 16 C 8 16, 12 14, 16 16'
    },
    neutral: {
        state: 'neutral',
        color: '#7280ff',  // Periwinkle blue
        lightColor: '#F0F3FF',  // Light periwinkle
        path: 'M 8 14 L 16 14'
    }
};

// In-memory storage for patients (in a real app, this would be a database)
//TODO: Add database
let patients = [
    {
        firstName: "John",
        lastName: "Doe",
        mrn: "MRN001",
        diagnosis: "General Checkup",
        dateAdmitted: new Date().toISOString(),
        emotionalState: emotionalStates.anxious
    },
    {
        firstName: "Jane",
        lastName: "Smith",
        mrn: "MRN002",
        diagnosis: "Routine Follow-up",
        dateAdmitted: new Date().toISOString(),
        emotionalState: emotionalStates.happy
    }
];

// Pagination settings
const PATIENTS_PER_PAGE = 5;

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
        emotionalState: emotionalStates.neutral
    };
    patients.unshift(newPatient); // Add to beginning of array
    return newPatient;
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

export function updatePatient(originalMrn, updatedData) {
    const index = patients.findIndex(p => p.mrn === originalMrn);
    if (index !== -1) {
        // Preserve the original dateAdmitted and emotionalState
        const originalPatient = patients[index];
        patients[index] = {
            ...updatedData,
            dateAdmitted: originalPatient.dateAdmitted,
            emotionalState: originalPatient.emotionalState
        };
        return true;
    }
    return false;
}

export function searchPatients(query, page = 1) {
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