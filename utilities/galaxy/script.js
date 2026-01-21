/* Galaxy Simulation - Refactored */

const canvas = document.getElementById('galaxyCanvas');
const ctx = canvas.getContext('2d');

// --- Configuration & State ---
let config = {
    numStars: 3000,
    spiralFactor: 1.0, // Tightness of spiral
    galaxyRadius: 300,
    initialRotation: 0.5,
    numArms: 4,
    blackHoleSize: 50,
    starSize: 1.2,
    gravityForce: 1.0, // G constant multiplier
    colorMode: 'arms', // 'arms', 'speed', 'galaxy', 'off'
    numGalaxies: 1,
    renderScale: 1.0,
    offsetX: 0,
    offsetY: 0
};

let stars = [];
let blackHoles = [];
let isPlaying = false;
let animationId = null;

// --- Constants ---
const G = 0.5; // Base Gravitational constant
const SOFTENING = 5; // To avoid singularities

// --- Classes ---

class BlackHole {
    constructor(x, y, mass) {
        this.pos = { x, y };
        this.vel = { x: 0, y: 0 };
        this.mass = mass;
        this.radius = Math.max(5, Math.sqrt(mass)); // Visual radius
        this.color = '#000';
    }

    draw(ctx) {
        // Accretion disk glow
        const glowRadius = this.radius * 3;
        const gradient = ctx.createRadialGradient(
            this.pos.x, this.pos.y, this.radius,
            this.pos.x, this.pos.y, glowRadius
        );
        gradient.addColorStop(0, 'rgba(255, 120, 0, 0.8)'); // Orange core
        gradient.addColorStop(0.4, 'rgba(200, 50, 0, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Event Horizon
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // White rim for contrast
        ctx.strokeStyle = 'rgba(255, 200, 150, 0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    update() {
        // Black holes attract each other
        // Simple Euler integration
        this.pos.x += this.vel.x;
        this.pos.y += this.vel.y;
    }
}

class Star {
    constructor(x, y, vx, vy, color, size, galaxyIndex) {
        this.pos = { x, y };
        this.vel = { x: vx, y: vy };

        this.initialPos = { x, y };
        this.initialVel = { x: vx, y: vy };

        this.color = color;
        this.initialColor = color;
        this.size = size;
        this.galaxyIndex = galaxyIndex;
    }

    reset() {
        this.pos.x = this.initialPos.x;
        this.pos.y = this.initialPos.y;
        this.vel.x = this.initialVel.x;
        this.vel.y = this.initialVel.y;
        this.color = this.initialColor;
    }

    update(blackHoles, gravityMult) {
        let ax = 0;
        let ay = 0;

        // Gravity from all Black Holes
        for (let bh of blackHoles) {
            const dx = bh.pos.x - this.pos.x;
            const dy = bh.pos.y - this.pos.y;
            const distSq = dx * dx + dy * dy;
            const dist = Math.sqrt(distSq);

            // F = G * M / r^2
            // a = F / m_star (assume m_star = 1 for kinematics) = G * M_bh / r^2

            if (dist > SOFTENING) { // Avoid division by zero and extreme slingshots
                const force = (G * gravityMult * bh.mass) / distSq;
                ax += (dx / dist) * force;
                ay += (dy / dist) * force;
            }
        }

        this.vel.x += ax;
        this.vel.y += ay;

        this.pos.x += this.vel.x;
        this.pos.y += this.vel.y;
    }

