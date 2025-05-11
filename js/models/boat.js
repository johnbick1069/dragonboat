
// Initialize the boat model
function initializeBoatModel() {
    boat = Array(10).fill().map(() => Array(2).fill(null)); // 10 rows, 2 seats per row (left, right)
    fixedSeats = new Set(); // Store fixed seat positions as "row-seat"
}

// Find an empty seat on a specific side
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

// Toggle fixed status of a seat
function toggleSeatFixed(row, seat) {
    const position = `${row}-${seat}`;
    
    // If there's no paddler, don't allow fixing
    if (!boat[row][seat]) {
        return;
    }
    
    if (fixedSeats.has(position)) {
        fixedSeats.delete(position);
    } else {
        fixedSeats.add(position);
    }
    
    updateAndSave();
}