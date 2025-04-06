 // Tab functionality
 document.addEventListener('DOMContentLoaded', function() {
  const personalTabBtn = document.getElementById('personalTabBtn');
  const medicalTabBtn = document.getElementById('medicalTabBtn');
  const personalTab = document.getElementById('personalTab');
  const medicalTab = document.getElementById('medicalTab');
  
  personalTabBtn.addEventListener('click', function() {
      // Switch to Personal Caregivers tab
      personalTab.classList.remove('hidden');
      medicalTab.classList.add('hidden');
      
      // Update button styles
      personalTabBtn.classList.add('border-b-2', 'border-[#6B21A8]', 'text-[#6B21A8]');
      personalTabBtn.classList.remove('text-gray-500');
      medicalTabBtn.classList.remove('border-b-2', 'border-[#6B21A8]', 'text-[#6B21A8]');
      medicalTabBtn.classList.add('text-gray-500');
  });
  
  medicalTabBtn.addEventListener('click', function() {
      // Switch to Medical Professionals tab
      personalTab.classList.add('hidden');
      medicalTab.classList.remove('hidden');
      
      // Update button styles
      medicalTabBtn.classList.add('border-b-2', 'border-[#6B21A8]', 'text-[#6B21A8]');
      medicalTabBtn.classList.remove('text-gray-500');
      personalTabBtn.classList.remove('border-b-2', 'border-[#6B21A8]', 'text-[#6B21A8]');
      personalTabBtn.classList.add('text-gray-500');
  });
  
  // Set up form handlers
  const caregiverForm = document.getElementById('caregiverForm');
  const medicalForm = document.getElementById('medicalForm');
  const caregiverList = document.getElementById('caregiverList');
  const medicalList = document.getElementById('medicalList');
  
  // Handler for caregiver form
  caregiverForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const nameInput = document.getElementById('caregiverName');
      const phoneInput = document.getElementById('caregiverPhone');
      
      if (nameInput.value && phoneInput.value) {
          addContact(caregiverList, nameInput.value, phoneInput.value, 'caregiver');
          nameInput.value = '';
          phoneInput.value = '';
      }
  });
  
  // Handler for medical form
  medicalForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const nameInput = document.getElementById('medicalName');
      const phoneInput = document.getElementById('medicalPhone');
      
      if (nameInput.value && phoneInput.value) {
          addContact(medicalList, nameInput.value, phoneInput.value, 'medical');
          nameInput.value = '';
          phoneInput.value = '';
      }
  });
});

// Function to add a contact to a list
function addContact(listElement, name, phone, type) {
  const item = document.createElement('li');
  item.className = 'p-3 bg-gray-100 rounded mb-2 flex justify-between items-center';
  item.dataset.type = type;
  
  const contactInfo = document.createElement('div');
  contactInfo.innerHTML = `<strong>${name}</strong>: ${phone}`;
  
  const removeBtn = document.createElement('button');
  removeBtn.innerHTML = '❌';
  removeBtn.className = 'text-red-500';
  removeBtn.onclick = function() {
      showConfirmModal(`Remove ${name} from emergency contacts?`, function(confirmed) {
          if (confirmed) {
              item.remove();
          }
      });
  };
  
  item.appendChild(contactInfo);
  item.appendChild(removeBtn);
  listElement.appendChild(item);
}

//code in contact management functionality
function saveContact(name, phone, type) {
    // Get existing contacts
    const contacts = JSON.parse(localStorage.getItem('emergencyContacts')) || [];
    
    // Add new contact
    contacts.push({
        name: name,
        phone: phone,
        type: type // 'caregiver' or 'medical'
    });
    
    // Save back to localStorage
    localStorage.setItem('emergencyContacts', JSON.stringify(contacts));
}

