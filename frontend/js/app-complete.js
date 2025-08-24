// Complete TimePlanner App.js - Comprehensive functionality (1280+ lines)
// This is the original large file with all features combined

// Global variables and state
let employees = [];
let schedules = [];
let reports = [];
let currentEmployeeId = null;
let currentScheduleData = null;
let weeklyShiftCounters = [1, 1, 1, 1, 1, 1, 1];

// =====================================================
// CORE INITIALIZATION AND VIEW SWITCHING
// =====================================================

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

    // Dark mode toggle
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        const savedTheme = localStorage.getItem('darkMode');
        const prefersDark = savedTheme ? savedTheme === 'true' : true;
        
        darkModeToggle.checked = prefersDark;
        if (prefersDark) {
            document.body.classList.add('dark');
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

    // Setup event listeners
    const applyEmployeeFilter = document.getElementById('applyEmployeeFilter');
    if (applyEmployeeFilter) {
        applyEmployeeFilter.addEventListener('click', () => {
            loadEmployees();
        });
    }

    if (weekSelector) {
        weekSelector.addEventListener('change', () => {
            updateWeekHeaders();
            loadSchedules();
        });
    }

    const refreshReports = document.getElementById('refreshReports');
    if (refreshReports) {
        refreshReports.addEventListener('click', () => {
            loadReports();
        });
    }

    // Initialize view - start with employees
    views.forEach(view => view.classList.add('hidden'));
    switchView('employees');
}

// =====================================================
// DATA LOADING AND API FUNCTIONS
// =====================================================

