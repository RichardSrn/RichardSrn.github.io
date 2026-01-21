const canvas = document.getElementById('boidsCanvas');
const ctx = canvas.getContext('2d');
const controlsDiv = document.getElementById('controls');
const toggleControlsButton = document.getElementById('toggleControlsButton');


// --- Simulation Parameters ---
let params = {
    numBoids: 100,
    maxSpeed: 4,
    maxForce: 0.1,
    separationDist: 20,
    alignmentDist: 60,
    cohesionDist: 60,

    // Obstacle Parameters
    obstacleDetectionDist: 30, // Repel radius
    obstacleAvoidForce: 0.6, // Repel force strength
    attractObstacleDist: 80, // Attract radius
    attractForce: 0.2, // Attract force strength
    slowFactor: 0.5, // Multiplier for speed in slow zones
    obstacleGridSize: 15, // Size of cells in the obstacle grid

    wallMargin: 100,
    wallTurnForce: 0.8, // Stronger turn force for walls

    wrapWalls: false,
    showStateColors: true,

    // Trail Parameters
    showTrail: true,
    trailAlpha: 0.3,

    // Visualization Parameters
    showVisualization: false,
    visualizationForceScale: 50, // Scale factor for drawing force vectors
    visualizationNeighborColor: '#00FFFF', // Cyan for neighbor lines
    visualizationForceColors: { // Colors for force vectors
        separation: '#ffa500', // Orange
        alignment: '#ffff00', // Yellow
        cohesion: '#66b3ff', // Blueish
        obstacleRepel: '#ff4d4d', // Red
        obstacleAttract: '#66b3ff', // Blueish (same as cohesion)
        wall: '#ff4d4d', // Red (same as obstacle repel)
        total: '#FFFFFF' // White for combined force
    },

    boidSize: 5,

    // Weights for different behaviors
    separationWeight: 2.0,
    alignmentWeight: 1.0,
    cohesionWeight: 1.0,
};

// Obstacle Types (internal representation)
const OBSTACLE_TYPE = {
    NONE: 0,
    REPEL: 1,
    ATTRACT: 2,
    SLOW: 3
};

let boids = [];
let animationFrameId;
let obstacleGrid = []; // 2D array to store obstacle data (type: 0, 1, 2, 3)

// Obstacle Painting Parameters
let currentBrushType = OBSTACLE_TYPE.REPEL; // Default brush type
let isPainting = false; // Flag to track if mouse button is down
let selectedBoidIndex = -1; // Index of the boid being visualized


// --- Boid Class ---
class Boid {
    constructor(x, y) {
        this.position = { x: x, y: y };
        this.velocity = {
            x: (Math.random() - 0.5) * params.maxSpeed * 0.8, // Start with velocity closer to max but not full
            y: (Math.random() - 0.5) * params.maxSpeed * 0.8
        };
        this.limitVector(this.velocity, params.maxSpeed); // Ensure initial speed is within max

        this.acceleration = { x: 0, y: 0 };
        this.state = 'normal'; // 'normal', 'cohesion', 'separation', 'wall_avoid' (also used for repel)
        this.defaultColor = 'white';
        this.stateColors = {
            normal: 'white',
            cohesion: '#66b3ff',    // Blueish (also for attract)
            separation: '#ffa500', // Orange
            wall_avoid: '#ff4d4d',    // Red (also for repel obstacles)
            slow: '#8B4513' // Brown
        };

        this.debugInfo = null; // To store force/neighbor info for visualization
    }

    // --- Core Update Logic ---
    update(allBoids, canvasWidth, canvasHeight, boidIndex) {
        this.state = 'normal'; // Reset state each frame
        this.acceleration = { x: 0, y: 0 }; // Reset acceleration

        let separationForce = { x: 0, y: 0 };
        let alignmentForce = { x: 0, y: 0 };
        let cohesionForce = { x: 0, y: 0 };
        let wallAvoidForce = { x: 0, y: 0 };
        let obstacleAvoidForce = { x: 0, y: 0 }; // Repel force
        let obstacleAttractForce = { x: 0, y: 0 }; // Attract force
        let isInSlowZone = false; // Flag

        let separationNeighbors = [];
        let alignmentNeighbors = [];
        let cohesionNeighbors = [];


        let separationCount = 0;
        let alignmentCount = 0;
        let cohesionCount = 0;

        // --- Calculate Behavior Forces (Separation, Alignment, Cohesion) ---
        for (let other of allBoids) {
            if (other === this) continue;

            const dx = other.position.x - this.position.x;
            const dy = other.position.y - this.position.y;
            let distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 0.0001) distance = 0.0001; // Avoid division by zero

            // Separation
            if (distance < params.separationDist) {
                let diffX = this.position.x - other.position.x;
                let diffY = this.position.y - other.position.y;
                separationForce.x += diffX / (distance * distance); // Weighted by inverse square distance
                separationForce.y += diffY / (distance * distance);
                separationCount++;
                if (params.showVisualization && boidIndex === selectedBoidIndex) separationNeighbors.push(other);
            }

            // Alignment
            if (distance < params.alignmentDist) {
                alignmentForce.x += other.velocity.x;
                alignmentForce.y += other.velocity.y;
                alignmentCount++;
                if (params.showVisualization && boidIndex === selectedBoidIndex) alignmentNeighbors.push(other);
            }

            // Cohesion
            if (distance < params.cohesionDist) {
                cohesionForce.x += other.position.x;
                cohesionForce.y += other.position.y;
                cohesionCount++;
                if (params.showVisualization && boidIndex === selectedBoidIndex) cohesionNeighbors.push(other);
            }
        }

