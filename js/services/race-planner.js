// Race Planning Service - Optimizes multiple races ensuring fair participation

let savedRacePlans = []; // Persistent storage for race plans
let raceConfig = {
    numRaces: 3,
    minRacesPerPaddler: 2,
    maxIterations: 10000
};

// Show race planning configuration modal
function showRacePlanConfig() {
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
            <div class="modal-actions">
                <button id="startRacePlanning" class="primary">Generate Race Plans</button>
                <button id="cancelRacePlanning" class="secondary">Cancel</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Event listeners
    modal.querySelector('.close').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    modal.querySelector('#cancelRacePlanning').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    modal.querySelector('#startRacePlanning').addEventListener('click', () => {
        const numRaces = parseInt(document.getElementById('numRaces').value);
        const minRacesPerPaddler = parseInt(document.getElementById('minRacesPerPaddler').value);
        
        // Validate constraints
        if (minRacesPerPaddler > numRaces) {
            alert('Minimum races per paddler cannot exceed total number of races.');
            return;
        }
        
        if (savedLineups.length === 0) {
            alert('No saved lineups found. Please generate some lineups first using "Test All Lineups".');
            return;
        }
        
        if (savedLineups.length < numRaces) {
            alert(`You need at least ${numRaces} saved lineups to create a ${numRaces}-race plan. You currently have ${savedLineups.length} saved lineups. Please generate more lineups using "Test All Lineups".`);
            return;
        }
        
        raceConfig.numRaces = numRaces;
        raceConfig.minRacesPerPaddler = minRacesPerPaddler;
        
        document.body.removeChild(modal);
        generateRacePlans();
    });
    
    // Show modal
    modal.style.display = 'block';
}

// Generate optimized race plans
function generateRacePlans() {
    if (savedLineups.length === 0) {
        alert('No saved lineups found. Please generate some lineups first using "Test All Lineups".');
        return;
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
            
            // Save race plans
            savedRacePlans = racePlans;
            saveRacePlansToStorage();
            
            showRacePlanResults(racePlans);
        } catch (error) {
            hideProgressModal(progressModal);
            alert('Error generating race plans: ' + error.message);
            console.error('Race plan generation error:', error);
        }
    }, 100);
}

// Find optimal race plans using constraint satisfaction
function findOptimalRacePlans() {
    const allPaddlers = paddlers;
    const numRaces = raceConfig.numRaces;
    const minRaces = raceConfig.minRacesPerPaddler;
    const maxIterations = raceConfig.maxIterations;
    
    console.log(`Generating race plans: ${numRaces} races, min ${minRaces} races per paddler`);
    console.log(`Available lineups: ${savedLineups.length}`);
    
    const validPlans = [];
    let iterations = 0;
    
    // Sort lineups by score for better results (higher scores first)
    const sortedLineups = [...savedLineups].sort((a, b) => (b.ttSum || 0) - (a.ttSum || 0));
    
    // Generate race plan combinations more efficiently
    if (numRaces === 1) {
        // Simple case - just return top lineups
        sortedLineups.slice(0, 10).forEach((lineup, index) => {
            const plan = [lineup];
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
        });
    } else {
        // Multi-race optimization with constraint satisfaction
        validPlans.push(...generateMultiRacePlans(sortedLineups, numRaces, minRaces, maxIterations));
    }
    
    console.log(`Generated ${validPlans.length} valid race plans`);
    
    // Sort by total score (higher is better)
    validPlans.sort((a, b) => b.totalScore - a.totalScore);
    
    // Limit to top 50 plans to prevent memory issues
    return validPlans.slice(0, 50);
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
                ${plan.races.map((race, index) => `
                    <div class="race-detail-item">
                        <h3>Race ${index + 1} (Score: ${race.ttSum.toFixed(1)})</h3>
                        <div class="race-lineup-compact">
                            <div class="boat-positions">
                                ${race.paddlersInBoat.map((paddler, idx) => `
                                    <span class="position-paddler">
                                        ${Math.floor(idx / 2) + 1}${idx % 2 === 0 ? 'L' : 'R'}: ${paddler.name}
                                    </span>
                                `).join('')}
                            </div>
                        </div>
                        <div class="race-stats">
                            <span>Weight Diff: ${race.weightDiff.toFixed(1)}kg</span>
                            <span>M/F: ${race.maleCount}/${race.femaleCount}</span>
                        </div>
                    </div>
                `).join('')}
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
        localStorage.setItem('dragonboat_race_plans', JSON.stringify(savedRacePlans));
    } catch (error) {
        console.warn('Could not save race plans to localStorage:', error);
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