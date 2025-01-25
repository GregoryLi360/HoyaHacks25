export async function loadComponent(path) {
    try {
        const response = await fetch(`${path}.html`);
        const html = await response.text();
        return html;
    } catch (error) {
        console.error(`Error loading component from ${path}:`, error);
        return '';
    }
}

export async function initializeModal() {
    const modalHtml = await loadComponent('/components/modals/add-patient');
    const modalContainer = document.getElementById('addPatientModal');
} 