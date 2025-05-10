document.addEventListener('DOMContentLoaded', function() {
    // Data structures
    const paddlers = [];
    const boat = Array(10).fill().map(() => Array(2).fill(null)); // 10 rows, 2 seats per row (left, right)
    const fixedSeats = new Set(); // Store fixed seat positions as "row-side"
    
    // DOM elements
    const paddlerNameInput = document.getElementById('paddlerName');
    const paddlerWeightInput = document.getElementById('paddlerWeight');
    const paddlerSideSelect = document.getElementById('paddlerSide');
    const addPaddlerButton = document.getElementById('addPaddler');
    const paddlerListElement = document.getElementById('paddlerList');
    const boatLayoutElement = document.getElementById('boatLayout');
    const autoGenerateButton = document.getElementById('autoGenerateLineup');
    const balanceBoatButton = document.getElementById('balanceBoat');
    const exportLineupButton = document.getElementById('exportLineup');
    const importCsvButton = document.getElementById('importCsv');
    const exportCsvButton = document.getElementById('exportCsv');
    const clearAllButton = document.getElementById('clearAll');
    const csvFileInput = document.getElementById('csvFileInput');
    const clearPaddlersButton = document.getElementById('clearPaddlers');
    const clearSavedDataButton = document.getElementById('clearSavedData');

    
    // Statistics elements
    const leftWeightElement = document.getElementById('leftWeight');
    const rightWeightElement = document.getElementById('rightWeight');
    const weightDiffElement = document.getElementById('weightDiff');
    const filledSeatsElement = document.getElementById('filledSeats');
    
    // Initialize the boat layout
    initializeBoatLayout();
    
    // Event listeners
    addPaddlerButton.addEventListener('click', addPaddler);
    autoGenerateButton.addEventListener('click', autoGenerateLineup);
    balanceBoatButton.addEventListener('click', balanceBoat);
    exportLineupButton.addEventListener('click', exportLineup);
    // Also, update the import button click handler to ensure proper reset
    importCsvButton.addEventListener('click', () => {
        csvFileInput.value = ''; // Clear the input first
        csvFileInput.click();
    });
    exportCsvButton.addEventListener('click', exportTeam);
    clearAllButton.addEventListener('click', clearAll);
    csvFileInput.addEventListener('change', importTeam);
    clearPaddlersButton.addEventListener('click', clearPaddlers);
    clearSavedDataButton.addEventListener('click', clearSavedData);
    
    // Call this function whenever there's a change to paddlers or boat
    function updateAndSave() {
        renderPaddlerList();
        updateBoatLayout();
        updateSimplifiedLineup(); // Add this line
        saveToLocalStorage();
    }

    // Modify existing functions to save data after changes

    // Update the addPaddler function
    function addPaddler() {
        const name = paddlerNameInput.value.trim();
        const weight = parseFloat(paddlerWeightInput.value);
        const side = paddlerSideSelect.value;
        
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
            side
        };
        
        paddlers.push(paddler);
        
        // Use updateAndSave instead of just renderPaddlerList
        updateAndSave();
        
        // Clear form
        paddlerNameInput.value = '';
        paddlerWeightInput.value = '';
        paddlerSideSelect.value = 'left';
    }
    
// Update the renderPaddlerList function to allow toggling side directly
function renderPaddlerList() {
    paddlerListElement.innerHTML = '';
    
    if (paddlers.length === 0) {
        paddlerListElement.innerHTML = '<div class="empty-message">No paddlers added yet</div>';
        return;
    }
    
    // Show all paddlers, but mark those in the boat as "in-boat"
    paddlers.forEach(paddler => {
        const isInBoat = isPaddlerInBoat(paddler);
        const paddlerElement = document.createElement('div');
        paddlerElement.className = 'paddler-item';
        if (isInBoat) {
            paddlerElement.classList.add('in-boat');
        }
        paddlerElement.draggable = true;
        paddlerElement.dataset.id = paddler.id;
        
        const sideClass = `side-${paddler.side}`;
        
        paddlerElement.innerHTML = `
            <div>
                <div class="paddler-name">${paddler.name}</div>
                <div class="paddler-details">${paddler.weight} kg</div>
            </div>
            <div>
                <span class="paddler-side ${sideClass}" data-id="${paddler.id}">${paddler.side}</span>
            </div>
            <div class="paddler-actions">
                <button class="edit edit-paddler" data-id="${paddler.id}">✎</button>
                <button class="danger delete-paddler" data-id="${paddler.id}">✕</button>
            </div>
        `;
        
        paddlerElement.addEventListener('dragstart', handleDragStart);
        
        // Add click event to toggle the paddler in/out of the boat
        paddlerElement.addEventListener('click', (e) => {
            // Don't trigger if clicking the delete button, edit button, or side toggle
            if (e.target.classList.contains('delete-paddler') || 
                e.target.classList.contains('edit-paddler') ||
                e.target.classList.contains('paddler-side')) {
                return;
            }
            
            const id = parseInt(paddlerElement.dataset.id);
            togglePaddlerInBoat(id);
        });
        
        // Delete paddler button
        paddlerElement.querySelector('.delete-paddler').addEventListener('click', (e) => {
            e.stopPropagation();
            const id = parseInt(e.target.dataset.id);
            const index = paddlers.findIndex(p => p.id === id);
            if (index !== -1) {
                // Remove from boat first if the paddler is in the boat
                removePaddlerFromBoat(id);
                // Then remove from paddlers array
                paddlers.splice(index, 1);
                updateAndSave();
            }
        });
        
        // Edit paddler button
        paddlerElement.querySelector('.edit-paddler').addEventListener('click', (e) => {
            e.stopPropagation();
            const id = parseInt(e.target.dataset.id);
            showEditPaddlerModal(id);
        });
        
        // Toggle side preference on click
        paddlerElement.querySelector('.paddler-side').addEventListener('click', (e) => {
            e.stopPropagation();
            const id = parseInt(e.target.dataset.id);
            togglePaddlerSide(id);
        });
        
        paddlerListElement.appendChild(paddlerElement);
    });
}
    // Add this function to create a simplified lineup table
    // Refine the updateSimplifiedLineup function to make it more compact
    function updateSimplifiedLineup() {
        // Find or create the simplified lineup container
        let simplifiedLineupElement = document.getElementById('simplifiedLineup');
        if (!simplifiedLineupElement) {
            simplifiedLineupElement = document.createElement('div');
            simplifiedLineupElement.id = 'simplifiedLineup';
            simplifiedLineupElement.className = 'simplified-lineup';
            
            // Find the right location to insert (in sidebar, after paddler list)
            const sidebar = document.querySelector('.sidebar');
            if (sidebar) {
                sidebar.appendChild(simplifiedLineupElement);
            }
        }
        
        // Create the simplified boat table
        simplifiedLineupElement.innerHTML = '<h3>Final Lineup</h3>';
        const tableElement = document.createElement('table');
        tableElement.className = 'simplified-boat-table';
        
        // Create header row
        const headerRow = document.createElement('tr');
        const leftHeader = document.createElement('th');
        leftHeader.textContent = 'Left';
        const rowNumHeader = document.createElement('th');
        rowNumHeader.textContent = 'Row';
        const rightHeader = document.createElement('th');
        rightHeader.textContent = 'Right';
        
        headerRow.appendChild(leftHeader);
        headerRow.appendChild(rowNumHeader);
        headerRow.appendChild(rightHeader);
        tableElement.appendChild(headerRow);
        
        // Create rows for each position
        for (let i = 0; i < 10; i++) {
            const row = document.createElement('tr');
            
            // Left paddler
            const leftCell = document.createElement('td');
            if (boat[i][0]) {
                // Just show the name without any other information
                leftCell.textContent = boat[i][0].name;
                if (fixedSeats.has(`${i}-0`)) {
                    leftCell.classList.add('fixed');
                }
            } else {
                leftCell.innerHTML = '<span class="empty">—</span>';
            }
            
            // Row number
            const rowNumCell = document.createElement('td');
            rowNumCell.textContent = i + 1;
            rowNumCell.className = 'row-number';
            
            // Right paddler
            const rightCell = document.createElement('td');
            if (boat[i][1]) {
                // Just show the name without any other information
                rightCell.textContent = boat[i][1].name;
                if (fixedSeats.has(`${i}-1`)) {
                    rightCell.classList.add('fixed');
                }
            } else {
                rightCell.innerHTML = '<span class="empty">—</span>';
            }
            
            row.appendChild(leftCell);
            row.appendChild(rowNumCell);
            row.appendChild(rightCell);
            tableElement.appendChild(row);
        }
        
        simplifiedLineupElement.appendChild(tableElement);
    }

    // Add new function to toggle a paddler in/out of the boat
    function togglePaddlerInBoat(id) {
        const paddler = paddlers.find(p => p.id === id);
        if (!paddler) return;
        
        // Check if paddler is already in boat
        if (isPaddlerInBoat(paddler)) {
            // Remove from boat
            removePaddlerFromBoat(id);
        } else {
            // Add to first available seat matching their side preference
            let side = paddler.side;
            let sideToTry = side === 'both' ? 'left' : side; // Default to left if both
            
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

    // Add function to remove a paddler from the boat
    function removePaddlerFromBoat(id) {
        for (let i = 0; i < 10; i++) {
            for (let j = 0; j < 2; j++) {
                if (boat[i][j] && boat[i][j].id === id) {
                    const seatPosition = `${i}-${j}`;
                    // Remove from fixed seats if it was fixed
                    if (fixedSeats.has(seatPosition)) {
                        fixedSeats.delete(seatPosition);
                    }
                    boat[i][j] = null;
                }
            }
        }
        saveToLocalStorage();
    }
    
    function initializeBoatLayout() {
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
        
        updateBoatStatistics();
    }
    
    function clearSavedData() {
        if (confirm('Are you sure you want to delete all saved data? This cannot be undone.')) {
            localStorage.removeItem('dragonBoatData');
            window.location.reload();
        }
    }

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
        
        // Event listeners for drag and drop
        seatElement.addEventListener('dragover', handleDragOver);
        seatElement.addEventListener('dragleave', handleDragLeave);
        seatElement.addEventListener('drop', handleDrop);
        // Add dragenter event to ensure dragover fires consistently
        seatElement.addEventListener('dragenter', function(e) {
            e.preventDefault();
        });
        
        // Right-click to fix/unfix seat
        seatElement.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            const row = parseInt(this.dataset.row);
            const seat = parseInt(this.dataset.seat);
            const position = `${row}-${seat}`;
            
            // If there's no paddler, don't allow fixing
            if (!boat[row][seat]) {
                return;
            }
            
            if (fixedSeats.has(position)) {
                fixedSeats.delete(position);
                this.classList.remove('fixed');
            } else {
                fixedSeats.add(position);
                this.classList.add('fixed');
            }
            
            // Save changes to localStorage
            saveToLocalStorage();
        });
        
        return seatElement;
    }
    
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
                
                paddlerElement.innerHTML = `
                    <div class="paddler-name">${paddler.name}</div>
                    <div class="paddler-details">${paddler.weight} kg</div>
                `;
                
                paddlerElement.addEventListener('dragstart', handleDragStart);
                
                seatElement.appendChild(paddlerElement);
            }
        }
    }
    
    updateBoatStatistics();
}
function handleDragStart(e) {
    try {
        const id = parseInt(e.target.dataset.id);
        // Set data in multiple formats for better cross-browser compatibility
        e.dataTransfer.setData('text/plain', id);
        
        // Check if dragging from boat or from list
        const fromBoat = e.target.classList.contains('seat-paddler');
        
        // Store as JSON string
        const jsonData = JSON.stringify({ id, fromBoat });
        e.dataTransfer.setData('application/json', jsonData);
        
        e.target.classList.add('dragging');
    } catch (error) {
        console.error("Error starting drag:", error);
    }
}