        // --- Process Separation ---
        if (separationCount > 0) {
            separationForce.x /= separationCount;
            separationForce.y /= separationCount;
            const mag = Math.sqrt(separationForce.x ** 2 + separationForce.y ** 2);
            if (mag > 0) {
                separationForce.x = (separationForce.x / mag) * params.maxSpeed;
                separationForce.y = (separationForce.y / mag) * params.maxSpeed;
                separationForce.x -= this.velocity.x;
                separationForce.y -= this.velocity.y;
                this.limitVector(separationForce, params.maxForce);
            } else {
                separationForce = { x: 0, y: 0 }; // Reset if magnitude is zero after division
            }
        } else {
            separationForce = { x: 0, y: 0 };
        }

        // --- Process Alignment ---
        if (alignmentCount > 0) {
            alignmentForce.x /= alignmentCount;
            alignmentForce.y /= alignmentCount;
            const mag = Math.sqrt(alignmentForce.x ** 2 + alignmentForce.y ** 2);
            if (mag > 0) {
                alignmentForce.x = (alignmentForce.x / mag) * params.maxSpeed;
                alignmentForce.y = (alignmentForce.y / mag) * params.maxSpeed;
                alignmentForce.x -= this.velocity.x;
                alignmentForce.y -= this.velocity.y;
                this.limitVector(alignmentForce, params.maxForce);
            } else {
                alignmentForce = { x: 0, y: 0 };
            }
        } else {
            alignmentForce = { x: 0, y: 0 };
        }

        // --- Process Cohesion ---
        if (cohesionCount > 0) {
            cohesionForce.x /= cohesionCount;
            cohesionForce.y /= cohesionCount;
            cohesionForce = this.steer(cohesionForce.x, cohesionForce.y); // Steer towards the center
        } else {
            cohesionForce = { x: 0, y: 0 };
        }


        // --- Handle Obstacles ---
        // Check nearby grid cells within detection distance for repel/attract, or check current cell for slow
        const maxObstacleDist = Math.max(params.obstacleDetectionDist, params.attractObstacleDist);
        const startGridX = Math.max(0, Math.floor((this.position.x - maxObstacleDist - params.boidSize) / params.obstacleGridSize));
        const endGridX = Math.min(obstacleGrid.length - 1, Math.floor((this.position.x + maxObstacleDist + params.boidSize) / params.obstacleGridSize));
        const startGridY = Math.max(0, Math.floor((this.position.y - maxObstacleDist - params.boidSize) / params.obstacleGridSize));
        const endGridY = Math.min(obstacleGrid[0].length - 1, Math.floor((this.position.y + maxObstacleDist + params.boidSize) / params.obstacleGridSize));

        let repelSumX = 0, repelSumY = 0, repelCount = 0;
        let attractSumX = 0, attractSumY = 0, attractCount = 0;

