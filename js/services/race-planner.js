// Race Planning Service - Optimizes multiple races ensuring fair participation

let savedRacePlans = []; // Persistent storage for race plans
let raceConfig = {
    numRaces: 3,
    minRacesPerPaddler: 2,
    fixedLineups: []
};

// Show race planning configuration modal
function showRacePlanConfig() {
    console.log('🚀 showRacePlanConfig called');
    console.log('savedLineups available:', typeof savedLineups !== 'undefined', savedLineups ? savedLineups.length : 'undefined');
    
    // Check if savedLineups is available
    if (typeof savedLineups === 'undefined') {
        console.error('❌ savedLineups is not defined');
        alert('Error: Saved lineups not available. Please try refreshing the page and generate some lineups first.');
        return;
    }
    
    const modal = document.createElement('div');
    modal.id = 'racePlanModal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content race-plan-config">
            <span class="close">&times;</span>
            <h2>Race Planning Configuration</h2>
            <div class="config-section">
                <div class="form-group">
                    <label for="numRaces">Number of Races in Championship</label>
                    <input type="number" id="numRaces" value="${raceConfig.numRaces}" min="1" max="10" step="1">
                    <small>Total number of races in the championship</small>
                </div>
                <div class="form-group">
                    <label for="minRacesPerPaddler">Minimum Races per Paddler</label>
                    <input type="number" id="minRacesPerPaddler" value="${raceConfig.minRacesPerPaddler}" min="0" max="10" step="1">
                    <small>Each paddler must race at least this many times</small>
                </div>
                <div class="form-group">
                    <label>Available Saved Lineups: <strong>${savedLineups.length}</strong></label>
                    <small>Race plans will use combinations of your saved lineups</small>
                </div>
            </div>
            
            <div class="lineup-selection-section">
                <h3>Fixed Lineups (Optional)</h3>
                <p class="section-description">Select specific lineups that MUST be included in every race plan:</p>
                <div class="fixed-lineups-controls">
                    <button id="selectFixedLineups" class="secondary">Select Fixed Lineups</button>
                    <span id="fixedLineupsCount" class="count-display">0 lineups selected</span>
                </div>
                <div id="fixedLineupsList" class="fixed-lineups-list"></div>
            </div>
            
            <div class="modal-actions">
                <button id="startRacePlanning" class="primary">Generate Race Plans</button>
                <button id="cancelRacePlanning" class="secondary">Cancel</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Initialize fixed lineups tracking
    if (!raceConfig.fixedLineups) {
        raceConfig.fixedLineups = [];
    }
    updateFixedLineupsDisplay();
    
    // Event listeners
    modal.querySelector('.close').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    modal.querySelector('#cancelRacePlanning').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    modal.querySelector('#selectFixedLineups').addEventListener('click', () => {
        showFixedLineupSelector();
    });
    
    modal.querySelector('#startRacePlanning').addEventListener('click', () => {
        console.log('🚀 Start Race Planning button clicked');
        
        const numRaces = parseInt(document.getElementById('numRaces').value);
        const minRacesPerPaddler = parseInt(document.getElementById('minRacesPerPaddler').value);
        
        console.log('Config values:', { numRaces, minRacesPerPaddler });
        
        // Validate constraints
        if (minRacesPerPaddler > numRaces) {
            alert('Minimum races per paddler cannot exceed total number of races.');
            return;
        }
        
        if (typeof savedLineups === 'undefined' || savedLineups.length === 0) {
            alert('No saved lineups found. Please generate some lineups first using "Test All Lineups".');
            return;
        }
        
        // Check if we have enough non-fixed lineups for the remaining races
        const fixedCount = raceConfig.fixedLineups.length;
        const remainingRaces = numRaces - fixedCount;
        const availableLineups = savedLineups.length - fixedCount;
        
        console.log('Lineup counts:', { fixedCount, remainingRaces, availableLineups, totalSaved: savedLineups.length });
        
        if (fixedCount > numRaces) {
            alert(`You have selected ${fixedCount} fixed lineups, but only ${numRaces} races. Please reduce fixed lineups or increase number of races.`);
            return;
        }
        
        if (remainingRaces > 0 && availableLineups < remainingRaces) {
            alert(`Not enough lineups available. Need ${remainingRaces} more lineups for remaining races, but only have ${availableLineups} available.`);
            return;
        }
        
        raceConfig.numRaces = numRaces;
        raceConfig.minRacesPerPaddler = minRacesPerPaddler;
        
        console.log('Closing modal and calling generateRacePlans...');
        document.body.removeChild(modal);
        generateRacePlans();
    });
    
    // Show modal
    modal.style.display = 'block';
}

