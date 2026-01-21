const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreBoard = document.getElementById('scoreBoard');
const restartButton = document.getElementById('restartButton');

// Configuration
const GRID_SIZE = 20; // Size of each tile in px (base, will be scaled)
const TILE_COUNT = 25; // 25x25 grid
let canvasSize = 600; // Base size, updated on resize

// Game State
let snake = [];
let direction = { x: 0, y: 0 };
let nextDirection = { x: 0, y: 0 };
let food = null;
let phantoms = [];
let phaseOrbs = [];
let score = 0;
let phaseOrbCount = 0;
let isPhasing = false;
let phaseTimer = null;
let isGameOver = false;
let isPaused = false;
let gameLoopId = null;
let lastRenderTime = 0;
const SNAKE_SPEED = 8; // Moves per second

// Assets / Styles
const COLORS = {
    background: '#000000',
    snakeHead: '#4CAF50',
    snakeBody: '#8BC34A',
    snakePhase: '#00FFFF', // Cyan
    food: '#FFEB3B', // Yellow
    phantomRed: '#F44336',
    phantomPink: '#E91E63',
    wall: '#1A237E', // Dark Blue
    phaseOrb: '#00BCD4',
    text: '#FFFFFF'
};

// Maze (1 = Wall, 0 = Empty)
let maze = [];

// --- Initialization ---

function initGame() {
    restartGame(); // Initialize state first
    resizeCanvas(); // Then set size (which calls draw)

    window.addEventListener('resize', resizeCanvas);
    document.addEventListener('keydown', handleInput);
    restartButton.addEventListener('click', restartGame);
}

function restartGame() {
    isGameOver = false;
    isPaused = false;
    isPhasing = false;
    score = 0;
    phaseOrbCount = 0;
    snake = [{ x: 10, y: 10 }]; // Start center-ish
    direction = { x: 0, y: 0 }; // Stationary start
    nextDirection = { x: 0, y: 0 };
    phantoms = [];
    phaseOrbs = [];

    if (phaseTimer) clearTimeout(phaseTimer);

    generateMaze();
    spawnFood();
    spawnPhantoms();

    updateUI();
    restartButton.style.display = 'none';

    if (gameLoopId) cancelAnimationFrame(gameLoopId);
    lastRenderTime = 0;
    gameLoopId = requestAnimationFrame(gameLoop);
}

// --- Game Loop ---

function gameLoop(currentTime) {
    if (isGameOver) return;

    gameLoopId = requestAnimationFrame(gameLoop);

    const secondsSinceLastRender = (currentTime - lastRenderTime) / 1000;
    if (secondsSinceLastRender < 1 / SNAKE_SPEED) return;

    lastRenderTime = currentTime;

    update();
    draw();
}

// --- Logic ---

function update() {
    if (isPaused) return;

    // Apply Direction
    if (nextDirection.x !== 0 || nextDirection.y !== 0) {
        // Prevent 180 turn
        if (nextDirection.x !== -direction.x || nextDirection.y !== -direction.y || snake.length === 1) {
            direction = nextDirection;
        }
    }

    if (direction.x === 0 && direction.y === 0) return; // Wait for input

    // Move Snake
    const head = { ...snake[0] };
    head.x += direction.x;
    head.y += direction.y;

    // Wraparound
    if (head.x < 0) head.x = TILE_COUNT - 1;
    if (head.x >= TILE_COUNT) head.x = 0;
    if (head.y < 0) head.y = TILE_COUNT - 1;
    if (head.y >= TILE_COUNT) head.y = 0;

    // Check Collisions
    if (checkCollision(head)) {
        gameOver();
        return;
    }

    snake.unshift(head);

    // Food
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        spawnFood();
        // Chance to spawn Phase Orb
        if (Math.random() < 0.1 && phaseOrbs.length === 0) {
            spawnPhaseOrb();
        }
    } else {
        snake.pop(); // Remove tail
    }

    // Phase Orbs
    const orbIndex = phaseOrbs.findIndex(o => o.x === head.x && o.y === head.y);
    if (orbIndex !== -1) {
        phaseOrbCount++;
        phaseOrbs.splice(orbIndex, 1);
        updateUI();
    }

    // Move Phantoms (Every 2nd tick approximately?)
    // Let's make them move every frame but slower? 
    // Simplified: Move phantoms every update for now, maybe add logic to skip frames.
    movePhantoms();

    // Check Phantom Collision
    if (!isPhasing) {
        if (phantoms.some(p => p.x === head.x && p.y === head.y)) {
            gameOver();
        }
    }

    updateUI();
}

