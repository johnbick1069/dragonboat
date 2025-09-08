// LocalStorage operations

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
                data.paddlers.forEach(p => {
                    // Add default gender for backward compatibility
                    if (!p.gender) {
                        p.gender = 'M';
                    }
                    paddlers.push(p);
                });
            }
              // Load boat configuration
            if (Array.isArray(data.boat)) {
                for (let i = 0; i < 10; i++) {
                    for (let j = 0; j < 2; j++) {
                        const paddler = data.boat[i] && data.boat[i][j] ? data.boat[i][j] : null;
                        if (paddler && !paddler.gender) {
                            paddler.gender = 'M'; // Add default gender for backward compatibility
                        }
                        boat[i][j] = paddler;
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
            updateSimplifiedLineup();
            updateBoatStatistics();
            
            return true;
        }
        return false;
    } catch (error) {
        console.error('Failed to load from localStorage:', error);
        return false;
    }
}