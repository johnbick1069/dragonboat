// Lineup testing service - generates and evaluates all possible lineups

let lineupTestResults = [];
let savedLineups = []; // Persistent storage for saved lineups
let lineupTestConfig = {
    maxWeightDifference: 10, // kg
    maxMalePaddlers: 10,
    minMalePaddlers: 10
};

// Configuration for lineup testing
function showLineupTestConfig() {
    const modal = document.createElement('div');
    modal.id = 'lineupTestModal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content lineup-test-config">
            <span class="close">&times;</span>
            <h2>Lineup Testing Configuration</h2>
            <div class="config-section">
                <div class="form-group">
                    <label for="maxWeightDiff">Max Left/Right Weight Difference (kg)</label>
                    <input type="number" id="maxWeightDiff" value="${lineupTestConfig.maxWeightDifference}" min="0" max="50" step="0.5">
                </div>
                <div class="form-group">
                    <label for="maxMales">Maximum Male Paddlers</label>
                    <input type="number" id="maxMales" value="${lineupTestConfig.maxMalePaddlers}" min="0" max="20">
                </div>
                <div class="form-group">
                    <label for="minMales">Minimum Male Paddlers</label>
                    <input type="number" id="minMales" value="${lineupTestConfig.minMalePaddlers}" min="0" max="20">
                </div>
            </div>
            <div class="modal-actions">
                <button id="startLineupTest" class="primary">Start Testing</button>
                <button id="cancelLineupTest" class="secondary">Cancel</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Event listeners
    modal.querySelector('.close').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    modal.querySelector('#cancelLineupTest').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    modal.querySelector('#startLineupTest').addEventListener('click', () => {
        const maxWeightDiff = parseFloat(document.getElementById('maxWeightDiff').value);
        const maxMales = parseInt(document.getElementById('maxMales').value);
        const minMales = parseInt(document.getElementById('minMales').value);
        
        // Validate constraints
        if (minMales > maxMales) {
            alert('Minimum male paddlers cannot exceed maximum male paddlers.');
            return;
        }
        
        lineupTestConfig.maxWeightDifference = maxWeightDiff;
        lineupTestConfig.maxMalePaddlers = maxMales;
        lineupTestConfig.minMalePaddlers = minMales;
        
        document.body.removeChild(modal);
        runLineupTest();
    });
    
    // Show modal
    modal.style.display = 'block';
}

// Generate all possible lineups
function runLineupTest() {
    // Basic validation - need at least 20 paddlers to choose from
    if (paddlers.length < 20) {
        alert('You need at least 20 paddlers to test all lineups.');
        return;
    }
    
    const progressModal = showProgressModal();
    
    setTimeout(() => {
        try {
            const results = generateAllLineups();
            hideProgressModal(progressModal);
            
            if (results.length === 0) {
                alert('No valid lineups found with the current constraints. Try adjusting the weight difference or male paddler limits.');
                return;
            }
            
            showLineupResults(results);
        } catch (error) {
            hideProgressModal(progressModal);
            alert('Error generating lineups: ' + error.message);
            console.error('Lineup generation error:', error);
        }
    }, 100);
}

function showProgressModal() {
    const modal = document.createElement('div');
    modal.id = 'progressModal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content progress-modal">
            <h3>Generating Lineups...</h3>
            <div class="progress-bar">
                <div class="progress-fill" id="progressFill"></div>
            </div>
            <p id="progressText">Calculating possible combinations...</p>
        </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'block';
    return modal;
}

function hideProgressModal(modal) {
    if (modal && modal.parentNode) {
        document.body.removeChild(modal);
    }
}