function checkCollision(pos) {
    // 1. Self Collision (if not phasing? Standard snake rules apply even when phasing usually, but let's make phasing OP)
    // Let's say Phasing allows passing through self too? No, mostly walls/enemies.
    // Standard rule: Body collision is deadly unless Phasing? Let's say Phasing saves you from everything.
    if (!isPhasing) {
        // Body
        for (let i = 1; i < snake.length; i++) {
            if (pos.x === snake[i].x && pos.y === snake[i].y) return true;
        }
        // Walls
        if (maze[pos.y][pos.x] === 1) return true;
    }
    return false;
}

function movePhantoms() {
    // Simple AI: Move towards snake head.
    // Improve: BFS or A* helps, but manhattan distance is okay for simple enemies.
    // They can pass through walls? No.
    // "Phantom" implies ghost, maybe one type can?

    phantoms.forEach(p => {
        // 50% chance to move each tick to make them slower than snake
        if (Math.random() > 0.6) return;

        const target = snake[0];
        const possibleMoves = [
            { x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }
        ];

        // Sort moves by distance to target
        possibleMoves.sort((a, b) => {
            const posA = { x: p.x + a.x, y: p.y + a.y };
            const posB = { x: p.x + b.x, y: p.y + b.y };
            const distA = Math.abs(target.x - posA.x) + Math.abs(target.y - posA.y);
            const distB = Math.abs(target.x - posB.x) + Math.abs(target.y - posB.y);
            return distA - distB;
        });

        // Try best move first
        for (let move of possibleMoves) {
            const newX = p.x + move.x;
            const newY = p.y + move.y;

            // Check bounds (no wraparound for enemies usually, simplifies logic)
            if (newX >= 0 && newX < TILE_COUNT && newY >= 0 && newY < TILE_COUNT) {
                // Check walls (Phantoms can't go through walls currently)
                if (maze[newY][newX] === 0) {
                    // Check other phantoms?
                    if (!phantoms.some(other => other !== p && other.x === newX && other.y === newY)) {
                        p.x = newX;
                        p.y = newY;
                        break; // Move taken
                    }
                }
            }
        }
    });
}


// --- Generators ---

function generateMaze() {
    maze = [];
    for (let y = 0; y < TILE_COUNT; y++) {
        let row = [];
        for (let x = 0; x < TILE_COUNT; x++) {
            // Edges logic? Wraparound means no hard edges.
            // Random internal blocks
            if (Math.random() < 0.1) {
                row.push(1);
            } else {
                row.push(0);
            }
        }
        maze.push(row);
    }
    // Clear center for start
    maze[10][10] = 0;
    maze[10][11] = 0;
    maze[11][10] = 0;
}

function spawnFood() {
    let valid = false;
    while (!valid) {
        const x = Math.floor(Math.random() * TILE_COUNT);
        const y = Math.floor(Math.random() * TILE_COUNT);
        if (maze[y][x] === 0 && !isOccupiedBySnake(x, y)) {
            food = { x, y };
            valid = true;
        }
    }
}

function spawnPhantoms() {
    phantoms = [];
    // Spawn 2 phantoms
    for (let i = 0; i < 2; i++) {
        let valid = false;
        while (!valid) {
            const x = Math.floor(Math.random() * TILE_COUNT);
            const y = Math.floor(Math.random() * TILE_COUNT);
            // Far from center
            if (Math.abs(x - 10) > 5 && Math.abs(y - 10) > 5 && maze[y][x] === 0) {
                phantoms.push({ x, y, type: i === 0 ? 'red' : 'pink' });
                valid = true;
            }
        }
    }
}

function spawnPhaseOrb() {
    let valid = false;
    while (!valid) {
        const x = Math.floor(Math.random() * TILE_COUNT);
        const y = Math.floor(Math.random() * TILE_COUNT);
        if (maze[y][x] === 0 && !isOccupiedBySnake(x, y) && (food.x !== x || food.y !== y)) {
            phaseOrbs.push({ x, y });
            valid = true;
        }
    }
}

