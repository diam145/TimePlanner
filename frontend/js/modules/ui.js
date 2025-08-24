// UI utilities and notification functions

// Utility function to show notifications
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg text-white font-medium z-50 transition-all transform translate-x-full`;
    
    if (type === 'success') {
        notification.classList.add('bg-green-600');
    } else if (type === 'error') {
        notification.classList.add('bg-red-600');
    } else {
        notification.classList.add('bg-blue-600');
    }
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Custom confirmation dialog function
function showConfirmDialog(title, message, iconClass = 'fa-question-circle', buttonText = 'Confirmer', buttonClass = 'bg-blue-600 hover:bg-blue-700') {
    console.log('showConfirmDialog called with:', { title, message, iconClass, buttonText, buttonClass });
    
    return new Promise((resolve) => {
        const modal = document.getElementById('confirmationModal');
        const titleElement = document.getElementById('confirmTitle');
        const messageElement = document.getElementById('confirmMessage');
        const iconElement = document.getElementById('confirmIcon');
        const okButton = document.getElementById('confirmOk');
        const cancelButton = document.getElementById('confirmCancel');

        console.log('Modal elements:', { modal, titleElement, messageElement, iconElement, okButton, cancelButton });

        // Set modal content
        titleElement.textContent = title;
        messageElement.textContent = message;
        iconElement.className = `fa-solid ${iconClass} text-2xl text-white`;
        okButton.textContent = buttonText;
        okButton.className = `px-4 py-2 ${buttonClass} text-white rounded-lg transition-colors`;

        // Show modal
        modal.classList.remove('hidden');
        console.log('Modal shown');

        // Handle button clicks
        const handleOk = () => {
            console.log('OK button clicked');
            modal.classList.add('hidden');
            okButton.removeEventListener('click', handleOk);
            cancelButton.removeEventListener('click', handleCancel);
            resolve(true);
        };

        const handleCancel = () => {
            console.log('Cancel button clicked');
            modal.classList.add('hidden');
            okButton.removeEventListener('click', handleOk);
            cancelButton.removeEventListener('click', handleCancel);
            resolve(false);
        };

        okButton.addEventListener('click', handleOk);
        cancelButton.addEventListener('click', handleCancel);
    });
}

// Make functions globally available
window.showNotification = showNotification;
window.showConfirmDialog = showConfirmDialog;

export { showNotification, showConfirmDialog };
