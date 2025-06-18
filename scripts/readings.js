// readings.js
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

function clearLogs() {
    logs = [];
    document.getElementById('logsBody').innerHTML = '';
}

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
        const tempValue = data.temp.toFixed(1);
        tempElem.textContent = `${tempValue} °C`;
        emergencyMetrics.temp = tempValue;
        
        const tempStatus = data.temp > 38.5 ? 'emergency' : 'normal';
        logData('Temperature', `${tempValue}°C`, tempStatus);
        
        if (data.temp > 38.5) {
            tempElem.parentElement.style.backgroundColor = "#ffe0b2";
            tempElem.parentElement.style.border = "2px solid orange";
            emergencyTriggered = true;
        } else {
            tempElem.parentElement.style.backgroundColor = "";
            tempElem.parentElement.style.border = "";
        }
    }

    // --- START OF BLOOD PRESSURE CHANGES ---
    // --- START OF ATMOSPHERIC PRESSURE DISPLAY ---
    // const pressureElem = document.getElementById("pressure"); // Assuming 'pressure' is the ID of your HTML element
    // if (typeof data.pressure === "number") { // Check for the 'pressure' field from Bangle.js
    //     const atmosphericPressureValue = data.pressure.toFixed(1); // Round to 1 decimal place
    //     pressureElem.textContent = `${atmosphericPressureValue} hPa`; // Display in hectopascals (hPa)
    //     logData('Atmospheric Pressure', `${atmosphericPressureValue} hPa`); 
        
        // Log to table

        // You might want to add emergency logic for blood pressure too if needed
        // For example:
        // if (systolic > 140 || diastolic > 90) { // Example high BP
        //     bpElem.parentElement.style.backgroundColor = "#ffcccc";
        //     bpElem.parentElement.style.border = "2px solid red";
        //     emergencyTriggered = true;
        // } else {
        //     bpElem.parentElement.style.backgroundColor = "";
        //     bpElem.parentElement.style.border = "";
        // }
    // } else {
    //     pressureElem.textContent = "No Pressure Data"; // Message if atmospheric pressure is not available
    //     console.log('Atmospheric Pressure data: Not available or invalid.'); 
    // }
    // --- END OF BLOOD PRESSURE CHANGES ---


    // Accelerometer Log 
    const accel = data.accel ?? {};
    if (accel.x !== undefined) {
        const accelValue = `x: ${accel.x?.toFixed(2)}, y: ${accel.y?.toFixed(2)}, z: ${accel.z?.toFixed(2)}`;
        document.getElementById("accel").textContent = accelValue;
        logData('Accelerometer', accelValue);
    }

    // Magnetometer Log 
    const mag = data.mag ?? {};
    if (mag.x !== undefined) {
        const magValue = `x: ${mag.x}, y: ${mag.y}, z: ${mag.z}`;
        document.getElementById("mag").textContent = magValue;
        logData('Magnetometer', magValue);
    }

    // 🚨 Emergency Display
    if (emergencyTriggered && !emergencyActive) {
        emergencyActive = true;
        
        if (!emergencyBanner) {
            console.warn('Emergency banner not found, creating elements...');
            if (typeof createEmergencyElements === 'function') {
                createEmergencyElements();
            }
        }
        
        document.getElementById("emergencyBanner").style.display = "block";
        document.getElementById("emergencyModal").style.display = "flex";
        
        if (alertSound && alertSound.paused) {
            alertSound.play().catch(e => console.warn('Could not play alert sound:', e));
        }

        window.sendEmergencyAlert(
            "EMERGENCY ALERT: Abnormal health readings detected. Medical assistance may be needed.",
            ['caregiver', 'medical'],
            emergencyMetrics
        );
    }

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

// Make functions available globally
window.connect = connect;
window.clearLogs = clearLogs;














  const alertSound = document.getElementById("alertSound");
  const emergencyBanner = document.getElementById("emergencyBanner");

  let emergencyTriggered = false;

  // Heart Rate Check
  const hrElem = document.getElementById("hr");
  if (typeof data.heartRate === "number" && data.heartRate > 0) {
    hrElem.textContent = `${data.heartRate} bpm`;
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
  } else {
    pressureElem.textContent = "--";
  }

  // Accelerometer
  const accel = data.accel ?? {};
  document.getElementById("accel").textContent = `x: ${accel.x?.toFixed(
    2
  )}, y: ${accel.y?.toFixed(2)}, z: ${accel.z?.toFixed(2)}`;

  // Magnetometer
  const mag = data.mag ?? {};
  document.getElementById(
    "mag"
  ).textContent = `x: ${mag.x}, y: ${mag.y}, z: ${mag.z}`;

  // 🚨 Emergency Display
  if (emergencyTriggered && !emergencyActive) {
    emergencyActive = true;
    emergencyBanner.style.display = "block";
    if (alertSound && alertSound.paused) {
      alertSound.play();
    }

    document.getElementById("emergencyModal").style.display = "block";

    // Auto-call if no user interaction after 10s
    if (!emergencyTimeout) {
      emergencyTimeout = setTimeout(callCaregiver, 10000);
    }
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
