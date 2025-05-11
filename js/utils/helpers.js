// Utility functions for the application

// Optimize row distribution of paddlers based on weight
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
            boat[i][0] = null;
        }
        
        if (boat[i][1] && !fixedSeats.has(`${i}-1`)) {
            rightSidePaddlers.push({
                paddler: boat[i][1],
                originalRow: i
            });
            boat[i][1] = null;
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

// Clear all boat positions but keep paddlers in the list
function clearAll() {
    if (confirm('Are you sure you want to clear all paddlers and reset the boat?')) {
        // Clear the boat but keep the paddlers
        for (let i = 0; i < 10; i++) {
            for (let j = 0; j < 2; j++) {
                boat[i][j] = null;
            }
        }
        fixedSeats.clear();
        
        updateAndSave();
    }
}