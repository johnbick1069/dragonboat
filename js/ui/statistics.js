// Boat statistics functionality
function updateBoatStatistics() {
    const leftWeightElement = document.getElementById('leftWeight');
    const rightWeightElement = document.getElementById('rightWeight');
    const weightDiffElement = document.getElementById('weightDiff');
    const filledSeatsElement = document.getElementById('filledSeats');
    
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