// Load employees from API
function loadEmployees() {
    const tableBody = document.getElementById('workers-table-body');
    const searchInput = document.getElementById('employeeSearch');
    const statusFilter = document.getElementById('statusFilter');
    
    tableBody.innerHTML = '<tr><td colspan="5" class="text-center p-8 text-gray-400">Chargement...</td></tr>';

    // Build query parameters
    const params = new URLSearchParams();
    if (searchInput && searchInput.value.trim()) {
        params.append('search', searchInput.value.trim());
    }
    if (statusFilter && statusFilter.value) {
        params.append('status', statusFilter.value);
    }

    const url = `http://127.0.0.1:5001/api/workers${params.toString() ? '?' + params.toString() : ''}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            employees = data;
            tableBody.innerHTML = '';
            
            if (data.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="5" class="text-center p-8 text-gray-400">Aucun employé trouvé.</td></tr>';
                return;
            }

            data.forEach(worker => {
                const statusBadge = worker.status === 'employee' ? 
                    '<span class="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">employé</span>' :
                    '<span class="bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-0.5 rounded-full">externe</span>';
                
                const row = `
                    <tr class="hover:bg-gray-750 transition-colors">
                        <td class="px-4 py-3 text-sm text-gray-200">${worker.id}</td>
                        <td class="px-4 py-3 text-sm font-medium text-white">${worker.name}</td>
                        <td class="px-4 py-3 text-sm">${statusBadge}</td>
                        <td class="px-4 py-3 text-sm">
                            <button class="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 rounded" onclick="addEmployeeSchedule(${worker.id})">
                                Ajouter
                            </button>
                        </td>
                        <td class="px-4 py-3 text-sm">
                            <button class="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 rounded mr-2" onclick="modifyEmployee(${worker.id})">
                                Modifier
                            </button>
                            <button class="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1 rounded" onclick="deleteEmployee(${worker.id})">
                                Supprimer
                            </button>
                        </td>
                    </tr>`;
                tableBody.innerHTML += row;
            });
        })
        .catch(error => {
            console.error('Error loading employees:', error);
            showNotification('Erreur lors du chargement des employés', 'error');
            tableBody.innerHTML = `<tr><td colspan="5" class="text-center p-8 text-red-400">Erreur lors du chargement.</td></tr>`;
        });
}

// Load schedules from API
function loadSchedules() {
    const tableBody = document.getElementById('schedules-table-body');
    tableBody.innerHTML = '<tr><td colspan="10" class="text-center p-8 text-gray-400">Chargement...</td></tr>';

    const weekSelector = document.getElementById('weekSelector');
    const selectedDate = weekSelector ? weekSelector.value : new Date().toISOString().split('T')[0];
    const url = `http://127.0.0.1:5001/api/schedule/weekly?date=${selectedDate}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            schedules = data;
            tableBody.innerHTML = '';
            
            if (!data || data.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="10" class="text-center p-8 text-gray-400">Aucune donnée d\'horaire trouvée.</td></tr>';
                return;
            }

            data.forEach(schedule => {
                const formatCell = (value) => {
                    if (!value || value === 0 || value === '0') return '';
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
                            <button class="bg-orange-600 hover:bg-orange-700 text-white text-xs px-3 py-1 rounded" onclick="modifySchedule('${schedule.Name || schedule.name || ''}')">
                                Modifier
                            </button>
                        </td>
                    </tr>`;
                tableBody.innerHTML += row;
            });
        })
        .catch(error => {
            console.error('Error loading schedules:', error);
            showNotification('Erreur lors du chargement des horaires', 'error');
            tableBody.innerHTML = `<tr><td colspan="10" class="text-center p-8 text-red-400">Erreur lors du chargement.</td></tr>`;
        });
}

// Load reports from API
function loadReports() {
    const loadingElement = document.getElementById('reportsLoading');
    const tableContainer = document.getElementById('reportsTableContainer');
    const emptyElement = document.getElementById('reportsEmpty');

    loadingElement.classList.remove('hidden');
    tableContainer.classList.add('hidden');
    emptyElement.classList.add('hidden');

    fetch('http://127.0.0.1:5001/api/reports/archive')
        .then(response => response.json())
        .then(data => {
            reports = data;
            loadingElement.classList.add('hidden');
            
            if (!data || data.length === 0) {
                emptyElement.classList.remove('hidden');
                return;
            }

            tableContainer.classList.remove('hidden');
            const tableBody = document.getElementById('reportsTableBody');
            tableBody.innerHTML = '';
            
            data.forEach(report => {
                const row = `
                    <tr class="hover:bg-gray-750 transition-colors">
                        <td class="px-4 py-3 text-sm font-medium text-white">${report.filename}</td>
                        <td class="px-4 py-3 text-sm text-gray-200">${report.date}</td>
                        <td class="px-4 py-3 text-sm text-gray-200">${report.size}</td>
                        <td class="px-4 py-3 text-sm">
                            <button class="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 rounded mr-2" onclick="downloadReport('${report.filename}')">
                                Télécharger
                            </button>
                            <button class="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1 rounded" onclick="deleteReport('${report.filename}')">
                                Supprimer
                            </button>
                        </td>
                    </tr>`;
                tableBody.innerHTML += row;
            });
        })
        .catch(error => {
            console.error('Error loading reports:', error);
            showNotification('Erreur lors du chargement des rapports', 'error');
            loadingElement.classList.add('hidden');
            emptyElement.classList.remove('hidden');
        });
}

// Export to Excel
function exportToExcel() {
    const weekSelector = document.getElementById('weekSelector');
    const selectedDate = weekSelector ? weekSelector.value : new Date().toISOString().split('T')[0];
    
    showNotification('Génération du rapport Excel...', 'info');
    
    fetch(`http://127.0.0.1:5001/api/export/excel?date=${selectedDate}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur lors de l\'export');
            }
            return response.blob();
        })
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `rapport_${selectedDate}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            showNotification('Export Excel réussi!', 'success');
        })
        .catch(error => {
            console.error('Error exporting to Excel:', error);
            showNotification('Erreur lors de l\'export Excel', 'error');
        });
}

// =====================================================
// CALENDAR AND DATE UTILITIES
// =====================================================

// Update week headers based on selected date
function updateWeekHeaders() {
    const weekSelector = document.getElementById('weekSelector');
    const selectedDate = weekSelector ? weekSelector.value : '2025-07-13';
    
    const dateParts = selectedDate.split('-');
    const year = parseInt(dateParts[0]);
    const month = parseInt(dateParts[1]) - 1; // JavaScript months are 0-indexed
    const day = parseInt(dateParts[2]);
    const date = new Date(year, month, day);
    
    // Get the day of the week (0 = Sunday, 1 = Monday, etc.)
    const dayOfWeek = date.getDay();
    
    // Calculate the date of the Sunday of that week
    const sundayDate = new Date(date);
    sundayDate.setDate(date.getDate() - dayOfWeek);
    
    // Update each day header
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    days.forEach((day, index) => {
        const dayElement = document.getElementById(`${day}-date`);
        if (dayElement) {
            const currentDayDate = new Date(sundayDate);
            currentDayDate.setDate(sundayDate.getDate() + index);
            const dayOfMonth = String(currentDayDate.getDate()).padStart(2, '0');
            const month = String(currentDayDate.getMonth() + 1).padStart(2, '0');
            dayElement.textContent = `${dayOfMonth}/${month}`;
        }
    });
}

// Get current week date range
function getCurrentWeekDateRange() {
    const weekSelector = document.getElementById('weekSelector');
    const selectedDate = weekSelector ? weekSelector.value : '2025-07-13';
    
    const dateParts = selectedDate.split('-');
    const year = parseInt(dateParts[0]);
    const month = parseInt(dateParts[1]) - 1;
    const day = parseInt(dateParts[2]);
    const date = new Date(year, month, day);
    
    const dayOfWeek = date.getDay();
    const sundayDate = new Date(date);
    sundayDate.setDate(date.getDate() - dayOfWeek);
    
    const saturdayDate = new Date(sundayDate);
    saturdayDate.setDate(sundayDate.getDate() + 6);
    
    return {
        start: sundayDate,
        end: saturdayDate
    };
}

// Format date for display
function formatDate(date) {
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        weekday: 'long'
    };
    return date.toLocaleDateString('fr-FR', options);
}

// =====================================================
// EMPLOYEE MANAGEMENT FUNCTIONS
// =====================================================

// Add employee schedule
function addEmployeeSchedule(employeeId) {
    currentEmployeeId = employeeId;
    const employee = employees.find(emp => emp.id === employeeId);
    
    if (!employee) {
        showNotification('Employé non trouvé', 'error');
        return;
    }

    // Update modal title
    const modalTitle = document.getElementById('addScheduleModalTitle');
    if (modalTitle) {
        modalTitle.textContent = `Ajouter un horaire pour ${employee.name}`;
    }

    // Generate weekly schedule form
    generateWeeklyScheduleForm();
    
    // Show modal
    const modal = document.getElementById('addScheduleModal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

// Modify employee
function modifyEmployee(employeeId) {
    currentEmployeeId = employeeId;
    const employee = employees.find(emp => emp.id === employeeId);
    
    if (!employee) {
        showNotification('Employé non trouvé', 'error');
        return;
    }

    // Fill form with current data
    const nameInput = document.getElementById('editEmployeeName');
    const statusSelect = document.getElementById('editEmployeeStatus');
    
    if (nameInput) nameInput.value = employee.name;
    if (statusSelect) statusSelect.value = employee.status;

    // Show modal
    const modal = document.getElementById('editEmployeeModal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

// Delete employee
function deleteEmployee(employeeId) {
    const employee = employees.find(emp => emp.id === employeeId);
    
    if (!employee) {
        showNotification('Employé non trouvé', 'error');
        return;
    }

    if (confirm(`Êtes-vous sûr de vouloir supprimer l'employé "${employee.name}" ?`)) {
        fetch(`http://127.0.0.1:5001/api/workers/${employeeId}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (response.ok) {
                showNotification('Employé supprimé avec succès', 'success');
                loadEmployees(); // Refresh the list
            } else {
                throw new Error('Erreur lors de la suppression');
            }
        })
        .catch(error => {
            console.error('Error deleting employee:', error);
            showNotification('Erreur lors de la suppression', 'error');
        });
    }
}

// Save employee changes
function saveEmployeeChanges() {
    const nameInput = document.getElementById('editEmployeeName');
    const statusSelect = document.getElementById('editEmployeeStatus');
    
    if (!nameInput || !statusSelect || !currentEmployeeId) {
        showNotification('Données manquantes', 'error');
        return;
    }

    const updatedEmployee = {
        name: nameInput.value.trim(),
        status: statusSelect.value
    };

    if (!updatedEmployee.name) {
        showNotification('Le nom est requis', 'error');
        return;
    }

    fetch(`http://127.0.0.1:5001/api/workers/${currentEmployeeId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedEmployee)
    })
    .then(response => {
        if (response.ok) {
            showNotification('Employé modifié avec succès', 'success');
            closeModal('editEmployeeModal');
            loadEmployees(); // Refresh the list
        } else {
            throw new Error('Erreur lors de la modification');
        }
    })
    .catch(error => {
        console.error('Error updating employee:', error);
        showNotification('Erreur lors de la modification', 'error');
    });
}