function generateAllLineups() {
    // Get fixed paddlers and their positions
    const fixedPositions = getFixedPositions();
    const availablePaddlers = getAvailablePaddlers(fixedPositions);
    
    // Separate available seats by side
    const availableLeftSeats = getAvailableSeats(0, fixedPositions);
    const availableRightSeats = getAvailableSeats(1, fixedPositions);
    
    const totalSeats = availableLeftSeats.length + availableRightSeats.length;
    
    // Validate we have exactly 20 seats total (10 left + 10 right)
    if (availableLeftSeats.length + availableRightSeats.length !== 20 - fixedPositions.length) {
        throw new Error(`Invalid seat configuration. Expected 20 total seats, but have ${availableLeftSeats.length} left + ${availableRightSeats.length} right + ${fixedPositions.length} fixed.`);
    }
    
    if (availablePaddlers.length < totalSeats) {
        throw new Error(`Not enough paddlers. Need ${totalSeats} but only have ${availablePaddlers.length} available.`);
    }
    
    // Ensure we can make exactly 10 left and 10 right (accounting for fixed positions)
    const fixedLeftCount = fixedPositions.filter(pos => pos.seat === 0).length;
    const fixedRightCount = fixedPositions.filter(pos => pos.seat === 1).length;
    const neededLeftCount = 10 - fixedLeftCount;
    const neededRightCount = 10 - fixedRightCount;
    
    if (neededLeftCount < 0 || neededRightCount < 0) {
        throw new Error(`Too many fixed positions. Need exactly 10 left and 10 right paddlers total.`);
    }
    
    // Check computational complexity
    const combinations = getCombinationsCount(availablePaddlers.length, totalSeats);
    if (combinations > 1000000) {
        throw new Error(`Too many combinations to process (${combinations}). Try fixing more paddler positions or reducing the number of paddlers.`);
    }
    
    // Generate all possible combinations of paddlers to fill available seats
    const lineups = [];
    const combinations_list = generateCombinations(availablePaddlers, totalSeats);
    
    let processed = 0;
    const total = combinations_list.length;
    
    for (const combination of combinations_list) {
        // Check for duplicates in combination (should not happen but safety check)
        if (hasDuplicates(combination)) {
            continue;
        }
        
        // Try all possible left/right assignments for this combination
        const assignments = generateLeftRightAssignments(combination, neededLeftCount, neededRightCount);
        
        for (const assignment of assignments) {
            if (isValidLineup(assignment, fixedPositions)) {
                try {
                    const lineup = createLineupObject(assignment, fixedPositions);
                    if (lineup && isValidCompleteLineup(lineup)) {
                        lineups.push(lineup);
                    }
                } catch (error) {
                    console.warn('Error creating lineup object:', error);
                }
            }
        }
        
        processed++;
        if (processed % 10 === 0) {
            updateProgress(processed / total * 100);
        }
    }
    
    // Sort by score (lower TT sum is better, but if no TT results, sort by weight balance)
    lineups.sort((a, b) => {
        if (a.ttSum > 0 && b.ttSum > 0) {
            return a.ttSum - b.ttSum;
        } else if (a.ttSum > 0 && b.ttSum === 0) {
            return -1;
        } else if (a.ttSum === 0 && b.ttSum > 0) {
            return 1;
        } else {
            return a.weightDiff - b.weightDiff;
        }
    });
    
    lineupTestResults = lineups;
    
    // Also add to saved lineups (append new results)
    const newLineupIds = new Set(lineups.map(l => l.id));
    const existingSavedIds = new Set(savedLineups.map(l => l.id));
    
    // Add only new lineups to avoid duplicates
    const newLineups = lineups.filter(l => !existingSavedIds.has(l.id));
    savedLineups = [...savedLineups, ...newLineups];
    
    // Keep only the best 200 lineups to prevent storage issues
    if (savedLineups.length > 200) {
        savedLineups.sort((a, b) => {
            if (a.ttSum > 0 && b.ttSum > 0) {
                return a.ttSum - b.ttSum;
            } else if (a.ttSum > 0 && b.ttSum === 0) {
                return -1;
            } else if (a.ttSum === 0 && b.ttSum > 0) {
                return 1;
            } else {
                return a.weightDiff - b.weightDiff;
            }
        });
        savedLineups = savedLineups.slice(0, 200);
    }
    
    return lineups;
}

function getCombinationsCount(n, k) {
    if (k > n) return 0;
    if (k === 0 || k === n) return 1;
    
    let result = 1;
    for (let i = 0; i < k; i++) {
        result = result * (n - i) / (i + 1);
    }
    return Math.floor(result);
}

function getFixedPositions() {
    const fixed = [];
    for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 2; j++) {
            const position = `${i}-${j}`;
            if (fixedSeats.has(position) && boat[i][j]) {
                fixed.push({
                    row: i,
                    seat: j,
                    paddler: boat[i][j]
                });
            }
        }
    }
    return fixed;
}

function getAvailablePaddlers(fixedPositions) {
    const fixedIds = new Set(fixedPositions.map(pos => pos.paddler.id));
    return paddlers.filter(p => !fixedIds.has(p.id));
}