        for (let i = startGridX; i <= endGridX; i++) {
            for (let j = startGridY; j <= endGridY; j++) {
                if (obstacleGrid[i] && obstacleGrid[i][j] !== undefined && obstacleGrid[i][j] > OBSTACLE_TYPE.NONE) {
                    const obstacleType = obstacleGrid[i][j];
                    const obstacleCenterX = i * params.obstacleGridSize + params.obstacleGridSize / 2;
                    const obstacleCenterY = j * params.obstacleGridSize + params.obstacleGridSize / 2;
                    const dx = this.position.x - obstacleCenterX;
                    const dy = this.position.y - obstacleCenterY;
                    let distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < 0.0001) distance = 0.0001;

                    if (obstacleType === OBSTACLE_TYPE.REPEL && distance < params.obstacleDetectionDist) {
                        // Calculate repulsion force away from the obstacle cell center
                        repelSumX += (this.position.x - obstacleCenterX) / (distance * distance); // Weighted by inverse square distance
                        repelSumY += (this.position.y - obstacleCenterY) / (distance * distance);
                        repelCount++;
                        // Set state early if repelling
                        this.state = 'wall_avoid';
                    } else if (obstacleType === OBSTACLE_TYPE.ATTRACT && distance < params.attractObstacleDist) {
                        // Calculate attraction force towards the obstacle cell center
                        attractSumX += (obstacleCenterX - this.position.x) / (distance * distance); // Weighted by inverse square distance
                        attractSumY += (obstacleCenterY - this.position.y) / (distance * distance);
                        attractCount++;
                        // Set state if attracting and not repelling/avoiding wall
                        if (this.state === 'normal') this.state = 'cohesion';
                    } else if (obstacleType === OBSTACLE_TYPE.SLOW) {
                        // Check if boid center is within the grid cell bounds
                        if (this.position.x >= i * params.obstacleGridSize && this.position.x < (i + 1) * params.obstacleGridSize &&
                            this.position.y >= j * params.obstacleGridSize && this.position.y < (j + 1) * params.obstacleGridSize) {
                            isInSlowZone = true;
                            // Set state if in slow zone and not repelling/avoiding wall/attracting
                            if (this.state === 'normal') this.state = 'slow';
                        }
                    }
                }
            }
        }

        // Process combined Repel force
        if (repelCount > 0) {
            repelSumX /= repelCount;
            repelSumY /= repelCount;
            const mag = Math.sqrt(repelSumX ** 2 + repelSumY ** 2);
            if (mag > 0) {
                // Normalize and scale to maxSpeed
                obstacleAvoidForce.x = (repelSumX / mag) * params.maxSpeed;
                obstacleAvoidForce.y = (repelSumY / mag) * params.maxSpeed;
                // Calculate steering force
                obstacleAvoidForce.x -= this.velocity.x;
                obstacleAvoidForce.y -= this.velocity.y;
                this.limitVector(obstacleAvoidForce, params.obstacleAvoidForce); // Use obstacle specific force
            }
        }

        // Process combined Attract force
        if (attractCount > 0) {
            attractSumX /= attractCount;
            attractSumY /= attractCount;
            const mag = Math.sqrt(attractSumX ** 2 + attractSumY ** 2);
            if (mag > 0) {
                // Normalize and scale
                obstacleAttractForce.x = (attractSumX / mag) * params.maxSpeed;
                obstacleAttractForce.y = (attractSumY / mag) * params.maxSpeed;
                // Calculate steering force
                obstacleAttractForce.x -= this.velocity.x;
                obstacleAttractForce.y -= this.velocity.y;
                this.limitVector(obstacleAttractForce, params.attractForce); // Use attractForce param
            }
        }


        // --- Handle Walls ---
        if (!params.wrapWalls) {
            let desired = null;
            if (this.position.x < params.wallMargin) {
                desired = { x: params.maxSpeed, y: this.velocity.y };
                if (this.state === 'normal') this.state = 'wall_avoid'; // Only set wall state if not already avoiding obstacle
            } else if (this.position.x > canvasWidth - params.wallMargin) {
                desired = { x: -params.maxSpeed, y: this.velocity.y };
                if (this.state === 'normal') this.state = 'wall_avoid';
            }
            if (this.position.y < params.wallMargin) {
                if (desired) desired.y = params.maxSpeed; else desired = { x: this.velocity.x, y: params.maxSpeed };
                if (this.state === 'normal' || (this.state === 'wall_avoid' && this.position.x >= params.wallMargin && this.position.x <= canvasWidth - params.wallMargin)) this.state = 'wall_avoid';
            } else if (this.position.y > canvasHeight - params.wallMargin) {
                if (desired) desired.y = -params.maxSpeed; else desired = { x: this.velocity.x, y: -params.maxSpeed };
                if (this.state === 'normal' || (this.state === 'wall_avoid' && this.position.x >= params.wallMargin && this.position.x <= canvasWidth - params.wallMargin)) this.state = 'wall_avoid';
            }

            if (desired) {
                const mag = Math.sqrt(desired.x ** 2 + desired.y ** 2);
                if (mag > 0) {
                    desired.x = (desired.x / mag) * params.maxSpeed;
                    desired.y = (desired.y / mag) * params.maxSpeed;
                    wallAvoidForce.x = desired.x - this.velocity.x;
                    wallAvoidForce.y = desired.y - this.velocity.y;
                    this.limitVector(wallAvoidForce, params.wallTurnForce);
                }
            }
        } else {
            // Wrap around edges
            if (this.position.x < 0) this.position.x = canvasWidth;
            if (this.position.y < 0) this.position.y = canvasHeight;
            if (this.position.x > canvasWidth) this.position.x = 0;
            if (this.position.y > canvasHeight) this.position.y = 0;
        }

        // --- Apply Forces with Weights and Priority ---
        let totalForceX = 0;
        let totalForceY = 0;

        // Highest priority: Repel Obstacles
        if (obstacleAvoidForce.x !== 0 || obstacleAvoidForce.y !== 0) {
            totalForceX += obstacleAvoidForce.x;
            totalForceY += obstacleAvoidForce.y;
        }
        // Second highest priority: Wall avoidance
        else if (!params.wrapWalls && (wallAvoidForce.x !== 0 || wallAvoidForce.y !== 0)) {
            totalForceX += wallAvoidForce.x;
            totalForceY += wallAvoidForce.y;
        }
        // Third priority: Flockings forces (Separation, Alignment, Cohesion) and Attract Obstacles
        else {
            totalForceX += separationForce.x * params.separationWeight;
            totalForceY += separationForce.y * params.separationWeight;

            totalForceX += alignmentForce.x * params.alignmentWeight;
            totalForceY += alignmentForce.y * params.alignmentWeight;

            totalForceX += cohesionForce.x * params.cohesionWeight;
            totalForceY += cohesionForce.y * params.cohesionWeight;

            // Attract Obstacles
            if (obstacleAttractForce.x !== 0 || obstacleAttractForce.y !== 0) {
                totalForceX += obstacleAttractForce.x;
                totalForceY += obstacleAttractForce.y;
            }
        }

        this.applyForce(totalForceX, totalForceY);

        // --- Update Velocity & Position ---
        this.velocity.x += this.acceleration.x;
        this.velocity.y += this.acceleration.y;

        // Handle Slow effect AFTER applying forces but BEFORE limiting speed
        if (isInSlowZone) {
            this.velocity.x *= params.slowFactor;
            this.velocity.y *= params.slowFactor;
            if (this.state === 'normal') this.state = 'slow'; // Set slow state if not already set
        }


        this.limitVector(this.velocity, params.maxSpeed); // Limit overall speed


        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;

        // --- Store Debug Info (if visualizing) ---
        if (params.showVisualization && boidIndex === selectedBoidIndex) {
            this.debugInfo = {
                separationForce: separationForce,
                alignmentForce: alignmentForce,
                cohesionForce: cohesionForce,
                wallAvoidForce: wallAvoidForce,
                obstacleAvoidForce: obstacleAvoidForce,
                obstacleAttractForce: obstacleAttractForce,
                totalForce: { x: totalForceX, y: totalForceY }, // The force *applied* to acceleration
                separationNeighbors: separationNeighbors,
                alignmentNeighbors: alignmentNeighbors,
                cohesionNeighbors: cohesionNeighbors,
                isInSlowZone: isInSlowZone,
                currentSpeed: Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2)
            };
        } else {
            this.debugInfo = null; // Clear debug info if not selected
        }

        // Update state color priority again after checking all influences
        // Repel/Wall > Separation > Attract/Cohesion > Slow > Normal
        if (obstacleAvoidForce.x !== 0 || obstacleAvoidForce.y !== 0 || (!params.wrapWalls && (wallAvoidForce.x !== 0 || wallAvoidForce.y !== 0))) {
            this.state = 'wall_avoid';
        } else if (separationCount > 0) {
            this.state = 'separation';
        } else if (attractCount > 0 || cohesionCount > 0) {
            this.state = 'cohesion';
        } else if (isInSlowZone) {
            this.state = 'slow';
        } else {
            this.state = 'normal';
        }
    }

    // --- Helper: Apply Force ---
    applyForce(forceX, forceY) {
        this.acceleration.x += forceX;
        this.acceleration.y += forceY;
    }

    // --- Helper: Steer Towards Target ---
    steer(targetX, targetY) {
        let desiredX = targetX - this.position.x;
        let desiredY = targetY - this.position.y;
        const mag = Math.sqrt(desiredX * desiredX + desiredY * desiredY);
        let steerForce = { x: 0, y: 0 };

        if (mag > 0) {
            desiredX = (desiredX / mag) * params.maxSpeed;
            desiredY = (desiredY / mag) * params.maxSpeed;

            steerForce.x = desiredX - this.velocity.x;
            steerForce.y = desiredY - this.velocity.y;

            this.limitVector(steerForce, params.maxForce);
        }
        return steerForce;
    }

    // --- Helper: Limit Vector Magnitude ---
    limitVector(vector, maxMagnitude) {
        const magSq = vector.x * vector.x + vector.y * vector.y;
        if (magSq > maxMagnitude * maxMagnitude) {
            const mag = Math.sqrt(magSq);
            vector.x = (vector.x / mag) * maxMagnitude;
            vector.y = (vector.y / mag) * maxMagnitude;
        }
    }

    // --- Drawing ---
    draw(ctx) {
        const angle = Math.atan2(this.velocity.y, this.velocity.x);
        const size = params.boidSize;

        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(angle);

        if (params.showStateColors) {
            ctx.fillStyle = this.stateColors[this.state] || this.defaultColor;
        } else {
            ctx.fillStyle = this.defaultColor;
        }

        ctx.beginPath();
        ctx.moveTo(size * 1.5, 0); // Tip
        ctx.lineTo(-size, -size / 1.5); // Back left
        ctx.lineTo(-size * 0.5, 0); // Indent slightly towards center
        ctx.lineTo(-size, size / 1.5); // Back right
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }
}

