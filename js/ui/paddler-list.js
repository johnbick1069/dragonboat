// UI components for paddler list
function renderPaddlerList() {
    const paddlerListElement = document.getElementById('paddlerList');
    paddlerListElement.innerHTML = '';
    
    if (paddlers.length === 0) {
        paddlerListElement.innerHTML = '<div class="empty-message">No paddlers added yet</div>';
        return;
    }
    
    // Show all paddlers, but mark those in the boat as "in-boat"
    paddlers.forEach(paddler => {
        const isInBoat = isPaddlerInBoat(paddler);
        const paddlerElement = document.createElement('div');
        paddlerElement.className = 'paddler-item';
        if (isInBoat) {
            paddlerElement.classList.add('in-boat');
        }
        paddlerElement.draggable = true;
        paddlerElement.dataset.id = paddler.id;
        
        const sideClass = `side-${paddler.side}`;
        
        paddlerElement.innerHTML = `
            <div>
                <div class="paddler-name">${paddler.name}</div>
                <div class="paddler-details">${paddler.weight} kg</div>
            </div>
            <div>
                <span class="paddler-side ${sideClass}" data-id="${paddler.id}">${paddler.side}</span>
            </div>
            <div class="paddler-actions">
                <button class="edit edit-paddler" data-id="${paddler.id}">✎</button>
                <button class="danger delete-paddler" data-id="${paddler.id}">✕</button>
            </div>
        `;
        
        paddlerElement.addEventListener('dragstart', handleDragStart);
        
        // Add click event to toggle the paddler in/out of the boat
        paddlerElement.addEventListener('click', (e) => {
            // Don't trigger if clicking the delete button, edit button, or side toggle
            if (e.target.classList.contains('delete-paddler') || 
                e.target.classList.contains('edit-paddler') ||
                e.target.classList.contains('paddler-side')) {
                return;
            }
            
            const id = parseInt(paddlerElement.dataset.id);
            togglePaddlerInBoat(id);
        });
        
        // Delete paddler button
        paddlerElement.querySelector('.delete-paddler').addEventListener('click', (e) => {
            e.stopPropagation();
            const id = parseInt(e.target.dataset.id);
            const index = paddlers.findIndex(p => p.id === id);
            if (index !== -1) {
                // Remove from boat first if the paddler is in the boat
                removePaddlerFromBoat(id);
                // Then remove from paddlers array
                paddlers.splice(index, 1);
                updateAndSave();
            }
        });
        
        // Edit paddler button
        paddlerElement.querySelector('.edit-paddler').addEventListener('click', (e) => {
            e.stopPropagation();
            const id = parseInt(e.target.dataset.id);
            showEditPaddlerModal(id);
        });
        
        // Toggle side preference on click
        paddlerElement.querySelector('.paddler-side').addEventListener('click', (e) => {
            e.stopPropagation();
            const id = parseInt(e.target.dataset.id);
            togglePaddlerSide(id);
        });
        
        paddlerListElement.appendChild(paddlerElement);
    });
}