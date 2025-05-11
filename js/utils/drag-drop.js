// Drag and drop handlers

// Handle drag start event
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

// Handle drag over event
function handleDragOver(e) {
    e.preventDefault();
    
    // During dragover, we can't reliably access the dataTransfer data in some browsers
    // So we'll just indicate it's a potential drop target and do full validation on drop
    this.classList.add('can-drop');
}

// Handle drag leave event
function handleDragLeave(e) {
    this.classList.remove('can-drop', 'cannot-drop');
}

// Handle drop event
// Complete the handleDrop function with the missing logic for handling drops

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
            this.classList.add('cannot-drop');
            setTimeout(() => {
                this.classList.remove('cannot-drop');
            }, 500);
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
                        break;
                    }
                }
                if (originalRow !== -1) break;
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
            }
        }
        // Case 3: Target has a paddler AND we're dragging from paddler list
        else {
            // Replace the existing paddler with the new one
            boat[row][seat] = paddler;
        }
        
        updateAndSave();
    } catch (error) {
        console.error("Error handling drop:", error);
    }
}