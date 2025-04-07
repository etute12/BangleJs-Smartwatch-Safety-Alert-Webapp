// readings.js
let emergencyActive = false;
let currentCaregiver = 0;
let emergencyTimeout;

const decoder = new TextDecoder();
let buffer = "";

const updateUI = (data) => {
    // Check if emergency.js functions are available
    if (typeof window.sendEmergencyAlert !== 'function') {
        console.error('Emergency alert functions not loaded');
        return;
    }

    const emergencyBanner = document.getElementById("emergencyBanner");
    const alertSound = document.getElementById("alertSound");

    let emergencyTriggered = false;
    let emergencyMetrics = {};

    // Heart Rate Check
    const hrElem = document.getElementById("hr");
    if (typeof data.heartRate === "number" && data.heartRate > 0) {
        hrElem.textContent = `${data.heartRate} bpm`;
        emergencyMetrics.heartRate = data.heartRate;
        if (data.heartRate > 120) {
            hrElem.parentElement.style.backgroundColor = "#ffcccc";
            hrElem.parentElement.style.border = "2px solid red";
            emergencyTriggered = true;
        } else {
            hrElem.parentElement.style.backgroundColor = "white";
            hrElem.parentElement.style.border = "none";
        }
    } else {
        hrElem.textContent = "No data";
    }

    // Temperature Check
    const tempElem = document.getElementById("temp");
    if (typeof data.temp === "number") {
        tempElem.textContent = `${data.temp.toFixed(1)} °C`;
        emergencyMetrics.temp = data.temp;
        if (data.temp > 38.5) {
            tempElem.parentElement.style.backgroundColor = "#ffe0b2";
            tempElem.parentElement.style.border = "2px solid orange";
            emergencyTriggered = true;
        } else {
            tempElem.parentElement.style.backgroundColor = "white";
            tempElem.parentElement.style.border = "none";
        }
    }

    // Pressure
    const pressureElem = document.getElementById("pressure");
    if (data.pressure?.pressure) {
        pressureElem.textContent = `${data.pressure.pressure} Pa`;
        emergencyMetrics.pressure = data.pressure;
    } else {
        pressureElem.textContent = "--";
    }

    // Accelerometer
    const accel = data.accel ?? {};
    document.getElementById("accel").textContent = `x: ${accel.x?.toFixed(2)}, y: ${accel.y?.toFixed(2)}, z: ${accel.z?.toFixed(2)}`;

    // Magnetometer
    const mag = data.mag ?? {};
    document.getElementById("mag").textContent = `x: ${mag.x}, y: ${mag.y}, z: ${mag.z}`;

    // 🚨 Emergency Display
    if (emergencyTriggered && !emergencyActive) {
        emergencyActive = true;
        
        // Ensure emergency elements exist
        if (!emergencyBanner) {
            console.warn('Emergency banner not found, creating elements...');
            if (typeof createEmergencyElements === 'function') {
                createEmergencyElements();
            }
        }
        
        // Show emergency UI
        document.getElementById("emergencyBanner").style.display = "block";
        document.getElementById("emergencyModal").style.display = "flex";
        
        // Play alert sound
        if (alertSound && alertSound.paused) {
            alertSound.play().catch(e => console.warn('Could not play alert sound:', e));
        }

        // Send emergency alerts directly using the updated function from emergency.js
        window.sendEmergencyAlert(
            "EMERGENCY ALERT: Abnormal health readings detected. Medical assistance may be needed.",
            ['caregiver', 'medical'],
            emergencyMetrics
        );
    }

    // ⚠️ Don't auto-dismiss the emergency alert
    if (!emergencyTriggered && emergencyActive) {
        emergencyActive = false;
        if (emergencyBanner) emergencyBanner.style.display = "none";
        
        const emergencyModal = document.getElementById("emergencyModal");
        if (emergencyModal) emergencyModal.style.display = "none";
        
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

// Add a connect button to your HTML and use this event listener
document.addEventListener('DOMContentLoaded', function() {
    const connectButton = document.getElementById('connectButton');
    if (connectButton) {
        connectButton.addEventListener('click', connect);
    } else {
        console.warn('Connect button not found in the DOM');
    }
});

// Export functions to be used by other scripts
window.connect = connect;