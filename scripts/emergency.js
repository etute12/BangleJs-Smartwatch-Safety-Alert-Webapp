// emergency.js - IMPROVED VERSION
// Sendchamp SMS functionality for emergency alerts
document.addEventListener('DOMContentLoaded', function() {
    console.log('Emergency.js loaded and DOM ready');
    
    // Add emergency alert button to the UI
    addEmergencyAlertButton();
    
    // Create emergency alert modal
    createEmergencyAlertModal();
    
    // Create emergency banner and modal
    createEmergencyElements();
    
    console.log('Emergency elements created');
});

// Function to create emergency banner and modal
function createEmergencyElements() {
    console.log('Creating emergency elements...');
    
    // Create emergency banner if not exists
    if (!document.getElementById('emergencyBanner')) {
        const banner = document.createElement('div');
        banner.id = 'emergencyBanner';
        banner.className = 'fixed top-0 left-0 w-full bg-red-600 text-white text-center py-4 hidden z-50';
        banner.innerHTML = '<strong>🚨 EMERGENCY ALERT</strong>: Abnormal health readings detected!';
        document.body.appendChild(banner);
        console.log('Emergency banner created');
    }
    
    // Create emergency modal if not exists
    if (!document.getElementById('emergencyModal')) {
        const modal = document.createElement('div');
        modal.id = 'emergencyModal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center hidden z-50';
        modal.innerHTML = `
            <div class="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
                <h3 class="text-xl font-bold mb-4 text-red-600">🚨 Emergency Alert</h3>
                <p>Abnormal health readings detected. Emergency contacts are being notified.</p>
                <div id="emergencyMetricsDisplay" class="my-4 p-3 bg-gray-100 rounded"></div>
                <button id="dismissEmergency" class="px-4 py-2 bg-gray-300 rounded mt-4">Dismiss Alert</button>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Add event listener for dismiss button
        document.getElementById('dismissEmergency').addEventListener('click', function() {
            document.getElementById('emergencyModal').classList.add('hidden');
            document.getElementById('emergencyBanner').classList.add('hidden');
        });
        
        console.log('Emergency modal created');
    }
    
    // Create audio element if not exists
    if (!document.getElementById('alertSound')) {
        const audio = document.createElement('audio');
        audio.id = 'alertSound';
        audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmocDkOL0fPTgjMGHm7A7+OZURE'; // Simple beep sound
        audio.preload = 'auto';
        document.body.appendChild(audio);
        console.log('Alert sound created');
    }
}

// Function to send SMS using Sendchamp API
function sendSMS(phoneNumbers, message, callback) {
    console.log('📱 Attempting to send SMS to:', phoneNumbers);
    console.log('📱 Message:', message);
    
    // Replace with your actual Sendchamp API key
    const apiKey = 'sendchamp_live_$2a$10$DoRUHJ.jZHGHYt502WlCcuQ91VzB8ClBeUZQ9TujekbQnLdb6GNS.';
    
    // Validate inputs
    if (!phoneNumbers || phoneNumbers.length === 0) {
        console.error('No phone numbers provided');
        if (callback) callback(false, 'No phone numbers provided');
        return;
    }
    
    if (!message || message.trim() === '') {
        console.error('No message provided');
        if (callback) callback(false, 'No message provided');
        return;
    }
    
    // Format phone numbers for Sendchamp API (ensure they have country code)
    const formattedNumbers = phoneNumbers.map(number => {
        // Remove any spaces, dashes, or parentheses
        const cleanNumber = number.replace(/[\s\-\(\)]/g, '');
        
        // If number doesn't start with '+', add Nigeria's code as default
        if (!cleanNumber.startsWith('+')) {
            return cleanNumber.startsWith('0') ? '+234' + cleanNumber.substring(1) : '+234' + cleanNumber;
        }
        return cleanNumber;
    });
    
    console.log('📱 Formatted numbers:', formattedNumbers);
    
    // Prepare the API request
    const requestBody = {
        to: formattedNumbers,
        message: message,
        sender_name: 'SChamp', // Changed to a more descriptive sender name
        route: 'dnd' // Use DND route for emergency messages
    };
    
    console.log('📱 Request body:', requestBody);
    
    fetch('https://api.sendchamp.com/api/v1/sms/send', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
    })
    .then(response => {
        console.log('📱 SMS API Response status:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('📱 SMS sent successfully:', data);
        if (callback) callback(true, data);
    })
    .catch(error => {
        console.error('📱 Error sending SMS:', error);
        if (callback) callback(false, error);
    });
}

// Function to handle emergency alerts
function sendEmergencyAlert(message, contactTypes = ['caregiver', 'medical'], metricsData = null) {
    console.log('🚨 sendEmergencyAlert called with:', { message, contactTypes, metricsData });
    
    // Get all contacts from localStorage
    let contacts;
    try {
        contacts = JSON.parse(localStorage.getItem('emergencyContacts')) || [];
        console.log('📞 Retrieved contacts from localStorage:', contacts);
    } catch (error) {
        console.error('Error parsing emergency contacts from localStorage:', error);
        showAlert('Error retrieving emergency contacts', 'error');
        return;
    }
    
    // Filter contacts by type if specified
    const filteredContacts = contacts.filter(contact => 
        contactTypes.includes(contact.type)
    );
    
    console.log('📞 Filtered contacts:', filteredContacts);
    
    if (filteredContacts.length === 0) {
        console.warn('No emergency contacts found for types:', contactTypes);
        showAlert('No emergency contacts found for the specified types', 'error');
        return;
    }
    
    // Extract phone numbers - more robust extraction
    const phoneNumbers = filteredContacts
        .map(contact => contact.phone || contact.phoneNumber || contact.number)
        .filter(phone => phone && phone.trim() !== '');
    
    console.log('📞 Extracted phone numbers:', phoneNumbers);
    
    if (phoneNumbers.length === 0) {
        console.warn('No valid phone numbers found in contacts');
        showAlert('No valid phone numbers found in emergency contacts', 'error');
        return;
    }
    
    // Build message with metrics data if available
    let enhancedMessage = message;
    if (metricsData) {
        enhancedMessage += '\n\nHealth Metrics:';
        if (metricsData.heartRate) {
            enhancedMessage += `\n- Heart Rate: ${metricsData.heartRate} bpm`;
        }
        if (metricsData.temp) {
            enhancedMessage += `\n- Temperature: ${parseFloat(metricsData.temp).toFixed(1)}°C`;
        }
        
        // Update metrics display in modal
        const metricsDisplay = document.getElementById('emergencyMetricsDisplay');
        if (metricsDisplay) {
            let metricsHTML = '<strong>Critical Readings:</strong><ul>';
            if (metricsData.heartRate) {
                metricsHTML += `<li>Heart Rate: <span class="text-red-600 font-bold">${metricsData.heartRate} bpm</span></li>`;
            }
            if (metricsData.temp) {
                metricsHTML += `<li>Temperature: <span class="text-red-600 font-bold">${parseFloat(metricsData.temp).toFixed(1)}°C</span></li>`;
            }
            metricsHTML += '</ul>';
            metricsDisplay.innerHTML = metricsHTML;
        }
    }
    
    // Add timestamp and location to message
    const timestamp = new Date().toLocaleString();
    enhancedMessage += `\n\nTime: ${timestamp}`;
    enhancedMessage += `\nLocation: https://maps.app.goo.gl/G45Js48qmYkdaWFe6?g_st=atm`;
    
    console.log('📱 Final message to send:', enhancedMessage);
    
    // Send the SMS
    sendSMS(phoneNumbers, enhancedMessage, function(success, response) {
        if (success) {
            console.log('✅ Emergency alerts sent successfully');
            showAlert(`Emergency alerts sent to ${phoneNumbers.length} contact(s)`, 'success');
        } else {
            console.error('❌ Failed to send emergency alerts:', response);
            showAlert('Failed to send some or all emergency alerts', 'error');
        }
    });
}

// Function to show alerts to the user
function showAlert(message, type = 'info') {
    console.log(`Alert (${type}):`, message);
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} fixed top-4 right-4 p-4 rounded shadow-lg z-50`;
    
    // Set background color based on type
    if (type === 'success') {
        alertDiv.style.backgroundColor = '#4CAF50';
    } else if (type === 'error') {
        alertDiv.style.backgroundColor = '#F44336';
    } else {
        alertDiv.style.backgroundColor = '#2196F3';
    }
    
    alertDiv.style.color = 'white';
    alertDiv.style.maxWidth = '300px';
    alertDiv.textContent = message;
    
    document.body.appendChild(alertDiv);
    
    // Remove the alert after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

// Function to create the emergency alert modal
function createEmergencyAlertModal() {
    const modalHTML = `
        <div id="emergencyAlertOverlay" class="fixed inset-0 bg-black bg-opacity-50 z-50 hidden flex items-center justify-center">
            <div id="emergencyAlertModal" class="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
                <h3 class="text-xl font-bold mb-4 text-red-600">🚨 Send Emergency Alert</h3>
                <div class="mb-4">
                    <label class="block text-gray-700 mb-2">Alert Message:</label>
                    <textarea id="emergencyMessage" class="w-full p-2 border rounded" rows="4" 
                        placeholder="Enter your emergency message here...">EMERGENCY ALERT: Medical assistance needed. Please respond ASAP.</textarea>
                </div>
                <div class="mb-4">
                    <div class="flex items-center">
                        <input type="checkbox" id="alertCaregivers" checked class="mr-2">
                        <label>Send to Caregivers</label>
                    </div>
                    <div class="flex items-center mt-2">
                        <input type="checkbox" id="alertMedical" checked class="mr-2">
                        <label>Send to Medical Professionals</label>
                    </div>
                </div>
                <div class="flex justify-end gap-2">
                    <button id="cancelAlert" class="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Cancel</button>
                    <button id="sendAlert" class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Send Alert</button>
                </div>
            </div>
        </div>
    `;
    
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer);
    
    // Add event listeners
    document.getElementById('cancelAlert').addEventListener('click', hideEmergencyAlertModal);
    document.getElementById('sendAlert').addEventListener('click', function() {
        const message = document.getElementById('emergencyMessage').value;
        const types = [];
        
        if (document.getElementById('alertCaregivers').checked) types.push('caregiver');
        if (document.getElementById('alertMedical').checked) types.push('medical');
        
        if (types.length === 0) {
            showAlert('Please select at least one contact type', 'error');
            return;
        }
        
        if (!message.trim()) {
            showAlert('Please enter a message', 'error');
            return;
        }
        
        sendEmergencyAlert(message, types);
        hideEmergencyAlertModal();
    });
}

// Function to show the emergency alert modal
function showEmergencyAlertModal() {
    const overlay = document.getElementById('emergencyAlertOverlay');
    if (overlay) {
        overlay.classList.remove('hidden');
    }
}

// Function to hide the emergency alert modal
function hideEmergencyAlertModal() {
    const overlay = document.getElementById('emergencyAlertOverlay');
    if (overlay) {
        overlay.classList.add('hidden');
    }
}

// Function to add an emergency alert button to the UI
function addEmergencyAlertButton() {
    // Check if button already exists
    if (document.getElementById('emergencyAlertButton')) {
        return;
    }
    
    const emergencyButton = document.createElement('button');
    emergencyButton.id = 'emergencyAlertButton';
    emergencyButton.className = 'fixed bottom-4 right-4 bg-red-600 text-white px-6 py-3 rounded-full shadow-lg hover:bg-red-700 transition-colors z-40';
    emergencyButton.innerHTML = '🚨 Send Alert';
    emergencyButton.onclick = showEmergencyAlertModal;
    
    document.body.appendChild(emergencyButton);
}

// Make functions available globally
window.sendEmergencyAlert = sendEmergencyAlert;
window.createEmergencyElements = createEmergencyElements;