function getAvailableSeats(side, fixedPositions) {
    const seats = [];
    for (let i = 0; i < 10; i++) {
        const position = `${i}-${side}`;
        if (!fixedSeats.has(position)) {
            seats.push(i);
        }
    }
    return seats;
}

function generateCombinations(arr, k) {
    const result = [];
    
    function combine(start, combo) {
        if (combo.length === k) {
            result.push([...combo]);
            return;
        }
        
        for (let i = start; i < arr.length; i++) {
            combo.push(arr[i]);
            combine(i + 1, combo);
            combo.pop();
        }
    }
    
    combine(0, []);
    return result;
}

function generateLeftRightAssignments(paddlers, leftCount, rightCount) {
    const assignments = [];
    
    // Validate that we're asking for the right number of paddlers
    if (leftCount + rightCount !== paddlers.length) {
        return assignments; // Return empty if counts don't match
    }
    
    // Validate that this specific combination of paddlers can satisfy the requirements
    const leftOnlyCount = paddlers.filter(p => p.side === 'left').length;
    const rightOnlyCount = paddlers.filter(p => p.side === 'right').length;
    const bothSidesCount = paddlers.filter(p => p.side === 'both').length;
    
    // Check if this combination can fill both sides
    const maxLeft = leftOnlyCount + bothSidesCount;
    const maxRight = rightOnlyCount + bothSidesCount;
    
    // Skip this combination if it's impossible to assign correctly
    if (maxLeft < leftCount || maxRight < rightCount) {
        return assignments;
    }
    
    // Generate all ways to choose 'leftCount' paddlers for left side
    const leftCombinations = generateCombinations(paddlers, leftCount);
    
    for (const leftPaddlers of leftCombinations) {
        const rightPaddlers = paddlers.filter(p => !leftPaddlers.includes(p));
        
        // Double-check we have the right count
        if (rightPaddlers.length !== rightCount) {
            continue;
        }
        
        // Check if assignment is valid based on side preferences
        if (isValidSideAssignment(leftPaddlers, rightPaddlers)) {
            assignments.push({
                left: leftPaddlers,
                right: rightPaddlers
            });
        }
    }
    
    return assignments;
}

// Check for duplicate paddlers in a combination
function hasDuplicates(paddlers) {
    const ids = paddlers.map(p => p.id);
    return ids.length !== new Set(ids).size;
}

// Validate that a complete lineup has exactly 10 left and 10 right paddlers with no duplicates
function isValidCompleteLineup(lineup) {
    const leftPaddlers = [];
    const rightPaddlers = [];
    const allPaddlerIds = new Set();
    
    // Collect all paddlers from the boat
    for (let i = 0; i < 10; i++) {
        if (lineup.boat[i][0]) {
            leftPaddlers.push(lineup.boat[i][0]);
            if (allPaddlerIds.has(lineup.boat[i][0].id)) {
                console.warn('Duplicate paddler found on left side:', lineup.boat[i][0].name);
                return false;
            }
            allPaddlerIds.add(lineup.boat[i][0].id);
        }
        
        if (lineup.boat[i][1]) {
            rightPaddlers.push(lineup.boat[i][1]);
            if (allPaddlerIds.has(lineup.boat[i][1].id)) {
                console.warn('Duplicate paddler found on right side:', lineup.boat[i][1].name);
                return false;
            }
            allPaddlerIds.add(lineup.boat[i][1].id);
        }
    }
    
    // Check that we have exactly 10 on each side
    if (leftPaddlers.length !== 10) {
        console.warn(`Invalid left side count: ${leftPaddlers.length}, expected 10`);
        return false;
    }
    
    if (rightPaddlers.length !== 10) {
        console.warn(`Invalid right side count: ${rightPaddlers.length}, expected 10`);
        return false;
    }
    
    // Validate side preferences
    for (const paddler of leftPaddlers) {
        if (paddler.side !== 'left' && paddler.side !== 'both') {
            console.warn(`Paddler ${paddler.name} assigned to left but prefers ${paddler.side}`);
            return false;
        }
    }
    
    for (const paddler of rightPaddlers) {
        if (paddler.side !== 'right' && paddler.side !== 'both') {
            console.warn(`Paddler ${paddler.name} assigned to right but prefers ${paddler.side}`);
            return false;
        }
    }
    
    return true;
}

