/**
 * Challenge Script Loader
 * Dynamically loads the appropriate challenge script based on the challenge type
 */

document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on a challenge page
    const challengeContainer = document.getElementById('challenge-container');
    if (!challengeContainer) return;
    
    // Get the challenge code from the container
    const challengeCode = challengeContainer.dataset.challengeCode;
    if (!challengeCode) return;
    
    // Normalize challenge code
    const normalizedCode = challengeCode.replace(/-/g, '_').toLowerCase();
    
    // Check if the script is already loaded
    if (document.querySelector(`script[src="/frontend/assets/js/challenges/${normalizedCode}.js"]`)) {
        console.log(`Challenge script ${normalizedCode}.js already loaded`);
        return;
    }
    
    // Create script element
    const script = document.createElement('script');
    script.src = `/frontend/assets/js/challenges/${normalizedCode}.js`;
    script.async = true;
    
    // Add error handling
    script.onerror = function() {
        console.error(`Failed to load challenge script: ${normalizedCode}.js`);
        
        // Show error in the challenge container
        challengeContainer.innerHTML = `
            <div class="alert alert-danger">
                <h4 class="alert-heading">Error Loading Challenge</h4>
                <p>Failed to load the challenge script. Please try refreshing the page or contact support.</p>
            </div>
        `;
    };
    
    // Add success callback
    script.onload = function() {
        console.log(`Challenge script loaded: ${normalizedCode}.js`);
    };
    
    // Add script to the document
    document.body.appendChild(script);
    
    console.log(`Loading challenge script: ${normalizedCode}.js`);
});