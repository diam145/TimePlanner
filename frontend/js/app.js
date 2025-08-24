// Complete TimePlanner App.js - Comprehensive functionality (1280+ lines)
// This is the original large file with all features combined

// Global variables and state
let employees = [];
let schedules = []; // Main schedule data for "Gestion des Horaires"
let teamScheduleData = []; // Independent team schedule data from date range API
let reports = [];
let currentEmployeeId = null;
let currentScheduleData = null;
let weeklyShiftCounters = [1, 1, 1, 1, 1, 1, 1];
let teams = []; // Team data

// Team schedule settings persistence
let teamScheduleSettings = {
    startDate: '',
    endDate: ''
};

// Load team schedule settings from localStorage
function loadTeamScheduleSettings() {
    const saved = localStorage.getItem('teamScheduleSettings');
    if (saved) {
        try {
            teamScheduleSettings = JSON.parse(saved);
        } catch (e) {
            console.log('Error loading team schedule settings:', e);
        }
    }
}

// Save team schedule settings to localStorage
function saveTeamScheduleSettings() {
    try {
        localStorage.setItem('teamScheduleSettings', JSON.stringify(teamScheduleSettings));
    } catch (e) {
        console.log('Error saving team schedule settings:', e);
    }
}

// Utility function to get date string in YYYY-MM-DD format without timezone issues
function getLocalDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// =====================================================
// CORE INITIALIZATION AND VIEW SWITCHING
// =====================================================

// Helper function to get the first day (Sunday) of the current week
function getCurrentWeekStart() {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const sundayDate = new Date(today);
    sundayDate.setDate(today.getDate() - dayOfWeek);
    return sundayDate.toISOString().split('T')[0];
}

// Initialize the app - can be called after partials are loaded
function initializeApp() {
    const views = document.querySelectorAll('.view');
    const navButtons = document.querySelectorAll('.nav-button');

    // Initialize date input with the first day of the current week
    const weekSelector = document.getElementById('weekSelector');
    if (weekSelector) {
        weekSelector.value = getCurrentWeekStart();
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
        } else if (viewId === 'teams') {
            loadTeams();
        } else if (viewId === 'team-schedules') {
            loadTeamSchedules();
        } else if (viewId === 'schedules') {
            // Clear team schedule data to ensure independence
            teamScheduleData = [];
            // Ensure the date picker has the correct value before updating headers
            setTimeout(() => {
                updateWeekHeaders();
                loadSchedules();
            }, 100);
        } else if (viewId === 'reports') {
            loadReports();
        }
    }

    // Alias for showView function (used in HTML onclick handlers)
    window.showView = switchView;

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

    // Add real-time search functionality
    const employeeSearch = document.getElementById('employeeSearch');
    const statusFilter = document.getElementById('statusFilter');
    
    // Debounce function to limit API calls
    let searchTimeout;
    
    if (employeeSearch) {
        employeeSearch.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                loadEmployees();
            }, 300); // Wait 300ms after user stops typing
        });
        
        // Also trigger on Enter key
        employeeSearch.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                clearTimeout(searchTimeout);
                loadEmployees();
            }
        });
    }
    
    if (statusFilter) {
        statusFilter.addEventListener('change', () => {
            loadEmployees();
        });
    }
    
    // Add clear filters functionality
    const clearEmployeeFilters = document.getElementById('clearEmployeeFilters');
    if (clearEmployeeFilters) {
        clearEmployeeFilters.addEventListener('click', () => {
            if (employeeSearch) employeeSearch.value = '';
            if (statusFilter) statusFilter.value = '';
            loadEmployees();
        });
    }

    // Teams management event listeners
    const createTeamBtn = document.getElementById('createTeamBtn');
    if (createTeamBtn) {
        createTeamBtn.addEventListener('click', openCreateTeamModal);
    }
    
    // Add team form submission handlers
    const createTeamForm = document.querySelector('#createTeamModal form');
    if (createTeamForm) {
        createTeamForm.addEventListener('submit', createTeam);
    }

    // Add form submission event listener
    const addScheduleForm = document.getElementById('addScheduleForm');
    if (addScheduleForm) {
        addScheduleForm.addEventListener('submit', (e) => {
            handleFormSubmit(e, 'schedule');
        });
    }

    // Add edit employee form submission event listener
    const editEmployeeForm = document.getElementById('editEmployeeForm');
    if (editEmployeeForm) {
        editEmployeeForm.addEventListener('submit', (e) => {
            handleFormSubmit(e, 'employee');
        });
    }

    // Add new employee form submission event listener
    const addEmployeeForm = document.getElementById('addEmployeeForm');
    if (addEmployeeForm) {
        addEmployeeForm.addEventListener('submit', (e) => {
            e.preventDefault();
            addNewEmployee();
        });
    }

    // Add phone number formatting to both add and edit forms
    const addPhoneInput = document.getElementById('addEmployeePhone');
    const editPhoneInput = document.getElementById('editEmployeePhone');
    
    if (addPhoneInput) {
        addPhoneInput.addEventListener('input', formatPhoneNumber);
    }
    
    if (editPhoneInput) {
        editPhoneInput.addEventListener('input', formatPhoneNumber);
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

    // Add export button event listener
    const exportExcelBtn = document.getElementById('exportExcel');
    if (exportExcelBtn) {
        exportExcelBtn.addEventListener('click', () => {
            exportToExcel();
        });
    }

    // Add keyboard event listeners for modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            // Close add employee modal if open
            const addModal = document.getElementById('addEmployeeModal');
            if (addModal && !addModal.classList.contains('hidden')) {
                closeAddEmployeeModal();
            }
            
            // Close delete employee modal if open
            const deleteModal = document.getElementById('deleteEmployeeModal');
            if (deleteModal && !deleteModal.classList.contains('hidden')) {
                closeDeleteEmployeeModal();
            }
            
            // Close edit employee modal if open
            const editModal = document.getElementById('editEmployeeModal');
            if (editModal && !editModal.classList.contains('hidden')) {
                closeEditEmployeeModal();
            }
        }
        
        // Keyboard shortcut: Ctrl+F to focus search (only in employees view)
        if (e.ctrlKey && e.key === 'f') {
            const currentView = document.querySelector('.view:not(.hidden)');
            if (currentView && currentView.id === 'view-employees') {
                e.preventDefault();
                const searchInput = document.getElementById('employeeSearch');
                if (searchInput) {
                    searchInput.focus();
                    searchInput.select();
                }
            }
        }
    });

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
    const resultsCounter = document.getElementById('employeesResultsCount');
    
    if (tableBody) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center p-8 text-gray-400">Chargement...</td></tr>';
    }
    
    // Show loading in results counter
    if (resultsCounter) {
        resultsCounter.textContent = 'Recherche en cours...';
    }

    // Build query parameters
    const params = new URLSearchParams();
    if (searchInput && searchInput.value.trim()) {
        params.append('search', searchInput.value.trim());
    }
    if (statusFilter && statusFilter.value) {
        params.append('status', statusFilter.value);
    }

    const url = `http://127.0.0.1:5001/api/workers${params.toString() ? '?' + params.toString() : ''}`;

    return fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            employees = data;
            tableBody.innerHTML = '';
            
            // Update results counter
            const resultsCounter = document.getElementById('employeesResultsCount');
            if (resultsCounter) {
                const hasFilters = (searchInput && searchInput.value.trim()) || (statusFilter && statusFilter.value);
                if (hasFilters) {
                    resultsCounter.textContent = `${data.length} employé(s) trouvé(s)`;
                } else {
                    resultsCounter.textContent = `${data.length} employé(s) au total`;
                }
            }
            
            if (data.length === 0) {
                // Show different messages based on whether filters are applied
                const hasFilters = (searchInput && searchInput.value.trim()) || (statusFilter && statusFilter.value);
                const message = hasFilters ? 
                    'Aucun employé trouvé avec les filtres appliqués.' : 
                    'Aucun employé trouvé.';
                tableBody.innerHTML = `<tr><td colspan="6" class="text-center p-8 text-gray-400">${message}</td></tr>`;
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
                        <td class="px-4 py-3 text-sm text-gray-200">${worker.employee_number || '-'}</td>
                        <td class="px-4 py-3 text-sm text-gray-200">${worker.phone_number || '-'}</td>
                        <td class="px-4 py-3 text-sm">${statusBadge}</td>
                        <td class="px-4 py-3 text-sm">
                            <button class="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 rounded mr-2" onclick="addEmployeeSchedule(${worker.id})">
                                Ajouter
                            </button>
                            <button class="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 rounded" onclick="modifyEmployeeSchedule(${worker.id})">
                                Modifier
                            </button>
                        </td>
                        <td class="px-4 py-3 text-sm">
                            <button class="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 rounded mr-2" onclick="modifyEmployee(${worker.id})">
                                Profil
                            </button>
                            <button class="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1 rounded" onclick="deleteEmployee(${worker.id})">
                                Supprimer
                            </button>
                        </td>
                    </tr>`;
                if (tableBody) {
                    tableBody.innerHTML += row;
                }
            });
        })
        .catch(error => {
            console.error('Error loading employees:', error);
            showNotification(`Erreur lors du chargement des employés: ${error.message}`, 'error');
            if (tableBody) {
                tableBody.innerHTML = `<tr><td colspan="6" class="text-center p-8 text-red-400">Erreur lors du chargement: ${error.message}</td></tr>`;
            }
            
            // Clear results counter on error
            const resultsCounter = document.getElementById('employeesResultsCount');
            if (resultsCounter) {
                resultsCounter.textContent = '';
            }
            
            // Re-throw the error so Promise can handle it
            throw error;
        });
}

// Load schedules from API
function loadSchedules() {
    const tableBody = document.getElementById('schedules-table-body');
    if (tableBody) {
        tableBody.innerHTML = '<tr><td colspan="9" class="text-center p-8 text-gray-400">Chargement...</td></tr>';
    }

    // Use the weekly schedule endpoint directly
    const weekSelector = document.getElementById('weekSelector');
    const selectedDate = weekSelector ? weekSelector.value : new Date().toISOString().split('T')[0];
    const url = `http://127.0.0.1:5001/api/schedule/weekly?date=${selectedDate}`;

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch schedules');
            }
            return response.json();
        })
        .then(data => {
            schedules = data;
            displaySchedulesList(data);
        })
        .catch(error => {
            console.error('Error loading schedules:', error);
            showNotification('Erreur lors du chargement des horaires', 'error');
            if (tableBody) {
                tableBody.innerHTML = `<tr><td colspan="9" class="text-center p-8 text-red-400">Erreur lors du chargement.</td></tr>`;
            }
        });
}

