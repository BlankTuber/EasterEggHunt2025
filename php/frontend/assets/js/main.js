/**
 * Kingdom Hunt Main JavaScript
 */

// Store user data
let userData = null;
let currentPage = '';
let authToken = '';

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize auth token from localStorage
    authToken = localStorage.getItem('kingdom_hunt_token') || '';
    
    // Store the current page from URL
    currentPage = window.location.search.match(/page=([^&]*)/)?.[1] || 'home';
    
    // Set current user ID in localStorage for Socket.io
    if (document.querySelector('meta[name="user-id"]')) {
        const userId = document.querySelector('meta[name="user-id"]').getAttribute('content');
        localStorage.setItem('current_user_id', userId);
    }
    
    // Auto-dismiss alerts after 5 seconds
    setTimeout(function() {
        const alerts = document.querySelectorAll('.alert:not(.alert-persistent)');
        alerts.forEach(alert => {
            if (bootstrap && bootstrap.Alert) {
                const bsAlert = new bootstrap.Alert(alert);
                bsAlert.close();
            } else {
                alert.style.display = 'none';
            }
        });
    }, 5000);
    
    // Initialize tooltips
    if (bootstrap && bootstrap.Tooltip) {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }
    
    // Handle challenge completion
    const completeBtn = document.getElementById('complete-challenge');
    if (completeBtn) {
        completeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            const challengeId = this.dataset.challengeId;
            if (!challengeId) return;
            
            // Show loading state
            this.disabled = true;
            this.innerHTML = '<span class="loading-spinner me-2"></span> Completing...';
            
            // Submit completion to the server
            fetch('/api/challenge/complete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authToken
                },
                body: JSON.stringify({ challenge_id: challengeId })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Show success message
                    showAlert('Challenge completed successfully!', 'success');
                    
                    // Redirect after a short delay
                    setTimeout(() => {
                        window.location.href = '/?page=dashboard';
                    }, 1500);
                } else {
                    // Show error
                    showAlert(data.error || 'Failed to complete challenge', 'danger');
                    
                    // Reset button
                    this.disabled = false;
                    this.innerHTML = 'Complete Challenge';
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showAlert('An error occurred while completing the challenge', 'danger');
                
                // Reset button
                this.disabled = false;
                this.innerHTML = 'Complete Challenge';
            });
        });
    }
    
    // Initialize page-specific JavaScript
    initializePageSpecific();
});

/**
 * Initialize page-specific functionality
 */
function initializePageSpecific() {
    switch (currentPage) {
        case 'dashboard':
            initDashboard();
            break;
        case 'story':
            initStory();
            break;
        case 'convergence':
            // Handled by socket-client.js
            break;
        case 'challenge':
            // Handled by socket-client.js and specific challenge scripts
            break;
        case 'intro':
            initIntro();
            break;
    }
}

/**
 * Initialize dashboard page
 */
function initDashboard() {
    // Check for new updates
    checkForUpdates();
    
    // Event delegation for challenge links
    document.addEventListener('click', function(e) {
        if (e.target.matches('.challenge-link') || e.target.closest('.challenge-link')) {
            const link = e.target.matches('.challenge-link') ? e.target : e.target.closest('.challenge-link');
            const isAvailable = link.dataset.available === 'true';
            
            if (!isAvailable) {
                e.preventDefault();
                showAlert('This challenge is not yet available. It requires coordination with other players.', 'warning');
            }
        }
    });
}

/**
 * Initialize story page
 */
function initStory() {
    // Add scroll tracking to remember position
    const storyContent = document.querySelector('.story-content');
    if (storyContent) {
        // Restore scroll position if saved
        const savedPosition = sessionStorage.getItem('story_scroll_position');
        if (savedPosition) {
            storyContent.scrollTop = parseInt(savedPosition);
        }
        
        // Save scroll position when scrolling
        storyContent.addEventListener('scroll', function() {
            sessionStorage.setItem('story_scroll_position', this.scrollTop);
        });
    }
}

/**
 * Initialize intro page
 */
function initIntro() {
    const introForm = document.querySelector('form');
    if (introForm) {
        introForm.addEventListener('submit', function(e) {
            const submitBtn = this.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="loading-spinner me-2"></span> Beginning...';
            }
        });
    }
}

/**
 * Check for updates
 */
function checkForUpdates() {
    // In a real implementation, this would check for new challenges or story segments
    console.log('Checking for updates...');
    
    // Simulate checking for updates
    setTimeout(() => {
        // No action needed for simulation
        console.log('Update check complete.');
    }, 1000);
}

/**
 * Show alert message
 */
function showAlert(message, type = 'info') {
    // Create alert element
    const alertEl = document.createElement('div');
    alertEl.className = `alert alert-${type} alert-dismissible fade show`;
    alertEl.setAttribute('role', 'alert');
    alertEl.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Find container for alerts
    const container = document.querySelector('main .container');
    if (container) {
        // Insert at the top
        container.insertBefore(alertEl, container.firstChild);
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            if (bootstrap && bootstrap.Alert) {
                const bsAlert = new bootstrap.Alert(alertEl);
                bsAlert.close();
            } else {
                alertEl.style.display = 'none';
            }
        }, 5000);
    }
}

/**
 * Store authentication token
 */
function setAuthToken(token) {
    authToken = token;
    localStorage.setItem('kingdom_hunt_token', token);
}

/**
 * Remove authentication token
 */
function clearAuthToken() {
    authToken = '';
    localStorage.removeItem('kingdom_hunt_token');
}