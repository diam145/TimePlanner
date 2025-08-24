// Core initialization and view switching functionality
import { loadEmployees, loadSchedules, loadReports, exportToExcel } from './data.js';
import { updateWeekHeaders } from './calendar.js';

// Initialize the app - can be called after partials are loaded
function initializeApp() {
    const views = document.querySelectorAll('.view');
    const navButtons = document.querySelectorAll('.nav-button');

    // Initialize date input with July 13, 2025
    const weekSelector = document.getElementById('weekSelector');
    if (weekSelector) {
        weekSelector.value = '2025-07-13';
    }

    // Function to switch between views
    function switchView(viewId) {
        // Hide all views
        views.forEach(view => view.classList.add('hidden'));
        // Deactivate all nav buttons
        navButtons.forEach(btn => btn.classList.remove('active'));

        // Show the selected view
        const activeView = document.getElementById(`view-${viewId}`);
        if (activeView) {
            activeView.classList.remove('hidden');
        }

        // Activate the selected nav button
        const activeButton = document.querySelector(`.nav-button[data-view="${viewId}"]`);
        if (activeButton) {
            activeButton.classList.add('active');
        }

        // Load data for the active view
        if (viewId === 'employees') {
            loadEmployees();
        } else if (viewId === 'schedules') {
            // Ensure the date picker has the correct value before updating headers
            setTimeout(() => {
                updateWeekHeaders();
                loadSchedules();
            }, 100);
        } else if (viewId === 'reports') {
            loadReports();
        }
    }

    // Add click listeners to nav buttons
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const viewId = button.getAttribute('data-view');
            switchView(viewId);
        });
    });

    // Dark mode toggle functionality
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        // Check if user has a preference stored
        const savedTheme = localStorage.getItem('darkMode');
        const prefersDark = savedTheme ? savedTheme === 'true' : true; // Default to dark mode
        
        darkModeToggle.checked = prefersDark;
        if (prefersDark) {
            document.body.classList.add('dark');
        } else {
            document.body.classList.remove('dark');
        }
        
        darkModeToggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                document.body.classList.add('dark');
                localStorage.setItem('darkMode', 'true');
            } else {
                document.body.classList.remove('dark');
                localStorage.setItem('darkMode', 'false');
            }
        });
    }

    // Employee search and filter functionality
    const employeeSearch = document.getElementById('employeeSearch');
    const statusFilter = document.getElementById('statusFilter');
    const applyEmployeeFilter = document.getElementById('applyEmployeeFilter');

    if (applyEmployeeFilter) {
        applyEmployeeFilter.addEventListener('click', () => {
            loadEmployees();
        });
    }

    // Week selector change handler
    if (weekSelector) {
        weekSelector.addEventListener('change', () => {
            updateWeekHeaders();
            loadSchedules();
        });
    }

    // Refresh reports button
    const refreshReports = document.getElementById('refreshReports');
    if (refreshReports) {
        refreshReports.addEventListener('click', () => {
            loadReports();
        });
    }

    // Export Excel button
    const exportExcel = document.getElementById('exportExcel');
    if (exportExcel) {
        exportExcel.addEventListener('click', () => {
            exportToExcel();
        });
    }

    // Ensure all views start hidden, then show employees view
    views.forEach(view => view.classList.add('hidden'));
    switchView('employees');
}

// Run initialization on DOMContentLoaded for backwards compatibility
document.addEventListener('DOMContentLoaded', initializeApp);

// Make initializeApp available globally for the modular version
window.initializeApp = initializeApp;

export { initializeApp };