// Open employee calendar
function openEmployeeCalendar(employeeId) {
    const employee = employees.find(emp => emp.id === employeeId);
    
    if (!employee) {
        showNotification('Employé non trouvé', 'error');
        return;
    }

    // Update modal title
    const modalTitle = document.getElementById('employeeCalendarModalTitle');
    if (modalTitle) {
        modalTitle.textContent = `Calendrier de ${employee.name}`;
    }

    // Load employee calendar data
    fetch(`http://127.0.0.1:5001/api/workers/${employeeId}/calendar`)
        .then(response => response.json())
        .then(data => {
            generateEmployeeCalendar(data);
        })
        .catch(error => {
            console.error('Error loading calendar:', error);
            showNotification('Erreur lors du chargement du calendrier', 'error');
        });

    // Show modal
    const modal = document.getElementById('employeeCalendarModal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

// Generate employee calendar
function generateEmployeeCalendar(calendarData) {
    const calendarContainer = document.getElementById('employeeCalendarContainer');
    if (!calendarContainer) return;

    // This would contain the calendar generation logic
    calendarContainer.innerHTML = `
        <div class="p-4 text-center text-gray-400">
            <p>Calendrier de l'employé</p>
            <p class="text-sm mt-2">Fonctionnalité en développement</p>
        </div>
    `;
}

// =====================================================
// SCHEDULE MANAGEMENT FUNCTIONS
// =====================================================

// Generate weekly schedule form
function generateWeeklyScheduleForm() {
    const container = document.getElementById('weeklySchedule');
    if (!container) return;
    
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    
    container.innerHTML = '';
    
    days.forEach((day, index) => {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'day-schedule mb-4';
        dayDiv.innerHTML = `
            <div class="flex items-center justify-between mb-2">
                <label class="flex items-center space-x-2">
                    <input type="checkbox" id="day${index}" class="day-checkbox" onchange="toggleDayInputs(${index})" ${index === 0 ? 'checked' : ''}>
                    <span class="text-white font-medium">${day}</span>
                </label>
                <span class="text-sm text-gray-400" id="dayStatus${index}">${index === 0 ? 'Travail' : 'Repos'}</span>
            </div>
            <div class="day-inputs ${index === 0 ? '' : 'hidden'}" id="dayInputs${index}">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-1">Type d'activité</label>
                        <select id="activityType${index}" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500" onchange="updateActivityTypeInfo(${index})">
                            <option value="X">X - Travail Normal</option>
                            <option value="F">F - Formation</option>
                            <option value="V">V - Vacances</option>
                            <option value="M">M - Maladie</option>
                            <option value="C">C - Congé</option>
                            <option value="RP">RP - Repos Payé</option>
                            <option value="S">S - Service</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-1">Nombre d'heures</label>
                        <input type="number" id="hoursCount${index}" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500" value="8" min="0" step="0.5" onchange="validateShiftTimes(${index})">
                    </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-1">Début</label>
                        <input type="time" id="startTime${index}" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500" value="00:00" onchange="validateShiftTimes(${index})">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-1">Fin</label>
                        <input type="time" id="endTime${index}" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500" value="23:59" onchange="validateShiftTimes(${index})">
                    </div>
                </div>
                <div class="flex items-center space-x-4 mb-4">
                    <label class="flex items-center space-x-2">
                        <input type="checkbox" id="isNightShift${index}" class="night-shift-checkbox" onchange="updateNightShiftInfo(${index})">
                        <span class="text-sm text-gray-300">Équipe de nuit (se termine le jour suivant)</span>
                        <span class="text-purple-400">🌙</span>
                    </label>
                </div>
                <div class="text-xs text-gray-500 mb-4" id="nightShiftInfo${index}" style="display: none;">
                    L'équipe commence aujourd'hui et se termine demain. Le jour suivant sera marqué "Fibeure" sur le calendrier.
                </div>
            </div>
        `;
        container.appendChild(dayDiv);
    });
}

// Toggle day inputs
function toggleDayInputs(dayIndex) {
    const checkbox = document.getElementById(`day${dayIndex}`);
    const inputs = document.getElementById(`dayInputs${dayIndex}`);
    const status = document.getElementById(`dayStatus${dayIndex}`);
    
    if (checkbox.checked) {
        inputs.classList.remove('hidden');
        status.textContent = 'Travail';
    } else {
        inputs.classList.add('hidden');
        status.textContent = 'Repos';
    }
}

// Update night shift info
function updateNightShiftInfo(dayIndex) {
    const nightShiftCheckbox = document.getElementById(`isNightShift${dayIndex}`);
    const nightShiftInfo = document.getElementById(`nightShiftInfo${dayIndex}`);
    
    if (nightShiftCheckbox.checked) {
        nightShiftInfo.style.display = 'block';
    } else {
        nightShiftInfo.style.display = 'none';
    }
}

// Update activity type info
function updateActivityTypeInfo(dayIndex) {
    const activityType = document.getElementById(`activityType${dayIndex}`);
    const startTime = document.getElementById(`startTime${dayIndex}`);
    const endTime = document.getElementById(`endTime${dayIndex}`);
    const hoursCount = document.getElementById(`hoursCount${dayIndex}`);
    
    // Set default values based on activity type
    switch (activityType.value) {
        case 'X': // Garde
            startTime.value = '00:00'; // 12:00 AM
            endTime.value = '23:59'; // 11:59 PM
            hoursCount.value = '24';
            break;
        case 'S': // Soutien de jour
            startTime.value = '09:00'; // 9:00 AM
            endTime.value = '17:00'; // 5:00 PM
            hoursCount.value = '8';
            break;
        case 'RP': // Rencontre Prénatale
            startTime.value = '09:00'; // 9:00 AM
            endTime.value = '17:00'; // 5:00 PM
            hoursCount.value = '8';
            break;
        case 'F':
            startTime.value = '09:00';
            endTime.value = '17:00';
            hoursCount.value = '7';
            break;
        default:
            // For V, M, C - these don't need specific times
            startTime.value = '08:00';
            endTime.value = '17:00';
            hoursCount.value = '8';
    }
}

// Validate shift times
function validateShiftTimes(dayIndex) {
    const startTime = document.getElementById(`startTime${dayIndex}`);
    const endTime = document.getElementById(`endTime${dayIndex}`);
    const isNightShift = document.getElementById(`isNightShift${dayIndex}`);
    const hoursCount = document.getElementById(`hoursCount${dayIndex}`);
    
    if (!startTime || !endTime || !hoursCount) return;
    
    const start = new Date(`2000-01-01T${startTime.value}`);
    let end = new Date(`2000-01-01T${endTime.value}`);
    
    // If it's a night shift, end time is next day
    if (isNightShift.checked) {
        end = new Date(`2000-01-02T${endTime.value}`);
    }
    
    // Calculate hours difference
    const diffMs = end - start;
    const diffHours = diffMs / (1000 * 60 * 60);
    
    if (diffHours > 0) {
        hoursCount.value = diffHours.toFixed(1);
    }
}

// Modify schedule
function modifySchedule(employeeName) {
    const schedule = schedules.find(s => (s.Name || s.name) === employeeName);
    
    if (!schedule) {
        showNotification('Horaire non trouvé', 'error');
        return;
    }

    currentScheduleData = schedule;
    
    // Update modal title
    const modalTitle = document.getElementById('addScheduleModalTitle');
    if (modalTitle) {
        modalTitle.textContent = `Modifier l'horaire de ${employeeName}`;
    }

    // Generate and populate form
    generateWeeklyScheduleForm();
    populateScheduleForm(schedule);
    
    // Show modal
    const modal = document.getElementById('addScheduleModal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

// Populate schedule form with existing data
function populateScheduleForm(schedule) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    days.forEach((day, index) => {
        const dayValue = schedule[day];
        const checkbox = document.getElementById(`day${index}`);
        const inputs = document.getElementById(`dayInputs${index}`);
        const status = document.getElementById(`dayStatus${index}`);
        
        if (dayValue && dayValue !== '0' && dayValue !== 0) {
            checkbox.checked = true;
            inputs.classList.remove('hidden');
            status.textContent = 'Travail';
            
            // Parse the value to extract activity type and hours
            // This is a simplified version - you'd need more complex parsing
            const activityType = document.getElementById(`activityType${index}`);
            const hoursCount = document.getElementById(`hoursCount${index}`);
            
            if (activityType) activityType.value = dayValue.toString().charAt(0) || 'X';
            if (hoursCount) hoursCount.value = '8'; // Default
        } else {
            checkbox.checked = false;
            inputs.classList.add('hidden');
            status.textContent = 'Repos';
        }
    });
}

// Save schedule
function saveSchedule() {
    if (!currentEmployeeId) {
        showNotification('Employé non sélectionné', 'error');
        return;
    }

    const scheduleData = {
        employee_id: currentEmployeeId,
        week_date: document.getElementById('weekSelector').value,
        schedule: {}
    };

    // Collect data from form
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    days.forEach((day, index) => {
        const checkbox = document.getElementById(`day${index}`);
        
        if (checkbox.checked) {
            const activityType = document.getElementById(`activityType${index}`);
            const hoursCount = document.getElementById(`hoursCount${index}`);
            const startTime = document.getElementById(`startTime${index}`);
            const endTime = document.getElementById(`endTime${index}`);
            const isNightShift = document.getElementById(`isNightShift${index}`);
            
            scheduleData.schedule[day] = {
                activity_type: activityType.value,
                hours: parseFloat(hoursCount.value),
                start_time: startTime.value,
                end_time: endTime.value,
                is_night_shift: isNightShift.checked
            };
        } else {
            scheduleData.schedule[day] = null;
        }
    });

    // Send to API
    const method = currentScheduleData ? 'PUT' : 'POST';
    const url = currentScheduleData ? 
        `http://127.0.0.1:5001/api/schedule/${currentScheduleData.id}` : 
        'http://127.0.0.1:5001/api/schedule';

    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(scheduleData)
    })
    .then(response => {
        if (response.ok) {
            showNotification('Horaire sauvegardé avec succès', 'success');
            closeModal('addScheduleModal');
            loadSchedules(); // Refresh the list
        } else {
            throw new Error('Erreur lors de la sauvegarde');
        }
    })
    .catch(error => {
        console.error('Error saving schedule:', error);
        showNotification('Erreur lors de la sauvegarde', 'error');
    });
}

// =====================================================
// MODAL MANAGEMENT FUNCTIONS
// =====================================================

// Close modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
    }
    
    // Reset current data
    currentEmployeeId = null;
    currentScheduleData = null;
}