function isOccupiedBySnake(x, y) {
    return snake.some(s => s.x === x && s.y === y);
}

// --- Interaction ---

function handleInput(e) {
    if (isGameOver) return;

    switch (e.key) {
        case 'ArrowUp':
            nextDirection = { x: 0, y: -1 };
            break;
        case 'ArrowDown':
            nextDirection = { x: 0, y: 1 };
            break;
        case 'ArrowLeft':
            nextDirection = { x: -1, y: 0 };
            break;
        case 'ArrowRight':
            nextDirection = { x: 1, y: 0 };
            break;
        case ' ': // Space
            activatePhase();
            break;
    }
}

function activatePhase() {
    if (phaseOrbCount > 0 && !isPhasing) {
        phaseOrbCount--;
        isPhasing = true;
        updateUI();

        if (phaseTimer) clearTimeout(phaseTimer);
        phaseTimer = setTimeout(() => {
            isPhasing = false;
            // Check if stuck inside wall when phase ends
            const head = snake[0];
            if (maze[head.y][head.x] === 1) {
                gameOver();
            }
            updateUI();
        }, 3000); // 3 seconds logic
    }
}

function resizeCanvas() {
    const minDim = Math.min(window.innerWidth, window.innerHeight * 0.8); // Leave room for header/score
    const finalSize = Math.floor(minDim * 0.95 / GRID_SIZE) * GRID_SIZE;

    canvas.width = finalSize;
    canvas.height = finalSize;
    draw();
}

function updateUI() {
    scoreBoard.textContent = `Score: ${score} | Phase Orbs: ${phaseOrbCount} ${isPhasing ? '[PHASING ACTIVE!]' : ''}`;
}

function gameOver() {
    isGameOver = true;
    restartButton.style.display = 'block';

    // Draw Game Over overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = COLORS.text;
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
}

// --- Rendering ---

function draw() {
    if (isGameOver) return; // Don't redraw under overlay

    // Clear
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const scale = canvas.width / TILE_COUNT;

    // Maze
    ctx.fillStyle = COLORS.wall;
    for (let y = 0; y < TILE_COUNT; y++) {
        for (let x = 0; x < TILE_COUNT; x++) {
            if (maze[y][x] === 1) {
                // If phasing, draw walls transparent
                ctx.globalAlpha = isPhasing ? 0.2 : 1.0;
                ctx.fillRect(x * scale, y * scale, scale, scale);
                ctx.globalAlpha = 1.0;
            }
        }
    }

    // Food
    ctx.fillStyle = COLORS.food;
    ctx.beginPath();
    ctx.arc((food.x + 0.5) * scale, (food.y + 0.5) * scale, scale * 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Orbs
    ctx.fillStyle = COLORS.phaseOrb;
    phaseOrbs.forEach(orb => {
        ctx.beginPath();
        ctx.arc((orb.x + 0.5) * scale, (orb.y + 0.5) * scale, scale * 0.3, 0, Math.PI * 2);
        ctx.fill();
    });

    // Snake
    snake.forEach((seg, i) => {
        ctx.fillStyle = isPhasing ? COLORS.snakePhase : (i === 0 ? COLORS.snakeHead : COLORS.snakeBody);
        ctx.fillRect(seg.x * scale, seg.y * scale, scale, scale);
    });

    // Phantoms
    phantoms.forEach(p => {
        ctx.fillStyle = p.type === 'red' ? COLORS.phantomRed : COLORS.phantomPink;
        if (isPhasing) ctx.globalAlpha = 0.5;

        // Draw ghost shape
        const cx = (p.x + 0.5) * scale;
        const cy = (p.y + 0.5) * scale;
        const r = scale * 0.4;

        ctx.beginPath();
        ctx.arc(cx, cy, r, Math.PI, 0); // Top dome
        ctx.lineTo(cx + r, cy + r); // Bottom right
        ctx.lineTo(cx - r, cy + r); // Bottom left
        ctx.fill();

        ctx.globalAlpha = 1.0;
    });
}

// Start
initGame();
