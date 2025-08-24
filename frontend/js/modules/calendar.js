// Calendar functionality and date utilities

// Calendar navigation variables
let currentCalendarMonth = new Date().getMonth();
let currentCalendarYear = new Date().getFullYear();
let currentCalendarEmployeeId = null;
let currentCalendarEmployeeName = null;

function updateWeekHeaders() {
    const weekSelector = document.getElementById('weekSelector');
    const selectedDate = weekSelector ? weekSelector.value : '2025-07-13';
    
    // Parse the date carefully to avoid timezone issues
    const dateParts = selectedDate.split('-');
    const year = parseInt(dateParts[0]);
    const month = parseInt(dateParts[1]) - 1; // JavaScript months are 0-based
    const day = parseInt(dateParts[2]);
    const date = new Date(year, month, day);
    
    // Find the Sunday of that week (start of week)
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
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

// Calendar navigation functions
function previousMonth() {
    currentCalendarMonth--;
    if (currentCalendarMonth < 0) {
        currentCalendarMonth = 11;
        currentCalendarYear--;
    }
    if (currentCalendarEmployeeId && currentCalendarEmployeeName) {
        generateEmployeeCalendar(currentCalendarEmployeeId, currentCalendarEmployeeName);
    }
}

function nextMonth() {
    currentCalendarMonth++;
    if (currentCalendarMonth > 11) {
        currentCalendarMonth = 0;
        currentCalendarYear++;
    }
    if (currentCalendarEmployeeId && currentCalendarEmployeeName) {
        generateEmployeeCalendar(currentCalendarEmployeeId, currentCalendarEmployeeName);
    }
}

// Open employee calendar function
function openEmployeeCalendar(employeeId, employeeName) {
    const modal = document.getElementById('employeeCalendarModal');
    const modalTitle = document.getElementById('employeeNameCalendar');
    const calendarContainer = document.getElementById('calendarDays');
    
    if (!modal) {
        console.error('Employee calendar modal not found');
        return;
    }
    
    if (!modalTitle) {
        console.error('Employee name calendar element not found');
        return;
    }
    
    if (!calendarContainer) {
        console.error('Calendar container not found');
        return;
    }
    
    // Set global variables for navigation
    currentCalendarEmployeeId = employeeId;
    currentCalendarEmployeeName = employeeName;
    currentCalendarMonth = new Date().getMonth();
    currentCalendarYear = new Date().getFullYear();
    
    // Set employee name in modal title
    modalTitle.textContent = employeeName;
    
    // Generate calendar for the current month
    generateEmployeeCalendar(employeeId, employeeName);
    
    // Show modal
    modal.classList.remove('hidden');
}

// Generate employee calendar
function generateEmployeeCalendar(employeeId, employeeName) {
    const container = document.getElementById('calendarDays');
    if (!container) return;
    
    // Store current employee info for navigation
    currentCalendarEmployeeId = employeeId;
    currentCalendarEmployeeName = employeeName;
    
    // Clear existing calendar
    container.innerHTML = '';
    
    // Use current calendar month/year (for navigation) or current date
    const currentMonth = currentCalendarMonth;
    const currentYear = currentCalendarYear;
    
    // Update month/year display
    const monthYearElement = document.getElementById('currentMonthYear');
    if (monthYearElement) {
        const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                           'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
        monthYearElement.textContent = `${monthNames[currentMonth]} ${currentYear}`;
    }
    
    // Generate calendar days
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    // Generate 42 days (6 weeks)
    for (let i = 0; i < 42; i++) {
        const dayDate = new Date(startDate);
        dayDate.setDate(startDate.getDate() + i);
        
        const dayElement = document.createElement('div');
        dayElement.className = 'bg-gray-600 border border-gray-500 p-2 min-h-[80px] cursor-pointer hover:bg-gray-500 transition-colors relative';
        
        const dayNumber = document.createElement('div');
        dayNumber.className = 'text-sm font-medium text-white mb-1';
        dayNumber.textContent = dayDate.getDate();
        
        // Add some sample schedule data (you can replace this with actual data later)
        const scheduleIndicator = document.createElement('div');
        scheduleIndicator.className = 'text-xs text-center mt-2';
        
        const isCurrentMonth = dayDate.getMonth() === currentMonth;
        if (!isCurrentMonth) {
            dayElement.classList.add('opacity-50');
        } else {
            // Add some sample schedule indicators for current month days
            const dayOfWeek = dayDate.getDay();
            if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Monday to Friday
                scheduleIndicator.innerHTML = '<span class="bg-green-600 text-white px-1 py-0.5 rounded text-xs">X</span>';
            } else if (dayOfWeek === 6) { // Saturday
                scheduleIndicator.innerHTML = '<span class="bg-purple-600 text-white px-1 py-0.5 rounded text-xs">S</span>';
            } else { // Sunday
                scheduleIndicator.innerHTML = '<span class="bg-red-600 text-white px-1 py-0.5 rounded text-xs">R</span>';
            }
        }
        
        dayElement.appendChild(dayNumber);
        dayElement.appendChild(scheduleIndicator);
        
        // Add click handler for day selection
        dayElement.addEventListener('click', () => {
            if (isCurrentMonth) {
                openDaySchedule(dayDate.getDate(), currentMonth + 1, currentYear, employeeName);
            }
        });
        
        container.appendChild(dayElement);
    }
}

// Open day schedule function
function openDaySchedule(day, month, year, employeeName) {
    const modal = document.getElementById('dayScheduleModal');
    const modalTitle = document.getElementById('dayScheduleTitle');
    
    if (!modal || !modalTitle) {
        console.error('Day schedule modal elements not found');
        return;
    }
    
    const formattedDate = `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
    modalTitle.textContent = `Horaire du ${formattedDate} - ${employeeName}`;
    
    // You can add more content here for the day schedule
    
    modal.classList.remove('hidden');
}

// Make functions globally available
window.previousMonth = previousMonth;
window.nextMonth = nextMonth;
window.openEmployeeCalendar = openEmployeeCalendar;
window.generateEmployeeCalendar = generateEmployeeCalendar;

export { updateWeekHeaders, openEmployeeCalendar, generateEmployeeCalendar, previousMonth, nextMonth };
