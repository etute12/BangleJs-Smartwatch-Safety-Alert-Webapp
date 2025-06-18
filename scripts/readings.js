// readings.js - CLEANED VERSION
let emergencyActive = false;
let currentCaregiver = 0;
let emergencyTimeout;
const decoder = new TextDecoder();
let buffer = "";
let logs = []; // Log storage array

function logData(metric, value, status = 'normal') {
    const timestamp = new Date().toLocaleString();
    const logEntry = {
        timestamp,
        metric,
        value,
        status
    };
    
    logs.push(logEntry);
    
    // Add to table
    const logsBody = document.getElementById('logsBody');
    if (logsBody) {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td class="px-4 py-3">${timestamp}</td>
            <td class="px-4 py-3">${metric}</td>
            <td class="px-4 py-3">${value}</td>
            <td class="px-4 py-3">
                <span class="px-2 py-1 rounded-full ${status === 'emergency' ? 
                    'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-500' : 
                    'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-500'}">
                    ${status}
                </span>
            </td>
        `;
        
        logsBody.prepend(row); // Add new entries at the top
    }
}

function clearLogs() {
    logs = [];
    const logsBody = document.getElementById('logsBody');
    if (logsBody) {
        logsBody.innerHTML = '';
    }
}

function debugEmergencyState(data) {
    console.log('=== Emergency Debug ===');
    console.log('Heart Rate:', data.heartRate);
    console.log('Temperature:', data.temp);
    console.log('Emergency Active:', emergencyActive);
    console.log('Emergency function available:', typeof window.sendEmergencyAlert);
    console.log('Emergency banner exists:', !!document.getElementById("emergencyBanner"));
    console.log('Emergency modal exists:', !!document.getElementById("emergencyModal"));
    
    // Check thresholds
    const hrEmergency = data.heartRate > 120;
    const tempEmergency = data.temp > 38.5;
    console.log('HR Emergency:', hrEmergency);
    console.log('Temp Emergency:', tempEmergency);
    console.log('Should trigger emergency:', hrEmergency || tempEmergency);
    console.log('========================');
}

const updateUI = (data) => {
    debugEmergencyState(data); // Debug logging
    
    // Check if emergency.js functions are available
    if (typeof window.sendEmergencyAlert !== 'function') {
        console.error('Emergency alert functions not loaded');
        return;
    }

    const emergencyBanner = document.getElementById("emergencyBanner");
    const alertSound = document.getElementById("alertSound");

    let emergencyTriggered = false;
    let emergencyMetrics = {};

    // Heart Rate Check and Log
    const hrElem = document.getElementById("hr");
    if (typeof data.heartRate === "number" && data.heartRate > 0) {
        const hrValue = data.heartRate;
        hrElem.textContent = `${hrValue} bpm`;
        emergencyMetrics.heartRate = hrValue;
        
        const hrStatus = hrValue > 120 ? 'emergency' : 'normal';
        logData('Heart Rate', `${hrValue} bpm`, hrStatus);
        
        if (hrValue > 120) {
            hrElem.parentElement.style.backgroundColor = "#ffcccc";
            hrElem.parentElement.style.border = "2px solid red";
            emergencyTriggered = true;
            console.log('🚨 Heart Rate Emergency Triggered:', hrValue);
        } else {
            hrElem.parentElement.style.backgroundColor = "";
            hrElem.parentElement.style.border = "";
        }
    } else {
        hrElem.textContent = "No data";
    }

    // Temperature Check and Log
    const tempElem = document.getElementById("temp");
    if (typeof data.temp === "number") {
        const tempValue = parseFloat(data.temp);
        tempElem.textContent = `${tempValue.toFixed(1)} °C`;
        emergencyMetrics.temp = tempValue;
        
        const tempStatus = tempValue > 38.5 ? 'emergency' : 'normal';
        logData('Temperature', `${tempValue.toFixed(1)}°C`, tempStatus);
        
        if (tempValue > 38.5) {
            tempElem.parentElement.style.backgroundColor = "#ffe0b2";
            tempElem.parentElement.style.border = "2px solid orange";
            emergencyTriggered = true;
            console.log('🚨 Temperature Emergency Triggered:', tempValue);
        } else {
            tempElem.parentElement.style.backgroundColor = "";
            tempElem.parentElement.style.border = "";
        }
    }

    // Accelerometer Log 
    const accel = data.accel ?? {};
    if (accel.x !== undefined) {
        const accelValue = `x: ${accel.x?.toFixed(2)}, y: ${accel.y?.toFixed(2)}, z: ${accel.z?.toFixed(2)}`;
        const accelElem = document.getElementById("accel");
        if (accelElem) {
            accelElem.textContent = accelValue;
        }
        logData('Accelerometer', accelValue);
    }

    // Magnetometer Log 
    const mag = data.mag ?? {};
    if (mag.x !== undefined) {
        const magValue = `x: ${mag.x}, y: ${mag.y}, z: ${mag.z}`;
        const magElem = document.getElementById("mag");
        if (magElem) {
            magElem.textContent = magValue;
        }
        logData('Magnetometer', magValue);
    }

    // 🚨 Emergency Display and SMS
    if (emergencyTriggered && !emergencyActive) {
        console.log('🚨 TRIGGERING EMERGENCY ALERT');
        emergencyActive = true;
        
        // Create emergency elements if they don't exist
        if (!emergencyBanner) {
            console.warn('Emergency banner not found, creating elements...');
            if (typeof createEmergencyElements === 'function') {
                createEmergencyElements();
            } else {
                console.error('createEmergencyElements function not available');
            }
        }
        
        // Show emergency UI
        const banner = document.getElementById("emergencyBanner");
        const modal = document.getElementById("emergencyModal");
        
        if (banner) banner.style.display = "block";
        if (modal) modal.style.display = "flex";
        
        if (alertSound && alertSound.paused) {
            alertSound.play().catch(e => console.warn('Could not play alert sound:', e));
        }

        // Send emergency SMS
        console.log('📱 Sending emergency SMS with metrics:', emergencyMetrics);
        try {
            window.sendEmergencyAlert(
                "EMERGENCY ALERT: Abnormal health readings detected. Medical assistance may be needed.",
                ['caregiver', 'medical'],
                emergencyMetrics
            );
            logData('Emergency SMS', 'Alert sent to caregivers', 'emergency');
        } catch (error) {
            console.error('Failed to send emergency alert:', error);
            logData('Emergency SMS', 'Failed to send alert', 'emergency');
        }
    }

    // Clear emergency state when readings return to normal
    if (!emergencyTriggered && emergencyActive) {
        console.log('✅ Emergency cleared - readings normal');
        emergencyActive = false;
        
        const banner = document.getElementById("emergencyBanner");
        const modal = document.getElementById("emergencyModal");
        
        if (banner) banner.style.display = "none";
        if (modal) modal.style.display = "none";
        
        clearTimeout(emergencyTimeout);
        emergencyTimeout = null;
        currentCaregiver = 0;
    }
};

function log(msg) {
    const statusElement = document.getElementById("status");
    if (statusElement) {
        statusElement.textContent = msg;
    } else {
        console.log(msg);
    }
}

async function connect() {
    try {
        const device = await navigator.bluetooth.requestDevice({
            filters: [{ namePrefix: "Bangle" }],
            optionalServices: ["6e400001-b5a3-f393-e0a9-e50e24dcca9e"],
        });

        const server = await device.gatt.connect();
        log("✅ Connected to " + device.name);

        const service = await server.getPrimaryService(
            "6e400001-b5a3-f393-e0a9-e50e24dcca9e"
        );
        const characteristic = await service.getCharacteristic(
            "6e400003-b5a3-f393-e0a9-e50e24dcca9e"
        );

        await characteristic.startNotifications();
        log("📡 Receiving live data...");

        characteristic.addEventListener(
            "characteristicvaluechanged",
            (event) => {
                const value = decoder.decode(event.target.value);
                buffer += value;

                let lines = buffer.split("\n");
                buffer = lines.pop();

                lines.forEach((line) => {
                    line = line.trim();
                    if (line.startsWith("{") && line.endsWith("}")) {
                        try {
                            const json = JSON.parse(line);
                            updateUI(json);
                        } catch (e) {
                            console.warn("JSON parse failed:", line);
                        }
                    }
                });
            }
        );
    } catch (err) {
        log("❌ Error: " + err);
    }
}

// Make functions available globally
window.connect = connect;
window.clearLogs = clearLogs;