function isValidSideAssignment(leftPaddlers, rightPaddlers) {
    // Check if paddlers can paddle on their assigned sides
    for (const paddler of leftPaddlers) {
        if (paddler.side !== 'left' && paddler.side !== 'both') {
            return false;
        }
    }
    
    for (const paddler of rightPaddlers) {
        if (paddler.side !== 'right' && paddler.side !== 'both') {
            return false;
        }
    }
    
    return true;
}

function isValidLineup(assignment, fixedPositions) {
    // Validate counts
    const fixedLeftCount = fixedPositions.filter(pos => pos.seat === 0).length;
    const fixedRightCount = fixedPositions.filter(pos => pos.seat === 1).length;
    const totalLeft = fixedLeftCount + assignment.left.length;
    const totalRight = fixedRightCount + assignment.right.length;
    
    // Must have exactly 10 on each side
    if (totalLeft !== 10 || totalRight !== 10) {
        return false;
    }
    
    // Check for duplicates between assignment and fixed positions
    const fixedIds = new Set(fixedPositions.map(pos => pos.paddler.id));
    const assignedIds = new Set([...assignment.left, ...assignment.right].map(p => p.id));
    
    // Check if there's any overlap between fixed and assigned paddlers
    for (const id of assignedIds) {
        if (fixedIds.has(id)) {
            return false; // Duplicate found
        }
    }
    
    // Calculate total weights
    const fixedLeftWeight = fixedPositions
        .filter(pos => pos.seat === 0)
        .reduce((sum, pos) => sum + pos.paddler.weight, 0);
    
    const fixedRightWeight = fixedPositions
        .filter(pos => pos.seat === 1)
        .reduce((sum, pos) => sum + pos.paddler.weight, 0);
    
    const leftWeight = fixedLeftWeight + assignment.left.reduce((sum, p) => sum + p.weight, 0);
    const rightWeight = fixedRightWeight + assignment.right.reduce((sum, p) => sum + p.weight, 0);
    
    // Check weight difference constraint
    if (Math.abs(leftWeight - rightWeight) > lineupTestConfig.maxWeightDifference) {
        return false;
    }
    
    // Check male paddler constraints
    const fixedMales = fixedPositions.filter(pos => pos.paddler.gender === 'M').length;
    const assignedMales = [...assignment.left, ...assignment.right].filter(p => p.gender === 'M').length;
    const totalMales = fixedMales + assignedMales;
    
    if (totalMales > lineupTestConfig.maxMalePaddlers) {
        return false;
    }
    
    if (totalMales < lineupTestConfig.minMalePaddlers) {
        return false;
    }
    
    return true;
}

function createLineupObject(assignment, fixedPositions) {
    // Create a copy of the current boat
    const lineupBoat = Array(10).fill().map(() => Array(2).fill(null));
    
    // Place fixed paddlers
    for (const pos of fixedPositions) {
        lineupBoat[pos.row][pos.seat] = pos.paddler;
    }
    
    // Get available seats
    const availableLeftSeats = getAvailableSeats(0, fixedPositions);
    const availableRightSeats = getAvailableSeats(1, fixedPositions);
    
    // Place left paddlers
    for (let i = 0; i < assignment.left.length; i++) {
        const row = availableLeftSeats[i];
        lineupBoat[row][0] = assignment.left[i];
    }
    
    // Place right paddlers
    for (let i = 0; i < assignment.right.length; i++) {
        const row = availableRightSeats[i];
        lineupBoat[row][1] = assignment.right[i];
    }
    
    // Optimize row distribution (heavy in middle)
    optimizeRowsForLineup(lineupBoat);
    
    // Calculate statistics
    const stats = calculateLineupStats(lineupBoat);
    
    return {
        boat: lineupBoat,
        ...stats,
        id: Date.now() + Math.random()
    };
}

