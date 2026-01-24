/**
 * Conway's Game of Life v2
 * - Infinite Canvas (Chunk-based)
 * - Viewport Logic (Pan/Zoom)
 * - Tool System (Move, Brush, Eraser)
 * - Theme & Grid Customization
 */

class ChunkManager {
    constructor() {
        this.chunks = new Map(); // key: "r,c" -> Uint8Array
        this.chunkSize = 20; // 20x20 cells per chunk
    }

    getChunkKey(chunkR, chunkC) {
        return `${chunkR},${chunkC}`;
    }

    getChunk(chunkR, chunkC) {
        const key = this.getChunkKey(chunkR, chunkC);
        if (!this.chunks.has(key)) {
            // Create new empty chunk
            this.chunks.set(key, new Uint8Array(this.chunkSize * this.chunkSize));
        }
        return this.chunks.get(key);
    }

    getCell(globalR, globalC) {
        const chunkR = Math.floor(globalR / this.chunkSize);
        const chunkC = Math.floor(globalC / this.chunkSize);
        const localR = ((globalR % this.chunkSize) + this.chunkSize) % this.chunkSize;
        const localC = ((globalC % this.chunkSize) + this.chunkSize) % this.chunkSize;

        const chunk = this.getChunk(chunkR, chunkC);
        const index = localR * this.chunkSize + localC;
        return chunk[index];
    }

    setCell(globalR, globalC, value) {
        const chunkR = Math.floor(globalR / this.chunkSize);
        const chunkC = Math.floor(globalC / this.chunkSize);
        const localR = ((globalR % this.chunkSize) + this.chunkSize) % this.chunkSize;
        const localC = ((globalC % this.chunkSize) + this.chunkSize) % this.chunkSize;

        const chunk = this.getChunk(chunkR, chunkC);
        const index = localR * this.chunkSize + localC;
        chunk[index] = value;
    }

    // Helper to clear all chunks
    clear() {
        this.chunks.clear();
    }
}

class GameOfLife {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        // Configuration
        this.baseCellSize = 20; // Size at zoom level 1.0
        this.theme = {
            bg: '#0d0f14',
            grid: '#1e293b',
            cell: '#10b981'
        };
        this.showGrid = true;

        // State
        this.chunks = new ChunkManager();
        this.nextChunks = new ChunkManager(); // Buffer for updates

        // Viewport
        this.offsetX = 0; // Pixels
        this.offsetY = 0;
        this.zoom = 1.0;
        this.minZoom = 0.1; // Increased zoom-out range
        this.maxZoom = 5.0;

        // Simulation
        this.isRunning = false;
        this.generation = 0;
        this.population = 0;
        this.speed = 30;

        // Tools
        this.activeTool = 'move'; // 'move', 'brush', 'eraser'
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.brushSize = 1;
        this.brushPattern = 'none'; // 'none' means single cell
        this.brushShape = 'circle'; // 'circle' or 'square'

