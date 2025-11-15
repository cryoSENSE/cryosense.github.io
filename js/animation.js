/**
 * Main animation class for cryoSENSE visualization
 */

class CryoSENSEAnimation {
    constructor() {
        // Animation parameters
        this.K = 32;            // Default block size
        this.b = 1;             // Default number of masks
        this.imageSize = 128;   // Image dimensions
        this.currentMask = 0;   // Current mask index
        this.currentBlockX = 0; // Current block X position
        this.currentBlockY = 0; // Current block Y position
        this.animationSpeed = 400; // ms between frames
        this.isPlaying = true;
        this.animationTimer = null;

        // Canvas contexts
        this.contexts = {};

        // Data structures
        this.originalImage = null;
        this.masks = [];
        this.maskedImages = [];
        this.outputs = [];

        // Random seed for reproducibility
        this.seed = 12345;
        this.rng = new SeededRandom(this.seed);
    }

    /**
     * Initialize the animation
     */
    async initialize() {
        this.setupCanvases();
        await this.loadParticleImage();
        this.setupControls();
        this.generateMasks();
        this.updateDisplay();
    }

    /**
     * Setup canvas contexts
     */
    setupCanvases() {
        const canvasIds = [
            'original-canvas',
            'mask-only-canvas',
            'masked-canvas',
            'process-canvas',
            'output-canvas'
        ];

        canvasIds.forEach(id => {
            const canvas = document.getElementById(id);
            if (canvas) {
                this.contexts[id] = canvas.getContext('2d');
            }
        });
    }

    /**
     * Load particle image from PNG file
     */
    async loadParticleImage() {
        try {
            this.originalImage = await loadImageFromFile('assets/sample-particle.png', this.imageSize);
            console.log('Particle image loaded successfully');
        } catch (error) {
            console.error('Failed to load particle image:', error);
            // Fallback to synthetic particle
            console.log('Falling back to synthetic particle image');
            this.originalImage = generateSyntheticParticle(this.imageSize);
        }
    }

    /**
     * Setup control event listeners
     */
    setupControls() {
        // K selector
        const kSlider = document.getElementById('k-slider');
        const kValue = document.getElementById('k-value');
        kSlider.addEventListener('change', (e) => {
            this.K = parseInt(e.target.value);
            kValue.textContent = this.K;
            this.resetAnimation();
        });

        // b slider
        const bSlider = document.getElementById('b-slider');
        const bValue = document.getElementById('b-value');
        bSlider.addEventListener('input', (e) => {
            this.b = parseInt(e.target.value);
            bValue.textContent = this.b;
            this.resetAnimation();
        });

        // Speed slider
        const speedSlider = document.getElementById('speed-slider');
        const speedValue = document.getElementById('speed-value');
        speedSlider.addEventListener('input', (e) => {
            this.animationSpeed = parseInt(e.target.value);
            speedValue.textContent = this.animationSpeed;
        });

        // Play/Pause button
        const playPauseBtn = document.getElementById('play-pause');
        playPauseBtn.addEventListener('click', () => {
            this.togglePlayPause();
        });

        // Reset button
        const resetBtn = document.getElementById('reset');
        resetBtn.addEventListener('click', () => {
            this.resetAnimation();
        });

        // Step button
        const stepBtn = document.getElementById('step');
        stepBtn.addEventListener('click', () => {
            if (this.isPlaying) {
                this.togglePlayPause();
            }
            this.stepAnimation();
        });
    }

    /**
     * Generate binary masks
     */
    generateMasks() {
        this.masks = [];
        this.maskedImages = [];
        this.outputs = [];

        for (let i = 0; i < this.b; i++) {
            const mask = this.generateBinaryMask();
            this.masks.push(mask);

            const maskedImage = applyMask(this.originalImage, mask);
            this.maskedImages.push(maskedImage);

            const output = blockwiseSummation(maskedImage, this.K);
            this.outputs.push(output);
        }
    }

    /**
     * Generate a single binary mask
     */
    generateBinaryMask() {
        const mask = new Array(this.imageSize);
        for (let i = 0; i < this.imageSize; i++) {
            mask[i] = new Array(this.imageSize);
            for (let j = 0; j < this.imageSize; j++) {
                mask[i][j] = this.rng.random() > 0.5 ? 1 : 0;
            }
        }
        return mask;
    }

    /**
     * Update all display elements
     */
    updateDisplay() {
        // Update original image
        Visualization.drawOriginalImage(
            this.contexts['original-canvas'],
            this.originalImage
        );

        // Update mask display
        if (this.masks.length > 0) {
            Visualization.drawMaskOnly(
                this.contexts['mask-only-canvas'],
                this.masks[this.currentMask]
            );
        }

        // Update masked image with grid
        if (this.maskedImages.length > 0) {
            Visualization.drawMaskedWithGrid(
                this.contexts['masked-canvas'],
                this.maskedImages[this.currentMask],
                this.K
            );
        }

        // Update compression stats
        this.updateCompressionStats();

        // Update mask index display
        document.getElementById('mask-index').textContent = this.currentMask + 1;
        document.getElementById('total-masks').textContent = this.b;
    }

