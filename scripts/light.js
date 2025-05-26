tailwind.config = {
    darkMode: 'class',
}

// Theme Management
const themeToggle = document.getElementById('themeToggle');
const sunIcon = document.getElementById('sunIcon');
const moonIcon = document.getElementById('moonIcon');

// Check for saved theme preference or default to light mode
const currentTheme = JSON.parse(window.localStorage?.getItem('theme')) || 'light';

// Apply the current theme on page load
if (currentTheme === 'dark') {
    document.documentElement.classList.add('dark');
    sunIcon.classList.add('hidden');
    moonIcon.classList.remove('hidden');
} else {
    document.documentElement.classList.remove('dark');
    sunIcon.classList.remove('hidden');
    moonIcon.classList.add('hidden');
}

// Theme toggle functionality
themeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.classList.contains('dark');
    
    if (isDark) {
        // Switch to light mode
        document.documentElement.classList.remove('dark');
        sunIcon.classList.remove('hidden');
        moonIcon.classList.add('hidden');
        if (window.localStorage) window.localStorage.setItem('theme', JSON.stringify('light'));
    } else {
        // Switch to dark mode
        document.documentElement.classList.add('dark');
        sunIcon.classList.add('hidden');
        moonIcon.classList.remove('hidden');
        if (window.localStorage) window.localStorage.setItem('theme', JSON.stringify('dark'));
    }
});

// Navigation functionality
document.addEventListener('DOMContentLoaded', function() {
    // Show dashboard by default
    document.getElementById('dashboard').classList.remove('hidden');
    
    // Navigation links
    const navLinks = document.querySelectorAll('[data-section]');
    const sections = document.querySelectorAll('.section');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSection = e.target.closest('[data-section]').getAttribute('data-section');
            
            // Hide all sections
            sections.forEach(section => {
                section.classList.add('hidden');
            });
            
            // Show target section
            document.getElementById(targetSection).classList.remove('hidden');
            
            // Close drawer on mobile
            const drawer = document.getElementById('drawer-navigation');
            if (drawer && !drawer.classList.contains('-translate-x-full')) {
                drawer.classList.add('-translate-x-full');
            }
        });
    });
});

// Tab functionality for contacts section
document.addEventListener('DOMContentLoaded', function() {
    const personalTabBtn = document.getElementById('personalTabBtn');
    const medicalTabBtn = document.getElementById('medicalTabBtn');
    const personalTab = document.getElementById('personalTab');
    const medicalTab = document.getElementById('medicalTab');
    
    if (personalTabBtn && medicalTabBtn) {
        personalTabBtn.addEventListener('click', () => {
            personalTabBtn.classList.add('border-[#6B21A8]', 'dark:border-purple-400', 'text-[#6B21A8]', 'dark:text-purple-400');
            personalTabBtn.classList.remove('text-gray-500', 'dark:text-gray-400');
            medicalTabBtn.classList.remove('border-[#6B21A8]', 'dark:border-purple-400', 'text-[#6B21A8]', 'dark:text-purple-400');
            medicalTabBtn.classList.add('text-gray-500', 'dark:text-gray-400');
            
            personalTab.classList.remove('hidden');
            medicalTab.classList.add('hidden');
        });
        
        medicalTabBtn.addEventListener('click', () => {
            medicalTabBtn.classList.add('border-[#6B21A8]', 'dark:border-purple-400', 'text-[#6B21A8]', 'dark:text-purple-400');
            medicalTabBtn.classList.remove('text-gray-500', 'dark:text-gray-400');
            personalTabBtn.classList.remove('border-[#6B21A8]', 'dark:border-purple-400', 'text-[#6B21A8]', 'dark:text-purple-400');
            personalTabBtn.classList.add('text-gray-500', 'dark:text-gray-400');
            
            medicalTab.classList.remove('hidden');
            personalTab.classList.add('hidden');
        });
    }
});

// // Placeholder functions for your existing functionality
// function connect() {
//     const status = document.getElementById('status');
//     status.textContent = '🔗 Connecting to Bangle.js...';
    
//     // Simulate connection
//     setTimeout(() => {
//         status.textContent = '✅ Connected to Bangle.js!';
//         simulateData();
//     }, 2000);
// }

// function simulateData() {
//     // Simulate some health data
//     document.getElementById('hr').textContent = '72 BPM';
//     document.getElementById('temp').textContent = '98.6°F';
//     document.getElementById('pressure').textContent = '120/80';
//     document.getElementById('accel').textContent = '0.1, 0.2, 9.8';
//     document.getElementById('mag').textContent = '45.2, -12.1, 32.8';
// }

// function callCaregiver() {
//     alert('📞 Calling primary caregiver...');
//     dismissAlert();
// }

// function dismissAlert() {
//     document.getElementById('emergencyBanner').classList.add('hidden');
//     document.getElementById('emergencyModal').classList.add('hidden');
// }

// // Contact management (simplified for demo)
// const contacts = {
//     caregivers: [],
//     medical: []
// };

// document.addEventListener('DOMContentLoaded', function() {
//     const caregiverForm = document.getElementById('caregiverForm');
//     const medicalForm = document.getElementById('medicalForm');
    
//     if (caregiverForm) {
//         caregiverForm.addEventListener('submit', (e) => {
//             e.preventDefault();
//             const name = document.getElementById('caregiverName').value;
//             const phone = document.getElementById('caregiverPhone').value;
            
//             contacts.caregivers.push({ name, phone });
//             updateContactList('caregiver');
//             caregiverForm.reset();
//         });
//     }
    
//     if (medicalForm) {
//         medicalForm.addEventListener('submit', (e) => {
//             e.preventDefault();
//             const name = document.getElementById('medicalName').value;
//             const phone = document.getElementById('medicalPhone').value;
            
//             contacts.medical.push({ name, phone });
//             updateContactList('medical');
//             medicalForm.reset();
//         });
//     }
// });

// function updateContactList(type) {
//     const listId = type === 'caregiver' ? 'caregiverList' : 'medicalList';
//     const list = document.getElementById(listId);
//     const contactArray = type === 'caregiver' ? contacts.caregivers : contacts.medical;
    
//     if (list) {
//         list.innerHTML = contactArray.map((contact, index) => 
//             `<li class="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 theme-transition">
//                 <div>
//                     <div class="font-medium text-gray-900 dark:text-white">${contact.name}</div>
//                     <div class="text-sm text-gray-600 dark:text-gray-300">${contact.phone}</div>
//                 </div>
//                 <button onclick="removeContact('${type}', ${index})" class="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1 rounded theme-transition">
//                     <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
//                         <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
//                     </svg>
//                 </button>
//             </li>`
//         ).join('');
//     }
// }

// function removeContact(type, index) {
//     if (type === 'caregiver') {
//         contacts.caregivers.splice(index, 1);
//         updateContactList('caregiver');
//     } else {
//         contacts.medical.splice(index, 1);
//         updateContactList('medical');
//     }
// }

// Initialize theme on load
document.addEventListener('DOMContentLoaded', function() {
    // Apply theme immediately to prevent flash
    const savedTheme = JSON.parse(window.localStorage?.getItem('theme')) || 'light';
    if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
    }
});