// Display schedules list
function displaySchedulesList(schedules) {
    const tableBody = document.getElementById('schedules-table-body');
    if (!tableBody) return;

    if (!schedules || schedules.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="9" class="text-center p-8 text-gray-400">Aucun horaire trouvé</td></tr>';
        return;
    }

    tableBody.innerHTML = schedules.map(schedule => {
        // Handle both schedule formats: regular schedules and weekly schedules
        let scheduleDetails = schedule.weekly_schedule || {};
        let dayDisplays;
        
        if (schedule.Name && schedule.Sunday !== undefined) {
            // This is weekly schedule format from /api/schedule/weekly
            dayDisplays = [
                schedule.Sunday || '',
                schedule.Monday || '', 
                schedule.Tuesday || '',
                schedule.Wednesday || '',
                schedule.Thursday || '',
                schedule.Friday || '',
                schedule.Saturday || ''
            ];
        } else {
            // This is regular schedule format from /api/schedules
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            dayDisplays = days.map(day => {
                const details = scheduleDetails[day];
                if (!details || details === null || details === 0 || details === '0') {
                    return '';
                }
                if (typeof details === 'string') {
                    return details;
                }
                if (details && details.activity_type) {
                    return details.activity_type;
                }
                return '';
            });
        }

        // Convert \n to <br> tags for proper line breaks in HTML
        dayDisplays = dayDisplays.map(day => {
            if (typeof day === 'string') {
                // Remove duplicates (e.g., "F 09h, F 09h" becomes "F 09h")
                let cleanedDay = day;
                
                // Split by comma and remove duplicates
                if (cleanedDay.includes(',')) {
                    const parts = cleanedDay.split(',').map(part => part.trim());
                    const uniqueParts = [...new Set(parts)];
                    cleanedDay = uniqueParts.join(', ');
                }
                
                // Convert \n to <br> for line breaks
                if (cleanedDay.includes('\n')) {
                    cleanedDay = cleanedDay.replace(/\n/g, '<br>');
                }
                
                return cleanedDay;
            }
            return day;
        });

        return `
            <tr class="hover:bg-gray-750 transition-colors">
                <td class="px-4 py-3 text-sm font-medium text-white">${schedule.employee_name || schedule.Name || 'Employé #' + (schedule.employee_id || 'N/A')}</td>
                <td class="px-4 py-3 text-center text-sm text-gray-200">${dayDisplays[0]}</td>
                <td class="px-4 py-3 text-center text-sm text-gray-200">${dayDisplays[1]}</td>
                <td class="px-4 py-3 text-center text-sm text-gray-200">${dayDisplays[2]}</td>
                <td class="px-4 py-3 text-center text-sm text-gray-200">${dayDisplays[3]}</td>
                <td class="px-4 py-3 text-center text-sm text-gray-200">${dayDisplays[4]}</td>
                <td class="px-4 py-3 text-center text-sm text-gray-200">${dayDisplays[5]}</td>
                <td class="px-4 py-3 text-center text-sm text-gray-200">${dayDisplays[6]}</td>
                <td class="px-4 py-3 text-center text-sm text-gray-200">${schedule.TOTAL || schedule.total_hours || ''}</td>
            </tr>
        `;
    }).join('');
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
                // Format file size to be human readable
                const formatFileSize = (bytes) => {
                    if (bytes === 0) return '0 Bytes';
                    const k = 1024;
                    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
                    const i = Math.floor(Math.log(bytes) / Math.log(k));
                    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
                };

                const row = `
                    <tr class="hover:bg-gray-750 transition-colors">
                        <td class="px-4 py-3 text-sm font-medium text-white">${report.filename}</td>
                        <td class="px-4 py-3 text-sm text-gray-200">${report.modified_date || 'N/A'}</td>
                        <td class="px-4 py-3 text-sm text-gray-200">${formatFileSize(report.size)}</td>
                        <td class="px-4 py-3 text-sm">
                            <div class="flex flex-wrap gap-1">
                                <button class="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 rounded" onclick="downloadReport('${report.filename}')">
                                    <i class="fa-solid fa-download mr-1"></i>Télécharger
                                </button>
                                <button class="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 rounded" onclick="updateReport('${report.filename}')">
                                    <i class="fa-solid fa-edit mr-1"></i>Mettre à jour
                                </button>
                                <button class="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1 rounded" onclick="deleteReport('${report.filename}')">
                                    <i class="fa-solid fa-trash mr-1"></i>Supprimer
                                </button>
                            </div>
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
    const exportFormat = document.getElementById('exportFormat');
    const selectedDate = weekSelector ? weekSelector.value : new Date().toISOString().split('T')[0];
    const format = exportFormat ? exportFormat.value : 'standard';
    
    showNotification('Génération du rapport Excel...', 'info');
    
    let apiUrl;
    if (format === 'professional') {
        apiUrl = `http://127.0.0.1:5001/api/export/professional-schedule?date=${selectedDate}`;
    } else {
        apiUrl = `http://127.0.0.1:5001/api/export/excel?date=${selectedDate}&format=${format}`;
    }
    
    fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur lors de l\'export');
            }
            return response.json();
        })
        .then(data => {
            showNotification(data.message || 'Export Excel réussi!', 'success');
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
    const selectedDate = weekSelector ? weekSelector.value : getCurrentWeekStart();
    
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
    const selectedDate = weekSelector ? weekSelector.value : getCurrentWeekStart();
    
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

// Setup real-time date validation for schedule modal
function setupDateValidation(startDateInput, endDateInput) {
    if (!startDateInput || !endDateInput) return;
    
    const today = new Date().toISOString().split('T')[0];
    
    // Validate start date
    startDateInput.addEventListener('change', function() {
        const selectedDate = new Date(this.value);
        const todayDate = new Date(today);
        
        if (selectedDate < todayDate) {
            showNotification('La date de début ne peut pas être dans le passé', 'error');
            this.value = today; // Reset to today
        }
        
        // Update end date minimum to start date
        if (endDateInput.value && new Date(endDateInput.value) < selectedDate) {
            endDateInput.value = this.value;
        }
        endDateInput.min = this.value;
    });
    
    // Validate end date
    endDateInput.addEventListener('change', function() {
        const selectedDate = new Date(this.value);
        const todayDate = new Date(today);
        const startDate = new Date(startDateInput.value);
        
        if (selectedDate < todayDate) {
            showNotification('La date de fin ne peut pas être dans le passé', 'error');
            this.value = today; // Reset to today
        }
        
        if (selectedDate < startDate) {
            showNotification('La date de fin ne peut pas être antérieure à la date de début', 'error');
            this.value = startDateInput.value; // Reset to start date
        }
    });
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

    // Set default dates to current week and restrict past dates
    const weekRange = getCurrentWeekDateRange();
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
    
    if (startDateInput) {
        startDateInput.value = weekRange.start.toISOString().split('T')[0];
        startDateInput.min = today; // Prevent selecting past dates
    }
    if (endDateInput) {
        endDateInput.value = weekRange.end.toISOString().split('T')[0];
        endDateInput.min = today; // Prevent selecting past dates
    }

    // Add real-time date validation
    setupDateValidation(startDateInput, endDateInput);

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
    const employeeNumberInput = document.getElementById('editEmployeeNumber');
    const phoneInput = document.getElementById('editEmployeePhone');
    
    if (nameInput) nameInput.value = employee.name;
    if (statusSelect) statusSelect.value = employee.status;
    if (employeeNumberInput) employeeNumberInput.value = employee.employee_number || '';
    if (phoneInput) phoneInput.value = employee.phone_number || '';

    // Show modal
    const modal = document.getElementById('editEmployeeModal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

// Modify employee schedule - show calendar view
function modifyEmployeeSchedule(employeeId) {
    const employee = employees.find(emp => emp.id === employeeId);
    
    if (!employee) {
        showNotification('Employé non trouvé', 'error');
        return;
    }

    // This will show the calendar view instead of the schedule form
    openEmployeeCalendar(employeeId);
}

// Delete employee schedule
function deleteEmployeeSchedule(employeeId) {
    const employee = employees.find(emp => emp.id === employeeId);
    
    if (!employee) {
        showNotification('Employé non trouvé', 'error');
        return;
    }

    // Find the schedule for this employee
    const schedule = schedules.find(s => s.employee_id === employeeId || (s.Name && s.Name === employee.name));
    
    if (!schedule) {
        showNotification('Aucun horaire trouvé pour cet employé', 'error');
        return;
    }

    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'horaire de ${employee.name}?`)) {
        return;
    }

    // If schedule has an ID, delete it via API
    if (schedule.id) {
        fetch(`http://127.0.0.1:5001/api/schedules/${schedule.id}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (response.ok) {
                showNotification('Horaire supprimé avec succès', 'success');
                loadSchedules(); // Refresh the list
            } else {
                throw new Error('Erreur lors de la suppression');
            }
        })
        .catch(error => {
            console.error('Error deleting schedule:', error);
            showNotification('Erreur lors de la suppression', 'error');
        });
    } else {
        showNotification('Impossible de supprimer cet horaire', 'error');
    }
}

// Delete employee
function deleteEmployee(employeeId) {
    const employee = employees.find(emp => emp.id === employeeId);
    
    if (!employee) {
        showNotification('Employé non trouvé', 'error');
        return;
    }

    // Store the employee ID for the confirmation
    window.pendingDeleteEmployeeId = employeeId;
    
    // Update the modal with employee name
    const employeeNameElement = document.getElementById('deleteEmployeeName');
    if (employeeNameElement) {
        employeeNameElement.textContent = employee.name;
    }
    
    // Show the delete confirmation modal
    const modal = document.getElementById('deleteEmployeeModal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

// Close delete employee modal
function closeDeleteEmployeeModal() {
    const modal = document.getElementById('deleteEmployeeModal');
    if (modal) {
        modal.classList.add('hidden');
    }
    // Clear the pending delete ID
    window.pendingDeleteEmployeeId = null;
}

// Confirm delete employee - actually perform the deletion
function confirmDeleteEmployee() {
    const employeeId = window.pendingDeleteEmployeeId;
    
    if (!employeeId) {
        showNotification('Erreur: Aucun employé sélectionné', 'error');
        closeDeleteEmployeeModal();
        return;
    }

    const employee = employees.find(emp => emp.id === employeeId);
    
    if (!employee) {
        showNotification('Employé non trouvé', 'error');
        closeDeleteEmployeeModal();
        return;
    }

    // Close the modal first
    closeDeleteEmployeeModal();
    
    // Show loading notification
    showNotification('Suppression en cours...', 'info');

    // Perform the actual deletion
    fetch(`http://127.0.0.1:5001/api/workers/${employeeId}`, {
        method: 'DELETE'
    })
    .then(response => {
        if (response.ok) {
            showNotification(`Employé "${employee.name}" supprimé avec succès`, 'success');
            loadEmployees(); // Refresh the list
        } else {
            throw new Error('Erreur lors de la suppression');
        }
    })
    .catch(error => {
        console.error('Error deleting employee:', error);
        showNotification('Erreur lors de la suppression de l\'employé', 'error');
    });
}

// Open add employee modal
function openAddEmployeeModal() {
    // Clear form fields
    const nameInput = document.getElementById('addEmployeeName');
    const employeeNumberInput = document.getElementById('addEmployeeNumber');
    const statusSelect = document.getElementById('addEmployeeStatus');
    
    if (nameInput) nameInput.value = '';
    if (employeeNumberInput) employeeNumberInput.value = '';
    if (statusSelect) statusSelect.value = 'employee'; // Default to internal employee
    
    // Show modal
    const modal = document.getElementById('addEmployeeModal');
    if (modal) {
        modal.classList.remove('hidden');
        // Focus on the name input
        setTimeout(() => {
            if (nameInput) nameInput.focus();
        }, 100);
    }
}

// Close add employee modal
function closeAddEmployeeModal() {
    const modal = document.getElementById('addEmployeeModal');
    if (modal) {
        modal.classList.add('hidden');
    }
    
    // Clear form fields
    const nameInput = document.getElementById('addEmployeeName');
    const employeeNumberInput = document.getElementById('addEmployeeNumber');
    const statusSelect = document.getElementById('addEmployeeStatus');
    
    if (nameInput) nameInput.value = '';
    if (employeeNumberInput) employeeNumberInput.value = '';
    if (statusSelect) statusSelect.value = 'employee';
}

// Add new employee
function addNewEmployee() {
    const nameInput = document.getElementById('addEmployeeName');
    const employeeNumberInput = document.getElementById('addEmployeeNumber');
    const phoneInput = document.getElementById('addEmployeePhone');
    const statusSelect = document.getElementById('addEmployeeStatus');
    
    if (!nameInput || !statusSelect) {
        showNotification('Erreur: Formulaire non trouvé', 'error');
        return;
    }

    const newEmployee = {
        name: nameInput.value.trim(),
        status: statusSelect.value,
        employee_number: employeeNumberInput ? employeeNumberInput.value.trim() : '',
        phone_number: phoneInput ? phoneInput.value.trim() : ''
    };

    if (!newEmployee.name) {
        showNotification('Le nom de l\'employé est requis', 'error');
        nameInput.focus();
        return;
    }

    if (!newEmployee.employee_number) {
        showNotification('Le numéro d\'employé est requis', 'error');
        if (employeeNumberInput) employeeNumberInput.focus();
        return;
    }

    // Show loading notification
    showNotification('Ajout de l\'employé en cours...', 'info');

    // Send POST request to create new employee
    fetch('http://127.0.0.1:5001/api/workers', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(newEmployee)
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        } else {
            throw new Error('Erreur lors de l\'ajout');
        }
    })
    .then(data => {
        showNotification(`Employé "${newEmployee.name}" ajouté avec succès`, 'success');
        closeAddEmployeeModal();
        loadEmployees(); // Refresh the list
    })
    .catch(error => {
        console.error('Error adding employee:', error);
        showNotification(`Erreur lors de l'ajout de l'employé: ${error.message}`, 'error');
    });
}

// Save employee changes
function saveEmployeeChanges() {
    const nameInput = document.getElementById('editEmployeeName');
    const statusSelect = document.getElementById('editEmployeeStatus');
    const employeeNumberInput = document.getElementById('editEmployeeNumber');
    const phoneInput = document.getElementById('editEmployeePhone');
    
    if (!nameInput || !statusSelect || !currentEmployeeId) {
        showNotification('Données manquantes', 'error');
        return;
    }

    const updatedEmployee = {
        name: nameInput.value.trim(),
        status: statusSelect.value,
        employee_number: employeeNumberInput ? employeeNumberInput.value.trim() : '',
        phone_number: phoneInput ? phoneInput.value.trim() : ''
    };

    if (!updatedEmployee.name) {
        showNotification('Le nom est requis', 'error');
        return;
    }

    if (!updatedEmployee.employee_number) {
        showNotification('Le numéro d\'employé est requis', 'error');
        if (employeeNumberInput) employeeNumberInput.focus();
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
    console.log('openEmployeeCalendar called with employeeId:', employeeId);
    
    const employee = employees.find(emp => emp.id === employeeId);
    
    if (!employee) {
        showNotification('Employé non trouvé', 'error');
        return;
    }

    console.log('Employee found:', employee);

    // Direct modal access - should work if DOM is loaded
    const modal = document.getElementById('employeeCalendarModal');
    if (!modal) {
        console.error('Employee calendar modal not found in DOM');
        showNotification('Erreur: Modal calendrier non trouvé', 'error');
        return;
    }

    console.log('Modal found:', modal);
    
    // Update modal title
    const modalTitle = document.getElementById('employeeCalendarModalTitle');
    if (modalTitle) {
        modalTitle.textContent = `Calendrier de ${employee.name}`;
    }

    // Update employee name in the modal
    const employeeNameElement = document.getElementById('employeeNameCalendar');
    if (employeeNameElement) {
        employeeNameElement.textContent = employee.name;
    }

    // Show modal immediately
    modal.classList.remove('hidden');

    // Wait for modal to be fully rendered before generating calendar
    setTimeout(() => {
            // Load employee calendar data using the same weekly schedule API as the table
            const currentDate = new Date();
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth() + 1;
            
            // Set current calendar state
            currentCalendarYear = currentDate.getFullYear();
            currentCalendarMonth = currentDate.getMonth();
            currentCalendarEmployeeId = employeeId;
            
            // Get all weeks that overlap with this month
            const firstDayOfMonth = new Date(year, month - 1, 1);
            const lastDayOfMonth = new Date(year, month, 0);
            
            // Calculate all weeks we need to fetch
            const weeks = [];
            let currentWeekStart = new Date(firstDayOfMonth);
            currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay()); // Go to Sunday
            
            while (currentWeekStart <= lastDayOfMonth) {
                weeks.push(new Date(currentWeekStart));
                currentWeekStart.setDate(currentWeekStart.getDate() + 7);
            }
            
            // Fetch data for all weeks and combine
            const weekPromises = weeks.map(weekStart => {
                const weekDate = weekStart.toISOString().split('T')[0];
                return fetch(`http://127.0.0.1:5001/api/schedule/weekly?date=${weekDate}`)
                    .then(response => response.json())
                    .then(weeklyData => {
                        const employeeData = weeklyData.find(w => w.Name === employee.name);
                        return { weekStart, employeeData };
                    });
            });
            
            Promise.all(weekPromises)
                .then(weekResults => {
                    console.log('Weekly schedule data received:', weekResults);
                    
                    // Combine all weeks into a single calendar data object
                    let calendarData = {};
                    
                    weekResults.forEach(({ weekStart, employeeData }) => {
                        if (employeeData) {
                            const weekCalendarData = convertWeeklyToCalendarData(employeeData, weekStart, month);
                            calendarData = { ...calendarData, ...weekCalendarData };
                        }
                    });
                    
                    generateEmployeeCalendar(calendarData);
                })
                .catch(error => {
                    console.error('Error loading calendar:', error);
                    showNotification(`Erreur lors du chargement du calendrier: ${error.message}`, 'error');
                    
                    // Generate calendar with sample data to show the structure
                    const sampleData = {
                        '2025-07-15': { schedule_type: 'work', activity_type: 'X', start_time: '08:00', end_time: '17:00' },
                        '2025-07-16': { schedule_type: 'work', activity_type: 'S', start_time: '09:00', end_time: '16:00' },
                        '2025-07-18': { schedule_type: 'work', activity_type: 'RP', start_time: '10:00', end_time: '18:00' },
                        '2025-07-20': { schedule_type: 'work', activity_type: 'X', start_time: '20:00', end_time: '08:00', is_night_shift: true }
                    };
                    generateEmployeeCalendar(sampleData);
                });
        }, 100); // Small delay to ensure modal is rendered
}

// Convert weekly schedule data to calendar format (using same logic as table)
function convertWeeklyToCalendarData(weeklyData, weekStart, targetMonth) {
    const calendarData = {};
    
    // Map day names to their schedule values (same as table)
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    dayNames.forEach((dayName, dayIndex) => {
        const scheduleValue = weeklyData[dayName];
        
        if (scheduleValue && scheduleValue.trim() !== '') {
            // Calculate the actual date for this day
            const dayDate = new Date(weekStart);
            dayDate.setDate(weekStart.getDate() + dayIndex);
            
            // Only include dates that are in the target month
            if (dayDate.getMonth() === targetMonth - 1) {
                const dateKey = dayDate.toISOString().split('T')[0];
                
                // Store the display value exactly as it appears in the table
                calendarData[dateKey] = {
                    displayValue: scheduleValue,
                    activity_type: scheduleValue.includes('F') ? 'F' : 
                                 scheduleValue.includes('M') ? 'M' :
                                 scheduleValue.includes('V') ? 'V' :
                                 scheduleValue.toUpperCase()
                };
            }
        }
    });
    
    return calendarData;
}

// Generate employee calendar
function generateEmployeeCalendar(calendarData) {
    console.log('generateEmployeeCalendar called with data:', calendarData);
    
    // Debug: Check if DOM is ready
    console.log('DOM readyState:', document.readyState);
    console.log('Available modal elements:', document.querySelectorAll('[id*="Modal"]'));
    
    const calendarContainer = document.getElementById('calendarDays');
    if (!calendarContainer) {
        console.error('Calendar container not found - checking if modal is visible');
        const modal = document.getElementById('employeeCalendarModal');
        console.log('Modal element:', modal);
        console.log('Modal visibility:', modal ? modal.classList.contains('hidden') : 'Modal not found');
        
        // Try to find any element with calendarDays in its id or class
        const calendarElements = document.querySelectorAll('[id*="calendar"], [class*="calendar"]');
        console.log('Found calendar-related elements:', calendarElements);
        
        return;
    }

    console.log('Calendar container found successfully');

    // Default to empty object if no data provided
    calendarData = calendarData || {};

    // Get current date and calculate current month
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Update month/year display
    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    
    const monthYearDisplay = document.getElementById('currentMonthYear');
    if (monthYearDisplay) {
        monthYearDisplay.textContent = `${monthNames[currentMonth]} ${currentYear}`;
    }
    
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDate = firstDay.getDay(); // Day of week (0-6)
    const daysInMonth = lastDay.getDate();
    
    let calendarHTML = '';
    
    // Add days of the month with new layout design (no empty cells)
    for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayData = calendarData[dateKey];
        
        // Calculate grid position for the first day of the month
        const dayOfWeek = new Date(currentYear, currentMonth, day).getDay();
        const gridColumnStart = day === 1 ? `col-start-${dayOfWeek + 1}` : '';
        
        let dayClass = `calendar-day h-16 border border-gray-300 dark:border-gray-500 rounded relative cursor-pointer transition-colors ${gridColumnStart}`;
        let hasActivity = false;
        let activityType = '';
        
        // Check if there's schedule data for this day
        if (dayData && dayData.activity_type) {
            activityType = dayData.activity_type;
            hasActivity = true;
        }
        
        // Base background color
        if (day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()) {
            // Today - use blue background with white text
            dayClass += ' bg-blue-600 text-white border-blue-400 ring-2 ring-blue-400';
        } else {
            // Regular day - light/dark mode appropriate colors
            dayClass += ' bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600';
        }
        
        // Create day content with new layout
        let dayContent = `
            <!-- Day number in top-left corner -->
            <div class="absolute top-1 left-1 text-xs font-medium calendar-day-number">${day}</div>
        `;
        
        // Add activity indicator in center if there's an activity
        if (hasActivity && activityType) {
            const activityColor = getActivityTypeColor(activityType);
            dayContent += `
                <!-- Activity type in center with background color -->
                <div class="absolute inset-2 flex items-center justify-center">
                    <div class="${activityColor} text-white text-xs font-bold px-2 py-1 rounded shadow-sm">
                        ${activityType}
                    </div>
                </div>
            `;
        }
        
        calendarHTML += `<div class="${dayClass}" data-date="${dateKey}">${dayContent}</div>`;
    }
    
    calendarContainer.innerHTML = calendarHTML;
    
    // Add click event listeners to calendar days
    const calendarDays = calendarContainer.querySelectorAll('.calendar-day[data-date]');
    calendarDays.forEach(day => {
        day.addEventListener('click', function() {
            const date = this.getAttribute('data-date');
            showDayScheduleDetails(date, calendarData[date]);
        });
    });
}

// Show day schedule details
function showDayScheduleDetails(date, dayData) {
    if (!dayData) {
        showNotification('Aucun horaire pour cette date', 'info');
        return;
    }
    
    // Get the employee ID from the current modal context
    const employeeNameElement = document.getElementById('employeeNameCalendar');
    const employeeName = employeeNameElement ? employeeNameElement.textContent : '';
    const employee = employees.find(emp => emp.name === employeeName);
    
    if (!employee) {
        showNotification('Employé non trouvé', 'error');
        return;
    }
    
    // Fetch detailed schedule information for this specific day
    fetch(`http://127.0.0.1:5001/api/workers/${employee.id}/schedule/day?date=${date}`)
        .then(response => response.json())
        .then(scheduleData => {
            displayDetailedScheduleModal(date, scheduleData, employee, dayData);
        })
        .catch(error => {
            console.error('Error fetching schedule details:', error);
            // Fallback to basic information if API fails
            displayBasicScheduleModal(date, dayData, employee);
        });
}

