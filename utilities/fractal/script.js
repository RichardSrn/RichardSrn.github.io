// Canvas setup
const canvas = document.getElementById('fractalCanvas');
const ctx = canvas.getContext('2d');
let width, height;
let imageData;

// Fractal parameters
let fractalType = 'mandelbrot';
let maxIterations = 100;
let resolution = 1;
let juliaReal = -0.7;
let juliaImag = 0.27015;
let colorScheme = 'rainbow';
let customColor1 = '#000000';
let customColor2 = '#ffffff';

// View parameters
let centerX = 0;
let centerY = 0;
let zoomLevel = 1;

// Mouse interaction variables
let isDragging = false;
let lastX, lastY;

// Initialize
function initialize() {
    // Set canvas dimensions
    resizeCanvas();

    // Set up event listeners
    window.addEventListener('resize', resizeCanvas);
    document.getElementById('fractalType').addEventListener('change', handleFractalTypeChange);
    document.getElementById('maxIterations').addEventListener('input', handleIterationsChange);
    document.getElementById('resolution').addEventListener('input', handleResolutionChange);
    document.getElementById('juliaReal').addEventListener('input', handleJuliaRealChange);
    document.getElementById('juliaImag').addEventListener('input', handleJuliaImagChange);
    document.getElementById('colorScheme').addEventListener('change', handleColorSchemeChange);
    document.getElementById('customColor1').addEventListener('input', handleCustomColorChange);
    document.getElementById('customColor2').addEventListener('input', handleCustomColorChange);
    document.getElementById('resetView').addEventListener('click', resetView);
    document.getElementById('downloadImage').addEventListener('click', downloadImage);

    // Mouse and touch events for pan and zoom
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('wheel', handleWheel);
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', handleTouchEnd);

    // Initial setup for Julia parameters
    updateJuliaParamsVisibility();

    // Draw initial fractal
    drawFractal();
}

// Resize canvas to window size
function resizeCanvas() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    imageData = ctx.createImageData(width, height);
    drawFractal();
}

// Main fractal drawing function
function drawFractal() {
    const pixelRatio = resolution;
    const effectiveWidth = Math.floor(width * pixelRatio);
    const effectiveHeight = Math.floor(height * pixelRatio);

    imageData = ctx.createImageData(effectiveWidth, effectiveHeight);
    const data = imageData.data;

    // Aspect ratio correction
    const aspectRatio = width / height;
    const rangeX = 4 / zoomLevel;
    const rangeY = rangeX / aspectRatio;

    // Calculate boundaries
    const minX = centerX - rangeX / 2;
    const maxX = centerX + rangeX / 2;
    const minY = centerY - rangeY / 2;
    const maxY = centerY + rangeY / 2;

    // Iterate through each pixel
    for (let x = 0; x < effectiveWidth; x++) {
        for (let y = 0; y < effectiveHeight; y++) {
            // Map pixel coordinates to complex plane
            const cReal = minX + (x / effectiveWidth) * (maxX - minX);
            const cImag = minY + (y / effectiveHeight) * (maxY - minY);

            // Calculate pixel value based on fractal type
            let value = 0;
            switch (fractalType) {
                case 'mandelbrot':
                    value = calculateMandelbrot(cReal, cImag);
                    break;
                case 'julia':
                    value = calculateJulia(cReal, cImag, juliaReal, juliaImag);
                    break;
                case 'burningShip':
                    value = calculateBurningShip(cReal, cImag);
                    break;
                case 'tricorn':
                    value = calculateTricorn(cReal, cImag);
                    break;
            }

            // Get color for pixel
            const [r, g, b] = getColor(value);

            // Set pixel data
            const pixelIndex = (y * effectiveWidth + x) * 4;
            data[pixelIndex] = r;     // Red
            data[pixelIndex + 1] = g; // Green
            data[pixelIndex + 2] = b; // Blue
            data[pixelIndex + 3] = 255; // Alpha (fully opaque)
        }
    }

    // Draw the image data to canvas
    const scaledCanvas = document.createElement('canvas');
    scaledCanvas.width = effectiveWidth;
    scaledCanvas.height = effectiveHeight;
    const scaledCtx = scaledCanvas.getContext('2d');
    scaledCtx.putImageData(imageData, 0, 0);

    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(scaledCanvas, 0, 0, width, height);
}

// Calculate Mandelbrot set iteration count for a point
function calculateMandelbrot(cReal, cImag) {
    let zReal = 0;
    let zImag = 0;
    let iteration = 0;

    while (zReal * zReal + zImag * zImag <= 4 && iteration < maxIterations) {
        const tempReal = zReal * zReal - zImag * zImag + cReal;
        zImag = 2 * zReal * zImag + cImag;
        zReal = tempReal;
        iteration++;
    }

    if (iteration === maxIterations) return 0;

    // Smooth coloring
    return iteration + 1 - Math.log(Math.log(zReal * zReal + zImag * zImag)) / Math.log(2);
}