function handleDragOver(e) {
    e.preventDefault();
    
    // During dragover, we can't reliably access the dataTransfer data in some browsers
    // So we'll just indicate it's a potential drop target and do full validation on drop
    this.classList.add('can-drop');
}

function handleDragLeave(e) {
    this.classList.remove('can-drop', 'cannot-drop');
}

// Update the handleDrop function to ensure we clean up properly
// Update the handleDrop function to handle switching paddlers
function handleDrop(e) {
    e.preventDefault();
    this.classList.remove('can-drop', 'cannot-drop');
    
    // Always clear any dragging classes first
    document.querySelectorAll('.dragging').forEach(el => {
        el.classList.remove('dragging');
    });
    
    try {
        // Get the dragged data - first try application/json format
        const jsonData = e.dataTransfer.getData('application/json');
        // Fallback to text/plain if needed
        const textData = e.dataTransfer.getData('text/plain');
        
        let id, fromBoat;
        
        if (jsonData) {
            const data = JSON.parse(jsonData);
            id = data.id;
            fromBoat = data.fromBoat;
        } else if (textData) {
            // If we only have text data, assume it's the ID and not from boat
            id = parseInt(textData);
            fromBoat = false;
        } else {
            return; // No valid data
        }
        
        const paddler = paddlers.find(p => p.id === id);
        if (!paddler) return;
        
        const row = parseInt(this.dataset.row);
        const seat = parseInt(this.dataset.seat);
        const seatSide = seat === 0 ? 'left' : 'right';
        
        // Check if this is a valid seat for this paddler
        const isValidSeat = paddler.side === 'both' || paddler.side === seatSide;
        
        // Check if the seat is fixed
        const seatPosition = `${row}-${seat}`;
        const isFixed = fixedSeats.has(seatPosition);
        
        if (!isValidSeat || isFixed) {
            return;
        }
        
        // Get the paddler currently in the target seat (if any)
        const existingPaddler = boat[row][seat];
        
        // If dragging from boat, get the original position
        let originalRow = -1;
        let originalSeat = -1;
        
        if (fromBoat) {
            for (let i = 0; i < 10; i++) {
                for (let j = 0; j < 2; j++) {
                    if (boat[i][j] && boat[i][j].id === id) {
                        originalRow = i;
                        originalSeat = j;
                    }
                }
            }
        }
        
        // Handle the drop - several cases to consider
        
        // Case 1: Target seat is empty - simple placement
        if (!existingPaddler) {
            if (fromBoat) {
                // Remove from original position
                boat[originalRow][originalSeat] = null;
            }
            // Place in new position
            boat[row][seat] = paddler;
        }
        // Case 2: Target has a paddler AND we're dragging from boat - swap paddlers
        else if (fromBoat) {
            // Check if the existing paddler can go to the original position
            const originalSeatSide = originalSeat === 0 ? 'left' : 'right';
            const canSwap = existingPaddler.side === 'both' || existingPaddler.side === originalSeatSide;
            
            if (canSwap) {
                // Swap paddlers
                boat[originalRow][originalSeat] = existingPaddler;
                boat[row][seat] = paddler;
            } else {
                // Can't swap - the existing paddler can't go to the original position
                // So just remove from original position and place in new position
                boat[originalRow][originalSeat] = null;
                boat[row][seat] = paddler;
                // Return the displaced paddler to the available list (it's already there)
            }
        }
        // Case 3: Target has a paddler AND we're dragging from paddler list
        else {
            // Replace the existing paddler with the new one
            boat[row][seat] = paddler;
            // The existing paddler is already in the available list
        }
        
        updateAndSave();
    } catch (error) {
        console.error("Error handling drop:", error);
    }
}

