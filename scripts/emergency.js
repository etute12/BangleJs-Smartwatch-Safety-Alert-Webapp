// emergency.js
let emergencyActive = false;
let currentCaregiver = 0;
let emergencyTimeout;

const decoder = new TextDecoder();
let buffer = "";

// Function to get contacts from localStorage
function getContacts(type) {
    const contacts = JSON.parse(localStorage.getItem('emergencyContacts')) || [];
    return contacts.filter(contact => contact.type === type);
}

// Function to trigger emergency alerts
async function triggerEmergencyAlerts(metrics) {
    try {
        const location = await getUserLocation();
        
        // Get contacts from localStorage
        const caregivers = getContacts('caregiver');
        const medicalProfessionals = getContacts('medical');
        
        const patientName = "Patient Name"; // Replace with actual patient name or get from storage
        
        if (caregivers.length === 0 && medicalProfessionals.length === 0) {
            console.warn('No emergency contacts configured');
            return;
        }
        
        const response = await fetch('/trigger-emergency', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                caregivers,
                medicalProfessionals,
                metrics,
                location,
                patientName
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to trigger emergency alerts');
        }
        
        console.log('Emergency alerts triggered successfully');
    } catch (error) {
        console.error('Error triggering emergency alerts:', error);
    }
}

// Helper function to get user's location
function getUserLocation() {
    return new Promise((resolve) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    resolve(`https://maps.google.com/?q=${lat},${lng}`);
                },
                () => {
                    resolve("Location unavailable");
                }
            );
        } else {
            resolve("Location services not available");
        }
    });
}

const updateUI = (data) => {
    const alertSound = document.getElementById("alertSound");
    const emergencyBanner = document.getElementById("emergencyBanner");

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
        emergencyBanner.style.display = "block";
        if (alertSound && alertSound.paused) {
            alertSound.play();
        }

        document.getElementById("emergencyModal").style.display = "block";
        triggerEmergencyAlerts(emergencyMetrics);
    }

    // ⚠️ Don't auto-dismiss the emergency alert
    if (!emergencyTriggered && emergencyActive) {
        emergencyActive = false;
        emergencyBanner.style.display = "none";
        document.getElementById("emergencyModal").style.display = "none";
        clearTimeout(emergencyTimeout);
        emergencyTimeout = null;
        currentCaregiver = 0;
    }
};

function log(msg) {
    document.getElementById("status").textContent = msg;
}

async function connect() {
    try {
        log("Searching for Bangle.js device...");
        
        const device = await navigator.bluetooth.requestDevice({
            filters: [{ namePrefix: "Bangle" }],
            optionalServices: ["6e400001-b5a3-f393-e0a9-e50e24dcca9e"],
        }).catch(error => {
            if (error.name === 'NotFoundError') {
                log("Please select a device to connect");
                return null;
            }
            throw error;
        });

        if (!device) {
            return; // User cancelled the device selection
        }

        log("Connecting to " + device.name + "...");
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
        if (err.name === 'NotFoundError') {
            log("Device not found. Please try again.");
        } else {
            log("❌ Error: " + err.message);
        }
        console.error("Bluetooth connection error:", err);
    }
}

// Add a connect button to your HTML and use this event listener
document.getElementById('connectButton')?.addEventListener('click', connect);

// Or automatically attempt to connect when page loads
// window.addEventListener('load', () => {
//     connect();
// });