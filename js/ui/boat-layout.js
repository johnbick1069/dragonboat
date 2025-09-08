// UI components for boat layout

// DOM elements
let boatLayoutElement;

// Initialize the boat layout
function initializeBoatLayout() {
    boatLayoutElement = document.getElementById('boatLayout');
    boatLayoutElement.innerHTML = '';
    
    for (let i = 0; i < 10; i++) {
        const rowIndex = i;
        const rowElement = document.createElement('div');
        rowElement.className = 'boat-row';
        
        // Row number indicator
        const rowNumber = document.createElement('div');
        rowNumber.className = 'row-number';
        rowNumber.textContent = i + 1;
        rowElement.appendChild(rowNumber);
        
        // Left seat
        const leftSeat = createSeatElement(rowIndex, 0);
        
        // Right seat
        const rightSeat = createSeatElement(rowIndex, 1);
        
        rowElement.appendChild(leftSeat);
        rowElement.appendChild(rightSeat);
        boatLayoutElement.appendChild(rowElement);
    }
}

// Create a seat element with event handlers
function createSeatElement(rowIndex, seatIndex) {
    const seatElement = document.createElement('div');
    seatElement.className = `seat ${seatIndex === 0 ? 'left' : 'right'}`;
    seatElement.dataset.row = rowIndex;
    seatElement.dataset.seat = seatIndex;
    
    // Seat label
    const seatLabel = document.createElement('div');
    seatLabel.className = 'seat-label';
    seatLabel.textContent = seatIndex === 0 ? 'Left' : 'Right';
    seatElement.appendChild(seatLabel);
    
    // Check if this seat is fixed
    const seatPosition = `${rowIndex}-${seatIndex}`;
    if (fixedSeats.has(seatPosition)) {
        seatElement.classList.add('fixed');
    }
    
    // Add dropdown button for paddler selection
    const dropdownButton = document.createElement('button');
    dropdownButton.className = 'seat-dropdown-button';
    dropdownButton.innerHTML = '<i class="dropdown-icon">▼</i>';
    dropdownButton.title = 'Click to select paddler';
    dropdownButton.addEventListener('click', function(e) {
        e.stopPropagation();
        showPaddlerDropdown(rowIndex, seatIndex, seatElement);
    });
    seatElement.appendChild(dropdownButton);
    
    // Add fix/unfix button for mobile compatibility
    const fixButton = document.createElement('button');
    fixButton.className = 'seat-fix-button';
    fixButton.innerHTML = '<i class="fix-icon">📌</i>';
    fixButton.title = 'Tap to fix/unfix position';
    fixButton.addEventListener('click', function(e) {
        e.stopPropagation();
        const row = parseInt(seatElement.dataset.row);
        const seat = parseInt(seatElement.dataset.seat);
        toggleSeatFixed(row, seat);
    });
    seatElement.appendChild(fixButton);
    
    // Event listeners for drag and drop
    seatElement.addEventListener('dragover', handleDragOver);
    seatElement.addEventListener('dragleave', handleDragLeave);
    seatElement.addEventListener('drop', handleDrop);
    // Add dragenter event to ensure dragover fires consistently
    seatElement.addEventListener('dragenter', function(e) {
        e.preventDefault();
    });
    
    // Right-click to fix/unfix seat (keep for desktop compatibility)
    seatElement.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        const row = parseInt(this.dataset.row);
        const seat = parseInt(this.dataset.seat);
        toggleSeatFixed(row, seat);
    });
    
    return seatElement;
}

// Update the boat layout with current paddlers
function updateBoatLayout() {
    for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 2; j++) {
            const seatElement = document.querySelector(`.seat[data-row="${i}"][data-seat="${j}"]`);
            seatElement.innerHTML = '';
            
            // Seat label
            const seatLabel = document.createElement('div');
            seatLabel.className = 'seat-label';
            seatLabel.textContent = j === 0 ? 'Left' : 'Right';
            seatElement.appendChild(seatLabel);
            
            // Add dropdown button
            const dropdownButton = document.createElement('button');
            dropdownButton.className = 'seat-dropdown-button';
            dropdownButton.innerHTML = '<i class="dropdown-icon">▼</i>';
            dropdownButton.title = 'Click to select paddler';
            dropdownButton.addEventListener('click', function(e) {
                e.stopPropagation();
                showPaddlerDropdown(i, j, seatElement);
            });
            seatElement.appendChild(dropdownButton);
            
            // Add fix/unfix button
            const fixButton = document.createElement('button');
            fixButton.className = 'seat-fix-button';
            fixButton.innerHTML = '<i class="fix-icon">📌</i>';
            fixButton.title = 'Tap to fix/unfix position';
            fixButton.addEventListener('click', function(e) {
                e.stopPropagation();
                const row = parseInt(seatElement.dataset.row);
                const seat = parseInt(seatElement.dataset.seat);
                toggleSeatFixed(row, seat);
            });
            seatElement.appendChild(fixButton);
            
            // Check if this seat is fixed
            const seatPosition = `${i}-${j}`;
            if (fixedSeats.has(seatPosition)) {
                seatElement.classList.add('fixed');
            } else {
                seatElement.classList.remove('fixed');
            }
              const paddler = boat[i][j];
            if (paddler) {
                const paddlerElement = document.createElement('div');
                paddlerElement.className = 'seat-paddler';
                paddlerElement.dataset.id = paddler.id;
                paddlerElement.draggable = true;
                
                // Add gender class for styling
                if (paddler.gender === 'M') {
                    paddlerElement.classList.add('male');
                } else if (paddler.gender === 'F') {
                    paddlerElement.classList.add('female');
                }
                
                paddlerElement.innerHTML = `
                    <div class="paddler-name">${paddler.name}</div>
                    <div class="paddler-details">${paddler.weight} kg</div>
                `;
                
                // Add remove button
                const removeButton = document.createElement('button');
                removeButton.className = 'remove-paddler-button';
                removeButton.innerHTML = '✕';
                removeButton.title = 'Remove paddler from boat';
                removeButton.addEventListener('click', function(e) {
                    e.stopPropagation();
                    e.preventDefault();
                    const row = parseInt(seatElement.dataset.row);
                    const seat = parseInt(seatElement.dataset.seat);
                    
                    // Check if fixed and confirm
                    if (fixedSeats.has(`${row}-${seat}`)) {
                        if (!confirm('This is a fixed position. Remove anyway?')) {
                            return;
                        }
                        fixedSeats.delete(`${row}-${seat}`);
                    }
                    
                    // Remove the paddler
                    boat[row][seat] = null;
                    updateAndSave();
                });
                paddlerElement.appendChild(removeButton);
                
                paddlerElement.addEventListener('dragstart', handleDragStart);
                
                seatElement.appendChild(paddlerElement);
            }
        }
    }
}