// Fix the autoGenerateLineup function to ensure paddlers are only used once
function autoGenerateLineup() {
    // First, keep all fixed paddlers in their positions
    const tempBoat = Array(10).fill().map(() => Array(2).fill(null));
    const usedPaddlers = new Set();
    
    // Place fixed paddlers first
    for (const position of fixedSeats) {
        const [row, seat] = position.split('-').map(Number);
        if (boat[row][seat]) {
            tempBoat[row][seat] = boat[row][seat];
            usedPaddlers.add(boat[row][seat].id);
        }
    }
    
    // Get available paddlers (not in fixed positions)
    const availablePaddlers = paddlers.filter(p => !usedPaddlers.has(p.id));
    
    // Separate by side preference
    let leftPaddlers = availablePaddlers.filter(p => p.side === 'left');
    let rightPaddlers = availablePaddlers.filter(p => p.side === 'right');
    let bothSidePaddlers = availablePaddlers.filter(p => p.side === 'both');
    
    // Sort by weight (heaviest first for better balance)
    leftPaddlers.sort((a, b) => b.weight - a.weight);
    rightPaddlers.sort((a, b) => b.weight - a.weight);
    bothSidePaddlers.sort((a, b) => b.weight - a.weight);
    
    // Fill remaining seats optimizing for weight balance
    let leftWeight = 0;
    let rightWeight = 0;
    
    // Calculate current weights from fixed paddlers
    for (let i = 0; i < 10; i++) {
        if (tempBoat[i][0]) {
            leftWeight += tempBoat[i][0].weight;
        }
        if (tempBoat[i][1]) {
            rightWeight += tempBoat[i][1].weight;
        }
    }
    
    // Count empty seats on each side
    let emptyLeftSeats = 0;
    let emptyRightSeats = 0;
    
    for (let i = 0; i < 10; i++) {
        if (!tempBoat[i][0]) emptyLeftSeats++;
        if (!tempBoat[i][1]) emptyRightSeats++;
    }
    
    // Distribute "both" paddlers based on empty seats and side needs
    while (bothSidePaddlers.length > 0 && (emptyLeftSeats > 0 || emptyRightSeats > 0)) {
        const paddler = bothSidePaddlers.shift();
        
        // Decide which side to place this paddler
        if (emptyLeftSeats === 0) {
            rightPaddlers.push(paddler);
            emptyRightSeats--;
        } else if (emptyRightSeats === 0) {
            leftPaddlers.push(paddler);
            emptyLeftSeats--;
        } else if (leftWeight <= rightWeight) {
            // Place on the lighter side
            leftPaddlers.push(paddler);
            emptyLeftSeats--;
        } else {
            rightPaddlers.push(paddler);
            emptyRightSeats--;
        }
    }
    
    // Re-sort after adding the "both" paddlers
    leftPaddlers.sort((a, b) => b.weight - a.weight);
    rightPaddlers.sort((a, b) => b.weight - a.weight);
    
    // Fill empty seats with available paddlers
    for (let i = 0; i < 10; i++) {
        // Left seat
        if (!tempBoat[i][0] && leftPaddlers.length > 0) {
            // Find best paddler for balance
            let bestIndex = 0;
            if (leftWeight > rightWeight) {
                // Find lightest paddler
                bestIndex = leftPaddlers.length - 1;
            }
            tempBoat[i][0] = leftPaddlers.splice(bestIndex, 1)[0];
            leftWeight += tempBoat[i][0].weight;
        }
        
        // Right seat
        if (!tempBoat[i][1] && rightPaddlers.length > 0) {
            // Find best paddler for balance
            let bestIndex = 0;
            if (rightWeight > leftWeight) {
                // Find lightest paddler
                bestIndex = rightPaddlers.length - 1;
            }
            tempBoat[i][1] = rightPaddlers.splice(bestIndex, 1)[0];
            rightWeight += tempBoat[i][1].weight;
        }
    }
    
    // Update boat with the new lineup
    for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 2; j++) {
            boat[i][j] = tempBoat[i][j];
        }
    }
    
    updateAndSave();
}
function optimizeRowDistribution() {
    // Get current paddlers from the boat, keeping track of which side they're on
    const leftSidePaddlers = [];
    const rightSidePaddlers = [];
    
    // First, collect all paddlers while preserving fixed positions
    for (let i = 0; i < 10; i++) {
        if (boat[i][0] && !fixedSeats.has(`${i}-0`)) {
            leftSidePaddlers.push({
                paddler: boat[i][0],
                originalRow: i
            });
            boat[i][0] = null; // Remove from boat temporarily
        }
        
        if (boat[i][1] && !fixedSeats.has(`${i}-1`)) {
            rightSidePaddlers.push({
                paddler: boat[i][1],
                originalRow: i
            });
            boat[i][1] = null; // Remove from boat temporarily
        }
    }
    
    // Sort paddlers by weight (heaviest first)
    leftSidePaddlers.sort((a, b) => b.paddler.weight - a.paddler.weight);
    rightSidePaddlers.sort((a, b) => b.paddler.weight - a.paddler.weight);
    
    // Define row priority - middle rows first
    const rowPriority = [4, 5, 3, 6, 2, 7, 1, 8, 0, 9];
    
    // Place left side paddlers in priority order
    for (const {paddler} of leftSidePaddlers) {
        for (const row of rowPriority) {
            if (!boat[row][0] && !fixedSeats.has(`${row}-0`)) {
                boat[row][0] = paddler;
                break;
            }
        }
    }
    
    // Place right side paddlers in priority order
    for (const {paddler} of rightSidePaddlers) {
        for (const row of rowPriority) {
            if (!boat[row][1] && !fixedSeats.has(`${row}-1`)) {
                boat[row][1] = paddler;
                break;
            }
        }
    }
    
    updateAndSave();
}
function balanceBoat() {
    // Get all paddlers in the boat who aren't in fixed positions
    const boatPaddlers = [];
    const fixedPaddlers = [];
    
    for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 2; j++) {
            const position = `${i}-${j}`;
            if (boat[i][j]) {
                if (fixedSeats.has(position)) {
                    fixedPaddlers.push({
                        paddler: boat[i][j],
                        row: i,
                        seat: j
                    });
                } else {
                    boatPaddlers.push({
                        paddler: boat[i][j],
                        row: i,
                        seat: j
                    });
                }
            }
        }
    }
    
    // If there are no non-fixed paddlers, can't balance
    if (boatPaddlers.length === 0) {
        alert('No movable paddlers to balance. Please add more paddlers or unfix some positions.');
        return;
    }
    
    // Remove all non-fixed paddlers from the boat
    for (const { row, seat } of boatPaddlers) {
        boat[row][seat] = null;
    }
    
    // Calculate current weight from fixed paddlers
    let fixedLeftWeight = 0;
    let fixedRightWeight = 0;
    
    for (const { paddler, seat } of fixedPaddlers) {
        if (seat === 0) {
            fixedLeftWeight += paddler.weight;
        } else {
            fixedRightWeight += paddler.weight;
        }
    }
    
    // Extract paddlers and separate by side preference
    const leftOnlyPaddlers = boatPaddlers
        .filter(p => p.paddler.side === 'left')
        .map(p => p.paddler);
        
    const rightOnlyPaddlers = boatPaddlers
        .filter(p => p.paddler.side === 'right')
        .map(p => p.paddler);
        
    const bothSidePaddlers = boatPaddlers
        .filter(p => p.paddler.side === 'both')
        .map(p => p.paddler);
    
    // Count available seats
    let leftSeatsAvailable = 10;
    let rightSeatsAvailable = 10;
    
    for (let i = 0; i < 10; i++) {
        if (boat[i][0] || fixedSeats.has(`${i}-0`)) leftSeatsAvailable--;
        if (boat[i][1] || fixedSeats.has(`${i}-1`)) rightSeatsAvailable--;
    }
    
    // Check if we have enough seats for side-specific paddlers
    if (leftOnlyPaddlers.length > leftSeatsAvailable) {
        alert(`Not enough left-side seats for all left-side paddlers. Need ${leftOnlyPaddlers.length} but only have ${leftSeatsAvailable}.`);
        return;
    }
    
    if (rightOnlyPaddlers.length > rightSeatsAvailable) {
        alert(`Not enough right-side seats for all right-side paddlers. Need ${rightOnlyPaddlers.length} but only have ${rightSeatsAvailable}.`);
        return;
    }
    
    // Place side-specific paddlers first
    for (const paddler of leftOnlyPaddlers) {
        const emptyLeftSeat = findEmptySeat(0);
        if (emptyLeftSeat) {
            boat[emptyLeftSeat.row][emptyLeftSeat.seat] = paddler;
            fixedLeftWeight += paddler.weight;
        }
    }
    
    for (const paddler of rightOnlyPaddlers) {
        const emptyRightSeat = findEmptySeat(1);
        if (emptyRightSeat) {
            boat[emptyRightSeat.row][emptyRightSeat.seat] = paddler;
            fixedRightWeight += paddler.weight;
        }
    }
    
    // For paddlers that can paddle on both sides, we need to find optimal distribution
    // We'll use a dynamic programming approach to minimize weight difference
    
    if (bothSidePaddlers.length > 0) {
        // Sort by weight for better optimization potential
        bothSidePaddlers.sort((a, b) => b.weight - a.weight);
        
        // Best configuration found so far
        let bestLeftSide = [];
        let bestRightSide = [];
        let bestWeightDiff = Infinity;
        
        // If we have a reasonable number of paddlers, try all permutations
        if (bothSidePaddlers.length <= 15) {
            // Generate all possible ways to distribute paddlers between sides
            // For each paddler, we need to decide: left or right?
            const totalCombinations = 2 ** bothSidePaddlers.length;
            
            for (let i = 0; i < totalCombinations; i++) {
                const leftSide = [];
                const rightSide = [];
                let leftWeight = fixedLeftWeight;
                let rightWeight = fixedRightWeight;
                let valid = true;
                
                // Use the bits of i to determine placement
                for (let j = 0; j < bothSidePaddlers.length; j++) {
                    const goesLeft = ((i >> j) & 1) === 1;
                    if (goesLeft) {
                        if (leftSide.length < leftSeatsAvailable) {
                            leftSide.push(bothSidePaddlers[j]);
                            leftWeight += bothSidePaddlers[j].weight;
                        } else {
                            valid = false;
                            break;
                        }
                    } else {
                        if (rightSide.length < rightSeatsAvailable) {
                            rightSide.push(bothSidePaddlers[j]);
                            rightWeight += bothSidePaddlers[j].weight;
                        } else {
                            valid = false;
                            break;
                        }
                    }
                }
                
                if (valid) {
                    const weightDiff = Math.abs(leftWeight - rightWeight);
                    if (weightDiff < bestWeightDiff) {
                        bestWeightDiff = weightDiff;
                        bestLeftSide = [...leftSide];
                        bestRightSide = [...rightSide];
                    }
                }
            }
        } else {
            // For larger numbers of paddlers, use a greedy algorithm
            bestLeftSide = [];
            bestRightSide = [];
            let leftWeight = fixedLeftWeight;
            let rightWeight = fixedRightWeight;
            
            // Sort paddlers by weight (heaviest first)
            bothSidePaddlers.sort((a, b) => b.weight - a.weight);
            
            for (const paddler of bothSidePaddlers) {
                if (leftWeight <= rightWeight && bestLeftSide.length < leftSeatsAvailable) {
                    bestLeftSide.push(paddler);
                    leftWeight += paddler.weight;
                } else if (bestRightSide.length < rightSeatsAvailable) {
                    bestRightSide.push(paddler);
                    rightWeight += paddler.weight;
                } else {
                    bestLeftSide.push(paddler);
                    leftWeight += paddler.weight;
                }
            }
        }
        
        // Place the paddlers according to the best distribution
        for (const paddler of bestLeftSide) {
            const emptyLeftSeat = findEmptySeat(0);
            if (emptyLeftSeat) {
                boat[emptyLeftSeat.row][emptyLeftSeat.seat] = paddler;
            }
        }
        
        for (const paddler of bestRightSide) {
            const emptyRightSeat = findEmptySeat(1);
            if (emptyRightSeat) {
                boat[emptyRightSeat.row][emptyRightSeat.seat] = paddler;
            }
        }
    }
    
    updateAndSave();
    optimizeRowDistribution();

}


