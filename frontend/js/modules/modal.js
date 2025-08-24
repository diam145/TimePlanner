// Modal management functions

// Modal management functions
function closeAddScheduleModal() {
    const modal = document.getElementById('addScheduleModal');
    const modalContent = modal.querySelector('.bg-gray-800');
    
    modalContent.classList.remove('modal-enter');
    modal.classList.remove('modal-backdrop');
    modal.classList.add('hidden');
}

function closeEmployeeCalendarModal() {
    document.getElementById('employeeCalendarModal').classList.add('hidden');
}

function closeDayScheduleModal() {
    document.getElementById('dayScheduleModal').classList.add('hidden');
}

function closeEditEmployeeModal() {
    document.getElementById('editEmployeeModal').classList.add('hidden');
}

// Make functions globally available
window.closeAddScheduleModal = closeAddScheduleModal;
window.closeEmployeeCalendarModal = closeEmployeeCalendarModal;
window.closeDayScheduleModal = closeDayScheduleModal;
window.closeEditEmployeeModal = closeEditEmployeeModal;

export { closeAddScheduleModal, closeEmployeeCalendarModal, closeDayScheduleModal, closeEditEmployeeModal };