// --- Setup and Control Functions ---
function setupCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Initialize or resize obstacle grid
    const gridWidth = Math.ceil(canvas.width / params.obstacleGridSize);
    const gridHeight = Math.ceil(canvas.height / params.obstacleGridSize);

    // Create new grid, copying old values if possible
    const newObstacleGrid = new Array(gridWidth).fill(null).map(() => new Array(gridHeight).fill(OBSTACLE_TYPE.NONE));

    // Copy data from old grid (if it exists and dimensions allow)
    if (obstacleGrid.length > 0 && obstacleGrid[0].length > 0) {
        const minWidth = Math.min(gridWidth, obstacleGrid.length);
        const minHeight = Math.min(gridHeight, obstacleGrid[0].length);
        for (let i = 0; i < minWidth; i++) {
            for (let j = 0; j < minHeight; j++) {
                newObstacleGrid[i][j] = obstacleGrid[i][j];
            }
        }
    }
    obstacleGrid = newObstacleGrid;
}

function initializeBoids() {
    boids = [];
    const spawnBuffer = Math.max(params.wallMargin, params.obstacleDetectionDist + params.boidSize * 2); // Keep boids away from walls and initial obstacles
    const maxAttempts = params.numBoids * 5; // Prevent infinite loop
    let createdCount = 0;

    for (let i = 0; i < maxAttempts && createdCount < params.numBoids; i++) {
        const x = spawnBuffer + Math.random() * (canvas.width - 2 * spawnBuffer);
        const y = spawnBuffer + Math.random() * (canvas.height - 2 * spawnBuffer);

        // Check if spawn position is too close to a REPEL obstacle
        const gridX = Math.floor(x / params.obstacleGridSize);
        const gridY = Math.floor(y / params.obstacleGridSize);
        let safeToSpawn = true;
        // Check the cell and immediate neighbors for REPEL obstacles
        const checkRadius = Math.ceil((params.obstacleDetectionDist + params.boidSize) / params.obstacleGridSize);
        for (let ox = Math.max(0, gridX - checkRadius); ox <= Math.min(obstacleGrid.length - 1, gridX + checkRadius); ox++) {
            for (let oy = Math.max(0, gridY - checkRadius); oy <= Math.min(obstacleGrid[0].length - 1, gridY + checkRadius); oy++) {
                if (obstacleGrid[ox] && obstacleGrid[ox][oy] === OBSTACLE_TYPE.REPEL) {
                    const obstacleCenterX = ox * params.obstacleGridSize + params.obstacleGridSize / 2;
                    const obstacleCenterY = oy * params.obstacleGridSize + params.obstacleGridSize / 2;
                    const dist = Math.sqrt((x - obstacleCenterX) ** 2 + (y - obstacleCenterY) ** 2);
                    if (dist < params.obstacleDetectionDist + params.boidSize) {
                        safeToSpawn = false;
                        break;
                    }
                }
            }
            if (!safeToSpawn) break;
        }

        if (safeToSpawn) {
            boids.push(new Boid(x, y));
            createdCount++;
        }
    }

    // Update the numBoids parameter and display if fewer boids were created
    params.numBoids = boids.length;
    const numBoidsInput = document.getElementById('numBoids');
    numBoidsInput.value = params.numBoids;
    updateValueDisplay('numBoidsValue', params.numBoids);

    // Deselect any boid if the current selected index is out of bounds
    if (selectedBoidIndex >= boids.length) {
        selectedBoidIndex = -1;
    }
}

function resetSimulation() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    // readParametersFromControls(); // Params are updated dynamically
    setupCanvas(); // Recalculate canvas size and obstacle grid
    initializeBoids(); // Recreate boids with new parameters and positions
    animate(); // Start the loop again
}