// Add this function after the balanceBoat function:

function updateBoatStatistics() {
    let leftWeight = 0;
    let rightWeight = 0;
    let filledSeats = 0;
    
    // Calculate total weights for each side and count filled seats
    for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 2; j++) {
            if (boat[i][j]) {
                filledSeats++;
                if (j === 0) { // Left side
                    leftWeight += boat[i][j].weight;
                } else { // Right side
                    rightWeight += boat[i][j].weight;
                }
            }
        }
    }
    
    // Update DOM elements with the calculated values
    leftWeightElement.textContent = leftWeight.toFixed(1) + ' kg';
    rightWeightElement.textContent = rightWeight.toFixed(1) + ' kg';
    
    const weightDiff = Math.abs(leftWeight - rightWeight);
    weightDiffElement.textContent = weightDiff.toFixed(1) + ' kg';
    
    // Set color based on weight difference (red if unbalanced, green if balanced)
    if (weightDiff < 5) {
        weightDiffElement.classList.add('balanced');
        weightDiffElement.classList.remove('unbalanced');
    } else {
        weightDiffElement.classList.add('unbalanced');
        weightDiffElement.classList.remove('balanced');
    }
    
    // Update filled seats counter
    filledSeatsElement.textContent = `${filledSeats}/20`;
}