function optimizeRowsForLineup(lineupBoat) {
    // Get movable paddlers (not fixed) - we need to check the current global fixedSeats
    const leftPaddlers = [];
    const rightPaddlers = [];
    
    for (let i = 0; i < 10; i++) {
        const leftPos = `${i}-0`;
        const rightPos = `${i}-1`;
        
        if (lineupBoat[i][0] && !fixedSeats.has(leftPos)) {
            leftPaddlers.push(lineupBoat[i][0]);
            lineupBoat[i][0] = null;
        }
        if (lineupBoat[i][1] && !fixedSeats.has(rightPos)) {
            rightPaddlers.push(lineupBoat[i][1]);
            lineupBoat[i][1] = null;
        }
    }
    
    // Sort by weight (heaviest first)
    leftPaddlers.sort((a, b) => b.weight - a.weight);
    rightPaddlers.sort((a, b) => b.weight - a.weight);
    
    // Row priority (middle rows first)
    const rowPriority = [4, 5, 3, 6, 2, 7, 1, 8, 0, 9];
    
    // Place paddlers in priority order
    for (const paddler of leftPaddlers) {
        for (const row of rowPriority) {
            const pos = `${row}-0`;
            if (!lineupBoat[row][0] && !fixedSeats.has(pos)) {
                lineupBoat[row][0] = paddler;
                break;
            }
        }
    }
    
    for (const paddler of rightPaddlers) {
        for (const row of rowPriority) {
            const pos = `${row}-1`;
            if (!lineupBoat[row][1] && !fixedSeats.has(pos)) {
                lineupBoat[row][1] = paddler;
                break;
            }
        }
    }
}

function calculateLineupStats(lineupBoat) {
    let leftWeight = 0, rightWeight = 0;
    let frontWeight = 0, backWeight = 0;
    let ttSum = 0;
    let maleCount = 0, femaleCount = 0;
    const paddlersInBoat = [];
    
    for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 2; j++) {
            if (lineupBoat[i][j]) {
                const paddler = lineupBoat[i][j];
                paddlersInBoat.push(paddler);
                
                if (j === 0) leftWeight += paddler.weight;
                else rightWeight += paddler.weight;
                
                if (i < 5) frontWeight += paddler.weight;
                else backWeight += paddler.weight;
                
                if (paddler.ttResults && !isNaN(paddler.ttResults)) {
                    ttSum += paddler.ttResults;
                }
                
                if (paddler.gender === 'M') maleCount++;
                else femaleCount++;
            }
        }
    }
    
    const paddlersNotInBoat = paddlers.filter(p => 
        !paddlersInBoat.some(pb => pb.id === p.id)
    );
    
    return {
        leftWeight,
        rightWeight,
        weightDiff: Math.abs(leftWeight - rightWeight),
        frontWeight,
        backWeight,
        frontBackDiff: Math.abs(frontWeight - backWeight),
        ttSum,
        maleCount,
        femaleCount,
        paddlersInBoat,
        paddlersNotInBoat
    };
}

function updateProgress(percent) {
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    if (progressFill) {
        progressFill.style.width = percent + '%';
    }
    
    if (progressText) {
        progressText.textContent = `Processing... ${Math.round(percent)}%`;
    }
}

