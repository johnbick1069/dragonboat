// Paddler data structure and operations

// Add a new paddler
function addPaddler() {
    const paddlerNameInput = document.getElementById('paddlerName');
    const paddlerWeightInput = document.getElementById('paddlerWeight');
    const paddlerSideSelect = document.getElementById('paddlerSide');
    const paddlerGenderSelect = document.getElementById('paddlerGender');
    
    const name = paddlerNameInput.value.trim();
    const weight = parseFloat(paddlerWeightInput.value);
    const side = paddlerSideSelect.value;
    const gender = paddlerGenderSelect.value;
    
    if (!name) {
        alert('Please enter a paddler name.');
        return;
    }
    
    if (isNaN(weight) || weight <= 0) {
        alert('Please enter a valid weight.');
        return;
    }
    
    const paddler = {
        id: Date.now(),
        name,
        weight,
        side,
        gender
    };
    
    paddlers.push(paddler);
    
    updateAndSave();
    
    // Clear form
    paddlerNameInput.value = '';
    paddlerWeightInput.value = '';
    paddlerSideSelect.value = 'left';
    paddlerGenderSelect.value = 'M';
}

// Function to check if a paddler is in the boat
function isPaddlerInBoat(paddler) {
    for (let i = 0; i < 10; i++) {        for (let j = 0; j < 2; j++) {
            if (boat[i][j] && boat[i][j].id == paddler.id) { // Use loose equality
                return true;
            }
        }
    }
    return false;
}

// Remove paddler from boat
function removePaddlerFromBoat(id) {
    for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 2; j++) {
            if (boat[i][j] && boat[i][j].id == id) { // Use loose equality
                const seatPosition = `${i}-${j}`;
                // Remove from fixed seats if it was fixed
                if (fixedSeats.has(seatPosition)) {
                    fixedSeats.delete(seatPosition);
                }
                boat[i][j] = null;
            }
        }
    }
}

// Toggle paddler in/out of boat
function togglePaddlerInBoat(id) {
    const paddler = paddlers.find(p => p.id == id); // Use loose equality
    if (!paddler) return;
    
    // Check if paddler is already in boat
    if (isPaddlerInBoat(paddler)) {
        // Remove from boat
        removePaddlerFromBoat(id);
    } else {
        // Add to first available seat matching their side preference
        let side = paddler.side;
        let placed = false;
        
        // Try preferred side first
        if (side === 'both' || side === 'left') {
            const leftSeat = findEmptySeat(0);
            if (leftSeat) {
                boat[leftSeat.row][leftSeat.seat] = paddler;
                placed = true;
            }
        }
        
        // If not placed and can paddle right or prefers right, try right side
        if (!placed && (side === 'both' || side === 'right')) {
            const rightSeat = findEmptySeat(1);
            if (rightSeat) {
                boat[rightSeat.row][rightSeat.seat] = paddler;
                placed = true;
            }
        }
    }
    
    updateAndSave();
}

// Toggle paddler side preference
function togglePaddlerSide(id) {
    const paddler = paddlers.find(p => p.id == id); // Use loose equality
    if (!paddler) return;
    
    // Cycle through side preferences: left -> right -> both -> left
    switch (paddler.side) {
        case 'left':
            paddler.side = 'right';
            break;
        case 'right':
            paddler.side = 'both';
            break;
        case 'both':
            paddler.side = 'left';
            break;
    }
    
    // If in boat, and current position violates side preference, remove from boat
    if (isPaddlerInBoat(paddler)) {
        for (let i = 0; i < 10; i++) {
            for (let j = 0; j < 2; j++) {
                if (boat[i][j] && boat[i][j].id === id) {
                    const seatSide = j === 0 ? 'left' : 'right';
                    if (paddler.side !== 'both' && paddler.side !== seatSide) {
                        removePaddlerFromBoat(id);
                        break;
                    }
                }
            }
        }
    }
    
    updateAndSave();
}