// Also, we need to add the isPaddlerInBoat function that's used in renderPaddlerList
function isPaddlerInBoat(paddler) {
    for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 2; j++) {
            if (boat[i][j] && boat[i][j].id === paddler.id) {
                return true;
            }
        }
    }
    return false;
}

// And we need the findEmptySeat function for the balanceBoat function
function findEmptySeat(side) {
    for (let i = 0; i < 10; i++) {
        if (!boat[i][side]) {
            const position = `${i}-${side}`;
            if (!fixedSeats.has(position)) {
                return { row: i, seat: side };
            }
        }
    }
    return null;
}

// Finally, we're missing exportLineup and exportTeam functions
function exportLineup() {
    const lineup = {
        paddlers: paddlers,
        boat: boat,
        fixedSeats: Array.from(fixedSeats)
    };
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(lineup));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "dragon_boat_lineup.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

function exportTeam() {
    // Create CSV content
    let csvContent = "Name,Weight,Side\n";
    
    paddlers.forEach(paddler => {
        csvContent += `${paddler.name},${paddler.weight},${paddler.side}\n`;
    });
    
    // Create download link
    const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "dragon_boat_team.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
}

// Save paddlers and boat state to localStorage
function saveToLocalStorage() {
    const data = {
        paddlers: paddlers,
        boat: boat,
        fixedSeats: Array.from(fixedSeats)
    };
    
    try {
        localStorage.setItem('dragonBoatData', JSON.stringify(data));
    } catch (error) {
        console.error('Failed to save to localStorage:', error);
    }
}