function showLineupResults(lineups) {
    // Save the lineups for future viewing
    savedLineups = [...lineups];
    saveSavedLineupsToStorage();
    
    const modal = document.createElement('div');
    modal.id = 'lineupResultsModal';
    modal.className = 'modal lineup-results-modal';
    modal.innerHTML = `
        <div class="modal-content lineup-results">
            <span class="close">&times;</span>
            <h2>Lineup Test Results</h2>
            <div class="results-info">
                <p>Found <strong>${lineups.length}</strong> valid lineups</p>
                <div class="results-controls">
                    <button id="sortByScoreAsc" class="secondary">TT Score ↑</button>
                    <button id="sortByScoreDesc" class="secondary">TT Score ↓</button>
                    <button id="sortByWeightAsc" class="secondary">Weight Diff ↑</button>
                    <button id="sortByWeightDesc" class="secondary">Weight Diff ↓</button>
                    <button id="clearSavedLineups" class="danger">Clear Saved</button>
                </div>
            </div>
            <div class="lineup-list" id="lineupList">
                ${generateLineupListHTML(lineups)}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Event listeners
    modal.querySelector('.close').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    modal.querySelector('#sortByScoreAsc').addEventListener('click', () => {
        lineups.sort((a, b) => {
            if (a.ttSum === 0 && b.ttSum === 0) return a.weightDiff - b.weightDiff;
            if (a.ttSum === 0) return 1;
            if (b.ttSum === 0) return -1;
            return a.ttSum - b.ttSum;
        });
        updateLineupList(lineups);
    });
    
    modal.querySelector('#sortByScoreDesc').addEventListener('click', () => {
        lineups.sort((a, b) => {
            if (a.ttSum === 0 && b.ttSum === 0) return b.weightDiff - a.weightDiff;
            if (a.ttSum === 0) return 1;
            if (b.ttSum === 0) return -1;
            return b.ttSum - a.ttSum;
        });
        updateLineupList(lineups);
    });
    
    modal.querySelector('#sortByWeightAsc').addEventListener('click', () => {
        lineups.sort((a, b) => a.weightDiff - b.weightDiff);
        updateLineupList(lineups);
    });
    
    modal.querySelector('#sortByWeightDesc').addEventListener('click', () => {
        lineups.sort((a, b) => b.weightDiff - a.weightDiff);
        updateLineupList(lineups);
    });
    
    modal.querySelector('#clearSavedLineups').addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all saved lineups?')) {
            savedLineups = [];
            saveSavedLineupsToStorage();
            alert('Saved lineups cleared!');
        }
    });
    
    // Add event listeners for lineup actions
    addLineupActionListeners();
    
    modal.style.display = 'block';
}

function generateLineupListHTML(lineups) {
    return lineups.slice(0, 50).map((lineup, index) => `
        <div class="lineup-item" data-lineup-id="${lineup.id}">
            <div class="lineup-rank">#${index + 1}</div>
            <div class="lineup-stats">
                <div class="stat-group">
                    <span class="stat-label">L/R Weight:</span>
                    <span class="stat-value">${lineup.leftWeight.toFixed(1)} / ${lineup.rightWeight.toFixed(1)} kg</span>
                    <span class="stat-diff ${lineup.weightDiff <= 5 ? 'good' : lineup.weightDiff <= 10 ? 'ok' : 'bad'}">
                        (±${lineup.weightDiff.toFixed(1)})
                    </span>
                </div>
                <div class="stat-group">
                    <span class="stat-label">TT Score:</span>
                    <span class="stat-value">${lineup.ttSum > 0 ? lineup.ttSum.toFixed(1) : 'N/A'}</span>
                </div>
                <div class="stat-group">
                    <span class="stat-label">M/F:</span>
                    <span class="stat-value">${lineup.maleCount}/${lineup.femaleCount}</span>
                </div>
                <div class="stat-group">
                    <span class="stat-label">Not in boat:</span>
                    <span class="stat-value">${lineup.paddlersNotInBoat.map(p => p.name).join(', ') || 'None'}</span>
                </div>
            </div>
            <div class="lineup-actions">
                <button class="preview-lineup" data-lineup-id="${lineup.id}">Preview</button>
                <button class="apply-lineup" data-lineup-id="${lineup.id}">Apply</button>
            </div>
        </div>
    `).join('');
}

function updateLineupList(lineups) {
    const lineupList = document.getElementById('lineupList');
    if (lineupList) {
        lineupList.innerHTML = generateLineupListHTML(lineups);
        addLineupActionListeners();
    }
}

function addLineupActionListeners() {
    document.querySelectorAll('.preview-lineup').forEach(button => {
        button.addEventListener('click', (e) => {
            const lineupId = e.target.dataset.lineupId;
            previewLineup(lineupId);
        });
    });
    
    document.querySelectorAll('.apply-lineup').forEach(button => {
        button.addEventListener('click', (e) => {
            const lineupId = e.target.dataset.lineupId;
            applyLineup(lineupId);
        });
    });
}

function previewLineup(lineupId) {
    const lineup = lineupTestResults.find(l => l.id == lineupId);
    if (!lineup) return;
    
    // Store current boat state
    const originalBoat = boat.map(row => [...row]);
    
    // Apply preview
    for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 2; j++) {
            boat[i][j] = lineup.boat[i][j];
        }
    }
    
    updateAndSave();
    
    // Show preview indicator
    showPreviewIndicator(originalBoat);
}

function applyLineup(lineupId) {
    const lineup = lineupTestResults.find(l => l.id == lineupId);
    if (!lineup) return;
    
    if (confirm('Apply this lineup? This will replace the current boat configuration.')) {
        for (let i = 0; i < 10; i++) {
            for (let j = 0; j < 2; j++) {
                boat[i][j] = lineup.boat[i][j];
            }
        }
        
        updateAndSave();
        
        // Close the results modal
        const modal = document.getElementById('lineupResultsModal');
        if (modal) {
            document.body.removeChild(modal);
        }
    }
}

function showPreviewIndicator(originalBoat) {
    const indicator = document.createElement('div');
    indicator.id = 'previewIndicator';
    indicator.className = 'preview-indicator';
    indicator.innerHTML = `
        <div class="preview-content">
            <span>PREVIEW MODE</span>
            <button id="revertPreview">Revert</button>
        </div>
    `;
    
    document.body.appendChild(indicator);
    
    document.getElementById('revertPreview').addEventListener('click', () => {
        // Restore original boat state
        for (let i = 0; i < 10; i++) {
            for (let j = 0; j < 2; j++) {
                boat[i][j] = originalBoat[i][j];
            }
        }
        
        updateAndSave();
        document.body.removeChild(indicator);
    });
}

// Show saved lineups
function showSavedLineups() {
    loadSavedLineupsFromStorage();
    
    if (savedLineups.length === 0) {
        alert('No saved lineups found. Run "Test All Lineups" first to generate and save lineups.');
        return;
    }
    
    const modal = document.createElement('div');
    modal.id = 'savedLineupsModal';
    modal.className = 'modal lineup-results-modal';
    modal.innerHTML = `
        <div class="modal-content lineup-results">
            <span class="close">&times;</span>
            <h2>Saved Lineups</h2>
            <div class="results-info">
                <p>Showing <strong>${savedLineups.length}</strong> saved lineups</p>
                <div class="results-controls">
                    <button id="sortByScoreAsc" class="secondary">TT Score ↑</button>
                    <button id="sortByScoreDesc" class="secondary">TT Score ↓</button>
                    <button id="sortByWeightAsc" class="secondary">Weight Diff ↑</button>
                    <button id="sortByWeightDesc" class="secondary">Weight Diff ↓</button>
                    <button id="clearAllSaved" class="danger">Clear All</button>
                </div>
            </div>
            <div class="lineup-list" id="lineupList">
                ${generateSavedLineupListHTML(savedLineups)}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Event listeners
    modal.querySelector('.close').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    modal.querySelector('#sortByScoreAsc').addEventListener('click', () => {
        savedLineups.sort((a, b) => {
            if (a.ttSum === 0 && b.ttSum === 0) return a.weightDiff - b.weightDiff;
            if (a.ttSum === 0) return 1;
            if (b.ttSum === 0) return -1;
            return a.ttSum - b.ttSum;
        });
        updateSavedLineupList(savedLineups);
    });
    
    modal.querySelector('#sortByScoreDesc').addEventListener('click', () => {
        savedLineups.sort((a, b) => {
            if (a.ttSum === 0 && b.ttSum === 0) return b.weightDiff - a.weightDiff;
            if (a.ttSum === 0) return 1;
            if (b.ttSum === 0) return -1;
            return b.ttSum - a.ttSum;
        });
        updateSavedLineupList(savedLineups);
    });
    
    modal.querySelector('#sortByWeightAsc').addEventListener('click', () => {
        savedLineups.sort((a, b) => a.weightDiff - b.weightDiff);
        updateSavedLineupList(savedLineups);
    });
    
    modal.querySelector('#sortByWeightDesc').addEventListener('click', () => {
        savedLineups.sort((a, b) => b.weightDiff - a.weightDiff);
        updateSavedLineupList(savedLineups);
    });
    
    modal.querySelector('#clearAllSaved').addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all saved lineups? This cannot be undone.')) {
            savedLineups = [];
            saveSavedLineupsToStorage();
            document.body.removeChild(modal);
            alert('All saved lineups have been cleared.');
        }
    });
    
    // Add event listeners for lineup actions
    addSavedLineupActionListeners();
    
    modal.style.display = 'block';
}

