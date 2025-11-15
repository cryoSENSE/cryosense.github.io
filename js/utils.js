/**
 * Utility functions for cryoSENSE animation
 */

// Seeded random number generator for reproducibility
class SeededRandom {
    constructor(seed) {
        this.seed = seed;
    }

    random() {
        // Linear congruential generator
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return this.seed / 233280;
    }

    // Reset to original seed
    reset(seed) {
        this.seed = seed;
    }
}

/**
 * Load image from file and convert to grayscale array
 * @param {string} imagePath - Path to image file
 * @param {number} targetSize - Target size (width and height)
 * @returns {Promise<Array<Array<number>>>} - 2D array of pixel values (0-255)
 */
function loadImageFromFile(imagePath, targetSize = 128) {
    return new Promise((resolve, reject) => {
        const img = new Image();

        img.onload = () => {
            // Create temporary canvas
            const canvas = document.createElement('canvas');
            canvas.width = targetSize;
            canvas.height = targetSize;
            const ctx = canvas.getContext('2d');

            // Draw image scaled to target size
            ctx.drawImage(img, 0, 0, targetSize, targetSize);

            // Get image data
            const imageData = ctx.getImageData(0, 0, targetSize, targetSize);
            const pixels = imageData.data;

            // Convert to grayscale 2D array
            const grayscaleImage = new Array(targetSize);
            for (let y = 0; y < targetSize; y++) {
                grayscaleImage[y] = new Array(targetSize);
                for (let x = 0; x < targetSize; x++) {
                    const idx = (y * targetSize + x) * 4;
                    const r = pixels[idx];
                    const g = pixels[idx + 1];
                    const b = pixels[idx + 2];

                    // Convert to grayscale (luminosity method)
                    const gray = Math.floor(0.299 * r + 0.587 * g + 0.114 * b);
                    grayscaleImage[y][x] = gray;
                }
            }

            resolve(grayscaleImage);
        };

        img.onerror = () => {
            reject(new Error(`Failed to load image: ${imagePath}`));
        };

        img.src = imagePath;
    });
}

/**
 * Generate a synthetic particle image (Gaussian blob with noise)
 * @param {number} size - Size of the square image
 * @returns {Array<Array<number>>} - 2D array of pixel values (0-255)
 */
function generateSyntheticParticle(size) {
    const image = new Array(size);
    const centerX = size / 2;
    const centerY = size / 2;
    const sigma = size / 8;

    for (let y = 0; y < size; y++) {
        image[y] = new Array(size);
        for (let x = 0; x < size; x++) {
            // Gaussian blob
            const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
            const gaussian = Math.exp(-(dist ** 2) / (2 * sigma ** 2));

            // Add some structure - concentric rings
            const ringFreq = 4;
            const rings = 0.3 * Math.sin(dist / size * Math.PI * ringFreq);

            // Add noise
            const noise = (Math.random() - 0.5) * 0.15;

            // Combine and scale to 0-255
            let value = gaussian + rings + noise;
            value = Math.max(0, Math.min(1, value));
            image[y][x] = Math.floor(value * 255);
        }
    }

    return image;
}

/**
 * Calculate compression statistics
 * @param {number} K - Block size
 * @param {number} b - Number of masks
 * @param {number} imageSize - Original image size
 * @returns {Object} - Statistics object
 */
function calculateCompressionStats(K, b, imageSize) {
    const originalPixels = imageSize * imageSize;
    const compressedDim = Math.floor(imageSize / K);
    const compressedSize = compressedDim * compressedDim * b;
    const compressionFactor = (K * K) / b;
    const reduction = ((1 - 1 / compressionFactor) * 100).toFixed(1);

    return {
        originalPixels,
        compressedSize,
        compressedDim,
        compressionFactor,
        reduction
    };
}

/**
 * Apply element-wise multiplication of image and mask
 * @param {Array<Array<number>>} image - Original image
 * @param {Array<Array<number>>} mask - Binary mask
 * @returns {Array<Array<number>>} - Masked image
 */
function applyMask(image, mask) {
    const size = image.length;
    const masked = new Array(size);

    for (let y = 0; y < size; y++) {
        masked[y] = new Array(size);
        for (let x = 0; x < size; x++) {
            masked[y][x] = image[y][x] * mask[y][x];
        }
    }

    return masked;
}

/**
 * Calculate sum of pixels in a block
 * @param {Array<Array<number>>} image - Image data
 * @param {number} startX - Block starting X coordinate
 * @param {number} startY - Block starting Y coordinate
 * @param {number} blockSize - Size of the block
 * @returns {number} - Sum of pixels in the block
 */
function calculateBlockSum(image, startX, startY, blockSize) {
    let sum = 0;
    const endX = Math.min(startX + blockSize, image[0].length);
    const endY = Math.min(startY + blockSize, image.length);

    for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
            sum += image[y][x];
        }
    }

    return sum;
}

/**
 * Perform block-wise summation on masked image
 * @param {Array<Array<number>>} maskedImage - Masked image
 * @param {number} K - Block size
 * @returns {Array<Array<number>>} - Compressed output
 */
function blockwiseSummation(maskedImage, K) {
    const imageSize = maskedImage.length;
    const outputDim = Math.floor(imageSize / K);
    const output = new Array(outputDim);

    for (let by = 0; by < outputDim; by++) {
        output[by] = new Array(outputDim);
        for (let bx = 0; bx < outputDim; bx++) {
            const startX = bx * K;
            const startY = by * K;
            output[by][bx] = calculateBlockSum(maskedImage, startX, startY, K);
        }
    }

    return output;
}

/**
 * Normalize array values to 0-255 range for visualization
 * @param {Array<Array<number>>} data - Input data
 * @returns {Array<Array<number>>} - Normalized data
 */
function normalizeForDisplay(data) {
    // Find min and max
    let min = Infinity;
    let max = -Infinity;

    for (let row of data) {
        for (let val of row) {
            if (val < min) min = val;
            if (val > max) max = val;
        }
    }

    // Avoid division by zero
    if (max === min) return data;

    // Normalize
    const normalized = new Array(data.length);
    for (let y = 0; y < data.length; y++) {
        normalized[y] = new Array(data[y].length);
        for (let x = 0; x < data[y].length; x++) {
            normalized[y][x] = Math.floor(((data[y][x] - min) / (max - min)) * 255);
        }
    }

    return normalized;
}

/**
 * Format number with commas
 * @param {number} num - Number to format
 * @returns {string} - Formatted number
 */
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