// Display detailed schedule modal with full information
function displayDetailedScheduleModal(date, scheduleData, employee, dayData) {
    const displayValue = dayData.displayValue || '';
    
    // Map activity types to their descriptions
    const activityDescriptions = {
        'X': 'Garde',
        'S': 'Soutien de jour', 
        'RP': 'Rencontre Prénatale',
        'F': 'Fin d\'équipe de nuit'
    };
    
    let details = `<strong>Employé:</strong> ${employee.name}<br>`;
    details += `<strong>Date:</strong> ${formatDateFr(date)}<br><br>`;
    
    // Store current data for edit mode
    let currentData = {
        activityType: 'X',
        startTime: '00:00',
        endTime: '23:59',
        hoursCount: '24',
        isNightShift: false
    };
    
    if (scheduleData && scheduleData.length > 0) {
        // Use API data if available
        const shift = scheduleData[0]; // Take the first shift
        const activityType = shift.activity_type || 'N/A';
        const activityDescription = activityDescriptions[activityType.toUpperCase()] || activityType;
        
        details += `<strong>Type d'activité:</strong> ${activityType.toUpperCase()} - ${activityDescription}<br>`;
        details += `<strong>Heure de début:</strong> ${shift.start_time || 'N/A'}<br>`;
        details += `<strong>Heure de fin:</strong> ${shift.end_time || 'N/A'}<br>`;
        details += `<strong>Durée:</strong> ${shift.hours_worked || 0}h<br>`;
        
        if (shift.is_night_shift) {
            details += `<strong>Équipe de nuit:</strong> Oui 🌙<br>`;
        }
        
        // Store for edit mode
        currentData = {
            activityType: shift.activity_type || 'X',
            startTime: shift.start_time || '00:00',
            endTime: shift.end_time || '23:59',
            hoursCount: shift.hours_worked || '24',
            isNightShift: shift.is_night_shift || false
        };
    } else {
        // Fallback to display value information
        if (displayValue.includes('F')) {
            // This is the end day of a night shift (F\n09h)
            details += `<strong>Type d'activité:</strong> F - Fin d'équipe de nuit<br>`;
            // Extract time from display value like "F\n09h"
            const timeMatch = displayValue.match(/(\d+)h/);
            if (timeMatch) {
                details += `<strong>Heure de début:</strong> 17:00 (jour précédent)<br>`;
                details += `<strong>Heure de fin:</strong> ${timeMatch[1]}:00<br>`;
                details += `<strong>Durée:</strong> ??h<br>`;
            }
            details += `<strong>Équipe de nuit:</strong> Oui 🌙<br>`;
        } else {
            // This is a regular activity or start day of night shift
            const activityType = displayValue.toUpperCase();
            const activityDescription = activityDescriptions[activityType] || activityType;
            details += `<strong>Type d'activité:</strong> ${activityType} - ${activityDescription}<br>`;
            details += `<strong>Heure de début:</strong> 17:00<br>`;
            details += `<strong>Heure de fin:</strong> 09:00<br>`;
            details += `<strong>Durée:</strong> 16h<br>`;
            details += `<strong>Équipe de nuit:</strong> Oui 🌙<br>`;
        }
    }
    
    // Create the modal with both view and edit modes
    const detailModal = document.createElement('div');
    detailModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    detailModal.id = 'dayScheduleDetailModal';
    detailModal.innerHTML = `
        <div class="bg-gray-800 rounded-lg p-6 max-w-lg mx-4">
            <h3 id="modalTitle" class="text-lg font-semibold text-white mb-4">Détails de l'horaire</h3>
            
            <!-- View Mode -->
            <div id="viewMode">
                <div class="text-gray-300 mb-6">${details}</div>
                <div class="flex space-x-3">
                    <button onclick="switchToEditMode('${date}', ${employee.id})" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
                        Modifier
                    </button>
                    <button onclick="deleteDaySchedule('${date}', ${employee.id})" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded">
                        Supprimer
                    </button>
                    <button onclick="this.closest('.fixed').remove()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
                        Fermer
                    </button>
                </div>
            </div>
            
            <!-- Edit Mode (hidden by default) -->
            <div id="editMode" class="hidden">
                <div class="text-gray-300 mb-4">
                    <strong>Employé:</strong> ${employee.name}<br>
                    <strong>Date:</strong> ${formatDateFr(date)}
                </div>
                
                <div class="space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-1">Type d'activité</label>
                            <select id="editActivityType" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500" onchange="updateInlineEditActivityTypeInfo()">
                                <option value="X" ${currentData.activityType === 'X' ? 'selected' : ''}>X - Garde</option>
                                <option value="S" ${currentData.activityType === 'S' ? 'selected' : ''}>S - Soutien de jour</option>
                                <option value="RP" ${currentData.activityType === 'RP' ? 'selected' : ''}>RP - Rencontre Prénatale</option>
                                <option value="F" ${currentData.activityType === 'F' ? 'selected' : ''}>F - Fin d'équipe de nuit</option>
                                <option value="C" ${currentData.activityType === 'C' ? 'selected' : ''}>C - Congé</option>
                                <option value="" ${!currentData.activityType || currentData.activityType === '' ? 'selected' : ''}>Vide - Repos</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-1">Nombre d'heures</label>
                            <input type="number" id="editHoursCount" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500" value="${currentData.hoursCount}" min="0" step="0.5" onchange="validateInlineEditShiftTimes()">
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-1">Début</label>
                            <input type="time" id="editStartTime" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500" value="${currentData.startTime}" onchange="validateInlineEditShiftTimes()">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-1">Fin</label>
                            <input type="time" id="editEndTime" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500" value="${currentData.endTime}" onchange="validateInlineEditShiftTimes()">
                        </div>
                    </div>
                    
                    <div class="flex items-center space-x-4">
                        <label class="flex items-center space-x-2">
                            <input type="checkbox" id="editIsNightShift" class="night-shift-checkbox" ${currentData.isNightShift ? 'checked' : ''} onchange="validateInlineEditShiftTimes()">
                            <span class="text-sm text-gray-300">Équipe de nuit (se termine le jour suivant)</span>
                            <span class="text-purple-400">🌙</span>
                        </label>
                    </div>
                </div>
                
                <div class="flex space-x-3 mt-6">
                    <button onclick="saveInlineEditDaySchedule('${date}', ${employee.id})" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
                        Sauvegarder
                    </button>
                    <button onclick="switchToViewMode()" class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded">
                        Annuler
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(detailModal);
}

// Display basic schedule modal when API data is not available
function displayBasicScheduleModal(date, dayData, employee) {
    const displayValue = dayData.displayValue || '';
    
    const activityDescriptions = {
        'X': 'Garde',
        'S': 'Soutien de jour', 
        'RP': 'Rencontre Prénatale',
        'F': 'Fin d\'équipe de nuit'
    };
    
    let details = `<strong>Employé:</strong> ${employee.name}<br>`;
    details += `<strong>Date:</strong> ${formatDateFr(date)}<br><br>`;
    
    if (displayValue.includes('F')) {
        // This is the end day of a night shift (F\n09h)
        details += `<strong>Type d'activité:</strong> F - Fin d'équipe de nuit<br>`;
        const timeMatch = displayValue.match(/(\d+)h/);
        if (timeMatch) {
            details += `<strong>Heure de début:</strong> 17:00 (jour précédent)<br>`;
            details += `<strong>Heure de fin:</strong> ${timeMatch[1]}:00<br>`;
            details += `<strong>Durée:</strong> ??h<br>`;
        }
        details += `<strong>Équipe de nuit:</strong> Oui 🌙<br>`;
    } else {
        // This is a regular activity or start day of night shift
        const activityType = displayValue.toUpperCase();
        const activityDescription = activityDescriptions[activityType] || activityType;
        details += `<strong>Type d'activité:</strong> ${activityType} - ${activityDescription}<br>`;
        details += `<strong>Heure de début:</strong> 17:00<br>`;
        details += `<strong>Heure de fin:</strong> 09:00<br>`;
        details += `<strong>Durée:</strong> 16h<br>`;
        details += `<strong>Équipe de nuit:</strong> Oui 🌙<br>`;
    }
    
    const detailModal = document.createElement('div');
    detailModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    detailModal.innerHTML = `
        <div class="bg-gray-800 rounded-lg p-6 max-w-md mx-4">
            <h3 class="text-lg font-semibold text-white mb-4">Détails de l'horaire</h3>
            <div class="text-gray-300 mb-6">${details}</div>
            <div class="flex space-x-3">
                <button onclick="editDaySchedule('${date}', ${employee.id})" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
                    Modifier
                </button>
                <button onclick="deleteDaySchedule('${date}', ${employee.id})" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded">
                    Supprimer
                </button>
                <button onclick="this.closest('.fixed').remove()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
                    Fermer
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(detailModal);
}

// Format date for French display
function formatDateFr(dateStr) {
    // Parse the date string to avoid timezone issues
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed in JavaScript
    
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    return date.toLocaleDateString('fr-FR', options);
}

// Edit day schedule
// Delete day schedule
function deleteDaySchedule(date, employeeId) {
    const employee = employees.find(emp => emp.id == employeeId);
    const employeeName = employee ? employee.name : 'cet employé';
    
    // Create custom confirmation modal
    showDeleteConfirmationModal(date, employeeId, employeeName);
}

// Show custom delete confirmation modal
function showDeleteConfirmationModal(date, employeeId, employeeName) {
    // Create the confirmation modal
    const confirmModal = document.createElement('div');
    confirmModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    confirmModal.id = 'deleteConfirmationModal';
    confirmModal.innerHTML = `
        <div class="bg-gray-800 rounded-xl shadow-2xl max-w-md mx-4 transform transition-all">
            <!-- Modal Header -->
            <div class="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 rounded-t-xl">
                <div class="flex items-center space-x-3">
                    <i class="fa-solid fa-exclamation-triangle text-2xl text-white"></i>
                    <h3 class="text-xl font-bold text-white">Confirmer la suppression</h3>
                </div>
            </div>
            
            <!-- Modal Content -->
            <div class="p-6">
                <div class="flex items-start space-x-4 mb-6">
                    <div class="flex-shrink-0">
                        <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                            <i class="fa-solid fa-trash text-red-600 text-xl"></i>
                        </div>
                    </div>
                    <div class="flex-1">
                        <p class="text-gray-300 text-lg mb-2">
                            Êtes-vous sûr de vouloir supprimer l'horaire ?
                        </p>
                        <div class="bg-gray-700 rounded-lg p-4 mb-4">
                            <div class="space-y-2 text-sm">
                                <div class="flex justify-between">
                                    <span class="text-gray-400">Employé:</span>
                                    <span class="text-white font-medium">${employeeName}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-400">Date:</span>
                                    <span class="text-white font-medium">${formatDateFr(date)}</span>
                                </div>
                            </div>
                        </div>
                        <p class="text-red-300 text-sm">
                            <i class="fa-solid fa-warning mr-2"></i>
                            Cette action est irréversible.
                        </p>
                    </div>
                </div>
                
                <!-- Action Buttons -->
                <div class="flex space-x-3 pt-4 border-t border-gray-600">
                    <button onclick="confirmDeleteDaySchedule('${date}', ${employeeId})" class="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2">
                        <i class="fa-solid fa-trash"></i>
                        <span>Supprimer</span>
                    </button>
                    <button onclick="closeDeleteConfirmationModal()" class="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2">
                        <i class="fa-solid fa-times"></i>
                        <span>Annuler</span>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(confirmModal);
    
    // Add smooth entrance animation
    setTimeout(() => {
        confirmModal.classList.add('animate-fade-in');
    }, 10);
}

// Close delete confirmation modal
function closeDeleteConfirmationModal() {
    const confirmModal = document.getElementById('deleteConfirmationModal');
    if (confirmModal) {
        confirmModal.remove();
    }
}

// Confirm and execute the deletion
function confirmDeleteDaySchedule(date, employeeId) {
    // Close the confirmation modal
    closeDeleteConfirmationModal();
    
    // Close the details modal if it exists
    const detailModal = document.getElementById('dayScheduleDetailModal');
    if (detailModal) {
        detailModal.remove();
    }
    
    // Make API call to delete the schedule
    fetch(`http://127.0.0.1:5001/api/schedules/day`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            employeeId: employeeId,
            date: date
        })
    })
    .then(response => {
        if (response.ok) {
            showNotification(`Horaire du ${formatDateFr(date)} supprimé avec succès`, 'success');
            // Reload the current view to reflect changes
            if (window.location.hash === '#gestion-horaires') {
                loadSchedules();
            } else if (currentCalendarEmployeeId == employeeId) {
                loadCalendarForMonth(currentCalendarYear, currentCalendarMonth, employeeId);
            }
        } else {
            return response.json().then(data => {
                throw new Error(data.error || 'Erreur lors de la suppression');
            });
        }
    })
    .catch(error => {
        console.error('Error deleting schedule:', error);
        showNotification(`Erreur lors de la suppression de l'horaire: ${error.message}`, 'error');
    });
}

// Edit day schedule
function editDaySchedule(date, employeeId) {
    // Close the details modal
    const detailModal = document.querySelector('.fixed.inset-0');
    if (detailModal) {
        detailModal.remove();
    }
    
    // Fetch current schedule data for this date and employee
    fetch(`http://127.0.0.1:5001/api/workers/${employeeId}/schedule/day?date=${date}`)
        .then(response => response.json())
        .then(scheduleData => {
            // Show edit modal with current data
            showEditDayScheduleModal(date, employeeId, scheduleData);
        })
        .catch(error => {
            console.error('Error fetching schedule for edit:', error);
            // Show edit modal with default values
            showEditDayScheduleModal(date, employeeId, null);
        });
}

// Show edit day schedule modal
function showEditDayScheduleModal(date, employeeId, currentData) {
    const employee = employees.find(emp => emp.id == employeeId);
    const employeeName = employee ? employee.name : 'Employé';
    
    // Set default values or use current data
    let activityType = 'X';
    let startTime = '00:00';
    let endTime = '23:59';
    let hoursCount = '24';
    let isNightShift = false;
    
    if (currentData && currentData.length > 0) {
        const schedule = currentData[0];
        activityType = schedule.activity_type || 'X';
        startTime = schedule.start_time || '00:00';
        endTime = schedule.end_time || '23:59';
        hoursCount = schedule.hours_worked || '24';
        isNightShift = schedule.is_night_shift || false;
    }
    
    // Create edit modal
    const editModal = document.createElement('div');
    editModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    editModal.innerHTML = `
        <div class="bg-gray-800 rounded-lg p-6 max-w-lg mx-4">
            <h3 class="text-lg font-semibold text-white mb-4">Modifier l'horaire</h3>
            <div class="text-gray-300 mb-4">
                <strong>Employé:</strong> ${employeeName}<br>
                <strong>Date:</strong> ${formatDateFr(date)}
            </div>
            
            <div class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-1">Type d'activité</label>
                        <select id="editActivityType" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500" onchange="updateEditActivityTypeInfo()">
                            <option value="X" ${activityType === 'X' ? 'selected' : ''}>X - Garde</option>
                            <option value="S" ${activityType === 'S' ? 'selected' : ''}>S - Soutien de jour</option>
                            <option value="RP" ${activityType === 'RP' ? 'selected' : ''}>RP - Rencontre Prénatale</option>
                            <option value="F" ${activityType === 'F' ? 'selected' : ''}>F - Fin d'équipe de nuit</option>
                            <option value="C" ${activityType === 'C' ? 'selected' : ''}>C - Congé</option>
                            <option value="" ${!activityType || activityType === '' ? 'selected' : ''}>Vide - Repos</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-1">Nombre d'heures</label>
                        <input type="number" id="editHoursCount" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500" value="${hoursCount}" min="0" step="0.5" onchange="validateEditShiftTimes()">
                    </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-1">Début</label>
                        <input type="time" id="editStartTime" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500" value="${startTime}" onchange="validateEditShiftTimes()">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-1">Fin</label>
                        <input type="time" id="editEndTime" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500" value="${endTime}" onchange="validateEditShiftTimes()">
                    </div>
                </div>
                
                <div class="flex items-center space-x-4">
                    <label class="flex items-center space-x-2">
                        <input type="checkbox" id="editIsNightShift" class="night-shift-checkbox" ${isNightShift ? 'checked' : ''} onchange="validateEditShiftTimes()">
                        <span class="text-sm text-gray-300">Équipe de nuit (se termine le jour suivant)</span>
                        <span class="text-purple-400">🌙</span>
                    </label>
                </div>
            </div>
            
            <div class="flex space-x-3 mt-6">
                <button onclick="saveEditDaySchedule('${date}', ${employeeId})" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
                    Sauvegarder
                </button>
                <button onclick="this.closest('.fixed').remove()" class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded">
                    Annuler
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(editModal);
    
    // Initialize with correct values based on activity type
    updateEditActivityTypeInfo();
}

// Update edit activity type info
function updateEditActivityTypeInfo() {
    const activityType = document.getElementById('editActivityType');
    const startTime = document.getElementById('editStartTime');
    const endTime = document.getElementById('editEndTime');
    const hoursCount = document.getElementById('editHoursCount');
    
    if (!activityType || !startTime || !endTime || !hoursCount) return;
    
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
            // For V, M, C, or empty - these don't need specific times
            startTime.value = '08:00';
            endTime.value = '17:00';
            hoursCount.value = '0';
    }
}

// Validate edit shift times
function validateEditShiftTimes() {
    const startTime = document.getElementById('editStartTime');
    const endTime = document.getElementById('editEndTime');
    const isNightShift = document.getElementById('editIsNightShift');
    const hoursCount = document.getElementById('editHoursCount');
    
    if (!startTime || !endTime || !hoursCount) return;
    
    const start = new Date(`2000-01-01T${startTime.value}`);
    let end = new Date(`2000-01-01T${endTime.value}`);
    
    // If it's a night shift, end time is next day
    if (isNightShift && isNightShift.checked) {
        end = new Date(`2000-01-02T${endTime.value}`);
    }
    
    // Calculate hours difference
    const diffMs = end - start;
    const diffHours = diffMs / (1000 * 60 * 60);
    
    if (diffHours > 0) {
        hoursCount.value = diffHours.toFixed(1);
    }
}

// Save edit day schedule
function saveEditDaySchedule(date, employeeId) {
    const activityType = document.getElementById('editActivityType').value;
    const startTime = document.getElementById('editStartTime').value;
    const endTime = document.getElementById('editEndTime').value;
    const hoursCount = document.getElementById('editHoursCount').value;
    const isNightShift = document.getElementById('editIsNightShift').checked;
    
    // Prepare schedule data
    const scheduleData = {
        employeeId: employeeId,
        date: date,
        activityType: activityType,
        startTime: startTime,
        endTime: endTime,
        hoursWorked: parseFloat(hoursCount) || 0,
        isNightShift: isNightShift
    };
    
    // Make API call to update the schedule
    fetch('http://127.0.0.1:5001/api/schedules/day', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(scheduleData)
    })
    .then(response => {
        if (response.ok) {
            // Close modal
            const editModal = document.querySelector('.fixed.inset-0');
            if (editModal) {
                editModal.remove();
            }
            
            showNotification(`Horaire du ${formatDateFr(date)} modifié avec succès`, 'success');
            
            // Reload the current view to reflect changes
            if (window.location.hash === '#gestion-horaires') {
                loadSchedules();
            } else if (currentCalendarEmployeeId == employeeId) {
                loadCalendarForMonth(currentCalendarYear, currentCalendarMonth, employeeId);
            }
        } else {
            return response.json().then(data => {
                throw new Error(data.error || 'Erreur lors de la modification');
            });
        }
    })
    .catch(error => {
        console.error('Error updating schedule:', error);
        showNotification(`Erreur lors de la modification de l'horaire: ${error.message}`, 'error');
    });
}

// =====================================================
// INLINE EDIT FUNCTIONS FOR DAY SCHEDULE MODAL
// =====================================================

// Switch to edit mode in the detail modal
function switchToEditMode(date, employeeId) {
    const viewMode = document.getElementById('viewMode');
    const editMode = document.getElementById('editMode');
    const modalTitle = document.getElementById('modalTitle');
    
    if (viewMode && editMode && modalTitle) {
        viewMode.classList.add('hidden');
        editMode.classList.remove('hidden');
        modalTitle.textContent = 'Modifier l\'horaire';
    }
}

// Switch back to view mode in the detail modal
function switchToViewMode() {
    const viewMode = document.getElementById('viewMode');
    const editMode = document.getElementById('editMode');
    const modalTitle = document.getElementById('modalTitle');
    
    if (viewMode && editMode && modalTitle) {
        editMode.classList.add('hidden');
        viewMode.classList.remove('hidden');
        modalTitle.textContent = 'Détails de l\'horaire';
    }
}

// Update activity type info for inline editing
function updateInlineEditActivityTypeInfo() {
    const activityType = document.getElementById('editActivityType');
    const startTime = document.getElementById('editStartTime');
    const endTime = document.getElementById('editEndTime');
    const hoursCount = document.getElementById('editHoursCount');
    
    if (!activityType || !startTime || !endTime || !hoursCount) return;
    
    // Set default values based on activity type
    switch (activityType.value) {
        case 'X':
            startTime.value = '00:00';
            endTime.value = '23:59';
            hoursCount.value = '24';
            break;
        case 'S':
            startTime.value = '09:00';
            endTime.value = '17:00';
            hoursCount.value = '8';
            break;
        case 'RP':
            startTime.value = '10:00';
            endTime.value = '18:00';
            hoursCount.value = '8';
            break;
        case 'F':
            startTime.value = '00:00';
            endTime.value = '09:00';
            hoursCount.value = '9';
            break;
        default:
            // For blank or other types - not working
            startTime.value = '09:00';
            endTime.value = '17:00';
            hoursCount.value = '0';
    }
}

// Validate shift times for inline editing
function validateInlineEditShiftTimes() {
    const startTime = document.getElementById('editStartTime');
    const endTime = document.getElementById('editEndTime');
    const isNightShift = document.getElementById('editIsNightShift');
    const hoursCount = document.getElementById('editHoursCount');
    
    if (!startTime || !endTime || !hoursCount) return;
    
    const start = new Date(`2000-01-01T${startTime.value}`);
    let end = new Date(`2000-01-01T${endTime.value}`);
    
    // If it's a night shift, end time is next day
    if (isNightShift && isNightShift.checked) {
        end = new Date(`2000-01-02T${endTime.value}`);
    }
    
    // Calculate hours difference
    const diffMs = end - start;
    const diffHours = diffMs / (1000 * 60 * 60);
    
    if (diffHours > 0) {
        hoursCount.value = diffHours.toFixed(1);
    }
}