function generateSavedLineupListHTML(lineups) {
    return lineups.slice(0, 100).map((lineup, index) => `
        <div class="lineup-item" data-lineup-id="${lineup.id}">
            <div class="lineup-rank">#${index + 1}</div>
            <div class="lineup-stats">
                <div class="stat-group">
                    <span class="stat-label">L/R Weight:</span>
                    <span class="stat-value">${lineup.leftWeight.toFixed(1)} / ${lineup.rightWeight.toFixed(1)} kg</span>
                    <span class="stat-diff ${lineup.weightDiff <= 5 ? 'good' : lineup.weightDiff <= 10 ? 'ok' : 'bad'}">
                        (±${lineup.weightDiff.toFixed(1)})
                    </span>
                </div>
                <div class="stat-group">
                    <span class="stat-label">TT Score:</span>
                    <span class="stat-value ${lineup.ttSum > 0 ? (lineup.ttSum < 180 ? 'good' : lineup.ttSum < 200 ? 'ok' : 'bad') : ''}">${lineup.ttSum > 0 ? lineup.ttSum.toFixed(1) : 'N/A'}</span>
                </div>
                <div class="stat-group">
                    <span class="stat-label">M/F:</span>
                    <span class="stat-value">${lineup.maleCount}/${lineup.femaleCount}</span>
                </div>
                <div class="stat-group">
                    <span class="stat-label">Not in boat:</span>
                    <span class="stat-value">${lineup.paddlersNotInBoat.map(p => p.name).join(', ') || 'None'}</span>
                </div>
            </div>
            <div class="lineup-actions">
                <button class="preview-saved-lineup" data-lineup-id="${lineup.id}">Preview</button>
                <button class="apply-saved-lineup" data-lineup-id="${lineup.id}">Apply</button>
                <button class="delete-saved-lineup" data-lineup-id="${lineup.id}">Delete</button>
            </div>
        </div>
    `).join('');
}

