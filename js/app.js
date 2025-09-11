// Add these lines at the top of app.js to make shared variables accessible to all modules
let paddlers = [];
let boat;
let fixedSeats;

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the application
    initializeBoatModel();
    initializeBoatLayout();
    setupEventListeners();
    loadFromLocalStorage();
    
    // Load saved lineups if the function exists
    if (typeof loadSavedLineupsFromStorage === 'function') {
        loadSavedLineupsFromStorage();
    }
});

// Set up main event listeners
function setupEventListeners() {
    // Paddler management
    document.getElementById('addPaddler').addEventListener('click', addPaddler);
    document.getElementById('clearPaddlers').addEventListener('click', clearPaddlers);
    
    // Boat operations
    document.getElementById('autoGenerateLineup').addEventListener('click', autoGenerateLineup);
    document.getElementById('balanceBoat').addEventListener('click', balanceBoat);
    document.getElementById('clearAll').addEventListener('click', clearAll);
    document.getElementById('testAllLineups').addEventListener('click', showLineupTestConfig);
    document.getElementById('viewSavedLineups').addEventListener('click', showSavedLineups);
    
    // Import/Export
    document.getElementById('importCsv').addEventListener('click', () => {
        const csvFileInput = document.getElementById('csvFileInput');
        csvFileInput.value = ''; // Clear the input first
        csvFileInput.click();
    });
    document.getElementById('exportCsv').addEventListener('click', exportTeam);
    document.getElementById('csvFileInput').addEventListener('change', importTeam);
    
    // Data management
    document.getElementById('clearSavedData').addEventListener('click', clearSavedData);
}

// Update and save after changes
function updateAndSave() {
    renderPaddlerList();
    updateBoatLayout();
    updateSimplifiedLineup();
    updateBoatStatistics();
    saveToLocalStorage();
}

// Clear the whole boat but keep paddlers
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

// Clear all saved data
function clearSavedData() {
    if (confirm('Are you sure you want to delete all saved data? This cannot be undone.')) {
        localStorage.removeItem('dragonBoatData');
        window.location.reload();
    }
}