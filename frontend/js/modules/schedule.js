// Schedule management and form handling
import { showNotification } from './ui.js';
import { loadSchedules } from './data.js';
import { openEmployeeCalendar } from './calendar.js';

// Missing global variables for schedule management
let weeklyShiftCounters = [1, 1, 1, 1, 1, 1, 1];

// Generate weekly schedule form function
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
                        <select id="activityType${index}" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
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
                        <input type="number" id="hoursCount${index}" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500" value="8" min="0" step="0.5">
                    </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-1">Début</label>
                        <input type="time" id="startTime${index}" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500" value="00:00">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-1">Fin</label>
                        <input type="time" id="endTime${index}" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500" value="23:59">
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

// Toggle day inputs function
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

// Update night shift info function
function updateNightShiftInfo(dayIndex) {
    const nightShiftCheckbox = document.getElementById(`isNightShift${dayIndex}`);
    const nightShiftInfo = document.getElementById(`nightShiftInfo${dayIndex}`);
    
    if (nightShiftCheckbox.checked) {
        nightShiftInfo.style.display = 'block';
    } else {
        nightShiftInfo.style.display = 'none';
    }
}

// Update activity type info function
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

// Validate shift times function
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

// Make schedule functions globally available
window.generateWeeklyScheduleForm = generateWeeklyScheduleForm;
window.toggleDayInputs = toggleDayInputs;
window.updateNightShiftInfo = updateNightShiftInfo;
window.updateActivityTypeInfo = updateActivityTypeInfo;
window.validateShiftTimes = validateShiftTimes;

export { generateWeeklyScheduleForm, toggleDayInputs, updateNightShiftInfo, updateActivityTypeInfo, validateShiftTimes };