// Save inline edited day schedule
function saveInlineEditDaySchedule(date, employeeId) {
    const activityType = document.getElementById('editActivityType').value;
    const startTime = document.getElementById('editStartTime').value;
    const endTime = document.getElementById('editEndTime').value;
    const hoursCount = document.getElementById('editHoursCount').value;
    const isNightShift = document.getElementById('editIsNightShift').checked;
    
    // Prepare schedule data
    const scheduleData = {
        employeeId: employeeId,
        date: date,
        activityType: activityType,
        startTime: startTime,
        endTime: endTime,
        hoursWorked: parseFloat(hoursCount) || 0,
        isNightShift: isNightShift
    };
    
    // Make API call to update the schedule
    fetch('http://127.0.0.1:5001/api/schedules/day', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(scheduleData)
    })
    .then(response => {
        if (response.ok) {
            // Close modal
            const detailModal = document.getElementById('dayScheduleDetailModal');
            if (detailModal) {
                detailModal.remove();
            }
            
            showNotification(`Horaire du ${formatDateFr(date)} modifié avec succès`, 'success');
            
            // Reload the current view to reflect changes
            if (window.location.hash === '#gestion-horaires') {
                loadSchedules();
            } else if (currentCalendarEmployeeId == employeeId) {
                loadCalendarForMonth(currentCalendarYear, currentCalendarMonth, employeeId);
            }
        } else {
            return response.json().then(data => {
                throw new Error(data.error || 'Erreur lors de la modification');
            });
        }
    })
    .catch(error => {
        console.error('Error updating schedule:', error);
        showNotification(`Erreur lors de la modification de l'horaire: ${error.message}`, 'error');
    });
}

// =====================================================
// TEAM MANAGEMENT FUNCTIONS
// =====================================================

// Global variables for team management
let currentTeamId = null;
let isCreatingTeam = false; // Prevent multiple submissions

// Load teams from API or local storage
function loadTeams() {
    console.log('Loading teams...');
    // For now, use local storage. Later this can be connected to a backend API
    const storedTeams = localStorage.getItem('timeplanner_teams');
    console.log('Stored teams from localStorage:', storedTeams);
    
    if (storedTeams) {
        teams = JSON.parse(storedTeams);
        console.log('Parsed teams:', teams);
    } else {
        teams = [];
        // Create sample teams for demonstration if no teams exist
        if (teams.length === 0) {
            console.log('No teams found, team management ready for use');
        }
    }
    displayTeams();
}

// Save teams to local storage
function saveTeams() {
    console.log('Saving teams to localStorage:', teams);
    localStorage.setItem('timeplanner_teams', JSON.stringify(teams));
}

// Display teams in the grid
function displayTeams() {
    console.log('Displaying teams:', teams);
    const teamsGrid = document.getElementById('teamsGrid');
    const teamsEmpty = document.getElementById('teamsEmpty');
    
    if (!teamsGrid || !teamsEmpty) {
        console.log('teamsGrid or teamsEmpty element not found');
        return;
    }
    
    if (teams.length === 0) {
        teamsGrid.innerHTML = '';
        teamsEmpty.classList.remove('hidden');
        return;
    }
    
    teamsEmpty.classList.add('hidden');
    
    teamsGrid.innerHTML = teams.map(team => `
        <div class="bg-gray-800 rounded-lg border border-gray-600 p-6 hover:bg-gray-750 transition-colors">
            <div class="flex items-center justify-between mb-4">
                <div class="flex items-center space-x-3">
                    <div class="w-4 h-4 rounded-full" style="background-color: ${team.color}"></div>
                    <h3 class="text-lg font-semibold text-white">${team.name}</h3>
                </div>
                <div class="flex space-x-2">
                    <button onclick="editTeam(${team.id})" class="text-orange-400 hover:text-orange-300">
                        <i class="fa-solid fa-edit"></i>
                    </button>
                    <button onclick="deleteTeam(${team.id})" class="text-red-400 hover:text-red-300">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
            
            <p class="text-gray-400 text-sm mb-4">${team.description || 'Aucune description'}</p>
            
            <div class="mb-4">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-sm font-medium text-gray-300">Membres</span>
                    <span class="text-xs text-gray-500">${team.members.length} membre(s)</span>
                </div>
                <div class="space-y-1">
                    ${team.members.slice(0, 3).map(member => `
                        <div class="text-sm text-gray-300 flex items-center">
                            <i class="fa-solid fa-user text-xs mr-2 text-gray-500"></i>
                            ${member.name}
                        </div>
                    `).join('')}
                    ${team.members.length > 3 ? `
                        <div class="text-xs text-gray-500">
                            +${team.members.length - 3} autre(s)
                        </div>
                    ` : ''}
                </div>
            </div>
            
            <div class="flex space-x-2">
                <button onclick="viewTeamDetail(${team.id})" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-2 rounded transition-colors">
                    <i class="fa-solid fa-eye mr-1"></i>Voir
                </button>
                <button onclick="generateTeamSchedule(${team.id})" class="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-2 rounded transition-colors">
                    <i class="fa-solid fa-calendar mr-1"></i>Horaires
                </button>
            </div>
        </div>
    `).join('');
}

// Open create team modal
function openCreateTeamModal() {
    console.log('Opening create team modal');
    const modal = document.getElementById('createTeamModal');
    if (modal) {
        // Clear form
        document.getElementById('teamName').value = '';
        document.getElementById('teamDescription').value = '';
        document.getElementById('teamColor').value = '#3b82f6';
        document.getElementById('teamColorText').value = '#3b82f6';
        
        // Reset the creating flag
        isCreatingTeam = false;
        
        modal.classList.remove('hidden');
        setTimeout(() => {
            document.getElementById('teamName').focus();
        }, 100);
    }
}

// Close create team modal
function closeCreateTeamModal() {
    const modal = document.getElementById('createTeamModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Create new team
function createTeam(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
    }
    
    console.log('createTeam function called');
    
    // Prevent multiple submissions immediately - check first
    if (isCreatingTeam) {
        console.log('Already creating team, ignoring duplicate call');
        return false;
    }
    isCreatingTeam = true;
    
    // Disable the submit button immediately to prevent double clicks
    const form = event ? event.target : document.querySelector('#createTeamModal form');
    const submitButton = form ? form.querySelector('button[type="submit"]') : null;
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Création...';
    }
    
    // Make sure teams are loaded first
    if (!teams || teams.length === undefined) {
        console.log('Teams array not initialized, loading teams first...');
        loadTeams();
    }
    
    const name = document.getElementById('teamName').value.trim();
    const description = document.getElementById('teamDescription').value.trim();
    const color = document.getElementById('teamColor').value;
    
    console.log('=== CREATE TEAM DEBUG ===');
    console.log('Team data:', { name, description, color });
    
    // Re-read teams from localStorage to ensure we have the latest state
    const storedTeams = localStorage.getItem('timeplanner_teams');
    if (storedTeams) {
        teams = JSON.parse(storedTeams);
        console.log('Reloaded teams from localStorage:', teams);
    }
    
    console.log('Current teams array:', teams);
    console.log('Current teams count:', teams.length);
    console.log('Checking for duplicate names...');
    console.log('Existing team names:', teams.map(t => t.name));
    console.log('isCreatingTeam flag:', isCreatingTeam);
    
    if (!name) {
        showNotification('Le nom de l\'équipe est requis', 'error');
        document.getElementById('teamName').focus();
        // Re-enable button and reset flag
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerHTML = '<i class="fa-solid fa-plus mr-2"></i>Créer';
        }
        isCreatingTeam = false;
        return;
    }
    
    // Check for duplicate team names
    const duplicateFound = teams.some(team => {
        const exists = team.name.toLowerCase() === name.toLowerCase();
        console.log(`Comparing "${team.name.toLowerCase()}" with "${name.toLowerCase()}": ${exists}`);
        return exists;
    });
    console.log('Duplicate check result:', duplicateFound);
    console.log('Existing team names:', teams.map(t => t.name));
    
    if (duplicateFound) {
        console.log('DUPLICATE DETECTED - showing error');
        showNotification('Une équipe avec ce nom existe déjà', 'error');
        document.getElementById('teamName').focus();
        // Re-enable button and reset flag
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerHTML = '<i class="fa-solid fa-plus mr-2"></i>Créer';
        }
        isCreatingTeam = false;
        return;
    } else {
        console.log('NO DUPLICATE - proceeding with creation');
    }
    
    const newTeam = {
        id: Date.now(), // Simple ID generation
        name,
        description,
        color,
        members: [],
        createdAt: new Date().toISOString(),
        weekendRotationIndex: 0 // Track current weekend rotation
    };
    
    console.log('Creating new team:', newTeam);
    teams.push(newTeam);
    console.log('Teams array after push:', teams);
    
    saveTeams();
    displayTeams();
    closeCreateTeamModal();
    
    // Re-enable button and reset flag
    if (submitButton) {
        submitButton.disabled = false;
        submitButton.innerHTML = '<i class="fa-solid fa-plus mr-2"></i>Créer';
    }
    isCreatingTeam = false;
    
    showNotification(`Équipe "${name}" créée avec succès`, 'success');
}

