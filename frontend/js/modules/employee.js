// Employee management functions
import { showNotification } from './ui.js';
import { loadEmployees } from './data.js';
import { openEmployeeCalendar } from './calendar.js';
import { generateWeeklyScheduleForm, validateShiftTimes } from './schedule.js';

// Global functions for button actions
function addEmployeeSchedule(employeeId) {
    const modal = document.getElementById('addScheduleModal');
    const modalContent = modal.querySelector('.bg-gray-800');
    
    document.getElementById('employeeId').value = employeeId;
    
    // Reset shift counters for weekly schedule
    const weeklyShiftCounters = [1, 1, 1, 1, 1, 1, 1];
    
    // Set default dates and allow today's date to be pickable
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    
    // Allow today's date to be pickable (don't restrict past dates as today is valid)
    startDateInput.min = todayString;
    endDateInput.min = todayString;
    
    // Set default values
    startDateInput.value = todayString;
    endDateInput.value = nextWeek;
    
    // Add event listeners to ensure end date is always after start date
    startDateInput.addEventListener('change', function() {
        endDateInput.min = this.value;
        if (endDateInput.value < this.value) {
            endDateInput.value = this.value;
        }
    });
    
    // Validate time inputs when changed
    function validateTimeInputs(dayIndex) {
        const startTime = document.getElementById(`startTime${dayIndex}`);
        const endTime = document.getElementById(`endTime${dayIndex}`);
        const isNightShift = document.getElementById(`isNightShift${dayIndex}`);
        const activityType = document.getElementById(`activityType${dayIndex}`);
        
        if (startTime && endTime && isNightShift) {
            startTime.addEventListener('change', () => validateShiftTimes(dayIndex));
            endTime.addEventListener('change', () => validateShiftTimes(dayIndex));
            isNightShift.addEventListener('change', () => {
                updateNightShiftInfo(dayIndex);
                validateShiftTimes(dayIndex);
            });
            activityType.addEventListener('change', () => updateActivityTypeInfo(dayIndex));
        }
    }
    
    // Add validation for all days after generating the form
    setTimeout(() => {
        for (let i = 0; i < 7; i++) {
            validateTimeInputs(i);
        }
    }, 100);
    
    // Generate weekly schedule form
    generateWeeklyScheduleForm();
    
    modal.classList.remove('hidden');
    modal.classList.add('modal-backdrop');
    
    // Add animation class
    setTimeout(() => {
        modalContent.classList.add('modal-enter');
    }, 10);
}

function modifyScheduleName(employeeName) {
    // Find employee ID by name (assuming we have access to the data)
    fetch('http://127.0.0.1:5001/api/workers')
        .then(response => response.json())
        .then(data => {
            const employee = data.find(worker => worker.name === employeeName);
            if (employee) {
                openEmployeeCalendar(employee.id, employee.name);
            }
        })
        .catch(error => {
            console.error('Error finding employee:', error);
            showNotification('Erreur lors de la recherche de l\'employé', 'error');
        });
}

function modifyEmployee(employeeId) {
    // Fetch employee data and open edit modal
    fetch('http://127.0.0.1:5001/api/workers')
        .then(response => response.json())
        .then(data => {
            const employee = data.find(worker => worker.id === employeeId);
            if (employee) {
                document.getElementById('editEmployeeId').value = employee.id;
                document.getElementById('editEmployeeName').value = employee.name;
                document.getElementById('editEmployeeStatus').value = employee.status;
                document.getElementById('editEmployeeModal').classList.remove('hidden');
            }
        })
        .catch(error => {
            console.error('Error fetching employee:', error);
            showNotification('Erreur lors du chargement des données employé', 'error');
        });
}

function deleteEmployee(employeeId) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet employé?')) {
        fetch(`http://127.0.0.1:5001/api/workers/${employeeId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                showNotification('Erreur: ' + data.error, 'error');
            } else {
                showNotification('Employé supprimé avec succès', 'success');
                loadEmployees(); // Reload the table
            }
        })
        .catch(error => {
            console.error('Error deleting employee:', error);
            showNotification('Erreur lors de la suppression', 'error');
        });
    }
}

// Modify employee schedule from schedule table
function modifyEmployeeSchedule(employeeName) {
    // Find employee ID by name and open calendar modal
    fetch('http://127.0.0.1:5001/api/workers')
        .then(response => response.json())
        .then(data => {
            const employee = data.find(worker => worker.name === employeeName);
            if (employee) {
                openEmployeeCalendar(employee.id, employee.name);
            } else {
                showNotification('Employé non trouvé', 'error');
            }
        })
        .catch(error => {
            console.error('Error finding employee:', error);
            showNotification('Erreur lors de la recherche de l\'employé', 'error');
        });
}

// Make functions globally available
window.addEmployeeSchedule = addEmployeeSchedule;
window.modifyScheduleName = modifyScheduleName;
window.modifyEmployee = modifyEmployee;
window.deleteEmployee = deleteEmployee;
window.modifyEmployeeSchedule = modifyEmployeeSchedule;

export { addEmployeeSchedule, modifyScheduleName, modifyEmployee, deleteEmployee, modifyEmployeeSchedule };