// Show lineup selector modal
function showFixedLineupSelector() {
    const selectorModal = document.createElement('div');
    selectorModal.id = 'fixedLineupSelectorModal';
    selectorModal.className = 'modal';
    selectorModal.innerHTML = `
        <div class="modal-content lineup-selector">
            <span class="close">&times;</span>
            <h2>Select Fixed Lineups</h2>
            <p>Choose lineups that must be included in every race plan:</p>
            <div class="lineup-selector-list">
                ${savedLineups.map((lineup, index) => `
                    <div class="lineup-selector-item">
                        <input type="checkbox" id="lineup_${index}" value="${index}" 
                               ${raceConfig.fixedLineups.includes(index) ? 'checked' : ''}>
                        <label for="lineup_${index}" class="lineup-label">
                            <div class="lineup-header">
                                <strong>Lineup ${index + 1}</strong>
                                <span class="lineup-score">Score: ${lineup.ttSum.toFixed(1)}</span>
                            </div>
                            <div class="lineup-stats">
                                Weight Diff: ${lineup.weightDiff.toFixed(1)}kg | 
                                M/F: ${lineup.maleCount}/${lineup.femaleCount}
                            </div>
                        </label>
                    </div>
                `).join('')}
            </div>
            <div class="modal-actions">
                <button id="applyFixedLineups" class="primary">Apply Selection</button>
                <button id="clearFixedLineups" class="secondary">Clear All</button>
                <button id="cancelFixedLineups" class="secondary">Cancel</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(selectorModal);
    
    // Event listeners
    selectorModal.querySelector('.close').addEventListener('click', () => {
        document.body.removeChild(selectorModal);
    });
    
    selectorModal.querySelector('#cancelFixedLineups').addEventListener('click', () => {
        document.body.removeChild(selectorModal);
    });
    
    selectorModal.querySelector('#clearFixedLineups').addEventListener('click', () => {
        // Uncheck all checkboxes
        selectorModal.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
        });
    });
    
    selectorModal.querySelector('#applyFixedLineups').addEventListener('click', () => {
        // Get selected lineup indices
        const selectedCheckboxes = selectorModal.querySelectorAll('input[type="checkbox"]:checked');
        raceConfig.fixedLineups = Array.from(selectedCheckboxes).map(cb => parseInt(cb.value));
        
        // Update the display in the main modal
        updateFixedLineupsDisplay();
        
        document.body.removeChild(selectorModal);
    });
    
    // Show modal
    selectorModal.style.display = 'block';
}

// Update the fixed lineups display in the main config modal
function updateFixedLineupsDisplay() {
    const countDisplay = document.getElementById('fixedLineupsCount');
    const listDisplay = document.getElementById('fixedLineupsList');
    
    if (!countDisplay || !listDisplay) return;
    
    const count = raceConfig.fixedLineups.length;
    countDisplay.textContent = `${count} lineup${count !== 1 ? 's' : ''} selected`;
    
    if (count === 0) {
        listDisplay.innerHTML = '';
        return;
    }
    
    listDisplay.innerHTML = `
        <div class="fixed-lineups-preview">
            ${raceConfig.fixedLineups.map(index => {
                const lineup = savedLineups[index];
                return `
                    <div class="fixed-lineup-preview">
                        <span class="lineup-name">Lineup ${index + 1}</span>
                        <span class="lineup-score">Score: ${lineup.ttSum.toFixed(1)}</span>
                        <button class="remove-fixed-lineup" onclick="removeFixedLineup(${index})">×</button>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

// Remove a specific fixed lineup
function removeFixedLineup(lineupIndex) {
    raceConfig.fixedLineups = raceConfig.fixedLineups.filter(index => index !== lineupIndex);
    updateFixedLineupsDisplay();
}

// Generate optimized race plans
function generateRacePlans() {
    console.log('🚀 generateRacePlans called');
    console.log('savedLineups available:', typeof savedLineups !== 'undefined', savedLineups ? savedLineups.length : 'undefined');
    
    if (typeof savedLineups === 'undefined' || savedLineups.length === 0) {
        alert('No saved lineups found. Please generate some lineups first using "Test All Lineups".');
        return;
    }
    
    const numRaces = raceConfig.numRaces;
    const minRacesPerPaddler = raceConfig.minRacesPerPaddler;
    const fixedLineups = raceConfig.fixedLineups || [];
    
    // Early impossibility detection
    const impossibilityCheck = detectImpossibleConstraints(numRaces, minRacesPerPaddler, fixedLineups);
    if (impossibilityCheck.isImpossible) {
        alert('Impossible constraints detected: ' + impossibilityCheck.reason);
        console.log('❌ Race planning aborted:', impossibilityCheck.reason);
        return;
    }
    
    // Calculate problem size and warn user if too large
    const fixedCount = fixedLineups.length;
    const remainingRaces = numRaces - fixedCount;
    const availableLineups = savedLineups.length - fixedCount;
    
    if (remainingRaces > 0) {
        // Calculate combinations with repetition: C(n+k-1, k)
        const n = availableLineups;
        const k = remainingRaces;
        const combinations = calculateCombinationsWithRepetition(n, k);
        
        console.log(`Problem size: C(${n}+${k}-1, ${k}) = ${combinations} combinations to check`);
        
        if (combinations > 1000000) {
            const proceed = confirm(
                `This will check ${combinations.toLocaleString()} combinations, which may take a very long time and could freeze the browser. ` +
                `Strongly recommend fixing more lineups (currently ${fixedCount}) or reducing races (currently ${numRaces}). Continue anyway?`
            );
            if (!proceed) return;
        } else if (combinations > 100000) {
            const proceed = confirm(
                `This will check ${combinations.toLocaleString()} combinations, which may take a while. ` +
                `Consider fixing more lineups (currently ${fixedCount}) or reducing races (currently ${numRaces}). Continue anyway?`
            );
            if (!proceed) return;
        }
    }
    
    const progressModal = showRacePlanProgressModal();
    
    setTimeout(() => {
        try {
            const racePlans = findOptimalRacePlans();
            hideProgressModal(progressModal);
            
            if (racePlans.length === 0) {
                alert('No valid race plans found with the current constraints. Try reducing the minimum races per paddler or increasing the number of races.');
                return;
            }
            
            // Save race plans (with intelligent limiting)
            savedRacePlans = racePlans;
            
            // Show summary of results
            console.log(`🎯 Race planning completed: Found ${racePlans.length} valid plans`);
            if (racePlans.length > 100) {
                console.log(`📊 Score range: ${racePlans[0].totalScore.toFixed(1)} (best) to ${racePlans[racePlans.length-1].totalScore.toFixed(1)} (worst)`);
            }
            
            saveRacePlansToStorage();
            
            showRacePlanResults(racePlans);
        } catch (error) {
            hideProgressModal(progressModal);
            alert('Error generating race plans: ' + error.message);
            console.error('Race plan generation error:', error);
        }
    }, 100);
}

// Calculate combinations with repetition: C(n+k-1, k)
function calculateCombinationsWithRepetition(n, k) {
    if (n === 0 || k === 0) return 1;
    
    // Calculate C(n+k-1, k) = C(n+k-1, n-1)
    // Use the smaller of k or n-1 for efficiency
    const numeratorSize = n + k - 1;
    const denominatorSize = Math.min(k, n - 1);
    
    let result = 1;
    for (let i = 0; i < denominatorSize; i++) {
        result = result * (numeratorSize - i) / (i + 1);
    }
    
    return Math.round(result);
}

// Find optimal race plans using constraint satisfaction
function findOptimalRacePlans() {
    console.log('🔍 findOptimalRacePlans called');
    
    const numRaces = raceConfig.numRaces;
    const minRaces = raceConfig.minRacesPerPaddler;
    const maxSitOuts = numRaces - minRaces; // Key constraint: max sit-outs per paddler
    const fixedLineups = raceConfig.fixedLineups || [];
    
    console.log(`🚀 Optimized race planning: ${numRaces} races, min ${minRaces} races per paddler (max ${maxSitOuts} sit-outs)`);
    console.log(`Available lineups: ${savedLineups.length}, Fixed lineups: ${fixedLineups.length}`);
    
    // Early impossibility detection
    const impossibilityCheck = detectImpossibleConstraints(numRaces, minRaces, fixedLineups);
    if (impossibilityCheck.isImpossible) {
        console.log('❌ Impossible constraints detected:', impossibilityCheck.reason);
        alert('Impossible constraints detected: ' + impossibilityCheck.reason);
        return [];
    }
    
    // Prepare lineup data
    const fixedLineupObjects = fixedLineups.map(index => savedLineups[index]).filter(Boolean);
    const availableIndices = savedLineups.map((_, index) => index).filter(index => !fixedLineups.includes(index));
    const remainingRaces = numRaces - fixedLineupObjects.length;
    
    let validPlans = [];
    
    if (remainingRaces === 0) {
        // All races are fixed lineups
        const stats = calculateRacePlanStats(fixedLineupObjects);
        if (isValidRacePlan(stats, minRaces)) {
            validPlans.push({
                id: generateUniqueId(),
                races: [...fixedLineupObjects],
                stats: stats,
                totalScore: stats.totalScore,
                timestamp: new Date().toISOString()
            });
        }
    } else {
        // Use optimized algorithm for remaining races
        const n = availableIndices.length;
        const k = remainingRaces;
        const totalCombinations = calculateCombinationsWithRepetition(n, k);
        
        console.log(`Total possible combinations: ${totalCombinations.toLocaleString()}`);
        
        if (totalCombinations > 5000000) {
            console.log('⚠️ Problem size too large for exhaustive search. Using intelligent sampling strategy.');
            validPlans = generateSampledRacePlans(fixedLineupObjects, availableIndices, remainingRaces, minRaces, maxSitOuts);
        } else {
            validPlans = generateAllValidRacePlansOptimized(fixedLineupObjects, availableIndices, remainingRaces, minRaces, maxSitOuts);
        }
    }
    
    console.log(`✅ Generated ${validPlans.length} valid race plans`);
    
    // Sort by total score (higher is better)
    validPlans.sort((a, b) => b.totalScore - a.totalScore);
    
    // Limit total results to prevent memory and storage issues
    const maxResults = 1000;
    if (validPlans.length > maxResults) {
        console.log(`📊 Found ${validPlans.length} valid plans. Keeping top ${maxResults} by score.`);
        validPlans = validPlans.slice(0, maxResults);
    }
    
    // Return the limited results
    return validPlans;
}

// Detect impossible constraints early to avoid unnecessary computation
function detectImpossibleConstraints(numRaces, minRacesPerPaddler, fixedLineups = []) {
    console.log('🔍 Checking for impossible constraints...');
    
    // Get all unique paddlers across all lineups
    const allPaddlers = new Set();
    savedLineups.forEach(lineup => {
        if (lineup.paddlersInBoat) {
            lineup.paddlersInBoat.forEach(paddler => {
                if (paddler && paddler.id) {
                    allPaddlers.add(paddler.id);
                }
            });
        }
        if (lineup.paddlersNotInBoat) {
            lineup.paddlersNotInBoat.forEach(paddler => {
                if (paddler && paddler.id) {
                    allPaddlers.add(paddler.id);
                }
            });
        }
    });
    
    const totalPaddlers = allPaddlers.size;
    console.log(`Total paddlers in system: ${totalPaddlers}`);
    
    // Check 1: Basic mathematical impossibility
    const maxPaddlersPerRace = 20; // 10 left + 10 right
    const totalPaddlerSlots = numRaces * maxPaddlersPerRace;
    const requiredPaddlerRaces = totalPaddlers * minRacesPerPaddler;
    
    if (requiredPaddlerRaces > totalPaddlerSlots) {
        return {
            isImpossible: true,
            reason: `Need ${requiredPaddlerRaces} total paddler-races (${totalPaddlers} paddlers × ${minRacesPerPaddler} min races), but only ${totalPaddlerSlots} slots available (${numRaces} races × ${maxPaddlersPerRace} paddlers per race)`
        };
    }
    
    // Check 2: Fixed lineup constraint conflicts
    if (fixedLineups.length > 0) {
        const fixedRaces = fixedLineups.map(index => savedLineups[index]).filter(Boolean);
        const paddlerRaceCount = new Map();
        
        // Count how many times each paddler appears in fixed races
        fixedRaces.forEach(race => {
            if (race.paddlersInBoat) {
                race.paddlersInBoat.forEach(paddler => {
                    if (paddler && paddler.id) {
                        paddlerRaceCount.set(paddler.id, (paddlerRaceCount.get(paddler.id) || 0) + 1);
                    }
                });
            }
        });
        
        // Check if any paddler already has too many races
        for (const [paddlerId, raceCount] of paddlerRaceCount) {
            if (raceCount > numRaces) {
                return {
                    isImpossible: true,
                    reason: `Paddler ${paddlerId} appears ${raceCount} times in fixed lineups, but only ${numRaces} total races available`
                };
            }
        }
        
        // Check 3: Paddlers who sit out too much in remaining races
        const remainingRaces = numRaces - fixedRaces.length;
        if (remainingRaces > 0) {
            for (const paddlerId of allPaddlers) {
                const currentRaces = paddlerRaceCount.get(paddlerId) || 0;
                const needMoreRaces = minRacesPerPaddler - currentRaces;
                
                if (needMoreRaces > remainingRaces) {
                    return {
                        isImpossible: true,
                        reason: `Paddler ${paddlerId} needs ${needMoreRaces} more races to meet minimum ${minRacesPerPaddler}, but only ${remainingRaces} races remaining`
                    };
                }
            }
        }
    }
    
    // Check 4: Lineup availability
    if (savedLineups.length === 0) {
        return {
            isImpossible: true,
            reason: 'No saved lineups available for race planning'
        };
    }
    
    console.log('✅ No impossible constraints detected');
    return { isImpossible: false };
}

// Generate all possible valid race plans using optimized algorithm
function generateAllValidRacePlansOptimized(fixedLineups, availableLineupIndices, remainingRaces, minRaces, maxSitOuts) {
    const validPlans = [];
    const totalRaces = fixedLineups.length + remainingRaces;
    
    console.log(`🚀 Optimized search: ${remainingRaces} remaining races, ${availableLineupIndices.length} available lineups`);
    
    // Early validation: Check if fixed lineups already violate constraints
    if (fixedLineups.length > 0) {
        const fixedStats = calculateRacePlanStats(fixedLineups);
        if (fixedStats.maxSitOuts > maxSitOuts) {
            console.log('❌ Fixed lineups already violate sit-out constraints');
            return validPlans;
        }
    }
    
    if (remainingRaces === 0) {
        return validPlans; // Already handled in parent function
    }
    
    let validCount = 0;
    let checkedCount = 0;
    let prunedEarly = 0;
    const startTime = performance.now();
    
    // Use memory-efficient iterator for multiset combinations
    for (const combination of generateMultisetCombinationsIterator(availableLineupIndices.length, remainingRaces)) {
        checkedCount++;
        
        // Convert indices to lineup objects
        const remainingLineups = combination.map(index => savedLineups[availableLineupIndices[index]]);
        const fullPlan = [...fixedLineups, ...remainingLineups];
        
        // Early pruning: Quick sit-out check before full calculation
        if (canSatisfySitOutConstraint(fullPlan, maxSitOuts)) {
            const stats = calculateRacePlanStats(fullPlan);
            
            if (isValidRacePlan(stats, minRaces)) {
                validPlans.push({
                    id: generateUniqueId(),
                    races: fullPlan,
                    stats: stats,
                    totalScore: stats.totalScore,
                    timestamp: new Date().toISOString(),
                    combination: combination.slice() // For debugging
                });
                validCount++;
            }
        } else {
            prunedEarly++;
        }
    }
    
    const endTime = performance.now();
    const totalTime = (endTime - startTime) / 1000;
    console.log(`✅ Search complete: ${checkedCount} combinations checked in ${totalTime.toFixed(2)}s, ${validCount} valid plans found, ${prunedEarly} pruned early`);
    
    return validPlans;
}

// Generate sampled race plans for very large problem spaces
function generateSampledRacePlans(fixedLineups, availableLineupIndices, remainingRaces, minRaces, maxSitOuts) {
    const validPlans = [];
    const startTime = performance.now();
    const maxSamples = 1000000; // Sample up to 1M combinations
    let checkedCount = 0;
    let validCount = 0;
    let prunedEarly = 0;
    
    console.log(`🎯 Sampling strategy: checking up to ${maxSamples.toLocaleString()} combinations`);
    
    // Intelligent sampling: focus on high-quality lineups
    const sortedIndices = availableLineupIndices.sort((a, b) => {
        const lineupA = savedLineups[a];
        const lineupB = savedLineups[b];
        return (lineupB.ttSum || 0) - (lineupA.ttSum || 0);
    });
    
    // Use top lineups more frequently
    const topCount = Math.min(20, sortedIndices.length);
    const regularCount = sortedIndices.length - topCount;
    
    while (checkedCount < maxSamples && validCount < 5000) {
        checkedCount++;
        
        // Generate a random combination favoring top lineups
        const combination = [];
        for (let i = 0; i < remainingRaces; i++) {
            if (Math.random() < 0.7 && topCount > 0) {
                // 70% chance to pick from top lineups
                combination.push(Math.floor(Math.random() * topCount));
            } else {
                // 30% chance to pick from any lineup
                combination.push(Math.floor(Math.random() * sortedIndices.length));
            }
        }
        
        // Convert indices to lineup objects
        const remainingLineups = combination.map(index => savedLineups[sortedIndices[index]]);
        const fullPlan = [...fixedLineups, ...remainingLineups];
        
        // Early pruning
        if (canSatisfySitOutConstraint(fullPlan, maxSitOuts)) {
            const stats = calculateRacePlanStats(fullPlan);
            
            if (isValidRacePlan(stats, minRaces)) {
                // Check for duplicates (basic duplicate detection)
                const isDuplicate = validPlans.some(existingPlan => 
                    Math.abs(existingPlan.totalScore - stats.totalScore) < 0.1
                );
                
                if (!isDuplicate) {
                    validPlans.push({
                        id: generateUniqueId(),
                        races: fullPlan,
                        stats: stats,
                        totalScore: stats.totalScore,
                        timestamp: new Date().toISOString(),
                        isSampled: true
                    });
                    validCount++;
                }
            }
        } else {
            prunedEarly++;
        }
        
        // Early termination if no results after significant sampling
        if (checkedCount > 100000 && validCount === 0) {
            console.log('⚠️ No valid solutions found in sampling. Constraints may be too strict.');
            break;
        }
    }
    
    const endTime = performance.now();
    const totalTime = (endTime - startTime) / 1000;
    console.log(`✅ Sampling complete: ${checkedCount} combinations sampled in ${totalTime.toFixed(2)}s, ${validCount} valid plans found`);
    
    return validPlans;
}

// Memory-efficient iterator for multiset combinations
// Generates combinations on-demand instead of storing all in memory
function* generateMultisetCombinationsIterator(numLineups, numRaces) {
    if (numRaces === 0) {
        yield [];
        return;
    }
    
    function* generateCombination(current, start, depth) {
        if (depth === numRaces) {
            yield [...current];
            return;
        }
        
        for (let i = start; i < numLineups; i++) {
            current.push(i);
            yield* generateCombination(current, i, depth + 1);
            current.pop();
        }
    }
    
    yield* generateCombination([], 0, 0);
}

// Early pruning: Quick check if a plan can possibly satisfy sit-out constraints
function canSatisfySitOutConstraint(racePlan, maxSitOuts) {
    if (racePlan.length === 0) return true;
    
    const participationCounts = new Map();
    const totalRaces = racePlan.length;
    
    // Count participation in each race - optimized loop
    for (let i = 0; i < racePlan.length; i++) {
        const race = racePlan[i];
        const paddlersInRace = race.paddlersInBoat || [];
        
        for (let j = 0; j < paddlersInRace.length; j++) {
            const paddler = paddlersInRace[j];
            if (paddler && paddler.id) {
                const currentCount = participationCounts.get(paddler.id) || 0;
                participationCounts.set(paddler.id, currentCount + 1);
            }
        }
    }
    
    // Early exit: check if any paddler sits out more than allowed
    for (const [paddlerId, participationCount] of participationCounts) {
        const sitOuts = totalRaces - participationCount;
        if (sitOuts > maxSitOuts) {
            return false;
        }
    }
    
    return true;
}

// Generate multi-race plans with optimization
function generateMultiRacePlans(sortedLineups, numRaces, minRaces, maxIterations) {
    const validPlans = [];
    let iterations = 0;
    
    // Use a more intelligent search strategy
    // Start with combinations of top-performing lineups
    const topLineups = sortedLineups.slice(0, Math.min(20, sortedLineups.length));
    
    function generateCombinationsOptimized(currentPlan, depth) {
        if (iterations >= maxIterations) return;
        iterations++;
        
        if (depth === numRaces) {
            const plan = [...currentPlan];
            const stats = calculateRacePlanStats(plan);
            
            if (isValidRacePlan(stats, minRaces)) {
                validPlans.push({
                    id: generateUniqueId(),
                    races: plan,
                    stats: stats,
                    totalScore: stats.totalScore,
                    timestamp: new Date().toISOString()
                });
            }
            return;
        }
        
        // Try different lineup combinations
        for (let i = 0; i < topLineups.length && iterations < maxIterations; i++) {
            currentPlan[depth] = topLineups[i];
            
            // Early pruning: check if we can still satisfy constraints
            if (depth >= Math.floor(numRaces / 2)) {
                const partialStats = calculateRacePlanStats(currentPlan.slice(0, depth + 1));
                const remainingRaces = numRaces - depth - 1;
                
                // Check if we can potentially satisfy min races constraint
                if (partialStats.minRaces + remainingRaces < minRaces) {
                    continue; // Skip this branch
                }
            }
            
            generateCombinationsOptimized(currentPlan, depth + 1);
        }
    }
    
    // Start generation
    generateCombinationsOptimized(new Array(numRaces), 0);
    
    // If we didn't find enough plans with top lineups, try with more lineups
    if (validPlans.length < 10 && sortedLineups.length > 20) {
        const expandedLineups = sortedLineups.slice(0, Math.min(40, sortedLineups.length));
        const remainingIterations = maxIterations - iterations;
        
        function generateExpandedCombinations(currentPlan, depth) {
            if (iterations >= maxIterations) return;
            iterations++;
            
            if (depth === numRaces) {
                const plan = [...currentPlan];
                const stats = calculateRacePlanStats(plan);
                
                if (isValidRacePlan(stats, minRaces)) {
                    // Check if this plan is significantly different from existing ones
                    const isDifferent = !validPlans.some(existingPlan => 
                        arePlansSignificantlyDifferent(existingPlan.races, plan)
                    );
                    
                    if (isDifferent) {
                        validPlans.push({
                            id: generateUniqueId(),
                            races: plan,
                            stats: stats,
                            totalScore: stats.totalScore,
                            timestamp: new Date().toISOString()
                        });
                    }
                }
                return;
            }
            
            // Randomly sample lineups for diversity
            const sampleSize = Math.min(15, expandedLineups.length);
            const shuffled = [...expandedLineups].sort(() => 0.5 - Math.random());
            
            for (let i = 0; i < sampleSize && iterations < maxIterations; i++) {
                currentPlan[depth] = shuffled[i];
                generateExpandedCombinations(currentPlan, depth + 1);
            }
        }
        
        if (remainingIterations > 100) {
            generateExpandedCombinations(new Array(numRaces), 0);
        }
    }
    
    return validPlans;
}

// Generate multi-race plans with fixed lineups
function generateMultiRacePlansWithFixed(fixedLineups, availableLineups, remainingRaces, minRaces, maxIterations) {
    const validPlans = [];
    let iterations = 0;
    
    // Use a more intelligent search strategy for remaining races
    const topAvailableLineups = availableLineups.slice(0, Math.min(15, availableLineups.length));
    
    function generateRemainingCombinations(currentRemainingPlan, depth) {
        if (iterations >= maxIterations) return;
        iterations++;
        
        if (depth === remainingRaces) {
            const fullPlan = [...fixedLineups, ...currentRemainingPlan];
            const stats = calculateRacePlanStats(fullPlan);
            
            if (isValidRacePlan(stats, minRaces)) {
                validPlans.push({
                    id: generateUniqueId(),
                    races: fullPlan,
                    stats: stats,
                    totalScore: stats.totalScore,
                    timestamp: new Date().toISOString()
                });
            }
            return;
        }
        
        // Try different lineups for the current remaining race
        for (let i = 0; i < topAvailableLineups.length && iterations < maxIterations; i++) {
            const lineup = topAvailableLineups[i];
            
            // Allow reuse of lineups (same lineup can be used in multiple races)
            currentRemainingPlan[depth] = lineup;
            generateRemainingCombinations(currentRemainingPlan, depth + 1);
        }
    }
    
    // Start generation
    generateRemainingCombinations(new Array(remainingRaces), 0);
    
    // If we haven't found many plans and have iterations left, try with more lineups
    if (validPlans.length < 10 && iterations < maxIterations * 0.7) {
        const expandedLineups = availableLineups.slice(0, Math.min(25, availableLineups.length));
        const remainingIterations = maxIterations - iterations;
        
        function generateExpandedCombinations(currentRemainingPlan, depth) {
            if (iterations >= maxIterations) return;
            iterations++;
            
            if (depth === remainingRaces) {
                const fullPlan = [...fixedLineups, ...currentRemainingPlan];
                const stats = calculateRacePlanStats(fullPlan);
                
                if (isValidRacePlan(stats, minRaces)) {
                    // Check if this plan is significantly different from existing ones
                    const isDifferent = validPlans.every(existingPlan => 
                        arePlansSignificantlyDifferent(fullPlan, existingPlan.races)
                    );
                    
                    if (isDifferent) {
                        validPlans.push({
                            id: generateUniqueId(),
                            races: fullPlan,
                            stats: stats,
                            totalScore: stats.totalScore,
                            timestamp: new Date().toISOString()
                        });
                    }
                }
                return;
            }
            
            for (let i = 0; i < expandedLineups.length && iterations < maxIterations; i++) {
                currentRemainingPlan[depth] = expandedLineups[i];
                generateExpandedCombinations(currentRemainingPlan, depth + 1);
            }
        }
        
        if (remainingIterations > 100) {
            generateExpandedCombinations(new Array(remainingRaces), 0);
        }
    }
    
    return validPlans;
}

// Check if two race plans are significantly different
function arePlansSignificantlyDifferent(plan1, plan2) {
    if (plan1.length !== plan2.length) return true;
    
    let differentRaces = 0;
    for (let i = 0; i < plan1.length; i++) {
        if (plan1[i].id !== plan2[i].id) {
            differentRaces++;
        }
    }
    
    // Consider plans different if at least 50% of races are different
    return differentRaces >= Math.ceil(plan1.length * 0.5);
}

// Calculate statistics for a race plan
function calculateRacePlanStats(races) {
    const paddlerParticipation = new Map();
    let totalScore = 0;
    
    // Initialize paddler participation tracking
    paddlers.forEach(p => {
        paddlerParticipation.set(p.id, {
            paddler: p,
            racesParticipated: 0,
            raceNumbers: []
        });
    });
    
    // Count participation in each race
    races.forEach((race, raceIndex) => {
        totalScore += race.ttSum || 0;
        
        race.paddlersInBoat.forEach(paddler => {
            const participation = paddlerParticipation.get(paddler.id);
            if (participation) {
                participation.racesParticipated++;
                participation.raceNumbers.push(raceIndex + 1);
            }
        });
    });
    
    const participationArray = Array.from(paddlerParticipation.values());
    const raceCounts = participationArray.map(p => p.racesParticipated);
    const sitOutCounts = participationArray.map(p => races.length - p.racesParticipated);
    
    return {
        totalScore,
        averageScore: totalScore / races.length,
        paddlerParticipation: participationArray,
        minRaces: Math.min(...raceCounts),
        maxRaces: Math.max(...raceCounts),
        averageRaces: raceCounts.reduce((a, b) => a + b, 0) / raceCounts.length,
        maxSitOuts: Math.max(...sitOutCounts),
        participationStdDev: calculateStandardDeviation(raceCounts),
        sitOutPaddlers: participationArray.filter(p => p.racesParticipated < races.length)
    };
}

// Check if a race plan meets the constraints
function isValidRacePlan(stats, minRaces) {
    // All paddlers must race at least minRaces times
    return stats.minRaces >= minRaces;
}

// Calculate standard deviation
function calculateStandardDeviation(values) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / squaredDiffs.length;
    return Math.sqrt(avgSquaredDiff);
}

// Show race plan results
function showRacePlanResults(racePlans) {
    const modal = document.createElement('div');
    modal.id = 'racePlanResultsModal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content race-plan-results">
            <span class="close">&times;</span>
            <h2>Race Planning Results</h2>
            <div class="results-header">
                <div class="results-info">
                    <p>Found <strong>${racePlans.length}</strong> valid race plans (ranked by total score)</p>
                </div>
                <div class="results-controls">
                    <button id="clearRacePlans" class="danger">Clear All</button>
                    <button id="exportRacePlans" class="success">Export Plans</button>
                </div>
            </div>
            <div class="race-plan-list" id="racePlanList">
                <!-- Race plans will be populated here -->
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Populate race plans
    updateRacePlanList(racePlans);
    
    // Event listeners
    modal.querySelector('.close').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    modal.querySelector('#clearRacePlans').addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all race plans?')) {
            savedRacePlans = [];
            saveRacePlansToStorage();
            alert('Race plans cleared!');
            document.body.removeChild(modal);
        }
    });
    
    modal.querySelector('#exportRacePlans').addEventListener('click', () => {
        exportRacePlans(racePlans);
    });
    
    // Show modal
    modal.style.display = 'block';
}

// Update race plan list display
function updateRacePlanList(racePlans) {
    const container = document.getElementById('racePlanList');
    if (!container) return;
    
    if (racePlans.length === 0) {
        container.innerHTML = '<div class="empty-message">No race plans available</div>';
        return;
    }
    
    container.innerHTML = racePlans.map((plan, index) => `
        <div class="race-plan-item" data-plan-id="${plan.id}">
            <div class="race-plan-header">
                <h3>Plan ${index + 1} <span class="score-badge">Score: ${plan.totalScore.toFixed(1)}</span></h3>
                <div class="plan-stats">
                    <span class="stat">Avg: ${plan.stats.averageScore.toFixed(1)}</span>
                    <span class="stat">Min Races: ${plan.stats.minRaces}</span>
                    <span class="stat">Max Sit-outs: ${plan.stats.maxSitOuts}</span>
                </div>
            </div>
            <div class="race-plan-details">
                <div class="races-summary">
                    <h4>${raceConfig.numRaces} Races:</h4>
                    ${plan.races.map((race, raceIdx) => `
                        <span class="race-chip">Race ${raceIdx + 1}: ${race.ttSum.toFixed(1)}</span>
                    `).join('')}
                </div>
                <div class="sit-out-summary">
                    <h4>Sit-out Summary:</h4>
                    <div class="sit-out-list">
                        ${plan.stats.sitOutPaddlers.map(p => `
                            <span class="sit-out-paddler">
                                ${p.paddler.name} (sits out ${raceConfig.numRaces - p.racesParticipated} race${raceConfig.numRaces - p.racesParticipated !== 1 ? 's' : ''})
                            </span>
                        `).join('')}
                    </div>
                </div>
                <div class="plan-actions">
                    <button class="btn-view-details" onclick="viewRacePlanDetails('${plan.id}')">View Details</button>
                    <button class="btn-apply-plan" onclick="applyRacePlan('${plan.id}')">Apply Plan</button>
                </div>
            </div>
        </div>
    `).join('');
}

// View detailed race plan
function viewRacePlanDetails(planId) {
    const plan = savedRacePlans.find(p => p.id === planId);
    if (!plan) return;
    
    const modal = document.createElement('div');
    modal.id = 'racePlanDetailModal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content race-plan-detail">
            <span class="close">&times;</span>
            <h2>Race Plan Details</h2>
            <div class="plan-overview">
                <div class="overview-stats">
                    <div class="stat-item">
                        <span class="stat-value">${plan.totalScore.toFixed(1)}</span>
                        <span class="stat-label">Total Score</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${plan.stats.averageScore.toFixed(1)}</span>
                        <span class="stat-label">Avg per Race</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${plan.stats.minRaces}</span>
                        <span class="stat-label">Min Races</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${plan.stats.maxSitOuts}</span>
                        <span class="stat-label">Max Sit-outs</span>
                    </div>
                </div>
            </div>
            <div class="races-detail">
                ${plan.races.map((race, index) => {
                    // Get sit-out paddlers for this race
                    const raceParticipantIds = new Set(race.paddlersInBoat.map(p => p.id));
                    const sitOutPaddlers = paddlers.filter(p => !raceParticipantIds.has(p.id));
                    
                    return `
                    <div class="race-detail-item">
                        <h3>Race ${index + 1} (Score: ${race.ttSum.toFixed(1)})</h3>
                        <div class="race-sitout-display">
                            <h4>Sit-out Paddlers (${sitOutPaddlers.length}):</h4>
                            <div class="sitout-paddlers">
                                ${sitOutPaddlers.length > 0 ? sitOutPaddlers.map(paddler => `
                                    <span class="sitout-paddler">
                                        ${paddler.name} (${paddler.side.toUpperCase()}${paddler.ttResults ? `, TT: ${paddler.ttResults}` : ''})
                                    </span>
                                `).join('') : '<span class="no-sitouts">All paddlers racing</span>'}
                            </div>
                        </div>
                        <div class="race-stats">
                            <span>Racing: ${race.paddlersInBoat.length}/${paddlers.length}</span>
                            <span>Sitting out: ${sitOutPaddlers.length}</span>
                            <span>Weight Diff: ${race.weightDiff.toFixed(1)}kg</span>
                            <span>M/F: ${race.maleCount}/${race.femaleCount}</span>
                        </div>
                    </div>
                `;}).join('')}
            </div>
            <div class="participation-summary">
                <h3>Paddler Participation Summary</h3>
                <div class="participation-grid">
                    ${plan.stats.paddlerParticipation.map(p => `
                        <div class="participation-item ${p.racesParticipated < raceConfig.minRacesPerPaddler ? 'insufficient' : ''}">
                            <span class="paddler-name">${p.paddler.name}</span>
                            <span class="race-count">${p.racesParticipated}/${raceConfig.numRaces}</span>
                            <span class="race-numbers">[${p.raceNumbers.join(', ')}]</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Event listeners
    modal.querySelector('.close').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    // Show modal
    modal.style.display = 'block';
}

// Apply a race plan (set current boat to first race)
function applyRacePlan(planId) {
    const plan = savedRacePlans.find(p => p.id === planId);
    if (!plan || plan.races.length === 0) return;
    
    const firstRace = plan.races[0];
    
    // Clear current boat
    for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 2; j++) {
            boat[i][j] = null;
        }
    }
    
    // Apply first race lineup
    firstRace.paddlersInBoat.forEach((paddler, index) => {
        const row = Math.floor(index / 2);
        const seat = index % 2;
        boat[row][seat] = paddler;
    });
    
    // Update display
    updateAndSave();
    
    alert(`Applied Race 1 from the selected plan. Total ${plan.races.length} races in this plan.`);
}

// Show saved race plans
function showSavedRacePlans() {
    if (savedRacePlans.length === 0) {
        alert('No saved race plans found. Generate some race plans first.');
        return;
    }
    
    showRacePlanResults(savedRacePlans);
}

// Export race plans to CSV
function exportRacePlans(racePlans) {
    if (racePlans.length === 0) {
        alert('No race plans to export.');
        return;
    }
    
    let csvContent = 'Plan,Race,Position,Paddler Name,Weight,TT Results,Gender,Side\n';
    
    racePlans.forEach((plan, planIndex) => {
        plan.races.forEach((race, raceIndex) => {
            race.paddlersInBoat.forEach((paddler, posIndex) => {
                const row = Math.floor(posIndex / 2) + 1;
                const seat = posIndex % 2 === 0 ? 'L' : 'R';
                const position = `${row}${seat}`;
                
                csvContent += `${planIndex + 1},${raceIndex + 1},${position},"${paddler.name}",${paddler.weight},${paddler.ttResults || ''},${paddler.gender},${paddler.side}\n`;
            });
        });
        
        // Add sit-out information
        plan.stats.sitOutPaddlers.forEach(p => {
            const sitOutRaces = [];
            for (let i = 1; i <= raceConfig.numRaces; i++) {
                if (!p.raceNumbers.includes(i)) {
                    sitOutRaces.push(i);
                }
            }
            sitOutRaces.forEach(raceNum => {
                csvContent += `${planIndex + 1},${raceNum},SIT-OUT,"${p.paddler.name}",${p.paddler.weight},${p.paddler.ttResults || ''},${p.paddler.gender},${p.paddler.side}\n`;
            });
        });
    });
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `race_plans_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}

// Progress modal for race planning
function showRacePlanProgressModal() {
    const modal = document.createElement('div');
    modal.id = 'racePlanProgressModal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content progress-modal">
            <h3>Generating Race Plans...</h3>
            <div class="progress-bar">
                <div class="progress-fill" id="racePlanProgressFill"></div>
            </div>
            <p id="racePlanProgressText">Initializing race plan generation...</p>
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

// Storage functions for race plans
function saveRacePlansToStorage() {
    try {
        // Limit the number of plans saved to prevent quota exceeded errors
        const maxPlansToSave = 100;
        let plansToSave = savedRacePlans;
        
        // If we have too many plans, save only the best ones
        if (savedRacePlans.length > maxPlansToSave) {
            console.log(`📦 Too many race plans (${savedRacePlans.length}). Saving top ${maxPlansToSave} by score.`);
            plansToSave = [...savedRacePlans]
                .sort((a, b) => b.totalScore - a.totalScore)
                .slice(0, maxPlansToSave);
        }
        
        // Try to save, and if still too big, reduce further
        let attempts = 0;
        let currentLimit = maxPlansToSave;
        
        while (attempts < 3) {
            try {
                const dataToSave = JSON.stringify(plansToSave);
                
                // Check approximate size (rough estimate: 2 bytes per character)
                const sizeKB = (dataToSave.length * 2) / 1024;
                console.log(`💾 Attempting to save ${plansToSave.length} race plans (~${sizeKB.toFixed(0)}KB)`);
                
                localStorage.setItem('dragonboat_race_plans', dataToSave);
                console.log(`✅ Successfully saved ${plansToSave.length} race plans to localStorage`);
                break;
                
            } catch (quotaError) {
                if (quotaError.name === 'QuotaExceededError') {
                    currentLimit = Math.floor(currentLimit / 2);
                    console.log(`⚠️ Storage quota exceeded. Reducing to top ${currentLimit} plans.`);
                    
                    if (currentLimit < 10) {
                        console.log('❌ Cannot save race plans - even minimal data exceeds storage quota');
                        // Clear any existing race plans to free up space
                        localStorage.removeItem('dragonboat_race_plans');
                        break;
                    }
                    
                    plansToSave = [...savedRacePlans]
                        .sort((a, b) => b.totalScore - a.totalScore)
                        .slice(0, currentLimit);
                    
                    attempts++;
                } else {
                    throw quotaError;
                }
            }
        }
        
    } catch (error) {
        console.warn('Could not save race plans to localStorage:', error);
        // Try to clear old data to make space
        try {
            localStorage.removeItem('dragonboat_race_plans');
            console.log('🗑️ Cleared old race plans data to free up storage space');
        } catch (clearError) {
            console.warn('Could not clear old race plans data:', clearError);
        }
    }
}

function loadRacePlansFromStorage() {
    try {
        const stored = localStorage.getItem('dragonboat_race_plans');
        if (stored) {
            savedRacePlans = JSON.parse(stored);
        }
    } catch (error) {
        console.warn('Could not load race plans from localStorage:', error);
        savedRacePlans = [];
    }
}

// Generate unique ID for race plans
function generateUniqueId() {
    return 'rp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}