// Show modal
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
    }
}

// =====================================================
// FORM HANDLING FUNCTIONS
// =====================================================

// Handle form submission
function handleFormSubmit(event, formType) {
    event.preventDefault();
    
    switch (formType) {
        case 'employee':
            saveEmployeeChanges();
            break;
        case 'schedule':
            saveSchedule();
            break;
        default:
            console.warn('Unknown form type:', formType);
    }
}

// Reset form
function resetForm(formId) {
    const form = document.getElementById(formId);
    if (form) {
        form.reset();
    }
}

// =====================================================
// REPORT MANAGEMENT FUNCTIONS
// =====================================================

// Download report
function downloadReport(filename) {
    fetch(`http://127.0.0.1:5001/api/reports/download/${filename}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur lors du téléchargement');
            }
            return response.blob();
        })
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            showNotification('Téléchargement réussi!', 'success');
        })
        .catch(error => {
            console.error('Error downloading report:', error);
            showNotification('Erreur lors du téléchargement', 'error');
        });
}

// Delete report
function deleteReport(filename) {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le rapport "${filename}" ?`)) {
        fetch(`http://127.0.0.1:5001/api/reports/${filename}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (response.ok) {
                showNotification('Rapport supprimé avec succès', 'success');
                loadReports(); // Refresh the list
            } else {
                throw new Error('Erreur lors de la suppression');
            }
        })
        .catch(error => {
            console.error('Error deleting report:', error);
            showNotification('Erreur lors de la suppression', 'error');
        });
    }
}

// =====================================================
// UI UTILITY FUNCTIONS
// =====================================================

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg text-white font-medium z-50 transition-all duration-300 transform translate-x-full`;
    
    if (type === 'success') {
        notification.classList.add('bg-green-600');
    } else if (type === 'error') {
        notification.classList.add('bg-red-600');
    } else if (type === 'warning') {
        notification.classList.add('bg-yellow-600');
    } else {
        notification.classList.add('bg-blue-600');
    }
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
    }, 100);
    
    // Animate out and remove
    setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Show loading state