    /**
     * Update compression statistics display
     */
    updateCompressionStats() {
        const stats = calculateCompressionStats(this.K, this.b, this.imageSize);

        document.getElementById('compression-factor').textContent =
            Math.floor(stats.compressionFactor);

        const compressedText = `${stats.compressedDim}×${stats.compressedDim}×${this.b} = ${formatNumber(stats.compressedSize)} pixels`;
        document.getElementById('compressed-size').textContent = compressedText;

        document.getElementById('reduction').textContent = stats.reduction + '%';
    }

    /**
     * Process current block
     */
    processCurrentBlock() {
        if (this.maskedImages.length === 0) return;

        const maskedImage = this.maskedImages[this.currentMask];

        // Draw block summation process
        Visualization.drawBlockSummationProcess(
            this.contexts['process-canvas'],
            maskedImage,
            this.K,
            this.currentBlockX,
            this.currentBlockY
        );

        // Calculate block sum
        const startX = this.currentBlockX * this.K;
        const startY = this.currentBlockY * this.K;
        const blockSum = calculateBlockSum(maskedImage, startX, startY, this.K);

        // Update sum display
        document.getElementById('sum-value').textContent = Math.floor(blockSum);

        // Update compressed output (progressive fill)
        const blocksPerRow = Math.floor(this.imageSize / this.K);
        const currentBlockIndex = this.currentBlockY * blocksPerRow + this.currentBlockX + 1;

        Visualization.drawCompressedOutput(
            this.contexts['output-canvas'],
            this.outputs[this.currentMask],
            currentBlockIndex
        );

        // Update matrix display
        const matrixContainer = document.getElementById('matrix-display');
        Visualization.updateMatrixDisplay(
            matrixContainer,
            this.outputs[this.currentMask],
            currentBlockIndex - 1
        );
    }

    /**
     * Animate block summation
     */
    animateBlockSummation() {
        if (!this.isPlaying) return;

        // Process current block
        this.processCurrentBlock();

        // Move to next block
        const blocksPerRow = Math.floor(this.imageSize / this.K);
        this.currentBlockX++;

        if (this.currentBlockX >= blocksPerRow) {
            this.currentBlockX = 0;
            this.currentBlockY++;

            if (this.currentBlockY >= blocksPerRow) {
                // Move to next mask or restart
                this.currentBlockY = 0;
                this.currentMask++;

                if (this.currentMask >= this.b) {
                    // Complete cycle - restart after pause
                    this.currentMask = 0;
                    this.updateDisplay();

                    // Pause briefly before restarting
                    this.animationTimer = setTimeout(() => {
                        if (this.isPlaying) {
                            this.animateBlockSummation();
                        }
                    }, 2000);
                    return;
                } else {
                    // Update display for new mask
                    this.updateDisplay();
                }
            }
        }

        // Schedule next frame
        this.animationTimer = setTimeout(() => {
            this.animateBlockSummation();
        }, this.animationSpeed);
    }

    /**
     * Start auto animation
     */
    startAutoAnimation() {
        this.isPlaying = true;
        this.updatePlayPauseButton();
        if (this.animationTimer) {
            clearTimeout(this.animationTimer);
        }
        this.animateBlockSummation();
    }

    /**
     * Toggle play/pause
     */
    togglePlayPause() {
        this.isPlaying = !this.isPlaying;
        this.updatePlayPauseButton();

        if (this.isPlaying) {
            this.animateBlockSummation();
        } else {
            if (this.animationTimer) {
                clearTimeout(this.animationTimer);
                this.animationTimer = null;
            }
        }
    }

    /**
     * Update play/pause button icon
     */
    updatePlayPauseButton() {
        const btn = document.getElementById('play-pause');
        btn.textContent = this.isPlaying ? '⏸' : '▶';
        btn.setAttribute('aria-label', this.isPlaying ? 'Pause' : 'Play');
        btn.style.background = this.isPlaying ? '#28a745' : '#007bff';
    }

    /**
     * Step animation by one block
     */
    stepAnimation() {
        this.processCurrentBlock();

        const blocksPerRow = Math.floor(this.imageSize / this.K);
        this.currentBlockX++;

        if (this.currentBlockX >= blocksPerRow) {
            this.currentBlockX = 0;
            this.currentBlockY++;

            if (this.currentBlockY >= blocksPerRow) {
                this.currentBlockY = 0;
                this.currentMask++;

                if (this.currentMask >= this.b) {
                    this.currentMask = 0;
                }

                this.updateDisplay();
            }
        }
    }

    /**
     * Reset animation to beginning
     */
    resetAnimation() {
        // Stop current animation
        if (this.animationTimer) {
            clearTimeout(this.animationTimer);
            this.animationTimer = null;
        }

        // Reset state
        this.currentMask = 0;
        this.currentBlockX = 0;
        this.currentBlockY = 0;

        // Reset RNG
        this.rng.reset(this.seed);

        // Regenerate masks
        this.generateMasks();

        // Update display
        this.updateDisplay();

        // Clear process canvas
        Visualization.clearCanvas(this.contexts['process-canvas']);
        Visualization.clearCanvas(this.contexts['output-canvas']);

        // Clear sum display
        document.getElementById('sum-value').textContent = '0';

        // Clear matrix display
        document.getElementById('matrix-display').innerHTML = '';

        // Restart if playing
        if (this.isPlaying) {
            this.startAutoAnimation();
        }
    }
}
