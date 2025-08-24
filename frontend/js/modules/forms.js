// Form handling and submission functions
import { showNotification } from './ui.js';
import { loadSchedules } from './data.js';
import { closeAddScheduleModal } from './modal.js';

// Schedule form submission setup
function setupScheduleFormHandler() {
    const addScheduleForm = document.getElementById('addScheduleForm');
    if (addScheduleForm) {
        addScheduleForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const employeeId = formData.get('employeeId');
            const startDate = formData.get('startDate');
            const endDate = formData.get('endDate');
            
            if (!employeeId || !startDate || !endDate) {
                showNotification('Veuillez remplir tous les champs requis', 'error');
                return;
            }
            
            // Collect weekly schedule data
            const weeklySchedule = [];
            for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
                const dayCheckbox = document.getElementById(`day${dayIndex}`);
                if (dayCheckbox && dayCheckbox.checked) {
                    const startTime = document.getElementById(`startTime${dayIndex}`)?.value;
                    const endTime = document.getElementById(`endTime${dayIndex}`)?.value;
                    const activityType = document.getElementById(`activityType${dayIndex}`)?.value;
                    const hoursCount = document.getElementById(`hoursCount${dayIndex}`)?.value;
                    const isNightShift = document.getElementById(`isNightShift${dayIndex}`)?.checked;
                    
                    if (startTime && endTime) {
                        weeklySchedule.push({
                            day: dayIndex,
                            startTime: startTime,
                            endTime: endTime,
                            activityType: activityType || 'X',
                            hours: parseFloat(hoursCount) || 8,
                            isNightShift: isNightShift || false
                        });
                    }
                }
            }
            
            if (weeklySchedule.length === 0) {
                showNotification('Veuillez sélectionner au moins un jour de travail', 'error');
                return;
            }
            
            // Submit the data
            try {
                const response = await fetch('http://127.0.0.1:5001/api/schedules/weekly', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        employeeId: parseInt(employeeId),
                        startDate: startDate,
                        endDate: endDate,
                        weeklySchedule: weeklySchedule
                    })
                });
                
                if (response.ok) {
                    showNotification('Horaire ajouté avec succès', 'success');
                    closeAddScheduleModal();
                    loadSchedules(); // Reload the schedule view
                } else {
                    const error = await response.json();
                    showNotification(error.error || 'Erreur lors de l\'ajout de l\'horaire', 'error');
                }
            } catch (error) {
                console.error('Error submitting schedule:', error);
                showNotification('Erreur de connexion', 'error');
            }
        });
    }
}

// Team color picker synchronization
function setupTeamColorPickers() {
    const teamColorInput = document.getElementById('teamColor');
    const teamColorText = document.getElementById('teamColorText');
    
    if (teamColorInput && teamColorText) {
        teamColorInput.addEventListener('input', (e) => {
            teamColorText.value = e.target.value;
        });
        
        teamColorText.addEventListener('input', (e) => {
            teamColorInput.value = e.target.value;
        });
    }

    // Edit team color picker synchronization
    const editTeamColorInput = document.getElementById('editTeamColor');
    const editTeamColorText = document.getElementById('editTeamColorText');
    
    if (editTeamColorInput && editTeamColorText) {
        editTeamColorInput.addEventListener('input', (e) => {
            editTeamColorText.value = e.target.value;
        });
        
        editTeamColorText.addEventListener('input', (e) => {
            editTeamColorInput.value = e.target.value;
        });
    }
}

export { setupScheduleFormHandler, setupTeamColorPickers };
