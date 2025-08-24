// Data loading and API functions
import { showNotification } from './ui.js';

// Employee search and filter functionality
const employeeSearch = document.getElementById('employeeSearch');
const statusFilter = document.getElementById('statusFilter');
const weekSelector = document.getElementById('weekSelector');

function loadEmployees() {
    const tableBody = document.getElementById('workers-table-body');
    tableBody.innerHTML = '<tr><td colspan="5" class="text-center p-8 text-gray-400">Chargement...</td></tr>';

    // Get filter values
    const searchTerm = employeeSearch ? employeeSearch.value.trim().toLowerCase() : '';
    const statusFilterValue = statusFilter ? statusFilter.value : '';

    fetch('http://127.0.0.1:5001/api/workers')
        .then(response => response.json())
        .then(data => {
            tableBody.innerHTML = ''; // Clear loading message
            
            // Filter data based on search and status
            let filteredData = data;
            if (searchTerm) {
                filteredData = filteredData.filter(worker => 
                    worker.name.toLowerCase().includes(searchTerm) || 
                    worker.id.toString().includes(searchTerm)
                );
            }
            if (statusFilterValue) {
                filteredData = filteredData.filter(worker => worker.status === statusFilterValue);
            }

            if (filteredData.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="5" class="text-center p-8 text-gray-400">Aucun employé trouvé.</td></tr>';
                return;
            }

            filteredData.forEach(worker => {
                const statusBadge = worker.status === 'employee' ? 
                    '<span class="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">employé</span>' :
                    '<span class="bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-0.5 rounded-full">externe</span>';
                
                const row = `
                    <tr class="hover:bg-gray-750 transition-colors">
                        <td class="px-4 py-3 text-sm text-gray-200">${worker.id}</td>
                        <td class="px-4 py-3 text-sm font-medium text-white">${worker.name}</td>
                        <td class="px-4 py-3 text-sm">${statusBadge}</td>
                        <td class="px-4 py-3 text-sm">
                            <div class="flex space-x-2">
                                <button class="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 rounded transition-colors" onclick="addEmployeeSchedule(${worker.id})">
                                    Ajouter
                                </button>
                                <button class="bg-orange-600 hover:bg-orange-700 text-white text-xs px-3 py-1 rounded transition-colors" onclick="modifyScheduleName('${worker.name}')">
                                    Modifier
                                </button>
                            </div>
                        </td>
                        <td class="px-4 py-3 text-sm">
                            <div class="flex space-x-2">
                                <button class="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 rounded transition-colors" onclick="modifyEmployee(${worker.id})">
                                    Modifier
                                </button>
                                <button class="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1 rounded transition-colors" onclick="deleteEmployee(${worker.id})">
                                    Supprimer
                                </button>
                            </div>
                        </td>
                    </tr>`;
                tableBody.innerHTML += row;
            });
        })
        .catch(error => {
            console.error('Error loading employees:', error);
            tableBody.innerHTML = `<tr><td colspan="5" class="text-center p-8 text-red-400">Erreur lors du chargement des données.</td></tr>`;
        });
}

function loadSchedules() {
    const tableBody = document.getElementById('schedules-table-body');
    tableBody.innerHTML = '<tr><td colspan="10" class="text-center p-8 text-gray-400">Chargement...</td></tr>';

    // Get selected date from date picker
    const selectedDate = weekSelector ? weekSelector.value : new Date().toISOString().split('T')[0];
    const url = `http://127.0.0.1:5001/api/schedule/weekly?date=${selectedDate}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            tableBody.innerHTML = '';
            
            if (!data || data.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="10" class="text-center p-8 text-gray-400">Aucune donnée d\'horaire trouvée pour cette semaine.</td></tr>';
                return;
            }

            data.forEach(schedule => {
                // Format the schedule data to match the display format
                const formatCell = (value) => {
                    if (!value || value === 0 || value === '0') return '';
                    if (typeof value === 'string') {
                        // Handle different string formats (F, X, S, RP, etc.)
                        return value;
                    }
                    return value;
                };

                const row = `
                    <tr class="hover:bg-gray-750 transition-colors">
                        <td class="px-4 py-3 text-sm font-medium text-white">${schedule.Name || schedule.name || ''}</td>
                        <td class="px-4 py-3 text-center text-sm text-gray-200">${formatCell(schedule.Sunday)}</td>
                        <td class="px-4 py-3 text-center text-sm text-gray-200">${formatCell(schedule.Monday)}</td>
                        <td class="px-4 py-3 text-center text-sm text-gray-200">${formatCell(schedule.Tuesday)}</td>
                        <td class="px-4 py-3 text-center text-sm text-gray-200">${formatCell(schedule.Wednesday)}</td>
                        <td class="px-4 py-3 text-center text-sm text-gray-200">${formatCell(schedule.Thursday)}</td>
                        <td class="px-4 py-3 text-center text-sm text-gray-200">${formatCell(schedule.Friday)}</td>
                        <td class="px-4 py-3 text-center text-sm text-gray-200">${formatCell(schedule.Saturday)}</td>
                        <td class="px-4 py-3 text-center text-sm font-bold text-blue-400">${schedule.TOTAL || 0}</td>
                        <td class="px-4 py-3 text-center text-sm">
                            <button class="bg-orange-600 hover:bg-orange-700 text-white text-xs px-3 py-1 rounded transition-colors" onclick="modifyEmployeeSchedule('${schedule.Name || schedule.name || ''}')">
                                Modifier
                            </button>
                        </td>
                    </tr>`;
                tableBody.innerHTML += row;
            });
        })
        .catch(error => {
            console.error('Error loading schedules:', error);
            tableBody.innerHTML = `<tr><td colspan="10" class="text-center p-8 text-red-400">Erreur lors du chargement des données d'horaire.</td></tr>`;
        });
}

