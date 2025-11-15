/**
 * Visualization helper functions for rendering on canvas
 */

class Visualization {
    /**
     * Draw a 2D grayscale image on canvas
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Array<Array<number>>} image - Image data (values 0-255)
     * @param {number} scale - Scale factor for display (default 2 for 128->256)
     */
    static drawImage(ctx, image, scale = 2) {
        const height = image.length;
        const width = image[0].length;
        const canvasWidth = width * scale;
        const canvasHeight = height * scale;

        const imageData = ctx.createImageData(canvasWidth, canvasHeight);

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const value = Math.floor(image[y][x]);

                // Scale up by drawing multiple pixels
                for (let dy = 0; dy < scale; dy++) {
                    for (let dx = 0; dx < scale; dx++) {
                        const idx = ((y * scale + dy) * canvasWidth + (x * scale + dx)) * 4;
                        imageData.data[idx] = value;     // R
                        imageData.data[idx + 1] = value; // G
                        imageData.data[idx + 2] = value; // B
                        imageData.data[idx + 3] = 255;   // A
                    }
                }
            }
        }

        ctx.putImageData(imageData, 0, 0);
    }

    /**
     * Draw original particle image
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Array<Array<number>>} image - Original image
     */
    static drawOriginalImage(ctx, image) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        this.drawImage(ctx, image, 2);
    }

    /**
     * Draw binary mask (white = 1, black = 0)
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Array<Array<number>>} mask - Binary mask
     */
    static drawMaskOnly(ctx, mask) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        const height = mask.length;
        const width = mask[0].length;
        const scale = 2;

        const imageData = ctx.createImageData(width * scale, height * scale);

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const value = mask[y][x] * 255;

                for (let dy = 0; dy < scale; dy++) {
                    for (let dx = 0; dx < scale; dx++) {
                        const idx = ((y * scale + dy) * width * scale + (x * scale + dx)) * 4;
                        imageData.data[idx] = value;
                        imageData.data[idx + 1] = value;
                        imageData.data[idx + 2] = value;
                        imageData.data[idx + 3] = 255;
                    }
                }
            }
        }

        ctx.putImageData(imageData, 0, 0);
    }

    /**
     * Draw masked image with red block grid overlay
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Array<Array<number>>} maskedImage - Masked image
     * @param {number} blockSize - Size of blocks (K)
     */
    static drawMaskedWithGrid(ctx, maskedImage, blockSize) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        // Draw the masked image
        this.drawImage(ctx, maskedImage, 2);

        // Draw red grid lines
        this.drawBlockGrid(ctx, maskedImage.length, blockSize, 2);
    }

    /**
     * Draw block grid overlay
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} imageSize - Original image size
     * @param {number} blockSize - Size of blocks (K)
     * @param {number} scale - Display scale
     */
    static drawBlockGrid(ctx, imageSize, blockSize, scale = 2) {
        ctx.strokeStyle = '#dc3545';
        ctx.lineWidth = 1;

        // Draw vertical lines
        for (let x = blockSize; x < imageSize; x += blockSize) {
            ctx.beginPath();
            ctx.moveTo(x * scale, 0);
            ctx.lineTo(x * scale, imageSize * scale);
            ctx.stroke();
        }

        // Draw horizontal lines
        for (let y = blockSize; y < imageSize; y += blockSize) {
            ctx.beginPath();
            ctx.moveTo(0, y * scale);
            ctx.lineTo(imageSize * scale, y * scale);
            ctx.stroke();
        }
    }

    /**
     * Highlight current block being processed
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} blockX - Block X index
     * @param {number} blockY - Block Y index
     * @param {number} blockSize - Size of blocks (K)
     * @param {number} scale - Display scale
     */
    static highlightCurrentBlock(ctx, blockX, blockY, blockSize, scale = 2) {
        ctx.strokeStyle = '#ffc107';
        ctx.lineWidth = 3;
        ctx.fillStyle = 'rgba(255, 193, 7, 0.15)';

        const x = blockX * blockSize * scale;
        const y = blockY * blockSize * scale;
        const size = blockSize * scale;

        ctx.fillRect(x, y, size, size);
        ctx.strokeRect(x, y, size, size);
    }

    /**
     * Draw the block summation process view
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Array<Array<number>>} maskedImage - Masked image
     * @param {number} blockSize - Size of blocks (K)
     * @param {number} blockX - Current block X index
     * @param {number} blockY - Current block Y index
     */
    static drawBlockSummationProcess(ctx, maskedImage, blockSize, blockX, blockY) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        // Draw the masked image
        this.drawImage(ctx, maskedImage, 2);

        // Draw grid
        this.drawBlockGrid(ctx, maskedImage.length, blockSize, 2);

        // Highlight current block
        this.highlightCurrentBlock(ctx, blockX, blockY, blockSize, 2);
    }

    /**
     * Draw compressed output
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Array<Array<number>>} output - Compressed output
     * @param {number} fillBlocks - Number of blocks to show as filled
     */
    static drawCompressedOutput(ctx, output, fillBlocks = -1) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        const height = output.length;
        const width = output[0].length;

        // Normalize for display
        const normalized = normalizeForDisplay(output);

        // Calculate scale to fit in 256x256 canvas
        const scale = Math.floor(256 / Math.max(width, height));

        const imageData = ctx.createImageData(width * scale, height * scale);

        let blockCount = 0;
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const value = fillBlocks === -1 || blockCount < fillBlocks
                    ? Math.floor(normalized[y][x])
                    : 0;
                blockCount++;

                for (let dy = 0; dy < scale; dy++) {
                    for (let dx = 0; dx < scale; dx++) {
                        const idx = ((y * scale + dy) * width * scale + (x * scale + dx)) * 4;
                        imageData.data[idx] = value;
                        imageData.data[idx + 1] = value;
                        imageData.data[idx + 2] = value;
                        imageData.data[idx + 3] = 255;
                    }
                }
            }
        }

        ctx.putImageData(imageData, 0, 0);

        // Draw grid lines
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1;

        for (let x = 1; x < width; x++) {
            ctx.beginPath();
            ctx.moveTo(x * scale, 0);
            ctx.lineTo(x * scale, height * scale);
            ctx.stroke();
        }

        for (let y = 1; y < height; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * scale);
            ctx.lineTo(width * scale, y * scale);
            ctx.stroke();
        }
    }

    /**
     * Update matrix display
     * @param {HTMLElement} container - Matrix display container
     * @param {Array<Array<number>>} output - Compressed output
     * @param {number} highlightIndex - Index of cell to highlight (-1 for none)
     */
    static updateMatrixDisplay(container, output, highlightIndex = -1) {
        container.innerHTML = '';

        const height = output.length;
        const width = output[0].length;

        let index = 0;
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const cell = document.createElement('div');
                cell.className = 'matrix-cell';
                if (index === highlightIndex) {
                    cell.classList.add('highlighted');
                }
                cell.textContent = Math.floor(output[y][x]);
                container.appendChild(cell);
                index++;
            }
        }
    }

    /**
     * Clear canvas
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    static clearCanvas(ctx) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
}
