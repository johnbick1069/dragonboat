// Import and export functionality

// Export team to CSV file
function exportTeam() {
    // Create CSV content
    let csvContent = "Name,Weight,Side\n";
    
    paddlers.forEach(paddler => {
        csvContent += `${paddler.name},${paddler.weight},${paddler.side}\n`;
    });
    
    // Create download link
    const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "dragon_boat_team.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
}

// Import team from CSV file
function importTeam(e) {
    const file = e.target.files[0];
    if (!file) {
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const contents = e.target.result;
        const lines = contents.split('\n');
        
        // Create a map of existing paddlers by name for quick lookup
        const existingPaddlers = {};
        paddlers.forEach(p => {
            existingPaddlers[p.name] = p;
        });
        
        // Skip header row
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line) {
                const parts = line.split(',');
                if (parts.length >= 3) {
                    const name = parts[0].trim();
                    const weight = parseFloat(parts[1].trim());
                    const side = parts[2].trim().toLowerCase();
                    
                    // Validate data
                    if (name && !isNaN(weight) && weight > 0 && 
                        (side === 'left' || side === 'right' || side === 'both')) {
                        
                        // Check if paddler already exists
                        if (existingPaddlers[name]) {
                            // Update existing paddler
                            existingPaddlers[name].weight = weight;
                            existingPaddlers[name].side = side;
                        } else {
                            // Add new paddler
                            const paddler = {
                                id: Date.now() + i, // Ensure unique ID
                                name,
                                weight,
                                side
                            };
                            paddlers.push(paddler);
                            existingPaddlers[name] = paddler;
                        }
                    }
                }
            }
        }
        
        updateAndSave();
    };
    reader.readAsText(file);
    
    // Reset the file input to allow selecting the same file again
    // This must be done after the file is read to avoid issues
    setTimeout(() => {
        const csvFileInput = document.getElementById('csvFileInput');
        csvFileInput.value = '';
    }, 100);
}