function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `
            <div class="flex items-center justify-center p-8">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span class="ml-2 text-gray-400">Chargement...</span>
            </div>
        `;
    }
}

// Hide loading state
function hideLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = '';
    }
}

// Confirm action
function confirmAction(message, callback) {
    if (confirm(message)) {
        callback();
    }
}

// =====================================================
// GLOBAL WINDOW FUNCTIONS
// =====================================================

// Make functions globally available
window.initializeApp = initializeApp;
window.loadEmployees = loadEmployees;
window.loadSchedules = loadSchedules;
window.loadReports = loadReports;
window.exportToExcel = exportToExcel;
window.updateWeekHeaders = updateWeekHeaders;
window.addEmployeeSchedule = addEmployeeSchedule;
window.modifyEmployee = modifyEmployee;
window.deleteEmployee = deleteEmployee;
window.saveEmployeeChanges = saveEmployeeChanges;
window.openEmployeeCalendar = openEmployeeCalendar;
window.generateWeeklyScheduleForm = generateWeeklyScheduleForm;
window.toggleDayInputs = toggleDayInputs;
window.updateNightShiftInfo = updateNightShiftInfo;
window.updateActivityTypeInfo = updateActivityTypeInfo;
window.validateShiftTimes = validateShiftTimes;
window.modifySchedule = modifySchedule;
window.saveSchedule = saveSchedule;
window.closeModal = closeModal;
window.showModal = showModal;
window.handleFormSubmit = handleFormSubmit;
window.resetForm = resetForm;
window.downloadReport = downloadReport;
window.deleteReport = deleteReport;
window.showNotification = showNotification;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.confirmAction = confirmAction;

// =====================================================
// INITIALIZATION
// =====================================================

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);

// Export key functions for module compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeApp,
        loadEmployees,
        loadSchedules,
        loadReports,
        showNotification
    };
}
