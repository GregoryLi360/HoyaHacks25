import { initializeModal } from './modal.js';
import notificationManager from './notifications.js';
import { initializeSidebar } from './components.js';
import { emotionalStates } from './patientData.js';

const ROOT_URL = "https://hoyahacks25.onrender.com/api";
const AUTH_TOKEN = "05d49692b755f99c4504b510418efeeeebfd466892540f27acf9a31a326d6504";

function setupModalControls() {
    const addPatientBtn = document.getElementById('addPatientBtn');
    const modal = document.getElementById('addPatientModal');

    if (addPatientBtn && modal) {
        addPatientBtn.addEventListener('click', () => {
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
            if (form) form.reset();
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

// Format duration in minutes and seconds
function formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
}

// Format time to display
function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

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

// Create interaction row HTML
function createInteractionRow(interaction) {
    const initial = interaction.firstName ? interaction.firstName[0].toUpperCase() : '?';
    const emotionKey = interaction.emotionalState || 'neutral';
    const emotionalState = emotionalStates[emotionKey];
    
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>
            <div class="interaction-info">
                <div class="interaction-avatar" style="background-color: ${emotionalState.lightColor}">
                    ${initial}
                </div>
                <span>${interaction.firstName || ''} ${interaction.lastName || ''}</span>
            </div>
        </td>
        <td>
            <div class="interaction-time">
                <i class="material-icons">schedule</i>
                ${formatTime(interaction.startTime)}
            </div>
        </td>
        <td>
            <div class="interaction-duration">
                <i class="material-icons">timer</i>
                ${formatDuration(interaction.interactionTime)}
            </div>
        </td>
        <td>
            <div class="emotion-indicator ${emotionKey}">
                ${createEmotionSVG(emotionalState)}
                <span class="emotion-text ${emotionKey}">
                    ${emotionKey.charAt(0).toUpperCase() + emotionKey.slice(1)}
                </span>
            </div>
        </td>
        <td class="actions">
            <button class="icon-btn" title="View details"><i class="material-icons">visibility</i></button>
            <button class="icon-btn" title="More options"><i class="material-icons">more_vert</i></button>
        </td>
    `;
    return row;
}

// Calculate dashboard metrics
function calculateMetrics(patients) {
    // Get all interactions with interactionTime
    const allInteractions = patients.flatMap(patient => {
        const logs = patient.logs || [];
        return logs.filter(log => log.interactionTime).map(log => ({
            mrn: patient.MRN,
            startTime: log.startTime || 0,
            interactionTime: log.interactionTime || 0,
            emotionalState: log.emotionalState || 'neutral'
        }));
    });

    // Total number of interactions
    const totalInteractions = allInteractions.length;

    // Number of unique users
    const uniqueUsers = new Set(allInteractions.map(i => i.mrn)).size;

    // Average interaction time
    const totalTime = allInteractions.reduce((sum, i) => sum + i.interactionTime, 0);
    const avgTime = totalInteractions > 0 ? Math.round(totalTime / totalInteractions) : 0;

    // Most common emotion
    const emotionCounts = allInteractions.reduce((counts, i) => {
        counts[i.emotionalState] = (counts[i.emotionalState] || 0) + 1;
        return counts;
    }, {});
    const mostCommonEmotion = Object.entries(emotionCounts)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';

    return {
        totalInteractions,
        uniqueUsers,
        avgTime,
        mostCommonEmotion
    };
}

// Update metrics display
function updateMetricsDisplay(metrics) {
    const metricsGrid = document.querySelector('.metrics-grid');
    if (!metricsGrid) return;

    metricsGrid.innerHTML = `
        <div class="metric-card">
            <div class="metric-icon">
                <i class="material-icons">psychology</i>
            </div>
            <div class="metric-content">
                <h3>AI Interactions</h3>
                <p class="metric-value">${metrics.totalInteractions.toLocaleString()}</p>
                <p class="metric-change">Total interactions</p>
            </div>
        </div>
        <div class="metric-card">
            <div class="metric-icon">
                <i class="material-icons">sentiment_satisfied_alt</i>
            </div>
            <div class="metric-content">
                <h3>Common Emotion</h3>
                <p class="metric-value">${metrics.mostCommonEmotion.charAt(0).toUpperCase() + metrics.mostCommonEmotion.slice(1)}</p>
                <p class="metric-change">Most frequent state</p>
            </div>
        </div>
        <div class="metric-card">
            <div class="metric-icon">
                <i class="material-icons">timer</i>
            </div>
            <div class="metric-content">
                <h3>Avg. Duration</h3>
                <p class="metric-value">${formatDuration(metrics.avgTime)}</p>
                <p class="metric-change">Per interaction</p>
            </div>
        </div>
        <div class="metric-card">
            <div class="metric-icon">
                <i class="material-icons">people</i>
            </div>
            <div class="metric-content">
                <h3>Active Users</h3>
                <p class="metric-value">${metrics.uniqueUsers}</p>
                <p class="metric-change">Unique patients</p>
            </div>
        </div>
    `;
}

// Refresh interactions list
async function refreshInteractionsList() {
    try {
        const tbody = document.getElementById('interactions-tbody');
        if (!tbody) return;

        // Show loading state
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 20px;">
                    <div>Loading interactions...</div>
                </td>
            </tr>
        `;

        // Fetch patients data
        const response = await fetch(`${ROOT_URL}/patients`, {
            method: "GET",
            headers: {
                'Authorization': 'Bearer ' + AUTH_TOKEN,
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch patients');
        }

        const patients = await response.json();
        
        // Update metrics first
        const metrics = calculateMetrics(patients);
        updateMetricsDisplay(metrics);
        
        // Extract interactions from patient logs
        const allInteractions = patients.flatMap(patient => {
            const logs = patient.logs || [];
            return logs.map(log => ({
                firstName: log.firstName || '',
                lastName: log.lastName || '',
                mrn: patient.MRN,
                interactionTime: log.interactionTime,
                startTime: log.startTime || 0,
                emotionalState: log.emotionalState || 'neutral'
            }));
        });
        
        // Filter out interactions without interactionTime and sort by startTime
        const interactions = allInteractions
            .filter(interaction => interaction.interactionTime)
            .sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

        // Display interactions
        tbody.innerHTML = '';
        if (interactions.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 20px;">
                        <div>No recent interactions</div>
                    </td>
                </tr>
            `;
        } else {
            interactions.forEach(interaction => {
                tbody.appendChild(createInteractionRow(interaction));
            });
        }
    } catch (error) {
        console.error('Error refreshing interactions:', error);
        const tbody = document.getElementById('interactions-tbody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 20px;">
                        <div>Error loading interactions. Please try again.</div>
                    </td>
                </tr>
            `;
        }
    }
}

// Initialize the dashboard when the DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Initializing dashboard...');
    
    // Initialize sidebar
    await initializeSidebar('dashboard');
    
    // Initialize modal
    await initializeModal();
    
    // Setup modal controls
    setupModalControls();

    // Load initial interactions data
    await refreshInteractionsList();

    // Setup update button
    const updateBtn = document.querySelector('.update-btn');
    if (updateBtn) {
        updateBtn.addEventListener('click', refreshInteractionsList);
    }

    // Initialize notifications
    window.showNotification = (type = 'add') => {
        const message = type === 'delete' ? 
            'Patient deleted successfully' : 
            'Patient data saved successfully';
        notificationManager.show(message, type);
    };

    // Handle logout
    window.handleLogout = () => {
        localStorage.removeItem('auth_token');
        sessionStorage.removeItem('auth_token');
        window.location.href = '/auth.html';
    };
}); 