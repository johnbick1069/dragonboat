// Import and export functionality

// Export team to CSV file
function exportTeam() {
    // Prepare data for Papa Parse
    const csvData = paddlers.map(paddler => ({
        Name: paddler.name,
        Weight: paddler.weight,
        Side: paddler.side
    }));
    
    // Use Papa Parse to generate CSV with proper escaping
    const csvContent = Papa.unparse(csvData, {
        header: true,
        delimiter: ",",
        newline: "\n"
    });
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "dragon_boat_team.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the object URL
    URL.revokeObjectURL(url);
}

// Import team from CSV file
function importTeam(e) {
    const file = e.target.files[0];
    if (!file) {
        return;
    }
    
    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
        alert('Please select a CSV file.');
        return;
    }
    
    // Use Papa Parse for robust CSV parsing
    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        trimHeaders: true,
        transformHeader: function(header) {
            // Normalize header names (case-insensitive matching)
            return header.toLowerCase().trim();
        },
        complete: function(results) {
            if (results.errors && results.errors.length > 0) {
                console.warn('CSV parsing warnings:', results.errors);
                
                // Show non-critical errors as warnings
                const criticalErrors = results.errors.filter(error => 
                    error.type === 'Delimiter' || error.type === 'Quotes'
                );
                
                if (criticalErrors.length > 0) {
                    alert('Error parsing CSV file. Please check the file format.');
                    return;
                }
            }
            
            if (!results.data || results.data.length === 0) {
                alert('No valid data found in the CSV file.');
                return;
            }
            
            // Create a map of existing paddlers by name for quick lookup
            const existingPaddlers = {};
            paddlers.forEach(p => {
                existingPaddlers[p.name.toLowerCase()] = p;
            });
            
            let importedCount = 0;
            let updatedCount = 0;
            let errorCount = 0;
            
            // Process each row
            results.data.forEach((row, index) => {
                try {
                    // Support multiple possible column names (flexible header matching)
                    const name = (row.name || row.paddler || row['paddler name'] || '').trim();
                    const weightStr = (row.weight || row.kg || row['weight (kg)'] || '').toString().trim();
                    const side = (row.side || row.position || row.preference || '').toString().toLowerCase().trim();
                    
                    // Validate required fields
                    if (!name) {
                        console.warn(`Row ${index + 2}: Missing name`);
                        errorCount++;
                        return;
                    }
                    
                    const weight = parseFloat(weightStr);
                    if (isNaN(weight) || weight <= 0 || weight > 200) {
                        console.warn(`Row ${index + 2}: Invalid weight "${weightStr}" for ${name}`);
                        errorCount++;
                        return;
                    }
                    
                    // Normalize and validate side preference
                    let normalizedSide = side;
                    if (side === 'l' || side === 'left') {
                        normalizedSide = 'left';
                    } else if (side === 'r' || side === 'right') {
                        normalizedSide = 'right';
                    } else if (side === 'b' || side === 'both' || side === 'either') {
                        normalizedSide = 'both';
                    } else if (side === '') {
                        normalizedSide = 'both'; // Default to both if not specified
                    } else {
                        console.warn(`Row ${index + 2}: Invalid side "${side}" for ${name}, defaulting to "both"`);
                        normalizedSide = 'both';
                    }
                    
                    // Check if paddler already exists (case-insensitive)
                    const existingPaddler = existingPaddlers[name.toLowerCase()];
                    
                    if (existingPaddler) {
                        // Update existing paddler
                        existingPaddler.weight = weight;
                        existingPaddler.side = normalizedSide;
                        updatedCount++;
                    } else {
                        // Add new paddler
                        const paddler = {
                            id: Date.now() + Math.random(), // Ensure unique ID
                            name,
                            weight,
                            side: normalizedSide
                        };
                        paddlers.push(paddler);
                        existingPaddlers[name.toLowerCase()] = paddler;
                        importedCount++;
                    }
                } catch (error) {
                    console.error(`Error processing row ${index + 2}:`, error);
                    errorCount++;
                }
            });
            
            // Show import results
            let message = `Import completed!\n`;
            if (importedCount > 0) {
                message += `• ${importedCount} new paddler(s) added\n`;
            }
            if (updatedCount > 0) {
                message += `• ${updatedCount} existing paddler(s) updated\n`;
            }
            if (errorCount > 0) {
                message += `• ${errorCount} row(s) had errors (check console for details)`;
            }
            
            alert(message);
            updateAndSave();
        },
        error: function(error) {
            console.error('CSV parsing error:', error);
            alert('Error reading CSV file: ' + error.message);
        }
    });
    
    // Reset the file input to allow selecting the same file again
    setTimeout(() => {
        const csvFileInput = document.getElementById('csvFileInput');
        csvFileInput.value = '';
    }, 100);
}