// Load paddlers and boat state from localStorage
function loadFromLocalStorage() {
    try {
        const savedData = localStorage.getItem('dragonBoatData');
        if (savedData) {
            const data = JSON.parse(savedData);
            
            // Load paddlers
            if (Array.isArray(data.paddlers)) {
                paddlers.length = 0; // Clear existing
                data.paddlers.forEach(p => paddlers.push(p));
            }
            
            // Load boat configuration
            if (Array.isArray(data.boat)) {
                for (let i = 0; i < 10; i++) {
                    for (let j = 0; j < 2; j++) {
                        boat[i][j] = data.boat[i] && data.boat[i][j] ? data.boat[i][j] : null;
                    }
                }
            }
            
            // Load fixed seats
            if (Array.isArray(data.fixedSeats)) {
                fixedSeats.clear();
                data.fixedSeats.forEach(seat => fixedSeats.add(seat));
            }
            
            // Update UI
            renderPaddlerList();
            updateBoatLayout();
            updateSimplifiedLineup(); // Add this line

            return true;
        }
        return false;
    } catch (error) {
        console.error('Failed to load from localStorage:', error);
        return false;
    }
}

// Call this function whenever there's a change to paddlers or boat
function updateAndSave() {
    renderPaddlerList();
    updateBoatLayout();
    saveToLocalStorage();
}