    updateColor(mode) {
        if (mode === 'off') {
            this.color = 'rgba(255, 255, 255, 0.8)';
        } else if (mode === 'speed') {
            const speed = Math.sqrt(this.vel.x * this.vel.x + this.vel.y * this.vel.y);
            // Map speed to color (Blue = fast, Red = slow)
            const nSpeed = Math.min(speed / 5.0, 1.0);
            const r = Math.floor(255 * (1 - nSpeed));
            const b = Math.floor(255 * nSpeed);
            this.color = `rgba(${r}, 100, ${b}, 0.9)`;
        } else if (mode === 'galaxy') {
            const hues = [200, 30, 120, 280, 60]; // Blue, Orange, Pink, Purple, Yellow
            const hue = hues[this.galaxyIndex % hues.length];
            this.color = `hsla(${hue}, 80%, 70%, 0.9)`;
        } else {
            // 'arms' or default -> revert to initial
            this.color = this.initialColor;
        }
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        // Draw as small rect for performance optimization if needed, but arc is fine for < 10000
        ctx.arc(this.pos.x, this.pos.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}


// --- Initialization ---

function init() {
    // Setup Canvas
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Setup Listeners
    setupControls();

    // Initial Simulation
    resetSimulation();

    // Start Loop
    loop();
}

function resizeCanvas() {
    // If fullscreen, use full window. If not, use fixed or container size.
    // For this utility, we'll fit to the container or default to 800x800 logic if strict.
    // Let's maximize within parent or use window size if fullscreen.
    if (document.fullscreenElement) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    } else {
        // Responsive width, reasonable max height
        canvas.width = Math.min(window.innerWidth - 40, 800);
        canvas.height = canvas.width; // Square aspect ratio preferred
    }
    // Re-center logic handled in draw
}

function setupControls() {
    // Attach listeners to all inputs
    const inputs = [
        'numStars', 'spiralFactor', 'galaxyRadius', 'rotationSpeed',
        'numArms', 'coreSize', 'starSize', 'gravityForce',
        'colorMode', 'numGalaxies'
    ];

    inputs.forEach(id => {
        const el = document.getElementById(id);
        const valDisplay = document.getElementById(id + '-value');

        if (el) {
            el.addEventListener('input', (e) => {
                config[id] = el.type === 'range' ? parseFloat(el.value) : el.value;
                if (valDisplay) valDisplay.textContent = el.value;

                // If parameter affects initial state, we might need to "soft reset" or "hard reset"
                // Gravity, Star Size, Black Hole Size can update live.
                // Num Stars, Spiral, Radius requires regeneration.

                if (['numStars', 'spiralFactor', 'galaxyRadius', 'rotationSpeed', 'numArms', 'numGalaxies'].includes(id)) {
                    generateGalaxy();
                } else if (id === 'coreSize') {
                    blackHoles.forEach(bh => {
                        bh.mass = config.blackHoleSize * 10; // Simple scaler
                        bh.radius = Math.max(5, Math.sqrt(bh.mass));
                    });
                } else if (id === 'starSize') {
                    stars.forEach(s => s.size = config.starSize * (0.5 + Math.random()));
                } else if (id === 'colorMode') {
                    stars.forEach(s => s.updateColor(config.colorMode));
                }
            });
            // Init config value
            config[id] = el.type === 'range' ? parseFloat(el.value) : el.value;
        }
    });

    // Buttons
    document.getElementById('playButton').addEventListener('click', togglePlay);
    document.getElementById('resetButton').addEventListener('click', resetSimulation);
    document.getElementById('randomizeButton').addEventListener('click', randomizeSettings);
    document.getElementById('fullscreenButton').addEventListener('click', toggleFullscreen);

    // Fullscreen change listener
    document.addEventListener('fullscreenchange', () => {
        const fsBtn = document.getElementById('fullscreenButton');
        if (document.fullscreenElement) {
            fsBtn.textContent = 'Exit Full Screen';
        } else {
            fsBtn.textContent = 'Full Screen';
        }
        resizeCanvas();
    });
}

function generateGalaxy() {
    stars = [];
    blackHoles = [];

    const starsPerGalaxy = Math.floor(config.numStars / config.numGalaxies);
    const bhMass = config.blackHoleSize * 10; // Mass scaling

    // Define Galaxy Centers
    let centers = [];
    if (config.numGalaxies === 1) {
        centers.push({ x: 0, y: 0, vx: 0, vy: 0 });
    } else {
        // Orbiting around common center
        const orbitRadius = config.galaxyRadius * 1.5;
        for (let i = 0; i < config.numGalaxies; i++) {
            const angle = (i / config.numGalaxies) * Math.PI * 2;
            const x = Math.cos(angle) * orbitRadius;
            const y = Math.sin(angle) * orbitRadius;

            // Orbital velocity for galaxies themselves (approximate for stability)
            // v = sqrt(G * M_total_inside / r). 
            // Treat other galaxies as central mass approx? Or just static for now?
            // Let's give them some rotation so they don't merge instantly if gravity is on.
            const velMag = 1.0;
            const vx = -Math.sin(angle) * velMag;
            const vy = Math.cos(angle) * velMag;

            centers.push({ x, y, vx, vy });
        }
    }

    // Create Objects
    centers.forEach((center, gIndex) => {
        // Black Hole
        const bh = new BlackHole(center.x, center.y, bhMass);
        bh.vel.x = center.vx;
        bh.vel.y = center.vy;
        blackHoles.push(bh);

        // Stars
        for (let i = 0; i < starsPerGalaxy; i++) {
            // Spiral distribution
            // Angle t, Radius r
            // bias random radius to be denser at core
            const rNorm = Math.pow(Math.random(), 2); // 0..1
            const r = rNorm * config.galaxyRadius;

            // Angle
            // Logarithmic Spiral: theta = a * ln(r)
            // We add noise and arm offsets.
            const armIndex = i % config.numArms;
            const armAngle = (armIndex / config.numArms) * Math.PI * 2;

            // "Spiral Factor" controls how much it winds. 
            // Standard galaxy spiral: angle increases with radius.
            const spiralAngle = r * (config.spiralFactor * 0.05); // Simple linear winding with radius

            let angle = armAngle + spiralAngle;

            // Add randomness to spread arms (scater)
            // More scatter further out?
            const scatter = (Math.random() - 0.5) * 0.5; // Radians
            angle += scatter;

            const x = center.x + Math.cos(angle) * r;
            const y = center.y + Math.sin(angle) * r;

            // Orbital Velocity
            // Ensure stable orbit around the black hole: v = sqrt(G*M/r)
            // r is distance to BH
            const dist = Math.max(r, 10); // Clamp min dist
            const orbitalSpeed = Math.sqrt((G * config.gravityForce * bhMass) / dist);

            // Velocity vector (tangent to circle)
            // Tangent direction is angle + 90 deg (PI/2)
            // Direction depends on rotationSpeed sign
            const velDir = angle + (Math.PI / 2) * (config.initialRotation >= 0 ? 1 : -1);

            // Apply Initial Rotation multiplier to speed
            const speed = orbitalSpeed * Math.abs(config.initialRotation);

            let vx = Math.cos(velDir) * speed;
            let vy = Math.sin(velDir) * speed;

            // Add Galaxy (center) velocity
            vx += center.vx;
            vy += center.vy;

            // Color
            let color;
            if (config.colorMode === 'arms') {
                // Color based on Arm + Noise
                const hueBase = (armIndex * 50 + gIndex * 120) % 360;
                const hue = hueBase + (Math.random() - 0.5) * 40;
                const sat = 60 + Math.random() * 40;
                const light = 50 + Math.random() * 40;
                color = `hsla(${hue}, ${sat}%, ${light}%, 0.9)`;
            } else {
                color = 'white'; // Will be updated by updateColor
            }

            const size = config.starSize * (0.5 + Math.random());

            const star = new Star(x, y, vx, vy, color, size, gIndex);
            if (config.colorMode !== 'arms') star.updateColor(config.colorMode);
            stars.push(star);
        }
    });
}


function resetSimulation() {
    isPlaying = false;
    document.getElementById('playButton').textContent = 'Play';

    // Regenerate everything to fresh state
    generateGalaxy();
    draw();
}

function togglePlay() {
    isPlaying = !isPlaying;
    document.getElementById('playButton').textContent = isPlaying ? 'Pause' : 'Play';
}

function randomizeSettings() {
    const r = (min, max) => Math.random() * (max - min) + min;
    const ri = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

    // Update Config & UI
    const setUI = (id, val) => {
        config[id] = val;
        const el = document.getElementById(id);
        const disp = document.getElementById(id + '-value');
        if (el) el.value = val;
        if (disp) disp.textContent = typeof val === 'number' ? val.toFixed(1) : val;
    };

    setUI('numStars', ri(1000, 5000));
    setUI('spiralFactor', parseFloat(r(0, 5).toFixed(1)));
    setUI('galaxyRadius', ri(100, 400));
    setUI('rotationSpeed', parseFloat(r(0.1, 2.0).toFixed(1)));
    setUI('numArms', ri(2, 8));
    setUI('coreSize', ri(20, 100));
    setUI('gravityForce', parseFloat(r(0.5, 3.0).toFixed(1)));

    generateGalaxy();
    draw();
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        // Request fullscreen on the container or canvas? 
        // Canvas usually gives best results.
        if (canvas.requestFullscreen) canvas.requestFullscreen();
        else if (canvas.webkitRequestFullscreen) canvas.webkitRequestFullscreen(); // Safari
    } else {
        if (document.exitFullscreen) document.exitFullscreen();
    }
}

// --- Loop ---

function loop() {
    if (isPlaying) {
        update();
    }
    draw();
    animationId = requestAnimationFrame(loop);
}

function update() {
    // 1. Update Black Holes (attract each other)
    // For multiple galaxies, they should orbit each other or merge
    for (let i = 0; i < blackHoles.length; i++) {
        for (let j = i + 1; j < blackHoles.length; j++) {
            const bh1 = blackHoles[i];
            const bh2 = blackHoles[j];
            const dx = bh2.pos.x - bh1.pos.x;
            const dy = bh2.pos.y - bh1.pos.y;
            const distSq = dx * dx + dy * dy;
            const dist = Math.sqrt(distSq);

            if (dist > bh1.radius + bh2.radius) {
                const force = (G * config.gravityForce * bh1.mass * bh2.mass) / distSq;

                // a = F/m
                const ax = (dx / dist) * force;
                const ay = (dy / dist) * force;

                bh1.vel.x += ax / bh1.mass;
                bh1.vel.y += ay / bh1.mass;
                bh2.vel.x -= ax / bh2.mass;
                bh2.vel.y -= ay / bh2.mass;
            }
        }
        blackHoles[i].update();
    }

    // 2. Update Stars
    stars.forEach(star => {
        star.update(blackHoles, config.gravityForce);

        // Color update if dynamic mode
        if (config.colorMode === 'speed') {
            star.updateColor('speed');
        }
    });
}

function draw() {
    // Clear Background
    ctx.fillStyle = '#000000'; // Pure black for space
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Setup Camera/Transform
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2); // Center Origin

    // Auto-scale or Manual Zoom could go here.
    // Let's implement simple fitting: 1.0 scale usually maps 1px = 1 unit.
    // Our galaxy radius is ~300. Canvas is ~800. So scale 1.0 fits nicely (-400 to 400).
    // If multiple galaxies spread out, we might want to zoom out.
    // For now, fixed scale 1.0 implies direct mapping.
    const scale = config.numGalaxies > 1 ? 0.6 : 0.8;
    ctx.scale(scale, scale);

    // Draw Background Gradient (Subtle nebula effect)
    /*
    const grad = ctx.createRadialGradient(0, 0, 10, 0, 0, 1000);
    grad.addColorStop(0, 'rgba(20, 20, 40, 0.4)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(-2000, -2000, 4000, 4000);
    */

    // Draw Objects
    stars.forEach(s => s.draw(ctx));
    blackHoles.forEach(bh => bh.draw(ctx));

    ctx.restore();
}

// Start
init();

