// Boat balancing algorithms

// Auto-generate a lineup considering weight balance
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
    
    // Count empty seats on each side
    let emptyLeftSeats = 0;
    let emptyRightSeats = 0;
    
    for (let i = 0; i < 10; i++) {
        if (!tempBoat[i][0]) emptyLeftSeats++;
        if (!tempBoat[i][1]) emptyRightSeats++;
    }
    
    // First, place specific side paddlers to ensure they get a seat
    // This first pass is just to fill basic seats, we'll optimize weight later
    
    // Place left-side paddlers first (up to available seats)
    for (const paddler of leftPaddlers) {
        if (emptyLeftSeats <= 0) break;
        
        // Find the first empty seat on the left side
        for (let i = 0; i < 10; i++) {
            if (!tempBoat[i][0] && !fixedSeats.has(`${i}-0`)) {
                tempBoat[i][0] = paddler;
                emptyLeftSeats--;
                break;
            }
        }
    }
    
    // Place right-side paddlers
    for (const paddler of rightPaddlers) {
        if (emptyRightSeats <= 0) break;
        
        // Find the first empty seat on the right side
        for (let i = 0; i < 10; i++) {
            if (!tempBoat[i][1] && !fixedSeats.has(`${i}-1`)) {
                tempBoat[i][1] = paddler;
                emptyRightSeats--;
                break;
            }
        }
    }
    
    // Distribute "both" paddlers to fill remaining seats
    // We'll do this evenly, ignoring weight for now, just to fill seats
    for (const paddler of bothSidePaddlers) {
        if (emptyLeftSeats <= 0 && emptyRightSeats <= 0) break;
        
        if (emptyLeftSeats > emptyRightSeats) {
            // Find the first empty seat on the left side
            for (let i = 0; i < 10; i++) {
                if (!tempBoat[i][0] && !fixedSeats.has(`${i}-0`)) {
                    tempBoat[i][0] = paddler;
                    emptyLeftSeats--;
                    break;
                }
            }
        } else {
            // Find the first empty seat on the right side
            for (let i = 0; i < 10; i++) {
                if (!tempBoat[i][1] && !fixedSeats.has(`${i}-1`)) {
                    tempBoat[i][1] = paddler;
                    emptyRightSeats--;
                    break;
                }
            }
        }
    }
    
    // Update boat with the initial lineup
    for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 2; j++) {
            boat[i][j] = tempBoat[i][j];
        }
    }
    
    // Use balanceBoat to optimize the weight distribution
    // The balanceBoat function will respect fixed positions
    // and optimize the weight balance
    balanceBoat();
    
    // Note: balanceBoat already calls updateAndSave() internally
}
// Balance the boat based on paddler weights
function balanceBoat() {
    // Get all paddlers in the boat who aren't in fixed positions
    const boatPaddlers = [];
    const fixedPaddlers = [];
    
    for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 2; j++) {
            if (boat[i][j]) {
                const position = `${i}-${j}`;
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
            // Try all possible distributions of "both" paddlers
            // This is a variation of the partition problem
            const totalBothPaddlers = bothSidePaddlers.length;
            const maxCombinations = 1 << totalBothPaddlers; // 2^n combinations
            
            for (let i = 0; i < maxCombinations; i++) {
                const leftSide = [];
                const rightSide = [];
                let leftTotal = fixedLeftWeight;
                let rightTotal = fixedRightWeight;
                
                // Check each bit position to determine which side the paddler goes
                for (let j = 0; j < totalBothPaddlers; j++) {
                    if ((i & (1 << j)) !== 0) {
                        leftSide.push(bothSidePaddlers[j]);
                        leftTotal += bothSidePaddlers[j].weight;
                    } else {
                        rightSide.push(bothSidePaddlers[j]);
                        rightTotal += bothSidePaddlers[j].weight;
                    }
                }
                
                // Check if we have enough seats for this distribution
                if (leftSide.length <= leftSeatsAvailable && rightSide.length <= rightSeatsAvailable) {
                    const weightDiff = Math.abs(leftTotal - rightTotal);
                    if (weightDiff < bestWeightDiff) {
                        bestLeftSide = leftSide;
                        bestRightSide = rightSide;
                        bestWeightDiff = weightDiff;
                    }
                }
            }
        } else {
            // For larger numbers of paddlers, use a greedy approach
            const leftSide = [];
            const rightSide = [];
            let leftTotal = fixedLeftWeight;
            let rightTotal = fixedRightWeight;
            
            // Assign each paddler to the lighter side
            for (const paddler of bothSidePaddlers) {
                if (leftSide.length >= leftSeatsAvailable) {
                    rightSide.push(paddler);
                    rightTotal += paddler.weight;
                } else if (rightSide.length >= rightSeatsAvailable) {
                    leftSide.push(paddler);
                    leftTotal += paddler.weight;
                } else if (leftTotal <= rightTotal) {
                    leftSide.push(paddler);
                    leftTotal += paddler.weight;
                } else {
                    rightSide.push(paddler);
                    rightTotal += paddler.weight;
                }
            }
            
            bestLeftSide = leftSide;
            bestRightSide = rightSide;
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
    optimizeRowDistribution();
    updateAndSave();
}