// Function to show confirmation modal
function showConfirmModal(message, callback) {
  const modalOverlay = document.getElementById('modalOverlay');
  const confirmModal = document.getElementById('confirmModal');
  const confirmMessage = document.getElementById('confirmMessage');
  const confirmYes = document.getElementById('confirmYes');
  const confirmNo = document.getElementById('confirmNo');
  
  // Set message and show modal
  confirmMessage.textContent = message;
  modalOverlay.classList.remove('hidden');
  confirmModal.classList.remove('hidden');
  
  // Remove previous event listeners
  const newYesBtn = confirmYes.cloneNode(true);
  const newNoBtn = confirmNo.cloneNode(true);
  confirmYes.parentNode.replaceChild(newYesBtn, confirmYes);
  confirmNo.parentNode.replaceChild(newNoBtn, confirmNo);
  
  // Set up new event listeners
  newYesBtn.addEventListener('click', function() {
      hideConfirmModal();
      callback(true);
  });
  
  newNoBtn.addEventListener('click', function() {
      hideConfirmModal();
      callback(false);
  });
}

// Function to hide confirmation modal
function hideConfirmModal() {
  document.getElementById('modalOverlay').classList.add('hidden');
  document.getElementById('confirmModal').classList.add('hidden');
}

// Close settings function
function closeSettings() {
  document.getElementById('contacts').classList.add('hidden');
}


// Function to add a contact to a list
function addContact(listElement, name, phone, type) {
    // Save to localStorage
    saveContact(name, phone, type);
    
    // Create and append the list item
    const item = document.createElement('li');
    item.className = 'p-3 bg-gray-100 rounded mb-2 flex justify-between items-center';
    item.dataset.type = type;
    
    const contactInfo = document.createElement('div');
    contactInfo.innerHTML = `<strong>${name}</strong>: ${phone}`;
    
    const removeBtn = document.createElement('button');
    removeBtn.innerHTML = '❌';
    removeBtn.className = 'text-red-500';
    removeBtn.onclick = function() {
        showConfirmModal(`Remove ${name} from emergency contacts?`, function(confirmed) {
            if (confirmed) {
                // Remove from localStorage
                const contacts = JSON.parse(localStorage.getItem('emergencyContacts')) || [];
                const updatedContacts = contacts.filter(contact => 
                    !(contact.name === name && contact.phone === phone && contact.type === type)
                );
                localStorage.setItem('emergencyContacts', JSON.stringify(updatedContacts));
                
                // Remove from UI
                item.remove();
            }
        });
    };
    
    item.appendChild(contactInfo);
    item.appendChild(removeBtn);
    listElement.appendChild(item);
}

document.addEventListener('DOMContentLoaded', function() {
    // ... your existing tab and form setup code ...
    
    // Load existing contacts
    const contacts = JSON.parse(localStorage.getItem('emergencyContacts')) || [];
    const caregiverList = document.getElementById('caregiverList');
    const medicalList = document.getElementById('medicalList');
    
    contacts.forEach(contact => {
        const listElement = contact.type === 'caregiver' ? caregiverList : medicalList;
        // Create the list item without saving again (it's already in storage)
        const item = document.createElement('li');
        item.className = 'p-3 bg-gray-100 rounded mb-2 flex justify-between items-center';
        item.dataset.type = contact.type;
        
        const contactInfo = document.createElement('div');
        contactInfo.innerHTML = `<strong>${contact.name}</strong>: ${contact.phone}`;
        
        const removeBtn = document.createElement('button');
        removeBtn.innerHTML = '❌';
        removeBtn.className = 'text-red-500';
        removeBtn.onclick = function() {
            showConfirmModal(`Remove ${contact.name} from emergency contacts?`, function(confirmed) {
                if (confirmed) {
                    // Remove from localStorage
                    const updatedContacts = contacts.filter(c => 
                        !(c.name === contact.name && c.phone === contact.phone && c.type === contact.type)
                    );
                    localStorage.setItem('emergencyContacts', JSON.stringify(updatedContacts));
                    
                    // Remove from UI
                    item.remove();
                }
            });
        };
        
        item.appendChild(contactInfo);
        item.appendChild(removeBtn);
        listElement.appendChild(item);
    });
});