// Calculate Julia set iteration count for a point
function calculateJulia(zReal, zImag, cReal, cImag) {
    let iteration = 0;

    while (zReal * zReal + zImag * zImag <= 4 && iteration < maxIterations) {
        const tempReal = zReal * zReal - zImag * zImag + cReal;
        zImag = 2 * zReal * zImag + cImag;
        zReal = tempReal;
        iteration++;
    }

    if (iteration === maxIterations) return 0;

    // Smooth coloring
    return iteration + 1 - Math.log(Math.log(zReal * zReal + zImag * zImag)) / Math.log(2);
}

// Calculate Burning Ship fractal
function calculateBurningShip(cReal, cImag) {
    let zReal = 0;
    let zImag = 0;
    let iteration = 0;

    while (zReal * zReal + zImag * zImag <= 4 && iteration < maxIterations) {
        zReal = Math.abs(zReal);
        zImag = Math.abs(zImag);
        const tempReal = zReal * zReal - zImag * zImag + cReal;
        zImag = 2 * zReal * zImag + cImag;
        zReal = tempReal;
        iteration++;
    }

    if (iteration === maxIterations) return 0;

    return iteration + 1 - Math.log(Math.log(zReal * zReal + zImag * zImag)) / Math.log(2);
}

// Calculate Tricorn fractal
function calculateTricorn(cReal, cImag) {
    let zReal = 0;
    let zImag = 0;
    let iteration = 0;

    while (zReal * zReal + zImag * zImag <= 4 && iteration < maxIterations) {
        const tempReal = zReal * zReal - zImag * zImag + cReal;
        zImag = -2 * zReal * zImag + cImag;  // Note the negative sign
        zReal = tempReal;
        iteration++;
    }

    if (iteration === maxIterations) return 0;

    return iteration + 1 - Math.log(Math.log(zReal * zReal + zImag * zImag)) / Math.log(2);
}

// Get color for a pixel based on iteration value
function getColor(value) {
    if (value === 0) return [0, 0, 0]; // Inside the set = black

    switch (colorScheme) {
        case 'rainbow':
            return getRainbowColor(value);
        case 'blueOrange':
            return getBlueOrangeColor(value);
        case 'grayscale':
            return getGrayscaleColor(value);
        case 'custom':
            return getCustomColor(value);
        default:
            return getRainbowColor(value);
    }
}

function getRainbowColor(value) {
    const hue = (value * 10) % 360;
    return HSVtoRGB(hue / 360, 1, 1);
}

function getBlueOrangeColor(value) {
    // Oscillate between blue and orange
    const t = (Math.sin(value * 0.1) + 1) / 2;
    return [
        Math.floor(255 * t), // R: More for orange
        Math.floor(165 * t), // G: Some for orange, none for blue
        Math.floor(255 * (1 - t) + 50 * t) // B: More for blue
    ];
}

function getGrayscaleColor(value) {
    const v = Math.floor(255 * (value % maxIterations) / maxIterations);
    return [v, v, v];
}

function getCustomColor(value) {
    // Interpolate between two colors
    const t = (value % maxIterations) / maxIterations;

    // Parse hex colors
    const color1 = hexToRgb(customColor1);
    const color2 = hexToRgb(customColor2);

    // Linear interpolation
    return [
        Math.floor(color1.r * (1 - t) + color2.r * t),
        Math.floor(color1.g * (1 - t) + color2.g * t),
        Math.floor(color1.b * (1 - t) + color2.b * t)
    ];
}

// Convert HSV to RGB
function HSVtoRGB(h, s, v) {
    let r, g, b;
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);

    switch (i % 6) {
        case 0: r = v; g = t; b = p; break;
        case 1: r = q; g = v; b = p; break;
        case 2: r = p; g = v; b = t; break;
        case 3: r = p; g = q; b = v; break;
        case 4: r = t; g = p; b = v; break;
        case 5: r = v; g = p; b = q; break;
    }

    return [
        Math.floor(r * 255),
        Math.floor(g * 255),
        Math.floor(b * 255)
    ];
}

// Convert hex color to RGB
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
}

// Event handlers
function handleFractalTypeChange(e) {
    fractalType = e.target.value;
    updateJuliaParamsVisibility();

    // Reset view for different fractals
    if (fractalType === 'mandelbrot') {
        centerX = -0.5;
        centerY = 0;
        zoomLevel = 1;
    } else if (fractalType === 'julia') {
        centerX = 0;
        centerY = 0;
        zoomLevel = 1;
    } else {
        centerX = 0;
        centerY = 0;
        zoomLevel = 1;
    }

    drawFractal();
}

function updateJuliaParamsVisibility() {
    const juliaParams = document.getElementById('juliaParams');
    juliaParams.style.display = fractalType === 'julia' ? 'block' : 'none';
}

function handleIterationsChange(e) {
    maxIterations = parseInt(e.target.value);
    document.getElementById('maxIterationsValue').textContent = maxIterations;
    drawFractal();
}

function handleResolutionChange(e) {
    resolution = parseFloat(e.target.value);
    document.getElementById('resolutionValue').textContent = resolution;
    drawFractal();
}

