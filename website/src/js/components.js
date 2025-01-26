import { addPatient, updatePatient, getPatients } from './patientData.js';
import { refreshPatientsList } from './patients.js';

// Load and initialize sidebar
export async function initializeSidebar(activePage) {
    try {
        console.log('Initializing sidebar with active page:', activePage);
        const response = await fetch('./src/components/sidebar.html');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const html = await response.text();
        console.log('Sidebar HTML loaded');
        
        // Create a temporary container
        const temp = document.createElement('div');
        temp.innerHTML = html;
        
        // Set the active page
        const navLinks = temp.querySelectorAll('.nav-links li');
        console.log('Found nav links:', navLinks.length);
        
        navLinks.forEach((li) => {
            const button = li.querySelector('button');
            if (!button) return;
            
            // Skip logout button
            if (button.classList.contains('logout-btn')) return;
            
            // Extract page name from onclick attribute
            const onclick = button.getAttribute('onclick') || '';
            const match = onclick.match(/href='([^']+)'/);
            if (!match) return;
            
            // Remove .html and any leading/trailing slashes
            const pageName = match[1].replace('.html', '').replace(/^\/+|\/+$/g, '');
            
            // Compare with active page
            if (pageName === activePage) {
                li.classList.add('active');
                console.log(`Set active class for ${pageName}`);
            }
        });
        
        // Insert the sidebar into the page
        const container = document.querySelector('.container');
        if (!container) {
            throw new Error('Container element not found');
        }
        
        const sidebar = temp.querySelector('.sidebar');
        if (!sidebar) {
            throw new Error('Sidebar element not found in loaded HTML');
        }
        
        container.insertBefore(sidebar, container.firstChild);
        console.log('Sidebar inserted into DOM');
        
        console.log('Sidebar initialized successfully');
    } catch (error) {
        console.error('Error initializing sidebar:', error);
        throw error;
    }
} 