        this.init();
        this.setupEventListeners();
        this.setupUI();
    }

    init() {
        this.handleResize();
        this.render();
    }

    handleResize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.render();
    }

    // -------------------------------------------------------------
    // Core Logic (Infinite Grid)
    // -------------------------------------------------------------

    countLiveNeighbors(row, col) {
        let count = 0;
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i === 0 && j === 0) continue;
                count += this.chunks.getCell(row + i, col + j);
            }
        }
        return count;
    }

    update() {
        // We only need to iterate over active chunks and their neighbors
        const chunksToProcess = new Set();

        for (const key of this.chunks.chunks.keys()) {
            const [r, c] = key.split(',').map(Number);
            // Add self and neighbors
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    chunksToProcess.add(`${r + i},${c + j}`);
                }
            }
        }

        // Create fresh next state
        this.nextChunks = new ChunkManager();
        let newPop = 0;

        // Process each chunk
        for (const key of chunksToProcess) {
            const [chunkR, chunkC] = key.split(',').map(Number);

            // Iterate all cells in this chunk
            const size = this.chunks.chunkSize;
            const startR = chunkR * size;
            const startC = chunkC * size;

            for (let r = 0; r < size; r++) {
                for (let c = 0; c < size; c++) {
                    const globalR = startR + r;
                    const globalC = startC + c;

                    const cell = this.chunks.getCell(globalR, globalC);
                    const neighbors = this.countLiveNeighbors(globalR, globalC);

                    let nextState = 0;
                    if (cell === 1 && (neighbors === 2 || neighbors === 3)) {
                        nextState = 1;
                    } else if (cell === 0 && neighbors === 3) {
                        nextState = 1;
                    }

                    if (nextState === 1) {
                        this.nextChunks.setCell(globalR, globalC, 1);
                        newPop++;
                    }
                }
            }
        }

        this.chunks = this.nextChunks;
        this.generation++;
        this.population = newPop;
        this.updateStats();
    }

    // -------------------------------------------------------------
    // Rendering
    // -------------------------------------------------------------

    worldToScreen(r, c) {
        const cellSize = this.baseCellSize * this.zoom;
        const x = c * cellSize + this.offsetX;
        const y = r * cellSize + this.offsetY;
        return { x, y, size: cellSize };
    }

    screenToWorld(x, y) {
        const cellSize = this.baseCellSize * this.zoom;
        const c = Math.floor((x - this.offsetX) / cellSize);
        const r = Math.floor((y - this.offsetY) / cellSize);
        return { r, c };
    }

    render() {
        // Clear background
        this.ctx.fillStyle = this.theme.bg;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const cellSize = this.baseCellSize * this.zoom;

        // Determine visible range
        const startCol = Math.floor(-this.offsetX / cellSize) - 1;
        const endCol = Math.floor((-this.offsetX + this.canvas.width) / cellSize) + 1;
        const startRow = Math.floor(-this.offsetY / cellSize) - 1;
        const endRow = Math.floor((-this.offsetY + this.canvas.height) / cellSize) + 1;

        // Filter chunks that are visible
        const size = this.chunks.chunkSize;
        const startChunkC = Math.floor(startCol / size);
        const endChunkC = Math.floor(endCol / size);
        const startChunkR = Math.floor(startRow / size);
        const endChunkR = Math.floor(endRow / size);

        // Draw grid lines
        if (this.showGrid && this.zoom > 0.2) {
            this.ctx.strokeStyle = this.theme.grid;
            this.ctx.lineWidth = 0.5;
            this.ctx.beginPath();

            for (let c = startCol; c <= endCol; c++) {
                const x = c * cellSize + this.offsetX;
                this.ctx.moveTo(x, 0);
                this.ctx.lineTo(x, this.canvas.height);
            }
            for (let r = startRow; r <= endRow; r++) {
                const y = r * cellSize + this.offsetY;
                this.ctx.moveTo(0, y);
                this.ctx.lineTo(this.canvas.width, y);
            }
            this.ctx.stroke();
        }

        // Draw Live Cells
        this.ctx.fillStyle = this.theme.cell;
        // Shadow only if zoomed in enough and not too many cells (performance)
        this.ctx.shadowBlur = this.zoom > 1.0 ? 8 : 0;
        this.ctx.shadowColor = this.theme.cell;

        for (let cr = startChunkR; cr <= endChunkR; cr++) {
            for (let cc = startChunkC; cc <= endChunkC; cc++) {
                const key = this.chunks.getChunkKey(cr, cc);
                const chunk = this.chunks.chunks.get(key);

                if (chunk) {
                    for (let i = 0; i < chunk.length; i++) {
                        if (chunk[i] === 1) {
                            const lr = Math.floor(i / size);
                            const lc = i % size;
                            const gr = cr * size + lr;
                            const gc = cc * size + lc;

                            if (gr >= startRow && gr <= endRow && gc >= startCol && gc <= endCol) {
                                const sc = this.worldToScreen(gr, gc);
                                // Gap calculation for crisp look
                                const gap = this.zoom > 3 ? 1 : 0;
                                this.ctx.fillRect(sc.x + gap, sc.y + gap, sc.size - gap * 2, sc.size - gap * 2);
                            }
                        }
                    }
                }
            }
        }
        this.ctx.shadowBlur = 0;
    }

    // -------------------------------------------------------------
    // Interaction & Tools
    // -------------------------------------------------------------

    setTool(tool) {
        this.activeTool = tool;
        document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
        if (tool === 'move') document.getElementById('toolMove').classList.add('active');
        if (tool === 'brush') document.getElementById('toolBrush').classList.add('active');
        if (tool === 'eraser') document.getElementById('toolEraser').classList.add('active');

        switch (tool) {
            case 'move': this.canvas.style.cursor = 'grab'; break;
            case 'brush': this.canvas.style.cursor = 'crosshair'; break;
            case 'eraser': this.canvas.style.cursor = 'not-allowed'; break; // or custom eraser cursor
        }
    }

    paint(globalR, globalC, isErasing = false) {
        const radius = parseInt(this.brushSize);
        const value = isErasing ? 0 : 1;

        // Stamp Logic (only if not erasing and pattern selected)
        if (!isErasing && this.brushPattern !== 'none') {
            this.stampPattern(globalR, globalC, this.brushPattern);
            return;
        }

        // Standard Circle/Square Brush
        const centerR = globalR;
        const centerC = globalC;

        for (let r = -radius + 1; r < radius; r++) {
            for (let c = -radius + 1; c < radius; c++) {
                if (this.brushShape === 'circle') {
                    // Circular approximation
                    if (r * r + c * c < radius * radius) {
                        this.chunks.setCell(centerR + r, centerC + c, value);
                    }
                } else {
                    // Square
                    this.chunks.setCell(centerR + r, centerC + c, value);
                }
            }
        }
    }

    stampPattern(r, c, patternKey) {
        const patterns = {
            glider: [[0, 1, 0], [0, 0, 1], [1, 1, 1]],
            lwss: [
                [0, 1, 1, 1, 1],
                [1, 0, 0, 0, 1],
                [0, 0, 0, 0, 1],
                [1, 0, 0, 1, 0]
            ],
            toad: [
                [0, 1, 1, 1],
                [1, 1, 1, 0]
            ],
            beacon: [
                [1, 1, 0, 0],
                [1, 1, 0, 0],
                [0, 0, 1, 1],
                [0, 0, 1, 1]
            ],
            pulsar: [
                [0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
                [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
                [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
                [0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0],
                [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
                [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
                [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0]
            ],
            diehard: [
                [0, 0, 0, 0, 0, 0, 1, 0],
                [1, 1, 0, 0, 0, 0, 0, 0],
                [0, 1, 0, 0, 0, 1, 1, 1]
            ],
            acorn: [
                [0, 1, 0, 0, 0, 0, 0],
                [0, 0, 0, 1, 0, 0, 0],
                [1, 1, 0, 0, 1, 1, 1]
            ],
            gosper: [
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
                [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
            ]
        };

        const p = patterns[patternKey];
        if (p) {
            const midR = Math.floor(p.length / 2);
            const midC = Math.floor(p[0].length / 2);
            p.forEach((rowArr, rIdx) => {
                rowArr.forEach((val, cIdx) => {
                    const gr = r + rIdx - midR;
                    const gc = c + cIdx - midC;
                    if (val === 1) this.chunks.setCell(gr, gc, 1);
                });
            });
        }
    }

    // -------------------------------------------------------------
    // Loop & Control
    // -------------------------------------------------------------

    start() { if (!this.isRunning) { this.isRunning = true; this.loop(); this.updateUI(); } }
    pause() { this.isRunning = false; this.updateUI(); }

    loop() {
        if (!this.isRunning) return;
        this.update();
        this.render();
        const delay = 1000 / this.speed;
        setTimeout(() => requestAnimationFrame(() => this.loop()), delay);
    }

    updateStats() {
        document.getElementById('genCount').textContent = this.generation;
        document.getElementById('popCount').textContent = this.population;
    }

    updateUI() {
        document.getElementById('startBtn').disabled = this.isRunning;
        document.getElementById('pauseBtn').disabled = !this.isRunning;
    }

    // -------------------------------------------------------------
    // Events
    // -------------------------------------------------------------

    setupUI() {
        // Toggle Settings Panel
        const settingsPanel = document.querySelector('.settings');
        document.getElementById('toggleSettings').addEventListener('click', () => {
            settingsPanel.classList.toggle('collapsed');
        });

        // Toggle Theme Panel
        const themePanel = document.querySelector('.theme-panel');
        document.getElementById('toggleTheme').addEventListener('click', () => {
            themePanel.classList.toggle('hidden');
        });
        document.getElementById('closeTheme').addEventListener('click', () => {
            themePanel.classList.add('hidden');
        });

        // Grid Toggle
        document.getElementById('toggleGrid').addEventListener('click', (e) => {
            this.showGrid = !this.showGrid;
            this.render();
            e.currentTarget.classList.toggle('active');
        });

        // Tools
        document.getElementById('toolMove').addEventListener('click', () => this.setTool('move'));
        document.getElementById('toolBrush').addEventListener('click', () => this.setTool('brush'));
        document.getElementById('toolEraser').addEventListener('click', () => this.setTool('eraser'));

        // Simulation Controls
        document.getElementById('startBtn').addEventListener('click', () => this.start());
        document.getElementById('pauseBtn').addEventListener('click', () => this.pause());
        document.getElementById('nextBtn').addEventListener('click', () => { this.update(); this.render(); });
        document.getElementById('clearBtn').addEventListener('click', () => {
            this.pause();
            this.chunks.clear();
            this.generation = 0;
            this.population = 0;
            this.updateStats();
            this.render();
        });

        // Inputs
        document.getElementById('speedRange').addEventListener('input', (e) => this.speed = parseInt(e.target.value));
        const zoomRange = document.getElementById('zoomRange');
        zoomRange.addEventListener('input', (e) => {
            // Logarithmic feel for slider
            // Map 2-50 to minZoom-maxZoom
            const val = parseInt(e.target.value);
            this.zoom = val / 10;
            this.render();
        });

        document.getElementById('brushSize').addEventListener('input', (e) => {
            this.brushSize = parseInt(e.target.value);
            document.getElementById('brushSizeVal').textContent = this.brushSize;
        });

        document.getElementById('patternSelect').addEventListener('change', (e) => {
            this.brushPattern = e.target.value;
            // Reset rotation when pattern changes
            this.patternRotation = 0;
            if (this.brushPattern !== 'none') this.setTool('brush');
        });

        document.getElementById('rotatePattern').addEventListener('click', () => {
            this.patternRotation = (this.patternRotation || 0) + 1;
            // Visual feedback could be added here (e.g. icon rotation)
        });

        // Brush Shapes
        document.getElementById('shapeCircle').addEventListener('click', (e) => {
            this.brushShape = 'circle';
            e.target.classList.add('active');
            document.getElementById('shapeSquare').classList.remove('active');
        });
        document.getElementById('shapeSquare').addEventListener('click', (e) => {
            this.brushShape = 'square';
            e.target.classList.add('active');
            document.getElementById('shapeCircle').classList.remove('active');
        });

        // Theme Inputs
        document.getElementById('bgColorPicker').addEventListener('input', (e) => {
            this.theme.bg = e.target.value;
            // Sync with page body
            document.body.style.backgroundColor = this.theme.bg;
            this.render();
        });
        document.getElementById('gridColorPicker').addEventListener('input', (e) => {
            this.theme.grid = e.target.value;
            this.render();
        });
        document.getElementById('cellColorPicker').addEventListener('input', (e) => {
            this.theme.cell = e.target.value;
            this.render();
        });
        document.getElementById('resetTheme').addEventListener('click', () => {
            const defBg = '#0d0f14';
            document.getElementById('bgColorPicker').value = defBg;
            document.getElementById('gridColorPicker').value = '#1e293b';
            document.getElementById('cellColorPicker').value = '#10b981';

            this.theme = { bg: defBg, grid: '#1e293b', cell: '#10b981' };
            document.body.style.backgroundColor = defBg;
            this.render();
        });
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.handleResize());

        // Mouse Events
        const getWorldPos = (e) => {
            return this.screenToWorld(e.clientX, e.clientY);
        };

        this.canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;

            // Handle Tools
            // Holding Space or Middle Click (button 1) forces Move
            if (this.activeTool === 'move' || e.button === 1 || e.code === 'Space') {
                this.canvas.style.cursor = 'grabbing';
                // Don't paint
                return;
            }

            if (this.activeTool === 'brush' || this.activeTool === 'eraser') {
                const { r, c } = getWorldPos(e);
                const isErase = this.activeTool === 'eraser';

                if (!isErase && this.brushPattern !== 'none') {
                    this.paint(r, c, false);
                    this.render();
                    this.isDragging = false; // Don't drag stamps
                } else {
                    this.paint(r, c, isErase);
                    this.render();
                }
            }
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;

            // Move logic
            if (this.activeTool === 'move' || e.buttons === 4 || (e.buttons === 1 && (document.activeElement === document.body && e.target === this.canvas && this.canvas.style.cursor === 'grabbing'))) {
                // e.buttons === 4 is middle mouse
                // The cursor check is a bit hacky, but 'grabbing' implies we started a move op
                const dx = e.clientX - this.lastMouseX;
                const dy = e.clientY - this.lastMouseY;
                this.offsetX += dx;
                this.offsetY += dy;
                this.render();
            }
            // Paint logic
            else if ((this.activeTool === 'brush' || this.activeTool === 'eraser') && this.brushPattern === 'none') {
                const { r, c } = getWorldPos(e);
                this.paint(r, c, this.activeTool === 'eraser');
                this.render();
            }

            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
        });

        this.canvas.addEventListener('mouseup', () => {
            this.isDragging = false;
            // Restore cursor
            if (this.activeTool === 'move') this.canvas.style.cursor = 'grab';
            else if (this.activeTool === 'brush') this.canvas.style.cursor = 'crosshair';
            else if (this.activeTool === 'eraser') this.canvas.style.cursor = 'not-allowed';
        });

        // Zoom Logic
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomSpeed = 0.001 * this.zoom; // Zoom proportional to current level
            let newZoom = this.zoom - e.deltaY * zoomSpeed;
            newZoom = Math.max(this.minZoom, Math.min(this.maxZoom, newZoom));

            // Zoom towards mouse pointer logic
            const wx = (e.clientX - this.offsetX) / this.zoom;
            const wy = (e.clientY - this.offsetY) / this.zoom;

            this.zoom = newZoom;

            this.offsetX = e.clientX - wx * this.zoom;
            this.offsetY = e.clientY - wy * this.zoom;

            // Sync Slider
            document.getElementById('zoomRange').value = Math.round(this.zoom * 10);

            this.render();
        }, { passive: false });

        // Key Shortcuts
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                this.canvas.style.cursor = 'grab';
            }
        });

        window.addEventListener('keyup', (e) => {
            if (e.code === 'Space') {
                // Restore active tool cursor
                this.setTool(this.activeTool);
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.game = new GameOfLife('lifeCanvas');
});