// Edit team
function editTeam(teamId) {
    const team = teams.find(t => t.id === teamId);
    if (!team) {
        showNotification('Équipe non trouvée', 'error');
        return;
    }
    
    currentTeamId = teamId;
    
    // Fill form with current data
    document.getElementById('editTeamId').value = teamId;
    document.getElementById('editTeamName').value = team.name;
    document.getElementById('editTeamDescription').value = team.description || '';
    document.getElementById('editTeamColor').value = team.color;
    document.getElementById('editTeamColorText').value = team.color;
    
    // Show modal
    const modal = document.getElementById('editTeamModal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

// Close edit team modal
function closeEditTeamModal() {
    const modal = document.getElementById('editTeamModal');
    if (modal) {
        modal.classList.add('hidden');
    }
    currentTeamId = null;
}

// Save team changes
function saveTeamChanges(event) {
    if (event) event.preventDefault();
    
    const teamId = parseInt(document.getElementById('editTeamId').value);
    const team = teams.find(t => t.id === teamId);
    
    if (!team) {
        showNotification('Équipe non trouvée', 'error');
        return;
    }
    
    const name = document.getElementById('editTeamName').value.trim();
    const description = document.getElementById('editTeamDescription').value.trim();
    const color = document.getElementById('editTeamColor').value;
    
    if (!name) {
        showNotification('Le nom de l\'équipe est requis', 'error');
        document.getElementById('editTeamName').focus();
        return;
    }
    
    // Check for duplicate team names (excluding current team)
    if (teams.some(t => t.id !== teamId && t.name.toLowerCase() === name.toLowerCase())) {
        showNotification('Une équipe avec ce nom existe déjà', 'error');
        document.getElementById('editTeamName').focus();
        return;
    }
    
    team.name = name;
    team.description = description;
    team.color = color;
    team.updatedAt = new Date().toISOString();
    
    saveTeams();
    displayTeams();
    closeEditTeamModal();
    
    showNotification(`Équipe "${name}" modifiée avec succès`, 'success');
}

// Delete team
function deleteTeam(teamId) {
    const team = teams.find(t => t.id === teamId);
    if (!team) {
        showNotification('Équipe non trouvée', 'error');
        return;
    }
    
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'équipe "${team.name}" ?\n\nCette action supprimera également tous les horaires associés à cette équipe.`)) {
        return;
    }
    
    teams = teams.filter(t => t.id !== teamId);
    saveTeams();
    displayTeams();
    
    showNotification(`Équipe "${team.name}" supprimée avec succès`, 'success');
}

// View team detail
function viewTeamDetail(teamId) {
    const team = teams.find(t => t.id === teamId);
    if (!team) {
        showNotification('Équipe non trouvée', 'error');
        return;
    }
    
    currentTeamId = teamId;
    
    // Update modal title and header color
    const teamDetailTitle = document.getElementById('teamDetailTitle');
    const teamDetailHeader = document.getElementById('teamDetailHeader');
    
    if (teamDetailTitle) {
        teamDetailTitle.textContent = team.name;
    }
    
    if (teamDetailHeader) {
        teamDetailHeader.style.background = `linear-gradient(to right, ${team.color}, ${adjustColor(team.color, -20)})`;
    }
    
    // Add event listeners to the action buttons
    const refreshBtn = document.getElementById('refreshTeamBtn');
    const addMemberBtn = document.getElementById('addMemberBtn');
    
    if (refreshBtn) {
        refreshBtn.onclick = () => {
            displayTeamMembers(team);
            displayTeamShifts(team);
            showNotification('Équipe actualisée', 'success');
        };
    }
    
    if (addMemberBtn) {
        addMemberBtn.onclick = () => addMemberToTeam();
    }
    
    // Display team members
    displayTeamMembers(team);
    
    // Display team shifts
    displayTeamShifts(team);
    
    // Show modal
    const modal = document.getElementById('teamDetailModal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

// Close team detail modal
function closeTeamDetailModal() {
    const modal = document.getElementById('teamDetailModal');
    if (modal) {
        modal.classList.add('hidden');
    }
    currentTeamId = null;
}

// Display team members
function displayTeamMembers(team) {
    const container = document.getElementById('teamMembersList');
    
    if (!container) {
        console.error('teamMembersList container not found');
        return;
    }
    
    const membersHtml = team.members.length > 0 ? 
        team.members.map((member, index) => `
            <div class="flex items-center justify-between p-3 bg-gray-600 rounded-lg">
                <div class="flex items-center space-x-3">
                    <div class="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        ${member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div class="text-white font-medium">${member.name}</div>
                        <div class="text-gray-400 text-xs">#${member.employee_number || 'N/A'}</div>
                    </div>
                </div>
                <button onclick="removeMemberFromTeam(${team.id}, ${member.id})" class="text-red-400 hover:text-red-300 text-sm">
                    <i class="fa-solid fa-times"></i>
                </button>
            </div>
        `).join('') :
        '<div class="text-center text-gray-400 py-4">Aucun membre dans cette équipe</div>';
    
    container.innerHTML = membersHtml;
}

// Display team shifts preview
function displayTeamShifts(team) {
    const container = document.getElementById('teamShiftsList');
    
    if (!container) {
        console.error('teamShiftsList container not found');
        return;
    }
    
    if (team.members.length === 0) {
        container.innerHTML = `
            <div class="text-center text-gray-400 py-4">
                Ajoutez des membres pour voir les horaires
            </div>
        `;
        return;
    }
    
    const schedule = generateTeamSchedulePreview(team);
    
    container.innerHTML = `
        <div class="space-y-3">
            <div class="bg-gray-600 rounded-lg p-4">
                <h5 class="text-white font-medium mb-3">Semaine (Lun-Ven)</h5>
                <div class="space-y-2 text-sm">
                    ${schedule.weekdays.map(shift => `
                        <div class="flex justify-between items-center">
                            <span class="text-gray-300">${shift.member}</span>
                            <span class="text-blue-400">${shift.days}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="bg-gray-600 rounded-lg p-4">
                <h5 class="text-white font-medium mb-3">Week-end (Sam-Dim)</h5>
                <div class="text-sm">
                    <div class="flex justify-between items-center">
                        <span class="text-gray-300">Cette semaine</span>
                        <span class="text-green-400">${schedule.weekend.current}</span>
                    </div>
                    <div class="flex justify-between items-center mt-1">
                        <span class="text-gray-300">Prochaine semaine</span>
                        <span class="text-purple-400">${schedule.weekend.next}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Generate team schedule preview based on universal patterns
function generateTeamSchedulePreview(team) {
    const memberCount = team.members.length;
    const members = team.members;
    
    // Universal Weekday Pattern: Overlapping 3-day shifts
    const weekdaySchedule = [];
    
    if (memberCount === 1) {
        weekdaySchedule.push({
            member: members[0].name,
            days: "Lun-Ven"
        });
    } else if (memberCount === 2) {
        weekdaySchedule.push(
            { member: members[0].name, days: "Lun-Mer" },
            { member: members[1].name, days: "Mer-Ven" }
        );
    } else if (memberCount >= 3) {
        weekdaySchedule.push(
            { member: members[0].name, days: "Lun-Mer" },
            { member: members[1].name, days: "Mar-Jeu" },
            { member: members[2].name, days: "Mer-Ven" }
        );
        
        // For teams with more than 3 members, distribute additional members
        for (let i = 3; i < memberCount; i++) {
            const pattern = i % 3;
            if (pattern === 0) weekdaySchedule.push({ member: members[i].name, days: "Lun-Mer" });
            else if (pattern === 1) weekdaySchedule.push({ member: members[i].name, days: "Mar-Jeu" });
            else weekdaySchedule.push({ member: members[i].name, days: "Mer-Ven" });
        }
    }
    
    // Universal Weekend Pattern: Rotational Duty
    const currentWeekendIndex = team.weekendRotationIndex % memberCount;
    const nextWeekendIndex = (team.weekendRotationIndex + 1) % memberCount;
    
    return {
        weekdays: weekdaySchedule,
        weekend: {
            current: members[currentWeekendIndex]?.name || 'N/A',
            next: members[nextWeekendIndex]?.name || 'N/A'
        }
    };
}

// Add member to team
function addMemberToTeam() {
    if (!currentTeamId) {
        showNotification('Aucune équipe sélectionnée', 'error');
        return;
    }
    
    const team = teams.find(t => t.id === currentTeamId);
    if (!team) {
        showNotification('Équipe non trouvée', 'error');
        return;
    }
    
    // Check if employees are loaded
    if (!employees || employees.length === 0) {
        showNotification('Chargement des employés en cours...', 'info');
        loadEmployees().then(() => {
            // Retry after loading employees
            setTimeout(() => {
                addMemberToTeam();
            }, 100);
        }).catch(() => {
            showNotification('Erreur lors du chargement des employés', 'error');
        });
        return;
    }
    
    // Show available employees
    const availableEmployees = employees.filter(emp => 
        !team.members.some(member => member.id === emp.id)
    );
    
    if (availableEmployees.length === 0) {
        showNotification('Aucun employé disponible à ajouter à cette équipe', 'warning');
        return;
    }
    
    // Create an improved selection dialog with search
    const employeeOptions = availableEmployees.map(emp => 
        `<option value="${emp.id}" data-name="${emp.name.toLowerCase()}" data-number="${(emp.employee_number || '').toLowerCase()}">${emp.name} (#${emp.employee_number || 'N/A'})</option>`
    ).join('');
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
        <div class="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md mx-auto">
            <!-- Modal Header -->
            <div class="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 rounded-t-xl">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                        <i class="fa-solid fa-user-plus text-xl text-white"></i>
                        <h3 class="text-lg font-bold text-white">Ajouter un membre</h3>
                    </div>
                    <button onclick="this.closest('.fixed').remove()" class="text-white hover:text-gray-200 transition-colors">
                        <i class="fa-solid fa-times text-lg"></i>
                    </button>
                </div>
            </div>
            
            <!-- Modal Content -->
            <div class="p-6">
                <!-- Search Field -->
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-300 mb-2">
                        <i class="fa-solid fa-search mr-1"></i>Rechercher un employé
                    </label>
                    <input 
                        type="text" 
                        id="memberSearchInput" 
                        placeholder="Nom ou numéro d'employé..." 
                        class="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-green-400 focus:ring-2 focus:ring-green-400 focus:outline-none transition-colors text-sm"
                    >
                </div>
                
                <!-- Employee Selection -->
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-300 mb-2">
                        Sélectionner un employé <span class="text-red-400">*</span>
                    </label>
                    <select id="memberSelect" class="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-green-400 focus:ring-2 focus:ring-green-400 focus:outline-none transition-colors">
                        <option value="">-- Choisir un employé --</option>
                        ${employeeOptions}
                    </select>
                </div>
                
                <div class="text-sm text-gray-400 mb-6">
                    <i class="fa-solid fa-info-circle mr-1"></i>
                    <span id="availableCount">${availableEmployees.length}</span> employé(s) disponible(s) pour cette équipe
                </div>
                
                <!-- Action Buttons -->
                <div class="flex space-x-3">
                    <button type="button" onclick="confirmAddMember()" class="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center">
                        <i class="fa-solid fa-plus mr-2"></i>
                        Ajouter
                    </button>
                    <button type="button" onclick="this.closest('.fixed').remove()" class="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg font-medium transition-colors">
                        Annuler
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Focus on the search field after a brief delay and add event listener
    setTimeout(() => {
        const searchInput = document.getElementById('memberSearchInput');
        if (searchInput) {
            searchInput.focus();
            // Add event listener for search functionality
            searchInput.addEventListener('input', filterEmployeeOptions);
            searchInput.addEventListener('keyup', filterEmployeeOptions);
        }
    }, 100);
}

// Filter employee options based on search input
function filterEmployeeOptions() {
    const searchInput = document.getElementById('memberSearchInput');
    const memberSelect = document.getElementById('memberSelect');
    const availableCountSpan = document.getElementById('availableCount');
    
    if (!searchInput || !memberSelect) return;
    
    const searchTerm = searchInput.value.toLowerCase().trim();
    const options = Array.from(memberSelect.options).filter(option => option.value !== ""); // Exclude the default option
    let visibleCount = 0;
    
    options.forEach(option => {
        const name = option.getAttribute('data-name') || '';
        const number = option.getAttribute('data-number') || '';
        const text = option.textContent.toLowerCase();
        
        const matches = searchTerm === '' || 
                       name.includes(searchTerm) || 
                       number.includes(searchTerm) || 
                       text.includes(searchTerm);
        
        if (matches) {
            option.style.display = '';
            visibleCount++;
        } else {
            option.style.display = 'none';
        }
    });
    
    // Update the count
    if (availableCountSpan) {
        availableCountSpan.textContent = visibleCount;
    }
    
    // Reset selection if current selection is now hidden
    if (memberSelect.value && memberSelect.selectedOptions[0] && memberSelect.selectedOptions[0].style.display === 'none') {
        memberSelect.value = '';
    }
}

// Confirm add member
function confirmAddMember() {
    const memberSelect = document.getElementById('memberSelect');
    if (!memberSelect) {
        showNotification('Erreur: Formulaire non trouvé', 'error');
        return;
    }
    
    const memberIdStr = memberSelect.value;
    const memberId = parseInt(memberIdStr);
    
    // More flexible validation - accept string or number ID
    if (!memberIdStr || memberIdStr === '' || memberIdStr === 'undefined' || memberIdStr === 'null') {
        // Get button and re-enable it
        const addButton = document.querySelector('#memberSelect').closest('.fixed').querySelector('button[onclick="confirmAddMember()"]');
        if (addButton) {
            addButton.disabled = false;
            addButton.innerHTML = '<i class="fa-solid fa-plus mr-2"></i>Ajouter';
        }
        
        // Highlight the select field to show the error
        memberSelect.classList.add('border-red-500', 'ring-2', 'ring-red-400');
        setTimeout(() => {
            memberSelect.classList.remove('border-red-500', 'ring-2', 'ring-red-400');
        }, 3000);
        
        showNotification('Veuillez sélectionner un employé', 'error');
        memberSelect.focus();
        return;
    }
    
    // Use the original string ID or parsed integer ID for finding employee
    const searchId = isNaN(memberId) ? memberIdStr : memberId;
    const employee = employees.find(emp => emp.id == searchId); // Use == for flexible comparison
    const team = teams.find(t => t.id === currentTeamId);
    
    if (!employee) {
        // Re-enable button
        const addButton = document.querySelector('#memberSelect').closest('.fixed').querySelector('button[onclick="confirmAddMember()"]');
        if (addButton) {
            addButton.disabled = false;
            addButton.innerHTML = '<i class="fa-solid fa-plus mr-2"></i>Ajouter';
        }
        showNotification('Employé non trouvé', 'error');
        return;
    }
    
    if (!team) {
        // Re-enable button
        const addButton = document.querySelector('#memberSelect').closest('.fixed').querySelector('button[onclick="confirmAddMember()"]');
        if (addButton) {
            addButton.disabled = false;
            addButton.innerHTML = '<i class="fa-solid fa-plus mr-2"></i>Ajouter';
        }
        showNotification('Équipe non trouvée', 'error');
        return;
    }
    
    // Get the button reference early for state management
    const addButton = document.querySelector('#memberSelect').closest('.fixed').querySelector('button[onclick="confirmAddMember()"]');
    
    // Check if employee is already in the team (double-check)
    if (team.members.some(member => member.id == employee.id)) { // Use == for flexible comparison
        showNotification(`${employee.name} fait déjà partie de cette équipe`, 'warning');
        // Re-enable button since we're not proceeding
        if (addButton) {
            addButton.disabled = false;
            addButton.innerHTML = '<i class="fa-solid fa-plus mr-2"></i>Ajouter';
        }
        return;
    }
    
    // Disable the button to prevent double-clicks
    if (addButton) {
        addButton.disabled = true;
        addButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Ajout...';
    }
    
    // Add member to team
    team.members.push({
        id: employee.id,
        name: employee.name,
        employee_number: employee.employee_number
    });
    
    // Save and update
    saveTeams();
    displayTeamMembers(team);
    displayTeamShifts(team);
    
    // Reset button state before closing modal
    if (addButton) {
        addButton.disabled = false;
        addButton.innerHTML = '<i class="fa-solid fa-plus mr-2"></i>Ajouter';
    }
    
    // Small delay to show success state before closing
    setTimeout(() => {
        // Close the modal
        const modal = document.querySelector('.fixed.inset-0');
        if (modal) {
            modal.remove();
        }
    }, 200);
    
    showNotification(`${employee.name} a été ajouté à l'équipe avec succès`, 'success');
}

// Close add member modal
function closeAddMemberModal() {
    const modal = document.querySelector('.fixed.inset-0');
    if (modal) {
        modal.remove();
    }
}

// Remove member from team
function removeMemberFromTeam(teamId, memberId) {
    const team = teams.find(t => t.id === teamId);
    if (!team) return;
    
    const member = team.members.find(m => m.id === memberId);
    if (!member) return;
    
    if (!confirm(`Êtes-vous sûr de vouloir retirer ${member.name} de l'équipe ?`)) {
        return;
    }
    
    team.members = team.members.filter(m => m.id !== memberId);
    saveTeams();
    displayTeamMembers(team);
    displayTeamShifts(team);
    
    showNotification(`${member.name} retiré de l'équipe`, 'success');
}

// Generate actual team schedule and apply to employees
function generateTeamSchedule(teamId) {
    const team = teams.find(t => t.id === teamId);
    if (!team) {
        showNotification('Équipe non trouvée', 'error');
        return;
    }
    
    if (team.members.length === 0) {
        showNotification('Aucun membre dans cette équipe pour générer des horaires', 'error');
        return;
    }
    
    // Store team ID for later use
    window.currentTeamForSchedule = teamId;
    
    // Set default dates (current week)
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday
    
    // Format dates for input fields
    document.getElementById('scheduleStartDate').value = startOfWeek.toISOString().split('T')[0];
    document.getElementById('scheduleEndDate').value = endOfWeek.toISOString().split('T')[0];
    
    // Populate weekend rotation section
    populateWeekendRotation(team);
    
    // Add event listeners to date inputs to refresh weekend rotation when dates change
    const startDateInput = document.getElementById('scheduleStartDate');
    const endDateInput = document.getElementById('scheduleEndDate');
    
    const updateWeekendRotation = () => {
        setTimeout(() => populateWeekendRotation(team), 100); // Delay to ensure values are updated
    };
    
    startDateInput.addEventListener('change', updateWeekendRotation);
    endDateInput.addEventListener('change', updateWeekendRotation);
    
    // Show modal
    document.getElementById('scheduleRangeModal').classList.remove('hidden');
}

// Populate weekend rotation assignments
function populateWeekendRotation(team) {
    const container = document.getElementById('weekendRotationContainer');
    if (!container || !team.members || team.members.length === 0) {
        return;
    }
    
    // Calculate number of weekends in the selected date range
    const startDate = document.getElementById('scheduleStartDate').value;
    const endDate = document.getElementById('scheduleEndDate').value;
    
    if (!startDate || !endDate) {
        container.innerHTML = '<p class="text-gray-400 text-sm">Sélectionnez d\'abord les dates pour configurer la rotation</p>';
        return;
    }
    
    const weekends = calculateWeekendsInRange(startDate, endDate);
    
    if (weekends.length === 0) {
        container.innerHTML = '<p class="text-gray-400 text-sm">Aucune fin de semaine dans la période sélectionnée</p>';
        return;
    }
    
    // Generate weekend assignment dropdowns
    const weekendAssignments = weekends.map((weekend, index) => {
        const defaultMemberIndex = index % team.members.length;
        const options = team.members.map((member, memberIndex) => 
            `<option value="${memberIndex}" ${memberIndex === defaultMemberIndex ? 'selected' : ''}>
                ${member.name}
            </option>`
        ).join('');
        
        return `
            <div class="flex items-center justify-between p-3 bg-gray-600 rounded-lg">
                <div class="flex items-center space-x-3">
                    <i class="fa-solid fa-calendar-week text-blue-400"></i>
                    <div>
                        <div class="text-white font-medium">Fin de semaine ${index + 1}</div>
                        <div class="text-gray-300 text-sm">${formatDateRange(weekend.start, weekend.end)}</div>
                    </div>
                </div>
                <select 
                    id="weekend_${index}" 
                    class="bg-gray-700 border border-gray-500 rounded px-3 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    ${options}
                </select>
            </div>
        `;
    }).join('');
    
    container.innerHTML = weekendAssignments;
}

// Calculate weekends in date range
function calculateWeekendsInRange(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const weekends = [];
    
    // Find first Saturday in range
    let current = new Date(start);
    while (current <= end) {
        if (current.getDay() === 6) { // Saturday
            const saturday = new Date(current);
            const sunday = new Date(current);
            sunday.setDate(saturday.getDate() + 1);
            
            // Only include if both Saturday and Sunday are in range
            if (sunday <= end) {
                weekends.push({
                    start: saturday.toISOString().split('T')[0],
                    end: sunday.toISOString().split('T')[0]
                });
            }
        }
        current.setDate(current.getDate() + 1);
    }
    
    return weekends;
}

// Format date range for display
function formatDateRange(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const options = { month: 'short', day: 'numeric' };
    
    return `${start.toLocaleDateString('fr-FR', options)} - ${end.toLocaleDateString('fr-FR', options)}`;
}

// Close schedule range modal
function closeScheduleRangeModal() {
    document.getElementById('scheduleRangeModal').classList.add('hidden');
    delete window.currentTeamForSchedule;
}

// Confirm schedule generation with selected dates
function confirmScheduleGeneration() {
    const startDate = document.getElementById('scheduleStartDate').value;
    const endDate = document.getElementById('scheduleEndDate').value;
    const teamId = window.currentTeamForSchedule;
    
    if (!startDate || !endDate) {
        showNotification('Veuillez sélectionner les dates de début et de fin', 'error');
        return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
        showNotification('La date de début doit être antérieure à la date de fin', 'error');
        return;
    }
    
    // Collect weekend rotation assignments
    const weekendRotations = [];
    const weekendSelects = document.querySelectorAll('[id^="weekend_"]');
    weekendSelects.forEach((select, index) => {
        weekendRotations.push({
            weekendIndex: index,
            memberIndex: parseInt(select.value)
        });
    });
    
    // Close modal
    closeScheduleRangeModal();
    
    // Continue with schedule generation
    generateTeamScheduleWithDates(teamId, startDate, endDate, weekendRotations);
}

// Generate schedule with specified dates
function generateTeamScheduleWithDates(teamId, startDate, endDate, weekendRotations = []) {
    const team = teams.find(t => t.id === teamId);
    
    showNotification('Génération des horaires en cours...', 'info');
    
    // Generate schedules for each team member based on universal patterns
    const schedulePromises = team.members.map((member, index) => {
        return generateMemberSchedule(member, team, index, startDate, endDate, weekendRotations);
    });
    
    Promise.all(schedulePromises)
        .then(results => {
            const successCount = results.filter(r => r.success).length;
            const failCount = results.length - successCount;
            
            if (successCount > 0) {
                showNotification(`Horaires générés: ${successCount} réussis${failCount > 0 ? `, ${failCount} échecs` : ''}`, 'success');
                
                // Advance weekend rotation
                team.weekendRotationIndex = (team.weekendRotationIndex + 1) % team.members.length;
                saveTeams();
            } else {
                showNotification('Erreur lors de la génération des horaires', 'error');
            }
        })
        .catch(error => {
            console.error('Error generating team schedule:', error);
            showNotification('Erreur lors de la génération des horaires', 'error');
        });
}

// Generate schedule for individual team member
function generateMemberSchedule(member, team, memberIndex, startDate, endDate, weekendRotations = []) {
    const memberCount = team.members.length;
    
    // Calculate all weeks in the date range
    const weeks = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    let currentWeekStart = new Date(start);
    // Adjust to Monday of the week
    currentWeekStart.setDate(start.getDate() - start.getDay() + 1);
    
    while (currentWeekStart <= end) {
        const weekEnd = new Date(currentWeekStart);
        weekEnd.setDate(currentWeekStart.getDate() + 6);
        
        weeks.push({
            start: new Date(currentWeekStart),
            end: weekEnd
        });
        
        currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    }
    
    // Generate weekday patterns (3 consecutive days for each member - WEEKDAYS ONLY Mon-Fri)
    const weekdayPatterns = [];
    if (memberCount === 1) {
        // Single member works Mon-Wed-Fri (3 non-consecutive days for coverage)
        weekdayPatterns.push([0, 1, 0, 1, 0, 1, 0]); // Sun, Mon, Tue, Wed, Thu, Fri, Sat
    } else if (memberCount === 2) {
        weekdayPatterns.push([0, 1, 1, 1, 0, 0, 0]); // Mon-Tue-Wed
        weekdayPatterns.push([0, 0, 1, 1, 1, 0, 0]); // Tue-Wed-Thu
    } else if (memberCount === 3) {
        weekdayPatterns.push([0, 1, 1, 1, 0, 0, 0]); // Mon-Tue-Wed
        weekdayPatterns.push([0, 0, 1, 1, 1, 0, 0]); // Tue-Wed-Thu
        weekdayPatterns.push([0, 0, 0, 1, 1, 1, 0]); // Wed-Thu-Fri
    } else {
        // For more than 3 members, cycle through 3-day patterns within weekdays only
        const patterns = [
            [0, 1, 1, 1, 0, 0, 0], // Mon-Tue-Wed
            [0, 0, 1, 1, 1, 0, 0], // Tue-Wed-Thu
            [0, 0, 0, 1, 1, 1, 0], // Wed-Thu-Fri
            [0, 1, 0, 1, 0, 1, 0], // Mon-Wed-Fri
            [0, 1, 1, 0, 1, 0, 0], // Mon-Tue-Thu
        ];
        for (let i = 0; i < memberCount; i++) {
            weekdayPatterns.push(patterns[i % patterns.length]);
        }
    }
    
    const memberPattern = weekdayPatterns[memberIndex % weekdayPatterns.length];
    
    // Generate schedule for each week
    const weeklySchedule = [];
    
    weeks.forEach((week, weekIndex) => {
        // Process all days of the week
        for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
            const currentDate = new Date(week.start);
            currentDate.setDate(week.start.getDate() + dayOffset);
            
            // Skip dates outside the requested range
            if (currentDate < new Date(startDate) || currentDate > new Date(endDate)) {
                continue;
            }
            
            const dayOfWeek = currentDate.getDay(); // 0=Sunday, 1=Monday, etc.
            const dateStr = currentDate.toISOString().split('T')[0];
            
            // Check if this member works this day according to their pattern
            if (memberPattern[dayOfWeek]) {
                weeklySchedule.push({
                    date: dateStr,
                    day: dayOfWeek,
                    startTime: '00:00',
                    endTime: '23:59',
                    activityType: 'X',
                    isNightShift: (dayOfWeek === 0 || dayOfWeek === 6), // Weekend shifts are night shifts
                    hours: 24
                });
            }
            
            // Additional weekend rotation logic (if not already covered by pattern)
            if ((dayOfWeek === 6 || dayOfWeek === 0) && !memberPattern[dayOfWeek]) { // Saturday or Sunday and not in pattern
                const weekendIndex = Math.floor(weekIndex);
                const assignedMemberIndex = weekendRotations.length > weekendIndex 
                    ? weekendRotations[weekendIndex].memberIndex 
                    : weekIndex % memberCount;
                
                if (assignedMemberIndex === memberIndex) {
                    weeklySchedule.push({
                        date: dateStr,
                        day: dayOfWeek,
                        startTime: '00:00',
                        endTime: '23:59',
                        activityType: 'X',
                        isNightShift: true,
                        hours: 24
                    });
                }
            }
        }
    });
    
    // Mock API response (since backend is not running)
    return Promise.resolve({
        success: true,
        member: member.name,
        scheduleData: weeklySchedule
    });
}

// Utility function to adjust color brightness
function adjustColor(color, amount) {
    const usePound = color[0] === '#';
    const col = usePound ? color.slice(1) : color;
    
    const num = parseInt(col, 16);
    let r = (num >> 16) + amount;
    let g = (num >> 8 & 0x00FF) + amount;
    let b = (num & 0x0000FF) + amount;
    
    r = r > 255 ? 255 : r < 0 ? 0 : r;
    g = g > 255 ? 255 : g < 0 ? 0 : g;
    b = b > 255 ? 255 : b < 0 ? 0 : b;
    
    return (usePound ? '#' : '') + (r << 16 | g << 8 | b).toString(16).padStart(6, '0');
}

// =====================================================
// TEAM SCHEDULES VIEW FUNCTIONS
// =====================================================

// Load team schedules
function loadTeamSchedules() {
    console.log('Loading team schedules...');
    
    // Load saved settings first
    loadTeamScheduleSettings();
    
    // Initialize date selectors with current week or saved settings
    const startDateInput = document.getElementById('teamScheduleStartDate');
    const endDateInput = document.getElementById('teamScheduleEndDate');
    
    if (startDateInput && endDateInput) {
        // Try to restore saved dates first
        if (teamScheduleSettings.startDate && teamScheduleSettings.endDate) {
            startDateInput.value = teamScheduleSettings.startDate;
            endDateInput.value = teamScheduleSettings.endDate;
            console.log('Restored saved team schedule dates:', teamScheduleSettings);
        } else {
            // Default to current week using local timezone
            const today = new Date();
            const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + 1);
            const sunday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + 7);
            
            startDateInput.value = getLocalDateString(monday);
            endDateInput.value = getLocalDateString(sunday);
            
            // Save these default dates
            teamScheduleSettings.startDate = startDateInput.value;
            teamScheduleSettings.endDate = endDateInput.value;
            saveTeamScheduleSettings();
        }
        
        // Remove existing event listeners to avoid duplicates
        startDateInput.removeEventListener('change', handleDateChange);
        endDateInput.removeEventListener('change', handleDateChange);
        
        // Add event listeners to save dates when they change
        startDateInput.addEventListener('change', handleDateChange);
        endDateInput.addEventListener('change', handleDateChange);
    }
    
    // Add event listener to refresh button
    const refreshBtn = document.getElementById('refreshTeamSchedulesBtn');
    if (refreshBtn) {
        refreshBtn.removeEventListener('click', displayTeamSchedules);
        refreshBtn.addEventListener('click', displayTeamSchedules);
    }
    
    // Add event listener to export button
    const exportBtn = document.getElementById('exportTeamSchedulesBtn');
    if (exportBtn) {
        exportBtn.removeEventListener('click', exportTeamSchedulesToExcel);
        exportBtn.addEventListener('click', exportTeamSchedulesToExcel);
    }
    
    displayTeamSchedules();
}

// Handle date changes with proper saving
function handleDateChange(event) {
    const startDateInput = document.getElementById('teamScheduleStartDate');
    const endDateInput = document.getElementById('teamScheduleEndDate');
    
    if (startDateInput && endDateInput) {
        teamScheduleSettings.startDate = startDateInput.value;
        teamScheduleSettings.endDate = endDateInput.value;
        saveTeamScheduleSettings();
        console.log('Saved team schedule dates:', teamScheduleSettings);
        displayTeamSchedules();
    }
}

// Get week number from date
function getWeekNumber(date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

// Display team schedules in table format
function displayTeamSchedules() {
    console.log('Displaying team schedules...');
    
    const teamsGrid = document.getElementById('teamSchedulesGrid');
    const teamsEmpty = document.getElementById('teamSchedulesEmpty');
    
    if (!teamsGrid || !teamsEmpty) {
        console.log('Team schedules grid or empty element not found');
        return;
    }
    
    // Get date range
    const startDateInput = document.getElementById('teamScheduleStartDate');
    const endDateInput = document.getElementById('teamScheduleEndDate');
    
    if (!startDateInput || !endDateInput || !startDateInput.value || !endDateInput.value) {
        console.log('Date inputs not found or not set');
        return;
    }
    
    // Create dates in local timezone to avoid timezone shifting
    const startDate = new Date(startDateInput.value + 'T00:00:00');
    const endDate = new Date(endDateInput.value + 'T00:00:00');
    
    if (startDate > endDate) {
        alert('La date de début doit être antérieure à la date de fin');
        return;
    }
    
    // Get teams from localStorage
    loadTeams(); // Ensure teams are loaded
    
    // Always load schedules data for the specific date range
    console.log('Loading team schedules for date range...');
    // Use the new team schedule API to get data for the entire date range
    const startDateStr = getLocalDateString(startDate);
    const endDateStr = getLocalDateString(endDate);
    const url = `http://127.0.0.1:5001/api/schedule/team-range?start_date=${startDateStr}&end_date=${endDateStr}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            teamScheduleData = data || [];
            console.log('Loaded team schedule data:', teamScheduleData);
            // Continue with display after loading schedules
            continueDisplayTeamSchedules(teamsGrid, teamsEmpty, startDate, endDate);
        })
        .catch(error => {
            console.error('Error loading team schedules:', error);
            teamScheduleData = [];
            // Continue anyway but with empty schedules
            continueDisplayTeamSchedules(teamsGrid, teamsEmpty, startDate, endDate);
        });
}

// Continue displaying team schedules after schedules are loaded
function continueDisplayTeamSchedules(teamsGrid, teamsEmpty, startDate, endDate) {
    const teamsWithMembers = teams.filter(team => team.members && team.members.length > 0);
    
    if (teamsWithMembers.length === 0) {
        teamsGrid.innerHTML = '';
        teamsEmpty.classList.remove('hidden');
        return;
    }
    
    teamsEmpty.classList.add('hidden');
    
    // Generate all dates in range using local timezone
    const dateRange = [];
    const current = new Date(startDate.getTime()); // Create a copy to avoid modifying original
    while (current <= endDate) {
        dateRange.push(new Date(current.getTime())); // Create proper copy
        current.setDate(current.getDate() + 1);
    }
    
    // Generate schedule table for each team and check for conflicts
    let allConflicts = [];
    const teamScheduleTables = teamsWithMembers.map(team => {
        // Check for conflicts in this team
        const teamConflicts = verifyTeamScheduleConflicts(team, startDate, endDate);
        if (teamConflicts.length > 0) {
            allConflicts.push({ team: team.name, conflicts: teamConflicts });
        }
        
        return generateTeamScheduleTable(team, startDate, endDate, dateRange);
    }).join('');
    
    // Add conflicts warning if any found
    let conflictsWarning = '';
    if (allConflicts.length > 0) {
        conflictsWarning = generateConflictsWarning(allConflicts);
    }
    
    teamsGrid.innerHTML = conflictsWarning + teamScheduleTables;
}

// Generate conflicts warning display
function generateConflictsWarning(allConflicts) {
    const conflictCount = allConflicts.reduce((total, teamConflict) => total + teamConflict.conflicts.length, 0);
    
    const conflictDetails = allConflicts.map(teamConflict => {
        const teamConflictList = teamConflict.conflicts.map(memberConflict => {
            const conflictList = memberConflict.conflicts.map(conflict => {
                return `• ${conflict.date}: Double réservation - ${conflict.schedule1_time} et ${conflict.schedule2_time}`;
            }).join('<br>');
            return `<strong>${memberConflict.member}:</strong><br>${conflictList}`;
        }).join('<br><br>');
        
        return `<div class="mb-3"><strong>${teamConflict.team}:</strong><br>${teamConflictList}</div>`;
    }).join('');
    
    return `
        <div class="bg-red-900 border border-red-700 rounded-lg p-4 mb-6">
            <div class="flex items-center mb-3">
                <i class="fa-solid fa-exclamation-triangle text-red-400 text-xl mr-3"></i>
                <h3 class="text-lg font-bold text-red-200">Conflits d'horaires d'employés détectés</h3>
                <span class="ml-auto bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">${conflictCount}</span>
            </div>
            <div class="text-red-300 text-sm">
                ${conflictDetails}
            </div>
            <div class="mt-3 pt-3 border-t border-red-700">
                <p class="text-red-400 text-xs">
                    <i class="fa-solid fa-info-circle mr-1"></i>
                    Les employés ont des horaires en conflit (double réservation). Veuillez résoudre ces conflits dans la section "Gestion des Horaires".
                </p>
            </div>
        </div>
    `;
}

// Generate team schedule table using actual schedule data from Gestion des Horaires
function generateTeamScheduleTable(team, startDate, endDate, dateRange) {
    const weekdays = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    
    // Get actual schedule data for each team member
    const memberSchedules = team.members.map(member => {
        const memberSchedule = {};
        
        // Fetch actual schedule data for this member from the global schedules array
        // The schedules array contains data from "Gestion des Horaires"
        dateRange.forEach(date => {
            const dateStr = getLocalDateString(date);
            
            // Look for schedule data for this member on this date
            // Use the same schedules array that powers "Gestion des Horaires"
            const memberScheduleData = findMemberScheduleFromArray(member, dateStr);
            
            if (memberScheduleData) {
                memberSchedule[dateStr] = memberScheduleData;
            }
        });
        
        return { member, schedule: memberSchedule };
    });
    
    return `
        <div class="bg-gray-800 rounded-lg shadow-lg mb-6 overflow-hidden">
            <!-- Team Header -->
            <div class="bg-gradient-to-r ${team.color ? `from-${team.color}-600 to-${team.color}-700` : 'from-blue-600 to-blue-700'} px-6 py-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                        <div class="w-4 h-4 rounded-full ${team.color ? `bg-${team.color}-300` : 'bg-blue-300'}"></div>
                        <h3 class="text-xl font-bold text-white">${team.name}</h3>
                        <span class="text-sm text-gray-200">(${team.members.length} membres)</span>
                    </div>
                </div>
            </div>
            
            <!-- Schedule Table -->
            <div class="overflow-x-auto">
                <table class="w-full text-sm">
                    <!-- Date Headers -->
                    <thead class="bg-gray-700">
                        <tr>
                            <th class="px-4 py-3 text-left text-gray-200 font-semibold sticky left-0 bg-gray-700 z-10 min-w-[120px]">
                                Membre
                            </th>
                            ${dateRange.map(date => {
                                const dayName = weekdays[date.getDay()];
                                const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                                return `
                                    <th class="px-2 py-3 text-center text-gray-200 font-semibold min-w-[80px] ${isWeekend ? 'bg-gray-600' : ''}">
                                        <div class="flex flex-col">
                                            <span class="text-xs">${dayName}</span>
                                            <span class="text-sm font-bold">${date.getDate()}</span>
                                            <span class="text-xs">${months[date.getMonth()]}</span>
                                        </div>
                                    </th>
                                `;
                            }).join('')}
                            <th class="px-4 py-3 text-center text-gray-200 font-semibold bg-gray-600 min-w-[100px] sticky right-0 z-10">
                                <div class="flex flex-col">
                                    <span class="text-sm font-bold">Total</span>
                                    <span class="text-xs">Jours / Heures</span>
                                </div>
                            </th>
                        </tr>
                    </thead>
                    
                    <!-- Member Rows -->
                    <tbody class="divide-y divide-gray-700">
                        ${memberSchedules.map(({ member, schedule }) => {
                            // Calculate totals for this member (exclude M and V from totals)
                            let totalDays = 0;
                            let totalHours = 0;
                            
                            dateRange.forEach(date => {
                                const dateStr = getLocalDateString(date);
                                const scheduleData = schedule[dateStr];
                                
                                if (scheduleData) {
                                    // Exclude M (Maladie) and V (Vacances) from totals
                                    const activityType = scheduleData.activity_type;
                                    if (activityType && !['M', 'V'].includes(activityType.toUpperCase())) {
                                        totalDays++;
                                        // Add hours, handling different activity types with safer fallback
                                        let hours = 8; // Default hours
                                        
                                        if (scheduleData.hours_worked && !isNaN(scheduleData.hours_worked)) {
                                            hours = scheduleData.hours_worked;
                                        } else if (scheduleData.start_time && scheduleData.end_time) {
                                            hours = calculateHours(scheduleData.start_time, scheduleData.end_time);
                                        }
                                        
                                        totalHours += hours;
                                    }
                                }
                            });
                            
                            // Round total hours to 1 decimal place
                            totalHours = Math.round(totalHours * 10) / 10;
                            
                            return `
                            <tr class="hover:bg-gray-750">
                                <td class="px-4 py-3 text-white font-medium sticky left-0 bg-gray-800 z-10 border-r border-gray-700">
                                    ${member.name}
                                </td>
                                ${dateRange.map(date => {
                                    const dateStr = getLocalDateString(date);
                                    const dayOfWeek = date.getDay();
                                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                                    const scheduleData = schedule[dateStr];
                                    
                                    return `
                                        <td class="px-2 py-3 text-center ${isWeekend ? 'bg-gray-700' : 'bg-gray-800'}">
                                            ${scheduleData ? `
                                                <div class="${getActivityTypeColor(scheduleData.activity_type)} text-white text-xs font-bold px-2 py-1 rounded">
                                                    ${formatScheduleDisplay(scheduleData)}
                                                </div>
                                            ` : `
                                                <span class="text-gray-500">-</span>
                                            `}
                                        </td>
                                    `;
                                }).join('')}
                                <td class="px-4 py-3 text-center bg-gray-600 font-bold sticky right-0 z-10 border-l border-gray-700">
                                    <div class="text-white">
                                        <div class="text-sm font-bold">${totalDays} jour${totalDays !== 1 ? 's' : ''}</div>
                                        <div class="text-xs text-gray-300">${totalHours}h</div>
                                    </div>
                                </td>
                            </tr>
                        `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function calculateHours(startTime, endTime) {
    if (!startTime || !endTime) return 8;
    
    const start = parseTimeToMinutes(startTime);
    const end = parseTimeToMinutes(endTime);
    
    // Handle night shifts (end time is next day)
    if (end <= start) {
        // This is a night shift (e.g., 17:00 to 09:00)
        const nightHours = (24 * 60 - start) + end; // Minutes from start to midnight + minutes from midnight to end
        return Math.round(nightHours / 60 * 100) / 100;
    }
    
    // Regular day shift
    return Math.round((end - start) / 60 * 100) / 100; // Round to 2 decimal places
}

function parseTimeToMinutes(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') {
        return 0; // Default to 0 minutes if timeStr is invalid
    }
    
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + (minutes || 0);
}

// Helper function to find schedule data for a member on a specific date
async function findMemberScheduleForDate(member, dateStr) {
    try {
        // Directly fetch from the employee_schedules table using the proper API
        const response = await fetch(`http://127.0.0.1:5001/api/workers/${member.id || member.name}/schedule/day?date=${dateStr}`);
        
        if (response.ok) {
            const scheduleData = await response.json();
            
            if (scheduleData && scheduleData.length > 0) {
                // Use the actual database columns: start_time, end_time, activity_type
                const schedule = scheduleData[0];
                return {
                    activity_type: schedule.activity_type || schedule.type || 'X',
                    start_time: schedule.start_time || '08:00',
                    end_time: schedule.end_time || '16:00',
                    hours_worked: schedule.hours_worked || calculateHours(schedule.start_time, schedule.end_time),
                    raw_text: `${schedule.activity_type} ${schedule.start_time}-${schedule.end_time}`
                };
            }
        }
    } catch (error) {
        console.log(`API not available, falling back to schedule parsing for ${member.name} on ${dateStr}`);
    }
    
    // Fallback: use the schedules array data (what we currently have)
    return findMemberScheduleFromArray(member, dateStr);
}

// Find member schedule using team schedule data (completely independent from main schedules)
function findMemberScheduleFromArray(member, dateStr) {
    // Only use the team schedule data - completely independent from main schedules
    if (teamScheduleData && teamScheduleData.length > 0) {
        const memberSchedule = teamScheduleData.find(schedule => {
            const scheduleEmployeeName = schedule.employee_name || '';
            const memberName = member.name || '';
            return scheduleEmployeeName.toLowerCase() === memberName.toLowerCase();
        });
        
        if (memberSchedule && memberSchedule.schedules && memberSchedule.schedules[dateStr]) {
            const daySchedule = memberSchedule.schedules[dateStr];
            console.log(`Team schedule data for ${member.name} on ${dateStr}:`, daySchedule);
            return daySchedule;
        }
    }
    
    // Return null if no team schedule data found - don't fall back to main schedules
    console.log(`No team schedule data found for member: ${member.name} on ${dateStr}`);
    return null;
}

// Extract activity type from text
function extractActivityFromText(text) {
    const textStr = text.toString().trim();
    if (textStr.includes('F')) return 'F';
    if (textStr.includes('S')) return 'S';
    if (textStr.includes('V')) return 'V';
    if (textStr.includes('C')) return 'C';
    if (textStr.includes('M')) return 'M';
    if (textStr.includes('D')) return 'D';
    return 'X'; // Default
}

// Parse schedule text when DB columns aren't available
function parseScheduleText(scheduleText) {
    // Default times for different activity types based on Gestion des Horaires patterns
    let startTime = '09:00';
    let endTime = '17:00';
    let activityType = 'X';
    
    // Extract activity type
    activityType = extractActivityFromText(scheduleText);
    
    // Set standard times based on activity type (matching Gestion des Horaires)
    switch(activityType.toUpperCase()) {
        case 'X': // Garde (standard day shift)
            startTime = '17:00';
            endTime = '09:00'; // Next day
            break;
        case 'S': // Soutien de jour
            startTime = '08:00';
            endTime = '16:00';
            break;
        case 'RP': // Rencontre Prénatale
            startTime = '10:00';
            endTime = '18:00';
            break;
        case 'F': // Fin d'équipe de nuit
            // Check if there's a specific hour mentioned (like "F\n09h")
            const hourMatch = scheduleText.match(/(\d{1,2})h/);
            if (hourMatch) {
                const hour = parseInt(hourMatch[1]);
                startTime = '17:00'; // Previous day
                endTime = `${hour.toString().padStart(2, '0')}:00`;
            } else {
                startTime = '17:00';
                endTime = '09:00';
            }
            break;
        case 'D': // Late start shift (after 4 PM)
            // Check if there's a specific hour mentioned (like "D\n17h")
            const startHourMatch = scheduleText.match(/(\d{1,2})h/);
            if (startHourMatch) {
                const hour = parseInt(startHourMatch[1]);
                startTime = `${hour.toString().padStart(2, '0')}:00`;
                // Calculate end time based on shift type
                if (hour >= 17) {
                    // Late evening start - likely goes to next morning
                    endTime = '09:00'; // Next day
                } else {
                    // Afternoon start - 8 hour shift
                    const endHour = (hour + 8) % 24;
                    endTime = `${endHour.toString().padStart(2, '0')}:00`;
                }
            } else {
                startTime = '17:00';
                endTime = '09:00'; // Default late shift
            }
            break;
        case 'V': // Vacation/Vacances
            startTime = '00:00';
            endTime = '00:00';
            break;
        case 'C': // Congé
            startTime = '00:00';
            endTime = '00:00';
            break;
        case 'M': // Maladie
            startTime = '00:00';
            endTime = '00:00';
            break;
        default:
            startTime = '17:00';
            endTime = '09:00';
            break;
    }
    
    const result = {
        activity_type: activityType,
        start_time: startTime,
        end_time: endTime,
        hours_worked: calculateHours(startTime, endTime),
        raw_text: scheduleText
    };
    
    return result;
}

// Check if a schedule entry contains data for a specific date
function hasScheduleForDate(schedule, dateStr) {
    const targetDate = new Date(dateStr);
    const dayOfWeek = targetDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Check the appropriate day column in the schedule
    const dayColumns = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayColumn = dayColumns[dayOfWeek];
    
    if (schedule[dayColumn] && schedule[dayColumn].toString().trim() !== '' && schedule[dayColumn].toString().trim() !== '-') {
        return true;
    }
    
    return false;
}

// Extract schedule data for a specific date from a schedule entry
function extractScheduleForDate(schedule, dateStr) {
    const targetDate = new Date(dateStr);
    const dayOfWeek = targetDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Map day numbers to schedule column names
    const dayColumns = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayColumn = dayColumns[dayOfWeek];
    
    const dayScheduleText = schedule[dayColumn];
    
    if (!dayScheduleText || dayScheduleText.toString().trim() === '' || dayScheduleText.toString().trim() === '-') {
        return null;
    }
    
    // Parse the schedule text to extract start time, end time, and activity type
    const scheduleText = dayScheduleText.toString().trim();
    console.log(`Parsing schedule for ${schedule.employee_name || schedule.Name} on ${dayColumn}: "${scheduleText}"`);
    
    let startTime = '08:00'; // Default start time
    let endTime = '16:00';   // Default end time
    let activityType = 'X';  // Default activity type
    
    // Parse different schedule text formats
    if (scheduleText.includes('F') && scheduleText.includes('h')) {
        // Format: "F 09h" or "F\n09h"
        activityType = 'F';
        const hourMatch = scheduleText.match(/(\d{1,2})h/);
        if (hourMatch) {
            const hour = parseInt(hourMatch[1]);
            startTime = `${hour.toString().padStart(2, '0')}:00`;
            endTime = `${((hour + 8) % 24).toString().padStart(2, '0')}:00`; // Assume 8-hour shift
        }
    } else if (scheduleText === 'S') {
        // Single letter activity type
        activityType = 'S';
        startTime = '08:00';
        endTime = '16:00';
    } else if (scheduleText === 'X') {
        // Single X
        activityType = 'X';
        startTime = '08:00';
        endTime = '16:00';
    } else if (scheduleText.includes('X') && scheduleText.includes(':')) {
        // Format: "X 08:00-16:00" or similar with time ranges
        activityType = 'X';
        const timePattern = /(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})/;
        const match = scheduleText.match(timePattern);
        if (match) {
            startTime = `${match[1].padStart(2, '0')}:${match[2]}`;
            endTime = `${match[3].padStart(2, '0')}:${match[4]}`;
        }
    } else if (scheduleText.match(/^\d{1,2}:\d{2}-\d{1,2}:\d{2}$/)) {
        // Format: "08:00-16:00" (just time range, no activity type)
        const timePattern = /(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})/;
        const match = scheduleText.match(timePattern);
        if (match) {
            startTime = `${match[1].padStart(2, '0')}:${match[2]}`;
            endTime = `${match[3].padStart(2, '0')}:${match[4]}`;
            activityType = 'X'; // Default to X if no explicit activity type
        }
    } else {
        // Try to extract any single letter activity type
        const letterMatch = scheduleText.match(/\b([XVSCMDF])\b/);
        if (letterMatch) {
            activityType = letterMatch[1];
        }
        
        // Try to extract any time information
        const timePattern = /(\d{1,2}):(\d{2})/g;
        const times = [];
        let timeMatch;
        while ((timeMatch = timePattern.exec(scheduleText)) !== null) {
            times.push(`${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`);
        }
        
        if (times.length >= 2) {
            startTime = times[0];
            endTime = times[1];
        } else if (times.length === 1) {
            startTime = times[0];
            // Assume 8-hour shift if only start time provided
            const startHour = parseInt(times[0].split(':')[0]);
            const endHour = (startHour + 8) % 24;
            endTime = `${endHour.toString().padStart(2, '0')}:00`;
        } else {
            // Try to extract hour from formats like "09h"
            const hourMatch = scheduleText.match(/(\d{1,2})h/);
            if (hourMatch) {
                const hour = parseInt(hourMatch[1]);
                startTime = `${hour.toString().padStart(2, '0')}:00`;
                endTime = `${((hour + 8) % 24).toString().padStart(2, '0')}:00`;
            }
        }
    }
    
    console.log(`Parsed result: activity=${activityType}, start=${startTime}, end=${endTime}`);
    
    return {
        activity_type: activityType,
        start_time: startTime,
        end_time: endTime,
        hours_worked: calculateHours(startTime, endTime),
        raw_text: scheduleText
    };
}

// Format schedule display based on shift type and time
function formatScheduleDisplay(scheduleData) {
    // Add null/undefined checks
    if (!scheduleData) {
        return '-';
    }
    
    // Display activity types exactly as in Gestion des Horaires table
    let activityType = scheduleData.activity_type || 'X';
    
    // Handle cases where the activity type already contains \n (from backend)
    if (activityType.includes('\n')) {
        // Convert \n to <br> for HTML display
        return activityType.replace(/\n/g, '<br>');
    }
    
    // Extract the first character for switch statement (in case of complex activity types)
    const baseActivityType = activityType.charAt(0).toUpperCase();
    
    switch(baseActivityType) {
        case 'F':
            // Show "F<br>09h" format for end of night shift
            if (scheduleData.end_time && scheduleData.end_time !== '09:00') {
                const endHour = parseInt(scheduleData.end_time.split(':')[0]);
                return `F<br>${endHour}h`;
            }
            return 'F<br>9h';
            
        case 'D':
            // Show "D<br>17h" format for late start shifts (after 4 PM)
            if (scheduleData.start_time && scheduleData.start_time !== '17:00') {
                const startHour = parseInt(scheduleData.start_time.split(':')[0]);
                return `D<br>${startHour}h`;
            }
            return 'D<br>17h';
            
        case 'X':
            return 'X'; // Standard garde
            
        case 'S':
            return 'S'; // Soutien de jour
            
        case 'R':
            // Handle RP case
            if (activityType.toUpperCase().startsWith('RP')) {
                return 'RP'; // Rencontre Prénatale
            }
            return activityType;
            
        case 'V':
            return 'V'; // Vacances
            
        case 'M':
            return 'M'; // Maladie
            
        case 'C':
            return 'C'; // Congé
            
        default:
            // Check if the default activity type contains \n and convert it
            if (typeof activityType === 'string' && activityType.includes('\n')) {
                return activityType.replace(/\n/g, '<br>');
            }
            return activityType;
    }
}

// Get background color for activity type
function getActivityTypeColor(activityType) {
    if (!activityType) return 'bg-green-600'; // Default green
    
    const baseType = activityType.charAt(0).toUpperCase();
    
    switch(baseType) {
        case 'M': // Maladie
            return 'bg-red-600';
        case 'V': // Vacances
            return 'bg-blue-600';
        case 'F': // Fin d'équipe de nuit
            return 'bg-yellow-600';
        case 'X': // Garde
        case 'S': // Soutien de jour
        case 'R': // RP - Rencontre Prénatale
        case 'C': // Congé
        default:
            return 'bg-green-600';
    }
}

// Calculate hours between two times
function calculateHours(startTime, endTime) {
    // Add null/undefined checks
    if (!startTime || !endTime) {
        return 8; // Default to 8 hours if times are missing
    }
    
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    let diffMinutes = endMinutes - startMinutes;
    if (diffMinutes < 0) {
        diffMinutes += 24 * 60; // Handle overnight shifts
    }
    
    return Math.round(diffMinutes / 60 * 100) / 100; // Round to 2 decimal places
}

// Verify that team members don't have individual schedule conflicts (not between team members)
function verifyTeamScheduleConflicts(team, startDate, endDate) {
    const conflicts = [];
    const dateRange = [];
    
    // Generate all dates in range
    const current = new Date(startDate);
    while (current <= endDate) {
        dateRange.push(new Date(current));
        current.setDate(current.getDate() + 1);
    }
    
    // Check each team member for individual schedule conflicts only
    team.members.forEach((member) => {
        const memberConflicts = [];
        
        dateRange.forEach(date => {
            const dateStr = date.toISOString().split('T')[0];
            
            // Check for individual member schedule conflicts (double booking)
            const memberDayConflicts = checkMemberDayConflicts(member, dateStr);
            memberConflicts.push(...memberDayConflicts);
        });
        
        if (memberConflicts.length > 0) {
            conflicts.push({
                member: member.name,
                conflicts: memberConflicts
            });
        }
    });
    
    return conflicts;
}

// Check if two time ranges overlap
function checkTimeOverlap(start1, end1, start2, end2) {
    const start1Minutes = timeToMinutes(start1);
    const end1Minutes = timeToMinutes(end1);
    const start2Minutes = timeToMinutes(start2);
    const end2Minutes = timeToMinutes(end2);
    
    // Check for overlap
    const overlapStart = Math.max(start1Minutes, start2Minutes);
    const overlapEnd = Math.min(end1Minutes, end2Minutes);
    
    if (overlapStart < overlapEnd) {
        return {
            hasOverlap: true,
            overlapMinutes: overlapEnd - overlapStart
        };
    }
    
    return { hasOverlap: false, overlapMinutes: 0 };
}

// Convert time string to minutes
function timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

// Check for conflicts in a single member's schedule on a single day
function checkMemberDayConflicts(member, dateStr) {
    const conflicts = [];
    
    // Look for multiple schedule entries for the same member on the same day
    const memberSchedules = schedules.filter(schedule => {
        const scheduleEmployeeName = schedule.employee_name || schedule.Name || '';
        const memberName = member.name || '';
        return scheduleEmployeeName.toLowerCase() === memberName.toLowerCase() && 
               hasScheduleForDate(schedule, dateStr);
    });
    
    // If multiple schedules found for the same day, check for conflicts
    if (memberSchedules.length > 1) {
        for (let i = 0; i < memberSchedules.length; i++) {
            for (let j = i + 1; j < memberSchedules.length; j++) {
                const schedule1 = extractScheduleForDate(memberSchedules[i], dateStr);
                const schedule2 = extractScheduleForDate(memberSchedules[j], dateStr);
                
                if (schedule1 && schedule2) {
                    const overlap = checkTimeOverlap(
                        schedule1.start_time, schedule1.end_time,
                        schedule2.start_time, schedule2.end_time
                    );
                    
                    if (overlap.hasOverlap) {
                        conflicts.push({
                            date: dateStr,
                            member: member.name,
                            conflict_type: 'double_booking',
                            schedule1_time: `${schedule1.start_time}-${schedule1.end_time}`,
                            schedule2_time: `${schedule2.start_time}-${schedule2.end_time}`,
                            overlap_duration: overlap.overlapMinutes
                        });
                    }
                }
            }
        }
    }
    
    return conflicts;
}

// Load schedule data for a specific team and week
function loadTeamScheduleData(team, weekStart) {
    // Convert week start to actual dates
    const startDate = new Date(weekStart);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    
    const formattedStartDate = startDate.toISOString().split('T')[0];
    const formattedEndDate = endDate.toISOString().split('T')[0];
    
    // Generate mock schedule data instead of fetching from API
    // This simulates the new 3-consecutive-days scheduling pattern
    const memberSchedules = team.members.map((member, memberIndex) => {
        const memberCount = team.members.length;
        const schedules = [];
        
        // Generate weekday patterns (3 consecutive days for each member - WEEKDAYS ONLY Mon-Fri)
        let weekdayPattern = [0, 0, 0, 0, 0, 0, 0]; // Initialize all days as 0
        
        if (memberCount === 1) {
            // Single member works Mon-Wed-Fri (3 non-consecutive days for coverage)
            weekdayPattern = [0, 1, 0, 1, 0, 1, 0]; // Sun, Mon, Tue, Wed, Thu, Fri, Sat
        } else if (memberCount === 2) {
            if (memberIndex === 0) {
                weekdayPattern = [0, 1, 1, 1, 0, 0, 0]; // Mon-Tue-Wed
            } else {
                weekdayPattern = [0, 0, 1, 1, 1, 0, 0]; // Tue-Wed-Thu
            }
        } else if (memberCount === 3) {
            if (memberIndex === 0) {
                weekdayPattern = [0, 1, 1, 1, 0, 0, 0]; // Mon-Tue-Wed
            } else if (memberIndex === 1) {
                weekdayPattern = [0, 0, 1, 1, 1, 0, 0]; // Tue-Wed-Thu
            } else {
                weekdayPattern = [0, 0, 0, 1, 1, 1, 0]; // Wed-Thu-Fri
            }
        } else {
            // For more than 3 members, cycle through 3-day patterns within weekdays only
            const patterns = [
                [0, 1, 1, 1, 0, 0, 0], // Mon-Tue-Wed
                [0, 0, 1, 1, 1, 0, 0], // Tue-Wed-Thu
                [0, 0, 0, 1, 1, 1, 0], // Wed-Thu-Fri
                [0, 1, 0, 1, 0, 1, 0], // Mon-Wed-Fri
                [0, 1, 1, 0, 1, 0, 0], // Mon-Tue-Thu
            ];
            weekdayPattern = patterns[memberIndex % patterns.length];
        }
        
        // Generate schedule for each day of the week
        for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + dayOffset);
            const dateStr = currentDate.toISOString().split('T')[0];
            const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday
            
            // Check if this member works this day according to their pattern
            if (weekdayPattern[dayOfWeek]) {
                schedules.push({
                    date: dateStr,
                    activity_type: 'X',
                    start_time: '00:00',
                    end_time: '23:59',
                    hours_worked: 24,
                    is_night_shift: (dayOfWeek === 0 || dayOfWeek === 6) // Weekend shifts are night shifts
                });
            }
            
            // Separate weekend rotation logic (override pattern for weekends if different member assigned)
            if ((dayOfWeek === 0 || dayOfWeek === 6) && !weekdayPattern[dayOfWeek]) { // Weekend and not already in pattern
                const weekendRotationIndex = team.weekendRotationIndex || 0;
                const assignedMember = weekendRotationIndex % memberCount;
                if (assignedMember === memberIndex) {
                    schedules.push({
                        date: dateStr,
                        activity_type: 'X',
                        start_time: '00:00',
                        end_time: '23:59',
                        hours_worked: 24,
                        is_night_shift: true
                    });
                }
            }
        }
        
        return schedules;
    });
    
    // Return promise that resolves with member schedule data
    return Promise.resolve(
        team.members.map((member, index) => ({
            member,
            schedules: memberSchedules[index] || []
        }))
    );
}

// Generate team schedule card HTML
function generateTeamScheduleCard(team, scheduleData, weekStart) {
    const startDate = new Date(weekStart);
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    
    // Calculate week dates
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        weekDates.push({
            name: days[i],
            date: date.getDate(),
            fullDate: date.toISOString().split('T')[0]
        });
    }
    
    // Generate member rows
    const memberRows = scheduleData.map(memberData => {
        const member = memberData.member;
        const schedules = memberData.schedules;
        
        // Create schedule map by date
        const scheduleMap = {};
        schedules.forEach(schedule => {
            const date = schedule.date;
            if (!scheduleMap[date]) scheduleMap[date] = [];
            scheduleMap[date].push(schedule);
        });
        
        const daysCells = weekDates.map(day => {
            const daySchedules = scheduleMap[day.fullDate] || [];
            let cellContent = '';
            
            if (daySchedules.length > 0) {
                const schedule = daySchedules[0]; // Take first schedule for the day
                const activityType = schedule.activity_type || 'X';
                const startTime = schedule.start_time || '';
                const endTime = schedule.end_time || '';
                
                cellContent = `
                    <div class="schedule-cell bg-green-600 text-white text-xs px-2 py-1 rounded">
                        <div class="font-bold">${activityType.toUpperCase()}</div>
                        ${startTime && endTime ? `<div>${startTime}-${endTime}</div>` : ''}
                    </div>
                `;
            } else {
                cellContent = `<div class="schedule-cell text-gray-500 text-xs">-</div>`;
            }
            
            return `<td class="px-2 py-2 text-center">${cellContent}</td>`;
        }).join('');
        
        return `
            <tr class="border-b border-gray-600">
                <td class="px-3 py-2 text-white font-medium">${member.name}</td>
                ${daysCells}
            </tr>
        `;
    }).join('');
    
    return `
        <div class="bg-gray-800 rounded-lg border border-gray-600 p-4">
            <div class="flex items-center justify-between mb-4">
                <div class="flex items-center space-x-3">
                    <div class="w-4 h-4 rounded-full" style="background-color: ${team.color}"></div>
                    <h3 class="text-lg font-semibold text-white">${team.name}</h3>
                    <span class="text-sm text-gray-400">(${team.members.length} membre${team.members.length > 1 ? 's' : ''})</span>
                </div>
                <div class="flex space-x-2">
                    <button onclick="generateTeamSchedule(${team.id})" class="bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-1 rounded transition-colors">
                        <i class="fa-solid fa-calendar-plus mr-1"></i>Générer
                    </button>
                    <button onclick="viewTeamDetail(${team.id})" class="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1 rounded transition-colors">
                        <i class="fa-solid fa-eye mr-1"></i>Voir
                    </button>
                </div>
            </div>
            
            <div class="overflow-x-auto">
                <table class="w-full text-sm">
                    <thead>
                        <tr class="bg-gray-700">
                            <th class="px-3 py-2 text-left text-gray-300 font-medium">Membre</th>
                            ${weekDates.map(day => `
                                <th class="px-2 py-2 text-center text-gray-300 font-medium">
                                    <div>${day.name}</div>
                                    <div class="text-xs text-gray-400">${day.date}</div>
                                </th>
                            `).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${memberRows || `
                            <tr>
                                <td colspan="8" class="px-3 py-4 text-center text-gray-500">
                                    Aucun horaire généré pour cette équipe
                                </td>
                            </tr>
                        `}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// =====================================================
// TEAM SCHEDULES EXPORT FUNCTIONS
// =====================================================

// Export team schedules to Excel using Python backend
function exportTeamSchedulesToExcel() {
    const startDateInput = document.getElementById('teamScheduleStartDate');
    const endDateInput = document.getElementById('teamScheduleEndDate');
    
    if (!startDateInput || !endDateInput || !startDateInput.value || !endDateInput.value) {
        showNotification('Veuillez sélectionner une période pour l\'export', 'warning');
        return;
    }
    
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;
    
    // Ensure teams are loaded
    loadTeams();
    
    // Filter teams with members only (same as what's displayed in UI)
    const teamsWithMembers = teams.filter(team => team.members && team.members.length > 0);
    
    if (teamsWithMembers.length === 0) {
        showNotification('Aucune équipe avec des membres trouvée pour l\'export', 'warning');
        return;
    }
    
    showNotification('Génération du fichier Excel en cours...', 'info');
    
    // Send teams data to backend via POST request
    const exportUrl = `http://127.0.0.1:5001/api/export/team-schedules`;
    
    fetch(exportUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            start_date: startDate,
            end_date: endDate,
            teams: teamsWithMembers
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            }
            
            showNotification(`Fichier Excel exporté avec succès: ${data.filename}`, 'success');
            console.log('Export successful:', data);
        })
        .catch(error => {
            console.error('Export error:', error);
            showNotification(`Erreur lors de l'export: ${error.message}`, 'error');
        });
}