// Show paddler dropdown for seat selection
function showPaddlerDropdown(rowIndex, seatIndex, seatElement) {
    // Remove any existing dropdowns
    document.querySelectorAll('.boat-paddler-dropdown').forEach(el => el.remove());
    
    // Check if seat is fixed
    const seatPosition = `${rowIndex}-${seatIndex}`;
    if (fixedSeats.has(seatPosition)) {
        return; // Don't show dropdown for fixed seats
    }
    
    // Create dropdown container
    const dropdown = document.createElement('div');
    dropdown.className = 'boat-paddler-dropdown';
    
    // Create search input
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.className = 'boat-paddler-search';
    searchInput.placeholder = 'Search paddlers...';
    dropdown.appendChild(searchInput);
    
    // Create paddler list container
    const paddlerListContainer = document.createElement('div');
    paddlerListContainer.className = 'boat-paddler-list';
    
    // Add empty option at the top
    const emptyOption = document.createElement('div');
    emptyOption.className = 'boat-paddler-item empty-option';
    emptyOption.textContent = '— Empty seat —';
    emptyOption.addEventListener('click', function() {
        // Remove paddler from this position
        if (boat[rowIndex][seatIndex]) {
            boat[rowIndex][seatIndex] = null;
            updateAndSave();
        }
        dropdown.remove();
    });
    paddlerListContainer.appendChild(emptyOption);
    
    // Determine which side paddlers can go here
    const side = seatIndex === 0 ? 'left' : 'right';
    
    // Filter eligible paddlers
    const eligiblePaddlers = paddlers.filter(p => 
        p.side === side || p.side === 'both'
    );
    
    // Create a paddler option for each eligible paddler
    eligiblePaddlers.forEach(paddler => {
        const paddlerOption = document.createElement('div');
        paddlerOption.className = 'boat-paddler-item';
        
        // Check if this paddler is already in the boat
        const isInBoat = isPaddlerInBoat(paddler);
        
        // Check if this is the currently selected paddler
        const isSelected = boat[rowIndex][seatIndex] && boat[rowIndex][seatIndex].id === paddler.id;
        
        if (isInBoat) {
            paddlerOption.classList.add('in-boat');
        }
        
        if (isSelected) {
            paddlerOption.classList.add('selected');
        }
          paddlerOption.innerHTML = `
            <div class="boat-paddler-name">${paddler.name}</div>
            <div class="boat-paddler-details">
                <span>${paddler.weight} kg | ${paddler.gender || 'M'}</span>
                <span class="side-${paddler.side}">${paddler.side}</span>
            </div>
        `;
        
        paddlerOption.addEventListener('click', function() {
            // If paddler is already somewhere else in the boat, remove them
            if (isInBoat && !isSelected) {
                removePaddlerFromBoat(paddler.id);
            }
            
            // Place paddler in this position
            boat[rowIndex][seatIndex] = paddler;
            updateAndSave();
            dropdown.remove();
        });
        
        paddlerListContainer.appendChild(paddlerOption);
    });
    
    dropdown.appendChild(paddlerListContainer);
    
    // Add search functionality
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        
        // Show empty option always
        emptyOption.style.display = 'block';
        
        // Filter paddler options
        paddlerListContainer.querySelectorAll('.boat-paddler-item:not(.empty-option)').forEach(option => {
            const name = option.querySelector('.boat-paddler-name').textContent.toLowerCase();
            if (name.includes(searchTerm)) {
                option.style.display = 'flex';
            } else {
                option.style.display = 'none';
            }
        });
    });
    
    // Position the dropdown
    document.body.appendChild(dropdown);
    
    // Position dropdown based on seat location
    const rect = seatElement.getBoundingClientRect();
    dropdown.style.top = `${rect.bottom + window.scrollY}px`;
    dropdown.style.left = `${rect.left + window.scrollX}px`;
    dropdown.style.minWidth = `${rect.width}px`;
    
    // Focus the search input
    setTimeout(() => {
        searchInput.focus();
    }, 100);
    
    // Close dropdown when clicking outside
    function closeDropdownOnOutsideClick(e) {
        if (!dropdown.contains(e.target) && !seatElement.contains(e.target)) {
            dropdown.remove();
            document.removeEventListener('mousedown', closeDropdownOnOutsideClick);
        }
    }
    
    // Add a slight delay to prevent immediate closing
    setTimeout(() => {
        document.addEventListener('mousedown', closeDropdownOnOutsideClick);
    }, 100);
}