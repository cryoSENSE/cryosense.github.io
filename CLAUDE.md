# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a static website for cryoSENSE - an interactive visualization demonstrating compressive cryo-EM imaging using pixel-space masking with block-wise summation. The project is built with vanilla JavaScript (no frameworks or build tools) and uses HTML5 Canvas for visualization.

## Development Commands

### Running the Application

Due to browser CORS restrictions, the application must be served via HTTP:

```bash
./start-server.sh
```

This starts a Python HTTP server on port 8000. Access at: `http://localhost:8000`

Alternative commands if the script doesn't work:
```bash
python3 -m http.server 8000
npx http-server -p 8000
```

**Important**: Do NOT open [index.html](index.html) directly with `file://` - it will fail due to CORS when loading the particle image.

## Architecture

### Script Loading Order

The HTML loads scripts in a specific order that **must be maintained**:

1. [js/utils.js](js/utils.js) - Utility functions and classes
2. [js/visualization.js](js/visualization.js) - Canvas rendering methods
3. [js/animation.js](js/animation.js) - Animation state and logic
4. [js/main.js](js/main.js) - Entry point and initialization

Dependencies flow downward (main.js depends on animation.js, which depends on visualization.js and utils.js).

### Core Components

**CryoSENSEAnimation Class** ([js/animation.js](js/animation.js))
- Main controller for the animation system
- Manages state: block size (K), number of masks (b), current position, playback state
- Handles mask generation using seeded random number generator
- Orchestrates the block-by-block animation loop
- Key methods:
  - `initialize()` - Sets up canvases, loads image, generates masks
  - `animateBlockSummation()` - Main animation loop
  - `processCurrentBlock()` - Renders current block state
  - `generateBinaryMask()` - Creates random binary masks using SeededRandom

**Visualization Class** ([js/visualization.js](js/visualization.js))
- Static utility class for all canvas drawing operations
- Each method is independent and stateless
- Key methods:
  - `drawImage()` - Core method that scales and renders 2D arrays to canvas
  - `drawMaskedWithGrid()` - Overlays red grid showing K×K block boundaries
  - `drawBlockSummationProcess()` - Highlights current block being processed
  - `drawCompressedOutput()` - Progressive fill of compressed output
  - `updateMatrixDisplay()` - Updates DOM matrix representation

**Utility Functions** ([js/utils.js](js/utils.js))
- `SeededRandom` class - Deterministic random number generation for reproducible masks
- `loadImageFromFile()` - Async image loading with conversion to grayscale 2D array
- `applyMask()` - Element-wise multiplication of image and binary mask
- `blockwiseSummation()` - Core compression algorithm (divides into K×K blocks and sums)
- `calculateCompressionStats()` - Computes compression factor C = K²/b

### Data Flow

1. Load particle image → Convert to grayscale 2D array (128×128)
2. Generate b binary masks using SeededRandom
3. For each mask:
   - Apply mask to original image (element-wise multiplication)
   - Divide into non-overlapping K×K blocks
   - Sum all pixels within each block
   - Store compressed output (size: [128/K]×[128/K])
4. Animation loops through each block sequentially, visualizing the summation process

### Canvas System

The application uses 5 canvases, all 256×256 pixels (displaying 128×128 data at 2× scale):
- `original-canvas` - Shows source particle image
- `mask-only-canvas` - Current binary mask (white=1, black=0)
- `masked-canvas` - Masked image with red K×K grid overlay
- `process-canvas` - Same as masked but highlights current block in yellow
- `output-canvas` - Progressive display of compressed output

## Key Constraints

### Image Format
- All images are represented as 2D arrays: `Array<Array<number>>`
- Values range from 0-255 (grayscale)
- Default image size is 128×128 pixels

### Seeded Randomness
- Masks use `SeededRandom` class with seed `12345` for reproducibility
- When resetting animation, the RNG is reset to ensure identical masks
- Do not use `Math.random()` for mask generation

### Display Scaling
- Image data is 128×128, canvases are 256×256
- Visualization methods use `scale=2` parameter
- When modifying visualization code, maintain this 2× scaling convention

## Common Modifications

### Changing Default Parameters
Default animation parameters are set in [js/animation.js](js/animation.js):
- `this.K = 32` - Block size (line 8)
- `this.b = 1` - Number of masks (line 9)
- `this.animationSpeed = 400` - Milliseconds between frames (line 14)

### Adding New Visualizations
To add a new canvas view:
1. Add canvas element to [index.html](index.html) in the visualization grid
2. Add canvas ID to `setupCanvases()` in CryoSENSEAnimation
3. Create static drawing method in Visualization class
4. Call the method from `updateDisplay()` or `processCurrentBlock()`

### Modifying Compression Algorithm
The core algorithm is in `blockwiseSummation()` ([js/utils.js](js/utils.js):180). When modifying:
- Maintain the K×K non-overlapping block structure
- Update `calculateCompressionStats()` if the compression formula changes
- Ensure output dimensions are calculated as `Math.floor(imageSize / K)`
