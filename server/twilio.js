// twilio.js with enhanced error handling
function getEnvVar(name) {
    const value = process.env[name];
    if (!value) {
      console.error(`❌ Missing required environment variable: ${name}`);
      throw new Error(`Missing ${name} in environment variables`);
    }
    return value;
  }
  
  // Get configuration with clear error messages
  const config = {
    accountSid: getEnvVar('TWILIO_ACCOUNT_SID'),
    authToken: getEnvVar('TWILIO_AUTH_TOKEN'),
    phoneNumber: getEnvVar('TWILIO_PHONE_NUMBER'),
    serverUrl: getEnvVar('SERVER_URL')
  };
  
  console.log('✅ Twilio Configuration Verified');
  const client = require('twilio')(config.accountSid, config.authToken);
  
  // Import TwiML for voice responses
  const VoiceResponse = require('twilio').twiml.VoiceResponse;
  
  async function callCaregiver(phoneNumber, location, patientName) {
      try {
          const call = await client.calls.create({
              url: `${config.serverUrl}/emergency-call?location=${
                  encodeURIComponent(location)}&patientName=${
                  encodeURIComponent(patientName)}`,
              to: phoneNumber,
              from: config.phoneNumber
          });
          console.log(`📞 Emergency call initiated to ${phoneNumber}: ${call.sid}`);
          return call.sid;
      } catch (error) {
          console.error('❌ Call failed:', error);
          throw new Error(`Call failed: ${error.message}`);
      }
  }
  
  async function sendEmergencySMS(phoneNumber, message) {
      try {
          const sms = await client.messages.create({
              body: message,
              to: phoneNumber,
              from: config.phoneNumber
          });
          console.log(`✉️ Emergency SMS sent to ${phoneNumber}: ${sms.sid}`);
          return sms.sid;
      } catch (error) {
          console.error('❌ SMS failed:', error);
          throw new Error(`SMS failed: ${error.message}`);
      }
  }
  
  module.exports = {
      callCaregiver,
      sendEmergencySMS,
      twiml: {
          VoiceResponse
      }
  };