// --- Obstacle Drawing and Interaction ---
function drawObstacles(ctx) {
    const gridWidth = obstacleGrid.length;
    const gridHeight = obstacleGrid[0]?.length || 0; // Handle empty grid case

    for (let i = 0; i < gridWidth; i++) {
        for (let j = 0; j < gridHeight; j++) {
            const obstacleType = obstacleGrid[i][j];
            if (obstacleType > OBSTACLE_TYPE.NONE) {
                switch (obstacleType) {
                    case OBSTACLE_TYPE.REPEL:
                        ctx.fillStyle = '#ff4d4d'; // Red
                        break;
                    case OBSTACLE_TYPE.ATTRACT:
                        ctx.fillStyle = '#66b3ff'; // Blueish
                        break;
                    case OBSTACLE_TYPE.SLOW:
                        ctx.fillStyle = '#8B4513'; // Brown
                        break;
                }
                ctx.fillRect(i * params.obstacleGridSize, j * params.obstacleGridSize, params.obstacleGridSize, params.obstacleGridSize);
            }
        }
    }
}

function paintObstacle(canvasX, canvasY, type) {
    const gridWidth = obstacleGrid.length;
    const gridHeight = obstacleGrid[0]?.length || 0;

    if (gridWidth === 0 || gridHeight === 0) return; // Cannot paint if grid is not initialized

    const brushRadius = params.brushSize / 2;
    // Convert brush radius to grid cell radius
    const gridBrushRadius = Math.ceil(brushRadius / params.obstacleGridSize);

    // Find the central grid cell under the mouse
    const centerGridX = Math.floor(canvasX / params.obstacleGridSize);
    const centerGridY = Math.floor(canvasY / params.obstacleGridSize);


    // Iterate through grid cells potentially affected by the brush size
    for (let i = Math.max(0, centerGridX - gridBrushRadius); i <= Math.min(gridWidth - 1, centerGridX + gridBrushRadius); i++) {
        for (let j = Math.max(0, centerGridY - gridBrushRadius); j <= Math.min(gridHeight - 1, centerGridY + gridBrushRadius); j++) {
            // Calculate distance from the center of the potential grid cell to the mouse point
            const cellCenterX = i * params.obstacleGridSize + params.obstacleGridSize / 2;
            const cellCenterY = j * params.obstacleGridSize + params.obstacleGridSize / 2;
            const distToMouse = Math.sqrt((cellCenterX - canvasX) ** 2 + (cellCenterY - canvasY) ** 2);

            if (distToMouse <= brushRadius) {
                obstacleGrid[i][j] = type;
            }
        }
    }
}

function clearAllObstacles() {
    if (obstacleGrid.length > 0 && obstacleGrid[0]?.length > 0) {
        const gridWidth = obstacleGrid.length;
        const gridHeight = obstacleGrid[0].length;
        for (let i = 0; i < gridWidth; i++) {
            for (let j = 0; j < gridHeight; j++) {
                obstacleGrid[i][j] = OBSTACLE_TYPE.NONE; // Set all cells to empty
            }
        }
    }
    // Also clear brush type radio buttons if we had any selected state
    const brushRadio = document.getElementById('brushTypeRepel');
    if (brushRadio) brushRadio.checked = true;
    currentBrushType = OBSTACLE_TYPE.REPEL;
}

