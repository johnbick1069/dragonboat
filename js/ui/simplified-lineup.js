// Simplified lineup functionality
function updateSimplifiedLineup() {
    // Find or create the simplified lineup container
    let simplifiedLineupElement = document.getElementById('simplifiedLineup');
    if (!simplifiedLineupElement) {
        simplifiedLineupElement = document.createElement('div');
        simplifiedLineupElement.id = 'simplifiedLineup';
        simplifiedLineupElement.className = 'simplified-lineup';
        
        // Find the right location to insert (in sidebar, after paddler list)
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.appendChild(simplifiedLineupElement);
        }
    }
    
    // Create the simplified boat table
    simplifiedLineupElement.innerHTML = '<h3>Final Lineup</h3>';
    const tableElement = document.createElement('table');
    tableElement.className = 'simplified-boat-table';
    
    // Create header row
    const headerRow = document.createElement('tr');
    const leftHeader = document.createElement('th');
    leftHeader.textContent = 'Left';
    const rowNumHeader = document.createElement('th');
    rowNumHeader.textContent = 'Row';
    const rightHeader = document.createElement('th');
    rightHeader.textContent = 'Right';
    
    headerRow.appendChild(leftHeader);
    headerRow.appendChild(rowNumHeader);
    headerRow.appendChild(rightHeader);
    tableElement.appendChild(headerRow);
    
    // Create rows for each position
    for (let i = 0; i < 10; i++) {
        const row = document.createElement('tr');
        
        // Left paddler
        const leftCell = document.createElement('td');
        if (boat[i][0]) {
            // Just show the name without any other information
            leftCell.textContent = boat[i][0].name;
            if (fixedSeats.has(`${i}-0`)) {
                leftCell.classList.add('fixed');
            }
        } else {
            leftCell.innerHTML = '<span class="empty">—</span>';
        }
        
        // Row number
        const rowNumCell = document.createElement('td');
        rowNumCell.textContent = i + 1;
        rowNumCell.className = 'row-number';
        
        // Right paddler
        const rightCell = document.createElement('td');
        if (boat[i][1]) {
            // Just show the name without any other information
            rightCell.textContent = boat[i][1].name;
            if (fixedSeats.has(`${i}-1`)) {
                rightCell.classList.add('fixed');
            }
        } else {
            rightCell.innerHTML = '<span class="empty">—</span>';
        }
        
        row.appendChild(leftCell);
        row.appendChild(rowNumCell);
        row.appendChild(rightCell);
        tableElement.appendChild(row);
    }
    
    simplifiedLineupElement.appendChild(tableElement);
}