function updateSavedLineupList(lineups) {
    const lineupList = document.getElementById('lineupList');
    if (lineupList) {
        lineupList.innerHTML = generateSavedLineupListHTML(lineups);
        addSavedLineupActionListeners();
    }
}

function addSavedLineupActionListeners() {
    document.querySelectorAll('.preview-saved-lineup').forEach(button => {
        button.addEventListener('click', (e) => {
            const lineupId = e.target.dataset.lineupId;
            previewSavedLineup(lineupId);
        });
    });
    
    document.querySelectorAll('.apply-saved-lineup').forEach(button => {
        button.addEventListener('click', (e) => {
            const lineupId = e.target.dataset.lineupId;
            applySavedLineup(lineupId);
        });
    });
    
    document.querySelectorAll('.delete-saved-lineup').forEach(button => {
        button.addEventListener('click', (e) => {
            const lineupId = e.target.dataset.lineupId;
            deleteSavedLineup(lineupId);
        });
    });
}

function previewSavedLineup(lineupId) {
    const lineup = savedLineups.find(l => l.id == lineupId);
    if (!lineup) return;
    
    // Store current boat state
    const originalBoat = boat.map(row => [...row]);
    
    // Apply preview
    for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 2; j++) {
            boat[i][j] = lineup.boat[i][j];
        }
    }
    
    updateAndSave();
    
    // Show preview indicator
    showPreviewIndicator(originalBoat);
}

function applySavedLineup(lineupId) {
    const lineup = savedLineups.find(l => l.id == lineupId);
    if (!lineup) return;
    
    if (confirm('Apply this saved lineup? This will replace the current boat configuration.')) {
        for (let i = 0; i < 10; i++) {
            for (let j = 0; j < 2; j++) {
                boat[i][j] = lineup.boat[i][j];
            }
        }
        
        updateAndSave();
        
        // Close the results modal
        const modal = document.getElementById('savedLineupsModal');
        if (modal) {
            document.body.removeChild(modal);
        }
    }
}

function deleteSavedLineup(lineupId) {
    if (confirm('Are you sure you want to delete this saved lineup?')) {
        savedLineups = savedLineups.filter(l => l.id != lineupId);
        saveSavedLineupsToStorage();
        
        // Update the display
        updateSavedLineupList(savedLineups);
        
        // Update the count in the header
        const resultsInfo = document.querySelector('#savedLineupsModal .results-info p');
        if (resultsInfo) {
            resultsInfo.innerHTML = `Showing <strong>${savedLineups.length}</strong> saved lineups`;
        }
    }
}

// Storage functions for saved lineups
function saveSavedLineupsToStorage() {
    try {
        localStorage.setItem('dragonboat_saved_lineups', JSON.stringify(savedLineups));
    } catch (error) {
        console.warn('Could not save lineups to localStorage:', error);
    }
}

function loadSavedLineupsFromStorage() {
    try {
        const stored = localStorage.getItem('dragonboat_saved_lineups');
        if (stored) {
            savedLineups = JSON.parse(stored);
        }
    } catch (error) {
        console.warn('Could not load saved lineups from localStorage:', error);
        savedLineups = [];
    }
}