// --- Visualization Drawing ---
function drawVisualization(ctx, boid) {
    if (!boid.debugInfo) return; // No debug info to draw

    ctx.save();
    ctx.translate(boid.position.x, boid.position.y); // Translate to boid's position

    const info = boid.debugInfo;
    const scale = params.visualizationForceScale;

    // Draw Neighbor lines
    ctx.lineWidth = 1;
    ctx.strokeStyle = params.visualizationNeighborColor;
    // Combine neighbor lists to avoid duplicate lines if boid is in multiple radii
    const allNeighbors = new Set([...info.separationNeighbors, ...info.alignmentNeighbors, ...info.cohesionNeighbors]);
    for (const neighbor of allNeighbors) {
        ctx.beginPath();
        ctx.moveTo(0, 0); // Start from selected boid's translated position
        // Draw line to neighbor's position relative to the selected boid
        ctx.lineTo(neighbor.position.x - boid.position.x, neighbor.position.y - boid.position.y);
        ctx.stroke();
    }


    // Draw Force Vectors (as arrows)
    function drawArrow(ctx, startX, startY, endX, endY, color) {
        const arrowHeadSize = 5;
        const angle = Math.atan2(endY - startY, endX - startX);

        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 1.5;

        // Draw line
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // Draw arrowhead
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(endX - arrowHeadSize * Math.cos(angle - Math.PI / 6), endY - arrowHeadSize * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(endX - arrowHeadSize * Math.cos(angle + Math.PI / 6), endY - arrowHeadSize * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
    }

    // Draw individual force vectors
    const forces = [
        { force: info.separationForce, color: params.visualizationForceColors.separation, label: 'Separation' },
        { force: info.alignmentForce, color: params.visualizationForceColors.alignment, label: 'Alignment' },
        { force: info.cohesionForce, color: params.visualizationForceColors.cohesion, label: 'Cohesion' },
        // Only draw wall/obstacle forces if they were the dominant force applied
        // This makes the visualization match the boid's behavior priority
        { force: info.obstacleAvoidForce, color: params.visualizationForceColors.obstacleRepel, label: 'Repel Obstacle', active: (info.obstacleAvoidForce.x !== 0 || info.obstacleAvoidForce.y !== 0) },
        { force: info.wallAvoidForce, color: params.visualizationForceColors.wall, label: 'Wall Avoid', active: (!params.wrapWalls && info.wallAvoidForce.x !== 0 || info.wallAvoidForce.y !== 0) && (info.obstacleAvoidForce.x === 0 && info.obstacleAvoidForce.y === 0) },
        { force: info.obstacleAttractForce, color: params.visualizationForceColors.obstacleAttract, label: 'Attract Obstacle', active: (info.obstacleAttractForce.x !== 0 || info.obstacleAttractForce.y !== 0) && (info.obstacleAvoidForce.x === 0 && info.obstacleAvoidForce.y === 0) && (!params.wrapWalls && info.wallAvoidForce.x === 0 && info.wallAvoidForce.y === 0) && (info.separationForce.x === 0 && info.separationForce.y === 0) && (info.alignmentForce.x === 0 && info.alignmentForce.y === 0) && (info.cohesionForce.x === 0 && info.cohesionForce.y === 0) } // Only draw if it was the *last* force added before total
    ];

    forces.forEach(fInfo => {
        // Only draw flocking forces if wall/repel forces were NOT dominant
        const isFlockingForce = ['Separation', 'Alignment', 'Cohesion', 'Attract Obstacle'].includes(fInfo.label);
        const wallOrRepelDominant = info.obstacleAvoidForce.x !== 0 || info.obstacleAvoidForce.y !== 0 || (!params.wrapWalls && (info.wallAvoidForce.x !== 0 || info.wallAvoidForce.y !== 0));

        if (isFlockingForce && wallOrRepelDominant) return; // Skip flocking forces if higher priority force was applied

        // Special check for wall/repel - only draw if THEY were dominant
        if (['Repel Obstacle', 'Wall Avoid'].includes(fInfo.label) && !fInfo.active) return;


        if (fInfo.force.x !== 0 || fInfo.force.y !== 0) {
            drawArrow(ctx, 0, 0, fInfo.force.x * scale, fInfo.force.y * scale, fInfo.color);
        }
    });


    // Draw Total Applied Force (Acceleration * Scale)
    const totalForce = {
        x: info.totalForce.x / 0.05 * params.maxForce, // Scale applied force by max force relation to visualize magnitude relative to steering
        y: info.totalForce.y / 0.05 * params.maxForce
    };
    // If slow zone active, total force shown might be misleading as velocity is modified directly.
    // For simplicity, we'll draw the force calculated *before* the slow modifier.
    // If slow zone, maybe indicate it visually around the boid?
    if (totalForce.x !== 0 || totalForce.y !== 0) {
        drawArrow(ctx, 0, 0, totalForce.x * scale, totalForce.y * scale, params.visualizationForceColors.total);
    }

    // Indicate slow zone visually around boid if in one
    if (info.isInSlowZone) {
        ctx.strokeStyle = params.stateColors.slow;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, params.boidSize * 3, 0, Math.PI * 2);
        ctx.stroke();
    }

    ctx.restore(); // Restore context state
}


// --- Animation Loop ---
function animate() {
    // Clear canvas based on trail setting
    if (params.showTrail) {
        ctx.fillStyle = `rgba(40, 40, 40, ${1.0 - params.trailAlpha})`; // Use canvas background color with alpha
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear completely
        // Redraw background if completely cleared
        ctx.fillStyle = '#282828';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    drawObstacles(ctx); // Draw obstacles first

    // Update all boids based on current state and neighbors/obstacles/walls
    // Pass index for visualization selection
    for (let i = 0; i < boids.length; i++) {
        boids[i].update(boids, canvas.width, canvas.height, i);
    }

    // Draw all boids
    for (let boid of boids) {
        boid.draw(ctx);
    }

    // Draw visualization for selected boid (after all boids are drawn)
    if (params.showVisualization && selectedBoidIndex !== -1 && boids[selectedBoidIndex]) {
        drawVisualization(ctx, boids[selectedBoidIndex]);
    }


    animationFrameId = requestAnimationFrame(animate); // Loop
}

// --- UI Control Handling ---
function updateValueDisplay(elementId, value) {
    const display = document.getElementById(elementId);
    if (display) {
        if (typeof value === 'number') {
            const input = document.getElementById(elementId.replace('Value', ''));
            let step = input ? parseFloat(input.step) : 1; // Get step from input if exists
            if (isNaN(step) || step === 1) {
                display.textContent = value.toFixed(0);
            } else {
                const decimalPlaces = step.toString().split('.')[1]?.length || 0;
                display.textContent = value.toFixed(decimalPlaces);
            }
        } else {
            display.textContent = value;
        }
    }
}

function readParametersFromControls() {
    // This function is less critical now as params update dynamically,
    // but useful for ensuring reset starts with current UI state.
    params.numBoids = parseInt(document.getElementById('numBoids').value);
    params.maxSpeed = parseFloat(document.getElementById('maxSpeed').value);
    params.maxForce = parseFloat(document.getElementById('maxForce').value);
    params.separationDist = parseFloat(document.getElementById('separationDist').value);
    params.alignmentDist = parseFloat(document.getElementById('alignmentDist').value);
    params.cohesionDist = parseFloat(document.getElementById('cohesionDist').value);
    params.obstacleDetectionDist = parseFloat(document.getElementById('obstacleDetectionDist').value);
    params.attractObstacleDist = parseFloat(document.getElementById('attractObstacleDist').value);
    params.attractForce = parseFloat(document.getElementById('attractForce').value);
    params.slowFactor = parseFloat(document.getElementById('slowFactor').value);
    params.wallMargin = parseFloat(document.getElementById('wallMargin').value);
    params.brushSize = parseFloat(document.getElementById('brushSize').value);
    params.trailAlpha = parseFloat(document.getElementById('trailAlpha').value);

    params.wrapWalls = document.getElementById('wrapWalls').checked;
    params.showStateColors = document.getElementById('showStateColors').checked;
    params.showTrail = document.getElementById('showTrail').checked;
    params.showVisualization = document.getElementById('showVisualization').checked;
}

// Add event listeners for dynamic updates
function attachEventListeners() {
    const inputs = controlsDiv.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            // Update value display immediately
            if (input.type === 'range') {
                updateValueDisplay(input.id + 'Value', parseFloat(input.value));
            }
            // Update params object
            const key = input.id;
            if (params.hasOwnProperty(key)) {
                if (input.type === 'checkbox') {
                    params[key] = input.checked;
                } else if (input.type === 'radio') {
                    // Radio buttons for brush type are handled separately or via name check
                } else {
                    params[key] = parseFloat(input.value);
                }
            }

            // Special handling for Brush Type radios
            if (input.name === 'brushType') {
                const selected = document.querySelector('input[name="brushType"]:checked');
                if (selected) {
                    switch (selected.value) {
                        case 'repel': currentBrushType = OBSTACLE_TYPE.REPEL; break;
                        case 'attract': currentBrushType = OBSTACLE_TYPE.ATTRACT; break;
                        case 'slow': currentBrushType = OBSTACLE_TYPE.SLOW; break;
                        case 'erase': currentBrushType = OBSTACLE_TYPE.NONE; break;
                    }
                }
            }
        });
    });

    // Buttons
    document.getElementById('resetButton').addEventListener('click', resetSimulation);
    document.getElementById('clearObstaclesButton').addEventListener('click', clearAllObstacles);

    toggleControlsButton.addEventListener('click', () => {
        controlsDiv.classList.toggle('hidden');
        toggleControlsButton.textContent = controlsDiv.classList.contains('hidden') ? 'Show Settings' : 'Hide Settings';
    });

    // Canvas interaction
    canvas.addEventListener('mousedown', (e) => {
        isPainting = true;
        handleInteraction(e);

        // Handle Boid Selection
        if (currentBrushType === OBSTACLE_TYPE.NONE) { // Only select if not painting
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            let clickedInfo = findResetBoid(x, y);
            selectedBoidIndex = clickedInfo;
            params.showVisualization = (selectedBoidIndex !== -1);
            document.getElementById('showVisualization').checked = params.showVisualization;
        }
    });

    window.addEventListener('mouseup', () => {
        isPainting = false;
    });

    canvas.addEventListener('mousemove', (e) => {
        if (isPainting) {
            handleInteraction(e);
        }
    });
}

