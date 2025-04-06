// server.js
const express = require('express');
const path = require('path');

// Load environment variables FIRST (before any other imports)
const envPath = path.join(__dirname, '.env');
require('dotenv').config({ path: envPath });

// Debug output
console.log('[DEBUG] Environment Variables:');
console.log('TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? '✔ Loaded' : '✖ Missing');
console.log('TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? '✔ Loaded' : '✖ Missing');
console.log('TWILIO_PHONE_NUMBER:', process.env.TWILIO_PHONE_NUMBER || '✖ Missing');
console.log('SERVER_URL:', process.env.SERVER_URL || '✖ Missing');

// Only import twilio AFTER loading environment variables
const twilio = require('./twilio');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '../')));

// Endpoint for Twilio to call when connecting to caregiver
app.get('/emergency-call', (req, res) => {
    const location = req.query.location || 'Unknown location';
    const patientName = req.query.patientName || 'Patient';
    
    const response = new twilio.twiml.VoiceResponse();
    response.say({
        voice: 'woman',
        language: 'en-GB'
    }, `Emergency alert for ${patientName}. This is an automated emergency call. ${patientName} requires immediate assistance. Their current location is: ${location}. Please respond immediately.`);
    
    // Play the distress audio file
    response.play(process.env.SERVER_URL + '/alert.wav');
    
    res.type('text/xml');
    res.send(response.toString());
});

// Endpoint to trigger emergency alerts from frontend
app.post('/trigger-emergency', async (req, res) => {
    const { caregivers, medicalProfessionals, metrics, location, patientName } = req.body;
    
    try {
        // Call each caregiver
        for (const caregiver of caregivers) {
            await twilio.callCaregiver(caregiver.phone, location, patientName);
        }
        
        // Send SMS to medical professionals with metrics
        const metricsMessage = `EMERGENCY ALERT for ${patientName}\n\n` +
                              `Vitals:\n` +
                              `- Heart Rate: ${metrics.heartRate} bpm\n` +
                              `- Temperature: ${metrics.temp}°C\n` +
                              `- Pressure: ${metrics.pressure?.pressure || 'N/A'} Pa\n\n` +
                              `Location: ${location}\n\n` +
                              `Please respond immediately.`;
        
        for (const professional of medicalProfessionals) {
            await twilio.sendEmergencySMS(professional.phone, metricsMessage);
        }
        
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Emergency alert failed:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

app.use(express.static(path.join(__dirname, '../')));