// =====================================================
// CALENDAR NAVIGATION FUNCTIONS
// =====================================================

// Current calendar state
let currentCalendarYear = new Date().getFullYear();
let currentCalendarMonth = new Date().getMonth();
let currentCalendarEmployeeId = null;

// Navigate to previous month
function prevMonth() {
    currentCalendarMonth--;
    if (currentCalendarMonth < 0) {
        currentCalendarMonth = 11;
        currentCalendarYear--;
    }
    
    // Get current employee ID from the modal
    const employeeNameElement = document.getElementById('employeeNameCalendar');
    if (employeeNameElement) {
        const employeeName = employeeNameElement.textContent;
        const employee = employees.find(emp => emp.name === employeeName);
        if (employee) {
            currentCalendarEmployeeId = employee.id;
            loadCalendarForMonth(currentCalendarYear, currentCalendarMonth, currentCalendarEmployeeId);
        }
    }
}

// Navigate to previous month (alias for HTML compatibility)
function previousMonth() {
    prevMonth();
}

// Navigate to next month
function nextMonth() {
    currentCalendarMonth++;
    if (currentCalendarMonth > 11) {
        currentCalendarMonth = 0;
        currentCalendarYear++;
    }
    
    // Get current employee ID from the modal
    const employeeNameElement = document.getElementById('employeeNameCalendar');
    if (employeeNameElement) {
        const employeeName = employeeNameElement.textContent;
        const employee = employees.find(emp => emp.name === employeeName);
        if (employee) {
            currentCalendarEmployeeId = employee.id;
            loadCalendarForMonth(currentCalendarYear, currentCalendarMonth, currentCalendarEmployeeId);
        }
    }
}