// Fix the importTeam function to allow importing the same file multiple times
function importTeam(e) {
    const file = e.target.files[0];
    if (!file) {
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const contents = e.target.result;
        const lines = contents.split('\n');
        
        // Create a map of existing paddlers by name for quick lookup
        const existingPaddlers = {};
        paddlers.forEach(p => {
            if (p && p.name) {  // Add check to ensure paddler has a name
                existingPaddlers[p.name.toLowerCase()] = p;
            }
        });
        
        // Skip header row
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;  // Skip empty lines
            
            // Handle both comma and potential quote-comma formats
            let parts;
            if (line.includes('"')) {
                // Handle quoted CSV format
                const regex = /(?:\"([^\"]*)\"|([^,]+)),(\d+\.?\d*),(\w+)/;
                const match = line.match(regex);
                if (match) {
                    const name = (match[1] || match[2]).trim();
                    parts = [name, match[3], match[4]];
                }
            } else {
                parts = line.split(',');
            }
            
            if (!parts || parts.length < 3) continue;
            
            const name = parts[0].trim();
            const weight = parseFloat(parts[1].trim());
            const side = parts[2].trim();
            
            if (!name || isNaN(weight) || !side) continue;
            
            // Check if paddler with this name already exists
            const lowerName = name.toLowerCase();
            if (existingPaddlers[lowerName]) {
                // Update existing paddler
                const existingPaddler = existingPaddlers[lowerName];
                existingPaddler.weight = weight;
                existingPaddler.side = side;
            } else {
                // Add new paddler
                const paddler = {
                    id: Date.now() + i, // Ensure unique IDs
                    name: name,
                    weight: weight,
                    side: side
                };
                
                paddlers.push(paddler);
            }
        }
        
        updateAndSave(); // Update in case any paddlers in the boat were modified
    };
    reader.readAsText(file);
    
    // Reset the file input to allow selecting the same file again
    // This must be done after the file is read to avoid issues
    setTimeout(() => {
        csvFileInput.value = '';
    }, 100);
}

// Update the clearAll function
function clearAll() {
    if (confirm('Are you sure you want to clear all paddlers and reset the boat?')) {
        // Clear the boat but keep the paddlers
        for (let i = 0; i < 10; i++) {
            for (let j = 0; j < 2; j++) {
                boat[i][j] = null;
            }
        }
        fixedSeats.clear();
        
        // Use updateAndSave instead
        updateAndSave();
    }
}


// Update the clearPaddlers function
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
        
        // Use updateAndSave instead
        updateAndSave();
    }
}

loadFromLocalStorage();

});