# cryoSENSE Pixel-Space Masking Animation

Interactive visualization of compressive cryo-EM imaging using pixel-space masking and block-wise summation.

## Quick Start

### Running the Animation

Due to browser security (CORS) restrictions, you need to run a local web server:

**Option 1: Use the provided script (easiest)**
```bash
./start-server.sh
```

**Option 2: Run Python server manually**
```bash
python3 -m http.server 8000
```

**Option 3: Use Node.js (if you have it installed)**
```bash
npx http-server -p 8000
```

Then open your browser to: **http://localhost:8000**

### Stopping the Server

Press `Ctrl+C` in the terminal to stop the server.

## Features

- **Auto-start animation** with default parameters (K=32, b=1)
- **Real-time visualization** of the compression process
- **Interactive controls** to adjust block size, number of masks, and speed
- **Red grid overlay** showing K×K block boundaries
- **Progressive output** display with matrix representation
- **Compression statistics** showing data reduction

## Controls

- **Block Size (K)**: Size of compression blocks (2-64)
- **Number of Masks (b)**: Number of binary masks to apply (1-4)
- **Play/Pause**: Start or pause the animation
- **Reset**: Restart animation from the beginning
- **Step**: Advance one block at a time (when paused)
- **Speed**: Animation speed in milliseconds

## File Structure

```
cryosense_website/
├── index.html              # Main HTML page
├── css/
│   └── styles.css         # Styling
├── js/
│   ├── main.js           # Entry point
│   ├── animation.js      # Animation logic
│   ├── visualization.js  # Canvas drawing functions
│   └── utils.js          # Utility functions
├── assets/
│   └── sample-particle.png  # Particle image
├── start-server.sh       # Server startup script
└── README.md            # This file
```

## Technical Details

### Compression Process

1. **Binary Masking**: Apply random binary masks to the original image
2. **Block Division**: Divide masked image into K×K non-overlapping blocks
3. **Summation**: Sum all pixels within each block
4. **Output**: Compressed representation with size (128/K) × (128/K) × b

### Compression Factor

C = K² / b

For default settings (K=32, b=1):
- Original: 128×128 = 16,384 pixels
- Compressed: 4×4×1 = 16 pixels
- Compression Factor: 1024
- Data Reduction: 99.9%

## Requirements

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Python 3 (for running the local server)

## Troubleshooting

**Issue**: Animation doesn't load or shows CORS error
**Solution**: Make sure you're accessing via `http://localhost:8000` and not opening the file directly with `file://`

**Issue**: Image doesn't appear
**Solution**: Ensure `assets/sample-particle.png` exists and the server is running