function findResetBoid(x, y) {
    let closestIndex = -1;
    let closestDist = Infinity;

    for (let i = 0; i < boids.length; i++) {
        const b = boids[i];
        const dist = Math.sqrt((b.position.x - x) ** 2 + (b.position.y - y) ** 2);
        if (dist < params.boidSize * 3 && dist < closestDist) { // Click within reasonable range
            closestDist = dist;
            closestIndex = i;
        }
    }
    return closestIndex;
}


function handleInteraction(e) {
    if (currentBrushType === OBSTACLE_TYPE.NONE && !document.getElementById('showVisualization').checked) return; // Allow selection if visualization checkbox is manually checked? Logic is bit mixed in original.
    // Actually, paintObstacle handles brush. Selection handled in mousedown.

    if (currentBrushType !== OBSTACLE_TYPE.NONE) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        paintObstacle(x, y, currentBrushType);
    }
}

// Window Resize Handling
window.addEventListener('resize', () => {
    // Save current obstacles if possible? 
    // For now, simpler to just reset or at least resize canvas.
    // If we just resize, the grid might get out of sync.
    // Best approach for this simple sim: Reset.
    resetSimulation();
});


// --- Init ---
// attachEventListeners(); // REMOVED to avoid duplication with setupControls
resetSimulation(); // Starts the loop


function setupControls() {
    // Dynamic updates for range inputs
    const rangeControls = [
        'maxSpeed', 'maxForce', 'separationDist',
        'alignmentDist', 'cohesionDist', 'obstacleDetectionDist',
        'attractObstacleDist', 'attractForce', 'slowFactor',
        'wallMargin', 'brushSize', 'trailAlpha'
    ];
    rangeControls.forEach(id => {
        const input = document.getElementById(id);
        const displayId = id + 'Value';
        updateValueDisplay(displayId, input.value); // Initial display
        input.addEventListener('input', () => {
            const value = parseFloat(input.value);
            params[id] = value; // Update param dynamically
            updateValueDisplay(displayId, value); // Update display
            // Special case: If wallMargin or obstacleDist changes, maybe re-initialize boids slightly to avoid spawning too close
            // For simplicity, this is handled by the reset button.
        });
    });

    // Special handling for numBoids (add/remove dynamically)
    const numBoidsInput = document.getElementById('numBoids');
    updateValueDisplay('numBoidsValue', numBoidsInput.value);
    numBoidsInput.addEventListener('input', () => {
        const newNumBoids = parseInt(numBoidsInput.value);
        const currentNumBoids = boids.length;

        if (newNumBoids > currentNumBoids) {
            // Add new boids
            const spawnBuffer = Math.max(params.wallMargin, params.obstacleDetectionDist + params.boidSize * 2);
            const attemptsPerBoid = 5; // Try a few times to find a safe spot
            for (let i = 0; i < newNumBoids - currentNumBoids; i++) {
                let spawned = false;
                for (let attempt = 0; attempt < attemptsPerBoid; attempt++) {
                    const x = spawnBuffer + Math.random() * (canvas.width - 2 * spawnBuffer);
                    const y = spawnBuffer + Math.random() * (canvas.height - 2 * spawnBuffer);

                    // Check if spawn position is too close to a REPEL obstacle
                    const gridX = Math.floor(x / params.obstacleGridSize);
                    const gridY = Math.floor(y / params.obstacleGridSize);
                    let safeToSpawn = true;
                    const checkRadius = Math.ceil((params.obstacleDetectionDist + params.boidSize) / params.obstacleGridSize);
                    for (let ox = Math.max(0, gridX - checkRadius); ox <= Math.min(obstacleGrid.length - 1, gridX + checkRadius); ox++) {
                        for (let oy = Math.max(0, gridY - checkRadius); oy <= Math.min(obstacleGrid[0]?.length - 1, gridY + checkRadius); oy++) {
                            if (obstacleGrid[ox] && obstacleGrid[ox][oy] === OBSTACLE_TYPE.REPEL) {
                                const obstacleCenterX = ox * params.obstacleGridSize + params.obstacleGridSize / 2;
                                const obstacleCenterY = oy * params.obstacleGridSize + params.obstacleGridSize / 2;
                                const dist = Math.sqrt((x - obstacleCenterX) ** 2 + (y - obstacleCenterY) ** 2);
                                if (dist < params.obstacleDetectionDist + params.boidSize) {
                                    safeToSpawn = false;
                                    break;
                                }
                            }
                        }
                        if (!safeToSpawn) break;
                    }

                    if (safeToSpawn) {
                        boids.push(new Boid(x, y));
                        spawned = true;
                        break; // Found a safe spot, move to next boid
                    }
                }
                if (!spawned) {
                    console.warn("Could not find a safe spot to spawn new boid after attempts.");
                }
            }
        } else if (newNumBoids < currentNumBoids) {
            // Remove boids randomly from the end
            boids.splice(newNumBoids);
            // If the selected boid was removed, deselect
            if (selectedBoidIndex >= newNumBoids) {
                selectedBoidIndex = -1;
            }
        }
        params.numBoids = boids.length; // Update param to actual count
        updateValueDisplay('numBoidsValue', params.numBoids); // Update display
    });


    // Checkbox toggles (dynamic updates)
    const checkboxes = ['wrapWalls', 'showStateColors', 'showTrail', 'showVisualization'];
    checkboxes.forEach(id => {
        const checkbox = document.getElementById(id);
        checkbox.addEventListener('change', () => {
            params[id] = checkbox.checked; // Update param dynamically
            if (id === 'showStateColors') {
                document.getElementById('legend').style.display = checkbox.checked ? 'flex' : 'none';
            }
            if (id === 'showVisualization' && !checkbox.checked) {
                selectedBoidIndex = -1; // Deselect boid when visualization is turned off
            }
            // Trail toggle and visualization drawing are handled directly in the animate loop
        });
    });

    // Obstacle Brush Type Radio Buttons
    const brushTypeRadios = document.querySelectorAll('input[name="brushType"]');
    brushTypeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            switch (e.target.value) {
                case 'repel': currentBrushType = OBSTACLE_TYPE.REPEL; break;
                case 'attract': currentBrushType = OBSTACLE_TYPE.ATTRACT; break;
                case 'slow': currentBrushType = OBSTACLE_TYPE.SLOW; break;
                case 'erase': currentBrushType = OBSTACLE_TYPE.NONE; break;
            }
        });
    });


    // Action Buttons
    const clearObstaclesButton = document.getElementById('clearObstaclesButton');
    clearObstaclesButton.addEventListener('click', clearAllObstacles);

    document.getElementById('resetButton').addEventListener('click', resetSimulation);

    // Toggle Controls Button
    toggleControlsButton.addEventListener('click', () => {
        controlsDiv.classList.toggle('hidden');
        toggleControlsButton.textContent = controlsDiv.classList.contains('hidden') ? 'Show Settings' : 'Hide Settings';
    });


    // Initial state color legend visibility
    document.getElementById('legend').style.display = params.showStateColors ? 'flex' : 'none';
    // Ensure initial brush size display is correct
    updateValueDisplay('brushSizeValue', params.brushSize);
    // Ensure initial trail alpha display is correct
    updateValueDisplay('trailAlphaValue', params.trailAlpha);
}