// Clear all paddlers
function clearPaddlers() {
    if (confirm('Are you sure you want to clear all paddlers? This will also remove paddlers from the boat.')) {
        // Clear all paddlers from the boat
        for (let i = 0; i < 10; i++) {
            for (let j = 0; j < 2; j++) {
                boat[i][j] = null;
            }
        }
        
        // Clear all paddlers from the list
        paddlers.length = 0;
        
        // Clear fixed seats since they no longer have paddlers
        fixedSeats.clear();
        
        updateAndSave();
    }
}

// Function to show edit paddler modal
function showEditPaddlerModal(id) {
    const paddler = paddlers.find(p => p.id == id); // Use loose equality to handle type conversion
    if (!paddler) return;
    
    // Create modal if it doesn't exist
    if (!document.getElementById('editPaddlerModal')) {
        const modal = document.createElement('div');
        modal.id = 'editPaddlerModal';
        modal.className = 'modal';
          modal.innerHTML = `
            <div class="modal-content">
                <span class="close">&times;</span>
                <h2>Edit Paddler</h2>
                <div class="form-group">
                    <label for="editPaddlerName">Name</label>
                    <input type="text" id="editPaddlerName">
                </div>
                <div class="form-group">
                    <label for="editPaddlerWeight">Weight (kg)</label>
                    <input type="number" id="editPaddlerWeight" min="30" max="200">
                </div>
                <div class="form-group">
                    <label for="editPaddlerSide">Paddle Side</label>
                    <select id="editPaddlerSide">
                        <option value="left">Left</option>
                        <option value="right">Right</option>
                        <option value="both">Both</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="editPaddlerGender">Gender</label>
                    <select id="editPaddlerGender">
                        <option value="M">Male (M)</option>
                        <option value="F">Female (F)</option>
                    </select>
                </div>
                <button id="savePaddlerChanges" class="primary">Save Changes</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add close functionality
        const closeBtn = document.querySelector('#editPaddlerModal .close');
        closeBtn.addEventListener('click', function() {
            document.getElementById('editPaddlerModal').style.display = 'none';
        });
        
        // Close when clicking outside
        window.addEventListener('click', function(event) {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
      // Update modal with paddler info
    const modal = document.getElementById('editPaddlerModal');
    const nameInput = document.getElementById('editPaddlerName');
    const weightInput = document.getElementById('editPaddlerWeight');
    const sideSelect = document.getElementById('editPaddlerSide');
    const genderSelect = document.getElementById('editPaddlerGender');
    
    nameInput.value = paddler.name;
    weightInput.value = paddler.weight;
    sideSelect.value = paddler.side;
    genderSelect.value = paddler.gender || 'M';
    
    // Remove old save handler
    const saveBtn = document.getElementById('savePaddlerChanges');
    const newSaveBtn = saveBtn.cloneNode(true);
    saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
      // Add new save handler
    newSaveBtn.addEventListener('click', function() {
        const name = nameInput.value.trim();
        const weight = parseFloat(weightInput.value);
        const side = sideSelect.value;
        const gender = genderSelect.value;
        
        if (!name) {
            alert('Please enter a paddler name.');
            return;
        }
        
        if (isNaN(weight) || weight <= 0) {
            alert('Please enter a valid weight.');
            return;
        }
          // Update paddler data
        paddler.name = name;
        paddler.weight = weight;
        paddler.gender = gender;
        
        // If side changed, check if in boat
        if (paddler.side !== side) {
            paddler.side = side;
              // If in boat and new side conflicts with position, remove
            if (isPaddlerInBoat(paddler)) {
                for (let i = 0; i < 10; i++) {
                    for (let j = 0; j < 2; j++) {
                        if (boat[i][j] && boat[i][j].id == id) { // Use loose equality
                            const seatSide = j === 0 ? 'left' : 'right';
                            if (side !== 'both' && side !== seatSide) {
                                removePaddlerFromBoat(id);
                            }
                            break;
                        }
                    }
                }
            }
        }
        
        // Hide modal
        modal.style.display = 'none';
        
        // Update UI - ensure all components are refreshed
        updateAndSave();
    });
    
    // Show modal
    modal.style.display = 'block';
}