// Load calendar data for specific month
function loadCalendarForMonth(year, month, employeeId) {
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) return;
    
    // Get all weeks that overlap with this month
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    
    // Calculate all weeks we need to fetch
    const weeks = [];
    let currentWeekStart = new Date(firstDayOfMonth);
    currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay()); // Go to Sunday
    
    while (currentWeekStart <= lastDayOfMonth) {
        weeks.push(new Date(currentWeekStart));
        currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    }
    
    // Fetch data for all weeks and combine
    const weekPromises = weeks.map(weekStart => {
        const weekDate = weekStart.toISOString().split('T')[0];
        return fetch(`http://127.0.0.1:5001/api/schedule/weekly?date=${weekDate}`)
            .then(response => response.json())
            .then(weeklyData => {
                const employeeData = weeklyData.find(w => w.Name === employee.name);
                return { weekStart, employeeData };
            });
    });
    
    Promise.all(weekPromises)
        .then(weekResults => {
            // Combine all weeks into a single calendar data object
            let calendarData = {};
            
            weekResults.forEach(({ weekStart, employeeData }) => {
                if (employeeData) {
                    const weekCalendarData = convertWeeklyToCalendarData(employeeData, weekStart, month + 1);
                    calendarData = { ...calendarData, ...weekCalendarData };
                }
            });
            
            generateEmployeeCalendarForMonth(calendarData, year, month);
        })
        .catch(error => {
            console.error('Error loading calendar for month:', error);
            showNotification(`Erreur lors du chargement du calendrier: ${error.message}`, 'error');
        });
}