function loadReports() {
    const loadingElement = document.getElementById('reportsLoading');
    const tableContainer = document.getElementById('reportsTableContainer');
    const emptyElement = document.getElementById('reportsEmpty');
    const tableBody = document.getElementById('reportsTableBody');

    // Show loading state
    loadingElement.classList.remove('hidden');
    tableContainer.classList.add('hidden');
    emptyElement.classList.add('hidden');

    fetch('http://127.0.0.1:5001/api/reports/archive')
        .then(response => response.json())
        .then(data => {
            loadingElement.classList.add('hidden');
            
            if (!data || data.length === 0) {
                emptyElement.classList.remove('hidden');
                return;
            }

            // Show table and populate data
            tableContainer.classList.remove('hidden');
            tableBody.innerHTML = '';

            data.forEach(file => {
                const fileSizeKB = (file.size / 1024).toFixed(1);
                const row = `
                    <tr class="hover:bg-gray-750 transition-colors">
                        <td class="px-4 py-3 text-sm text-white flex items-center">
                            <i class="fa-solid fa-file-excel mr-2 text-green-400"></i>
                            ${file.filename}
                        </td>
                        <td class="px-4 py-3 text-sm text-gray-300">
                            ${file.modified_date}
                        </td>
                        <td class="px-4 py-3 text-sm text-gray-300">
                            ${fileSizeKB} KB
                        </td>
                        <td class="px-4 py-3 text-center">
                            <div class="flex justify-center space-x-2">
                                <button onclick="saveReport('${file.filename}')" 
                                        class="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 rounded transition-colors flex items-center space-x-1">
                                    <i class="fa-solid fa-download"></i>
                                    <span>SAUVEGARDER</span>
                                </button>
                                <button onclick="updateReport('${file.filename}')" 
                                        class="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 rounded transition-colors flex items-center space-x-1">
                                    <i class="fa-solid fa-sync-alt"></i>
                                    <span>METTRE À JOUR</span>
                                </button>
                                <button onclick="deleteReport('${file.filename}')" 
                                        class="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1 rounded transition-colors flex items-center space-x-1">
                                    <i class="fa-solid fa-trash"></i>
                                    <span>SUPPRIMER</span>
                                </button>
                            </div>
                        </td>
                    </tr>`;
                tableBody.innerHTML += row;
            });
        })
        .catch(error => {
            console.error('Error loading reports:', error);
            loadingElement.classList.add('hidden');
            emptyElement.classList.remove('hidden');
            showNotification('Erreur lors du chargement des rapports', 'error');
        });
}

// Export to Excel function
function exportToExcel() {
    const button = document.getElementById('exportExcel');
    const originalText = button.innerHTML;
    
    button.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Export...';
    button.disabled = true;

    const selectedDate = weekSelector ? weekSelector.value : new Date().toISOString().split('T')[0];
    const url = `http://127.0.0.1:5001/api/export/excel?date=${selectedDate}`;

    fetch(url)
    .then(response => {
        if (response.ok) {
            return response.json();
        }
        throw new Error('Export failed');
    })
    .then(data => {
        button.innerHTML = originalText;
        button.disabled = false;
        
        if (data.error) {
            showNotification('Erreur lors de l\'export Excel: ' + data.error, 'error');
        } else {
            showNotification(`${data.message}`, 'success');
        }
    })
    .catch(error => {
        console.error('Error exporting to Excel:', error);
        button.innerHTML = originalText;
        button.disabled = false;
        showNotification('Erreur lors de l\'export Excel', 'error');
    });
}

// Make functions available globally
window.loadReports = loadReports;

export { loadEmployees, loadSchedules, loadReports, exportToExcel };