// --- Mouse Event Handling for Painting and Boid Selection ---
function getMousePos(canvas, evt) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}

function isClickOnControls(clientX, clientY) {
    const controlsRect = controlsDiv.getBoundingClientRect();
    return clientX > controlsRect.left && clientX < controlsRect.right &&
        clientY > controlsRect.top && clientY < controlsRect.bottom;
}


canvas.addEventListener('mousedown', (e) => {
    if (isClickOnControls(e.clientX, e.clientY)) {
        isPainting = false; // Do not start painting if clicking controls
        return;
    }

    isPainting = true;
    const pos = getMousePos(canvas, e);

    // If visualization is active, try selecting a boid instead of painting
    if (params.showVisualization) {
        const clickRadius = 15; // Pixels radius for clicking a boid
        let closestBoidIndex = -1;
        let minDistanceSq = clickRadius * clickRadius;

        for (let i = 0; i < boids.length; i++) {
            const dx = boids[i].position.x - pos.x;
            const dy = boids[i].position.y - pos.y;
            const distSq = dx * dx + dy * dy;

            if (distSq < minDistanceSq) {
                minDistanceSq = distSq;
                closestBoidIndex = i;
            }
        }

        if (closestBoidIndex !== -1) {
            // If clicking the already selected boid, deselect
            if (selectedBoidIndex === closestBoidIndex) {
                selectedBoidIndex = -1;
            } else {
                selectedBoidIndex = closestBoidIndex;
            }
            isPainting = false; // Don't paint if a boid was selected
        } else {
            // No boid selected, proceed with painting if a tool is active
            if (currentBrushType !== OBSTACLE_TYPE.NONE) {
                paintObstacle(pos.x, pos.y, currentBrushType);
            } else {
                isPainting = false; // No tool active
            }
        }
    } else {
        // Visualization is off, always paint if a tool is active
        if (currentBrushType !== OBSTACLE_TYPE.NONE) {
            paintObstacle(pos.x, pos.y, currentBrushType);
        } else {
            isPainting = false; // No tool active
        }
    }
});

canvas.addEventListener('mousemove', (e) => {
    if (isPainting && currentBrushType !== OBSTACLE_TYPE.NONE) {
        const pos = getMousePos(canvas, e);
        paintObstacle(pos.x, pos.y, currentBrushType);
    }
});

canvas.addEventListener('mouseup', () => {
    isPainting = false;
});

canvas.addEventListener('mouseleave', () => {
    isPainting = false; // Stop painting if mouse leaves canvas
});

// --- Initialisation ---
window.addEventListener('load', () => {
    setupControls(); // Set up listeners first
    resetSimulation(); // Setup canvas, obstacle grid, initialize boids, and start animation
});

// Resize canvas, obstacle grid, and reset simulation if window size changes
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        console.log("Window resized, resetting simulation...");
        setupCanvas(); // Resize canvas AND obstacle grid (preserves existing obstacles)
        initializeBoids(); // Recreate boids for new size (avoiding existing obstacles)
        // Animation loop continues
    }, 250); // Debounce resize event
});
