let clerk;

// Initialize Clerk and check authentication
window.addEventListener('load', async () => {
    try {
        clerk = window.Clerk;
        await clerk.load();
        
        // Check if user is signed in
        if (!clerk.user) {
            // Redirect to auth page if not signed in
            window.location.href = 'auth.html';
            return;
        }
        
        // User is signed in, populate patient info
        populatePatientInfo();
        updateCurrentDate();
        
    } catch (error) {
        console.error('Error initializing Clerk:', error);
        // Redirect to auth page on error
        window.location.href = 'auth.html';
    }
});

// Populate patient information from Clerk user data
function populatePatientInfo() {
    const user = clerk.user;
    
    if (user) {
        // Get user information
        const firstName = user.firstName || '';
        const lastName = user.lastName || '';
        const fullName = `${firstName} ${lastName}`.trim() || 'Not provided';
        
        // Get phone number (Clerk stores this in phoneNumbers array)
        const phoneNumber = user.phoneNumbers?.[0]?.phoneNumber || user.unsafeMetadata?.phone || 'Not provided';
        
        // Get metadata
        const age = user.unsafeMetadata?.age || 'Not provided';
        const gender = user.unsafeMetadata?.gender || 'Not provided';
        
        // Update DOM elements (make sure these IDs match your existing elements)
        const nameElement = document.getElementById('patientName');
        const genderElement = document.getElementById('patientGender');
        const ageElement = document.getElementById('patientAge');
        const contactElement = document.getElementById('patientContact');
        
        if (nameElement) nameElement.textContent = fullName;
        if (genderElement) genderElement.textContent = gender;
        if (ageElement) ageElement.textContent = age;
        if (contactElement) contactElement.textContent = phoneNumber;
    }
}

// Update current date
function updateCurrentDate() {
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    
    const formattedDate = now.toLocaleDateString('en-US', options);
    const day = now.getDate();
    const suffix = getDaySuffix(day);
    
    const finalDate = formattedDate.replace(day.toString(), `${day}${suffix}`);
    const dateElement = document.getElementById('currentDate');
    if (dateElement) {
        dateElement.textContent = finalDate;
    }
}

// Get day suffix (st, nd, rd, th)
function getDaySuffix(day) {
    if (day >= 11 && day <= 13) {
        return 'th';
    }
    switch (day % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
    }
}

// Sign out function (call this from your sign out button)
async function signOut() {
    try {
        await clerk.signOut();
        window.location.href = 'auth.html';
    } catch (error) {
        console.error('Sign out error:', error);
    }
}

// Listen for Clerk user changes
if (clerk) {
    clerk.addListener('user', (user) => {
        if (user) {
            populatePatientInfo();
        } else {
            window.location.href = 'auth.html';
        }
    });
}