// Generate employee calendar for specific month
function generateEmployeeCalendarForMonth(calendarData, year, month) {
    // Check if the modal is actually visible before trying to generate calendar
    const modal = document.getElementById('employeeCalendarModal');
    if (!modal || modal.classList.contains('hidden')) {
        console.log('Calendar modal is not visible, skipping calendar generation');
        return;
    }
    
    const calendarContainer = document.getElementById('calendarDays');
    if (!calendarContainer) {
        console.error('Calendar container not found');
        return;
    }

    // Default to empty object if no data provided
    calendarData = calendarData || {};

    // Update month/year display
    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    
    const monthYearDisplay = document.getElementById('currentMonthYear');
    if (monthYearDisplay) {
        monthYearDisplay.textContent = `${monthNames[month]} ${year}`;
    }
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = firstDay.getDay(); // Day of week (0-6)
    const daysInMonth = lastDay.getDate();
    const today = new Date();
    
    let calendarHTML = '';
    
    // Add days of the month with new layout design
    for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayData = calendarData[dateKey];
        
        // Calculate grid position for the first day of the month
        const dayOfWeek = new Date(year, month, day).getDay();
        const gridColumnStart = day === 1 ? `col-start-${dayOfWeek + 1}` : '';
        
        let dayClass = `calendar-day h-16 border border-gray-300 dark:border-gray-500 rounded relative cursor-pointer transition-colors ${gridColumnStart}`;
        let hasActivity = false;
        let activityType = '';
        
        // Check if there's schedule data for this day
        if (dayData && dayData.activity_type) {
            activityType = dayData.activity_type;
            hasActivity = true;
        }
        
        // Base background color
        if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
            // Today - use blue background with white text
            dayClass += ' bg-blue-600 text-white border-blue-400 ring-2 ring-blue-400';
        } else {
            // Regular day - light/dark mode appropriate colors
            dayClass += ' bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600';
        }
        
        // Create day content with new layout
        let dayContent = `
            <!-- Day number in top-left corner -->
            <div class="absolute top-1 left-1 text-xs font-medium calendar-day-number">${day}</div>
        `;
        
        // Add activity indicator in center if there's an activity
        if (hasActivity && activityType) {
            const activityColor = getActivityTypeColor(activityType);
            dayContent += `
                <!-- Activity type in center with background color -->
                <div class="absolute inset-2 flex items-center justify-center">
                    <div class="${activityColor} text-white text-xs font-bold px-2 py-1 rounded shadow-sm">
                        ${activityType}
                    </div>
                </div>
            `;
        }
        
        calendarHTML += `<div class="${dayClass}" data-date="${dateKey}">${dayContent}</div>`;
    }
    
    calendarContainer.innerHTML = calendarHTML;
    
    // Add click event listeners to calendar days
    const calendarDays = calendarContainer.querySelectorAll('.calendar-day[data-date]');
    calendarDays.forEach(day => {
        day.addEventListener('click', function() {
            const date = this.getAttribute('data-date');
            showDayScheduleDetails(date, calendarData[date]);
        });
    });
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
                            <option value="X">X - Garde</option>
                            <option value="S">S - Soutien de jour</option>
                            <option value="RP">RP - Rencontre Prénatale</option>
                            <option value="V">V - Vacances</option>
                            <option value="M">M - Maladie</option>
                            <option value="">Vide - Repos</option>
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
        default:
            // For blank - not working
            startTime.value = '09:00';
            endTime.value = '17:00';
            hoursCount.value = '0';
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

    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    
    if (!startDateInput || !endDateInput || !startDateInput.value || !endDateInput.value) {
        showNotification('Veuillez sélectionner les dates de début et fin', 'error');
        return;
    }

    const startDate = new Date(startDateInput.value);
    const endDate = new Date(endDateInput.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison
    
    // Validate that dates are not in the past
    if (startDate < today) {
        showNotification('La date de début ne peut pas être dans le passé', 'error');
        startDateInput.focus();
        return;
    }
    
    if (endDate < today) {
        showNotification('La date de fin ne peut pas être dans le passé', 'error');
        endDateInput.focus();
        return;
    }
    
    // Validate that end date is not before start date
    if (endDate < startDate) {
        showNotification('La date de fin ne peut pas être antérieure à la date de début', 'error');
        endDateInput.focus();
        return;
    }
    
    // Collect data from form
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const weeklySchedule = [];
    
    days.forEach((day, index) => {
        const checkbox = document.getElementById(`day${index}`);
        
        if (checkbox && checkbox.checked) {
            const activityType = document.getElementById(`activityType${index}`);
            const hoursCount = document.getElementById(`hoursCount${index}`);
            const startTime = document.getElementById(`startTime${index}`);
            const endTime = document.getElementById(`endTime${index}`);
            const isNightShift = document.getElementById(`isNightShift${index}`);
            
            weeklySchedule.push({
                day: index,
                startTime: startTime.value,
                endTime: endTime.value,
                activityType: activityType.value,
                isNightShift: isNightShift ? isNightShift.checked : false
            });
        }
    });

    // Prepare data for the weekly schedule endpoint
    const scheduleData = {
        employeeId: currentEmployeeId,
        startDate: startDateInput.value,
        endDate: endDateInput.value,
        weeklySchedule: weeklySchedule
    };

    // Add indisponibilité data if provided
    const unavailabilityEnabled = document.getElementById('enableUnavailability');
    if (unavailabilityEnabled && unavailabilityEnabled.checked) {
        const unavailabilityType = document.getElementById('unavailabilityType');
        
        if (unavailabilityType && unavailabilityType.value) {
            scheduleData.unavailabilityType = unavailabilityType.value;
            // Use the main date pickers for indisponibilité dates
            scheduleData.unavailabilityStartDate = startDateInput.value;
            scheduleData.unavailabilityEndDate = endDateInput.value;
        }
    }

    // Send to API using the weekly schedule endpoint
    fetch('http://127.0.0.1:5001/api/schedules/weekly', {
        method: 'POST',
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
            return response.text().then(text => {
                throw new Error(text || 'Erreur lors de la sauvegarde');
            });
        }
    })
    .catch(error => {
        console.error('Error saving schedule:', error);
        showNotification('Erreur lors de la sauvegarde: ' + error.message, 'error');
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

// Close add schedule modal specifically
function closeAddScheduleModal() {
    closeModal('addScheduleModal');
}

// Close employee calendar modal specifically
function closeEmployeeCalendarModal() {
    closeModal('employeeCalendarModal');
}

// Close edit employee modal specifically
function closeEditEmployeeModal() {
    closeModal('editEmployeeModal');
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
    fetch(`http://127.0.0.1:5001/api/reports/archive/${filename}/download`)
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
        fetch(`http://127.0.0.1:5001/api/reports/archive/${filename}`, {
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

// Update report
function updateReport(filename) {
    if (confirm(`Voulez-vous mettre à jour le rapport "${filename}" avec les données actuelles ?`)) {
        // Show loading notification
        showNotification('Mise à jour du rapport en cours...', 'info');
        
        fetch(`http://127.0.0.1:5001/api/reports/archive/${filename}`, {
            method: 'PUT'
        })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                return response.json().then(err => {
                    throw new Error(err.error || 'Erreur lors de la mise à jour');
                });
            }
        })
        .then(data => {
            showNotification(data.message || 'Rapport mis à jour avec succès', 'success');
            loadReports(); // Refresh the list
        })
        .catch(error => {
            console.error('Error updating report:', error);
            showNotification(`Erreur lors de la mise à jour: ${error.message}`, 'error');
        });
    }
}

// =====================================================
// UI UTILITY FUNCTIONS
// =====================================================

// Show notification
function showNotification(message, type = 'info') {
    // Clear any existing notifications first
    const existingNotifications = document.querySelectorAll('.fixed.top-4.right-4');
    existingNotifications.forEach(notification => notification.remove());
    
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
window.getCurrentWeekStart = getCurrentWeekStart;
window.setupDateValidation = setupDateValidation;
window.loadEmployees = loadEmployees;
window.loadSchedules = loadSchedules;
window.loadReports = loadReports;
window.exportToExcel = exportToExcel;
window.updateWeekHeaders = updateWeekHeaders;
window.addEmployeeSchedule = addEmployeeSchedule;
window.modifyEmployeeSchedule = modifyEmployeeSchedule;
window.deleteEmployeeSchedule = deleteEmployeeSchedule;
window.modifyEmployee = modifyEmployee;
window.deleteEmployee = deleteEmployee;
window.openAddEmployeeModal = openAddEmployeeModal;
window.closeAddEmployeeModal = closeAddEmployeeModal;
window.addNewEmployee = addNewEmployee;
window.closeDeleteEmployeeModal = closeDeleteEmployeeModal;
window.confirmDeleteEmployee = confirmDeleteEmployee;
window.saveEmployeeChanges = saveEmployeeChanges;
window.openEmployeeCalendar = openEmployeeCalendar;
window.prevMonth = prevMonth;
window.previousMonth = previousMonth;
window.nextMonth = nextMonth;
window.generateWeeklyScheduleForm = generateWeeklyScheduleForm;
window.toggleDayInputs = toggleDayInputs;
window.updateNightShiftInfo = updateNightShiftInfo;
window.updateActivityTypeInfo = updateActivityTypeInfo;
window.validateShiftTimes = validateShiftTimes;
window.modifySchedule = modifySchedule;
window.saveSchedule = saveSchedule;
window.closeModal = closeModal;
window.closeAddScheduleModal = closeAddScheduleModal;
window.closeEmployeeCalendarModal = closeEmployeeCalendarModal;
window.closeEditEmployeeModal = closeEditEmployeeModal;
window.showModal = showModal;
window.handleFormSubmit = handleFormSubmit;
window.resetForm = resetForm;
window.downloadReport = downloadReport;
window.deleteReport = deleteReport;
window.updateReport = updateReport;
window.showNotification = showNotification;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.confirmAction = confirmAction;

// Schedule day editing functions
window.deleteDaySchedule = deleteDaySchedule;
window.showDeleteConfirmationModal = showDeleteConfirmationModal;
window.closeDeleteConfirmationModal = closeDeleteConfirmationModal;
window.confirmDeleteDaySchedule = confirmDeleteDaySchedule;
window.editDaySchedule = editDaySchedule;
window.saveEditDaySchedule = saveEditDaySchedule;
window.updateEditActivityTypeInfo = updateEditActivityTypeInfo;
window.validateEditShiftTimes = validateEditShiftTimes;

// Inline editing functions
window.switchToEditMode = switchToEditMode;
window.switchToViewMode = switchToViewMode;
window.updateInlineEditActivityTypeInfo = updateInlineEditActivityTypeInfo;
window.validateInlineEditShiftTimes = validateInlineEditShiftTimes;
window.saveInlineEditDaySchedule = saveInlineEditDaySchedule;

// Team management functions
window.loadTeams = loadTeams;
window.openCreateTeamModal = openCreateTeamModal;
window.closeCreateTeamModal = closeCreateTeamModal;
window.createTeam = createTeam;
window.editTeam = editTeam;
window.closeEditTeamModal = closeEditTeamModal;
window.saveTeamChanges = saveTeamChanges;
window.deleteTeam = deleteTeam;
window.viewTeamDetail = viewTeamDetail;
window.closeTeamDetailModal = closeTeamDetailModal;
window.addMemberToTeam = addMemberToTeam;
window.closeAddMemberModal = closeAddMemberModal;
window.confirmAddMember = confirmAddMember;
window.removeMemberFromTeam = removeMemberFromTeam;
window.generateTeamSchedule = generateTeamSchedule;
window.exportTeamSchedulesToExcel = exportTeamSchedulesToExcel;
window.filterEmployeeOptions = filterEmployeeOptions;

// Debug function to clear teams for testing
window.clearAllTeams = function() {
    if (confirm('Êtes-vous sûr de vouloir supprimer toutes les équipes ? Cette action est irréversible.')) {
        localStorage.removeItem('timeplanner_teams');
        teams = [];
        displayTeams();
        showNotification('Toutes les équipes ont été supprimées', 'success');
        console.log('All teams cleared');
    }
};

// Debug function to inspect current state
window.debugTeams = function() {
    console.log('=== TEAM DEBUG INFO ===');
    console.log('Current teams array:', teams);
    console.log('localStorage content:', localStorage.getItem('timeplanner_teams'));
    console.log('isCreatingTeam flag:', isCreatingTeam);
    console.log('Number of teams:', teams.length);
    teams.forEach((team, index) => {
        console.log(`Team ${index + 1}:`, team);
    });
    console.log('=== END DEBUG INFO ===');
    return teams;
};

// Debug function to clear all notifications
window.clearNotifications = function() {
    const notifications = document.querySelectorAll('.fixed.top-4.right-4, .fixed.top-4, .notification, [class*="notification"]');
    console.log('Found notifications:', notifications.length);
    notifications.forEach((notif, index) => {
        console.log(`Removing notification ${index + 1}:`, notif);
        notif.remove();
    });
    showNotification('Notifications cleared', 'success');
};

// Debug function to create team without duplicate check
window.forceCreateTeam = function(teamName, description = 'Test team', color = '#ff6600') {
    console.log('FORCE CREATING TEAM:', teamName);
    const newTeam = {
        id: Date.now(),
        name: teamName,
        description: description,
        color: color,
        members: [],
        createdAt: new Date().toISOString(),
        weekendRotationIndex: 0
    };
    
    // Re-read teams first
    const storedTeams = localStorage.getItem('timeplanner_teams');
    if (storedTeams) {
        teams = JSON.parse(storedTeams);
    } else {
        teams = [];
    }
    
    teams.push(newTeam);
    localStorage.setItem('timeplanner_teams', JSON.stringify(teams));
    displayTeams();
    showNotification(`Team "${teamName}" force created!`, 'success');
    return newTeam;
};

// Populate schedule form with existing data
function populateScheduleForm(schedule) {
    if (schedule.start_date) {
        document.getElementById('startDate').value = schedule.start_date;
    }
    if (schedule.end_date) {
        document.getElementById('endDate').value = schedule.end_date;
    }
    
    const weeklySchedule = schedule.weekly_schedule || {};
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    days.forEach((day, index) => {
        const dayData = weeklySchedule[day];
        if (dayData && typeof dayData === 'object') {
            const checkbox = document.getElementById(`day${index}`);
            const activityType = document.getElementById(`activityType${index}`);
            const hoursCount = document.getElementById(`hoursCount${index}`);
            const startTime = document.getElementById(`startTime${index}`);
            const endTime = document.getElementById(`endTime${index}`);
            const isNightShift = document.getElementById(`isNightShift${index}`);
            
            if (checkbox) checkbox.checked = true;
            if (activityType) activityType.value = dayData.activity_type || '';
            if (hoursCount) hoursCount.value = dayData.hours || 0;
            if (startTime) startTime.value = dayData.start_time || '';
            if (endTime) endTime.value = dayData.end_time || '';
            if (isNightShift) isNightShift.checked = dayData.is_night_shift || false;
            
            // Trigger change events to update form
            if (checkbox) checkbox.dispatchEvent(new Event('change'));
            if (activityType) activityType.dispatchEvent(new Event('change'));
        }
    });
}

// Function to handle unavailability toggle in schedule modal
function initializeUnavailabilityToggle() {
    const toggleCheckbox = document.getElementById('enableUnavailability');
    const unavailabilityFields = document.getElementById('unavailabilityFields');
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    
    if (toggleCheckbox && unavailabilityFields) {
        toggleCheckbox.addEventListener('change', function() {
            if (this.checked) {
                unavailabilityFields.classList.remove('hidden');
                // Add visual feedback to main date pickers
                if (startDateInput && endDateInput) {
                    startDateInput.style.borderColor = '#ef4444'; // red-500
                    endDateInput.style.borderColor = '#ef4444';
                    startDateInput.style.boxShadow = '0 0 0 1px #ef4444';
                    endDateInput.style.boxShadow = '0 0 0 1px #ef4444';
                }
                // Update the description text ONLY in the schedule modal
                const scheduleModal = document.getElementById('addScheduleModal');
                if (scheduleModal && !scheduleModal.classList.contains('hidden')) {
                    const descriptionText = scheduleModal.querySelector('.text-gray-400.text-sm');
                    if (descriptionText) {
                        descriptionText.innerHTML = '<i class="fa-solid fa-info-circle mr-1"></i>Ces dates définissent la période d\'indisponibilité (remplace l\'horaire normal)';
                        descriptionText.classList.remove('text-gray-400');
                        descriptionText.classList.add('text-red-300');
                    }
                }
            } else {
                unavailabilityFields.classList.add('hidden');
                // Remove visual feedback from main date pickers
                if (startDateInput && endDateInput) {
                    startDateInput.style.borderColor = '';
                    endDateInput.style.borderColor = '';
                    startDateInput.style.boxShadow = '';
                    endDateInput.style.boxShadow = '';
                }
                // Restore original description text ONLY in the schedule modal
                const scheduleModal = document.getElementById('addScheduleModal');
                if (scheduleModal && !scheduleModal.classList.contains('hidden')) {
                    const descriptionText = scheduleModal.querySelector('.text-red-300.text-sm, .text-gray-400.text-sm');
                    if (descriptionText) {
                        descriptionText.innerHTML = '<i class="fa-solid fa-info-circle mr-1"></i>L\'horaire sera répété chaque semaine durant cette période';
                        descriptionText.classList.remove('text-red-300');
                        descriptionText.classList.add('text-gray-400');
                    }
                }
                // Clear the fields when disabled
                document.getElementById('unavailabilityType').value = '';
            }
        });
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    initializeUnavailabilityToggle();
});

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

// Phone number formatting function
function formatPhoneNumber(event) {
    const input = event.target;
    let value = input.value.replace(/\D/g, ''); // Remove all non-digits
    
    if (value.length >= 6) {
        value = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6, 10)}`;
    } else if (value.length >= 3) {
        value = `(${value.slice(0, 3)}) ${value.slice(3)}`;
    } else if (value.length > 0) {
        value = `(${value}`;
    }
    
    input.value = value;
}
