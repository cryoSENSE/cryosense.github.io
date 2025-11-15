/**
 * Entry point for cryoSENSE animation
 * Initializes the animation when DOM is ready
 */

// Global animation instance
let cryoAnimation = null;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    console.log('cryoSENSE Animation initializing...');

    // Create animation instance
    cryoAnimation = new CryoSENSEAnimation();

    // Initialize with default parameters (K=32, b=1)
    await cryoAnimation.initialize();

    // Start auto-animation
    cryoAnimation.startAutoAnimation();

    console.log('cryoSENSE Animation started with K=32, b=1');
});

// Handle page visibility changes (pause when tab is hidden)
document.addEventListener('visibilitychange', () => {
    if (cryoAnimation) {
        if (document.hidden) {
            // Pause animation when tab is hidden
            if (cryoAnimation.isPlaying) {
                cryoAnimation.togglePlayPause();
            }
        }
    }
});

// Prevent context menu on canvases
document.addEventListener('DOMContentLoaded', () => {
    const canvases = document.querySelectorAll('canvas');
    canvases.forEach(canvas => {
        canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    });
});