function handleJuliaRealChange(e) {
    juliaReal = parseFloat(e.target.value);
    document.getElementById('juliaRealValue').textContent = juliaReal.toFixed(5);
    if (fractalType === 'julia') {
        drawFractal();
    }
}

function handleJuliaImagChange(e) {
    juliaImag = parseFloat(e.target.value);
    document.getElementById('juliaImagValue').textContent = juliaImag.toFixed(5);
    if (fractalType === 'julia') {
        drawFractal();
    }
}

function handleColorSchemeChange(e) {
    colorScheme = e.target.value;
    document.getElementById('customColorGroup').style.display =
        colorScheme === 'custom' ? 'block' : 'none';
    drawFractal();
}

function handleCustomColorChange() {
    customColor1 = document.getElementById('customColor1').value;
    customColor2 = document.getElementById('customColor2').value;
    if (colorScheme === 'custom') {
        drawFractal();
    }
}

function resetView() {
    if (fractalType === 'mandelbrot') {
        centerX = -0.5;
        centerY = 0;
    } else {
        centerX = 0;
        centerY = 0;
    }
    zoomLevel = 1;
    drawFractal();
}

function downloadImage() {
    const link = document.createElement('a');
    link.download = `${fractalType}-fractal.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
}

// Mouse and touch event handlers
function handleMouseDown(e) {
    isDragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    canvas.style.cursor = 'grabbing';
}

function handleMouseMove(e) {
    if (!isDragging) return;

    const deltaX = e.clientX - lastX;
    const deltaY = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;

    // Convert pixel movement to coordinate system movement
    const aspectRatio = width / height;
    const rangeX = 4 / zoomLevel;
    const rangeY = rangeX / aspectRatio;

    centerX -= deltaX * rangeX / width;
    centerY -= deltaY * rangeY / height;

    drawFractal();
}

function handleMouseUp() {
    isDragging = false;
    canvas.style.cursor = 'crosshair';
}

function handleWheel(e) {
    e.preventDefault();

    // Get mouse position as a fraction of canvas size
    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / width;
    const mouseY = (e.clientY - rect.top) / height;

    // Get mouse position in coordinate system
    const aspectRatio = width / height;
    const rangeX = 4 / zoomLevel;
    const rangeY = rangeX / aspectRatio;

    const mouseRealX = centerX + (mouseX - 0.5) * rangeX;
    const mouseRealY = centerY + (mouseY - 0.5) * rangeY;

    // Adjust zoom level
    const zoomFactor = e.deltaY < 0 ? 1.2 : 0.8;
    zoomLevel *= zoomFactor;

    // Adjust center to zoom on mouse position
    centerX = mouseRealX - (mouseRealX - centerX) / zoomFactor;
    centerY = mouseRealY - (mouseRealY - centerY) / zoomFactor;

    drawFractal();
}

// Touch events for mobile
let initialDistance = 0;

function handleTouchStart(e) {
    if (e.touches.length === 1) {
        isDragging = true;
        lastX = e.touches[0].clientX;
        lastY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
        // Handle pinch-to-zoom
        initialDistance = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
        );
    }
}

function handleTouchMove(e) {
    e.preventDefault();

    if (e.touches.length === 1 && isDragging) {
        const touch = e.touches[0];
        const deltaX = touch.clientX - lastX;
        const deltaY = touch.clientY - lastY;
        lastX = touch.clientX;
        lastY = touch.clientY;

        // Convert pixel movement to coordinate system movement
        const aspectRatio = width / height;
        const rangeX = 4 / zoomLevel;
        const rangeY = rangeX / aspectRatio;

        centerX -= deltaX * rangeX / width;
        centerY -= deltaY * rangeY / height;

        drawFractal();
    } else if (e.touches.length === 2) {
        // Handle pinch-to-zoom
        const currentDistance = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
        );

        // Calculate zoom factor based on pinch
        const zoomFactor = currentDistance / initialDistance;
        initialDistance = currentDistance;

        const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;

        // Get midpoint position as a fraction of canvas size
        const rect = canvas.getBoundingClientRect();
        const mouseX = (midX - rect.left) / width;
        const mouseY = (midY - rect.top) / height;

        // Get midpoint position in coordinate system
        const aspectRatio = width / height;
        const rangeX = 4 / zoomLevel;
        const rangeY = rangeX / aspectRatio;

        const mouseRealX = centerX + (mouseX - 0.5) * rangeX;
        const mouseRealY = centerY + (mouseY - 0.5) * rangeY;

        // Adjust zoom level
        zoomLevel *= zoomFactor;

        // Adjust center to zoom on midpoint
        centerX = mouseRealX - (mouseRealX - centerX) / zoomFactor;
        centerY = mouseRealY - (mouseRealY - centerY) / zoomFactor;

        drawFractal();
    }
}

function handleTouchEnd() {
    isDragging = false;
    initialDistance = 0;
}

// Initialize when the page loads
window.onload = initialize;
