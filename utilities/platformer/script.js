/**
 * =================================================================
 * PROCEDURAL PLATFORMER - Main Game Script
 * A Mario-like platformer with Markov chain procedural generation
 * =================================================================
 */

// ========================================
// CONFIGURATION
// ========================================

const CONFIG = {
    // Canvas & Rendering
    TILE_SIZE: 16,
    SCALE: 3,
    TARGET_FPS: 60,

    // World dimensions (in tiles)
    WORLD_HEIGHT: 15,  // Number of tiles high the world is
    GROUND_HEIGHT: 4,  // Ground tiles from bottom

    // Physics
    GRAVITY: 0.6,
    MAX_FALL_SPEED: 12,
    PLAYER_SPEED: 4,
    PLAYER_RUN_SPEED: 6,
    PLAYER_JUMP_FORCE: 12,
    PLAYER_BOUNCE_FORCE: 9,
    FRICTION: 0.85,

    // Generation
    GENERATION_BUFFER: 40,
    MAX_GAP_WIDTH: 4,

    // Gameplay
    STARTING_LIVES: 3,
    INVINCIBILITY_TIME: 2000,

    // Scoring
    SCORE_COIN: 100,
    SCORE_ENEMY: 200,
    SCORE_QUESTION_BLOCK: 50,
    SCORE_POWERUP: 500,
    SCORE_DISTANCE: 10
};

const SPRITE_MAP = {
    goomba: { sheet: 'enemies.png', x: 0, y: 0, w: 16, h: 16, frames: 2 },
    koopa: { sheet: 'enemies.png', x: 96, y: 32, w: 16, h: 24, frames: 2 },
    coin: { sheet: 'mario_and_items.png', x: 0, y: 96, w: 16, h: 16, frames: 4 }
};

// Computed values
const TILE_SCALED = () => CONFIG.TILE_SIZE * CONFIG.SCALE;

// ========================================
// MARKOV CHAIN GENERATION CONFIG
// ========================================

const GENERATION = {
    groundTransitions: {
        'ground': { ground: 0.88, gap: 0.10, platform: 0.02 },
        'gap': { ground: 0.75, gap: 0.20, platform: 0.05 },
        'platform': { ground: 0.45, gap: 0.10, platform: 0.45 },
        'gap,gap': { ground: 0.80, gap: 0.15, platform: 0.05 },
        'gap,gap,gap': { ground: 0.95, gap: 0.03, platform: 0.02 },
        'gap,gap,gap,gap': { ground: 1.0, gap: 0.0, platform: 0.0 },
    },

    heightTransitions: {
        0: { 0: 0.90, 1: 0.10, 2: 0.00 },
        1: { 0: 0.15, 1: 0.70, 2: 0.15 },
        2: { 1: 0.15, 2: 0.70, 3: 0.15 },
        3: { 2: 0.20, 3: 0.80 }
    },

    blockTypes: {
        normal: 0.75,
        brick: 0.12,
        question: 0.08,
        pipe: 0.03,
        empty: 0.02
    },

    enemies: {
        baseRate: 0.025,
        types: { goomba: 0.60, koopa: 0.40 },
        distanceMultiplier: (dist) => 1 + (dist / 8000)
    },

    items: {
        coin: { rate: 0.06, heightAboveGround: [3, 5] }
    }
};

// ========================================
// SEEDED RANDOM NUMBER GENERATOR
// ========================================

class SeededRandom {
    constructor(seed) {
        this.seed = this.hashString(String(seed));
        this.state = this.seed;
    }

    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash = hash & hash;
        }
        return Math.abs(hash) || 1;
    }

    next() {
        let t = this.state += 0x6D2B79F5;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    nextInt(min, max) {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }

    nextBool(probability = 0.5) {
        return this.next() < probability;
    }

    choose(options) {
        const keys = Object.keys(options);
        const total = Object.values(options).reduce((a, b) => a + b, 0);
        let random = this.next() * total;
        for (const key of keys) {
            random -= options[key];
            if (random <= 0) return key;
        }
        return keys[keys.length - 1];
    }
}

// ========================================
// SOUND MANAGER
// ========================================

class SoundManager {
    constructor() {
        this.sounds = {};
        this.sfxVolume = 0.8;
        this.muted = false;
    }

    async load() {
        const files = [
            'smb_jump_small', 'smb_coin', 'smb_stomp', 'smb_break_block',
            'smb_bump', 'smb_powerup_appears', 'smb_mario_die', 'smb_game_over', 'smb_pause'
        ];
        await Promise.all(files.map(name => new Promise(resolve => {
            const audio = new Audio(`assets/sounds/${name}.wav`);
            audio.addEventListener('canplaythrough', () => resolve(), { once: true });
            audio.addEventListener('error', () => resolve(), { once: true });
            this.sounds[name] = audio;
        })));
    }

    play(name) {
        if (this.muted || !this.sounds[name]) return;
        const sound = this.sounds[name].cloneNode();
        sound.volume = this.sfxVolume;
        sound.play().catch(() => { });
    }

    setVolume(v) { this.sfxVolume = Math.max(0, Math.min(1, v)); }
}

// ========================================
// INPUT HANDLER
// ========================================

class InputHandler {
    constructor() {
        this.keys = {};
        this.touches = {};
        this.jumpPressed = false;
        this.jumpWasPressed = false;

        document.addEventListener('keydown', e => {
            this.keys[e.code] = true;
            if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                e.preventDefault();
            }
        });
        document.addEventListener('keyup', e => this.keys[e.code] = false);

        this.setupTouchControls();
    }

    setupTouchControls() {
        const buttons = { btnLeft: 'left', btnRight: 'right', btnA: 'jump', btnB: 'run' };
        Object.entries(buttons).forEach(([id, action]) => {
            const btn = document.getElementById(id);
            if (!btn) return;

            ['touchstart', 'mousedown'].forEach(evt => {
                btn.addEventListener(evt, e => {
                    e.preventDefault();
                    this.touches[action] = true;
                    btn.classList.add('pressed');
                }, { passive: false });
            });

            ['touchend', 'touchcancel', 'mouseup', 'mouseleave'].forEach(evt => {
                btn.addEventListener(evt, e => {
                    e.preventDefault();
                    this.touches[action] = false;
                    btn.classList.remove('pressed');
                }, { passive: false });
            });
        });
    }

    isPressed(action) {
        const bindings = {
            left: ['KeyA', 'ArrowLeft'],
            right: ['KeyD', 'ArrowRight'],
            jump: ['Space', 'KeyW', 'ArrowUp'],
            run: ['ShiftLeft', 'ShiftRight']
        };
        return bindings[action]?.some(k => this.keys[k]) || this.touches[action] || false;
    }

    update() {
        this.jumpWasPressed = this.jumpPressed;
        this.jumpPressed = this.isPressed('jump');
    }

    jumpJustPressed() {
        return this.jumpPressed && !this.jumpWasPressed;
    }
}

// ========================================
// SPRITE SYSTEM
// ========================================

class SpriteSystem {
    constructor() {
        this.sheets = {};
    }

    async load() {
        const names = ['mario_and_items.png', 'blocks.png', 'enemies.png'];
        await Promise.all(names.map(name => new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => { this.sheets[name] = img; resolve(); };
            img.onerror = reject;
            img.src = `assets/images/${name}`;
        })));
    }

    drawTile(ctx, sheet, tileX, tileY, x, y, scale = CONFIG.SCALE, flipX = false) {
        const img = this.sheets[sheet];
        if (!img) return;

        const s = CONFIG.TILE_SIZE;
        const d = s * scale;

        ctx.save();
        if (flipX) {
            ctx.translate(x + d, y);
            ctx.scale(-1, 1);
            ctx.drawImage(img, tileX * s, tileY * s, s, s, 0, 0, d, d);
        } else {
            ctx.drawImage(img, tileX * s, tileY * s, s, s, x, y, d, d);
        }
        ctx.restore();
    }

    // Draw sprite with exact pixel coordinates from source
    drawSprite(ctx, sheet, sx, sy, sw, sh, x, y, dw, dh, flipX = false) {
        const img = this.sheets[sheet];
        if (!img) return;

        ctx.save();
        if (flipX) {
            ctx.translate(x + dw, y);
            ctx.scale(-1, 1);
            ctx.drawImage(img, sx, sy, sw, sh, 0, 0, dw, dh);
        } else {
            ctx.drawImage(img, sx, sy, sw, sh, x, y, dw, dh);
        }
        ctx.restore();
    }
}

// ========================================
// WORLD GENERATOR
// ========================================

class WorldGenerator {
    constructor(seed, worldHeight) {
        this.rng = new SeededRandom(seed);
        this.seed = seed;
        this.worldHeight = worldHeight;
        this.columns = [];
        this.lastColumn = -1;
        this.groundHistory = ['ground', 'ground', 'ground', 'ground'];
        this.platformHeight = 0;
    }

    generateTo(targetColumn) {
        while (this.lastColumn < targetColumn) {
            this.lastColumn++;
            this.generateColumn(this.lastColumn);
        }
    }

    generateColumn(col) {
        const column = { tiles: [], enemies: [], items: [] };

        // Force solid ground for first 8 columns
        if (col < 8) {
            this.addGroundTiles(column, col);
            this.columns[col] = column;
            return;
        }

        const groundType = this.getNextGroundType();
        this.groundHistory.push(groundType);
        if (this.groundHistory.length > 4) this.groundHistory.shift();

        if (groundType === 'ground') {
            this.addGroundTiles(column, col);
            if (this.rng.nextBool(0.04) && col > 10) this.addPipe(column, col);
            if (this.rng.nextBool(0.12)) this.addFloatingBlock(column, col);
        } else if (groundType === 'platform') {
            this.addPlatform(column, col);
        }
        // gap = no tiles

        // Enemies
        if (col > 12 && groundType !== 'gap') {
            const rate = GENERATION.enemies.baseRate * GENERATION.enemies.distanceMultiplier(col * TILE_SCALED());
            if (this.rng.nextBool(rate)) {
                const type = this.rng.choose(GENERATION.enemies.types);
                const groundY = groundType === 'platform' ?
                    CONFIG.GROUND_HEIGHT + this.platformHeight * 2 : CONFIG.GROUND_HEIGHT;
                column.enemies.push({ type, col, tileY: groundY });
            }
        }

        // Coins
        if (groundType === 'ground' && this.rng.nextBool(GENERATION.items.coin.rate)) {
            const [minH, maxH] = GENERATION.items.coin.heightAboveGround;
            column.items.push({ type: 'coin', col, tileY: CONFIG.GROUND_HEIGHT + this.rng.nextInt(minH, maxH) });
        }

        this.columns[col] = column;
    }

    getNextGroundType() {
        const patterns = [
            this.groundHistory.slice(-4).join(','),
            this.groundHistory.slice(-3).join(','),
            this.groundHistory.slice(-2).join(','),
            this.groundHistory[this.groundHistory.length - 1]
        ];
        for (const p of patterns) {
            if (GENERATION.groundTransitions[p]) {
                return this.rng.choose(GENERATION.groundTransitions[p]);
            }
        }
        return 'ground';
    }

    addGroundTiles(column, col) {
        for (let y = 0; y < CONFIG.GROUND_HEIGHT; y++) {
            column.tiles.push({
                type: y === CONFIG.GROUND_HEIGHT - 1 ? 'groundTop' : 'ground',
                col, tileY: y, solid: true
            });
        }
    }

    addPlatform(column, col) {
        const opts = GENERATION.heightTransitions[this.platformHeight] || { 1: 1 };
        this.platformHeight = parseInt(this.rng.choose(opts));
        const y = CONFIG.GROUND_HEIGHT + 2 + this.platformHeight;
        column.tiles.push({ type: 'brick', col, tileY: y, solid: true });

        // Maybe add ground too
        if (this.rng.nextBool(0.4)) this.addGroundTiles(column, col);
    }

    addPipe(column, col) {
        const h = this.rng.nextInt(2, 3);
        for (let i = 0; i < h; i++) {
            column.tiles.push({
                type: i === h - 1 ? 'pipeTop' : 'pipeBody',
                col, tileY: CONFIG.GROUND_HEIGHT + i, solid: true
            });
        }
    }

    addFloatingBlock(column, col) {
        const y = CONFIG.GROUND_HEIGHT + this.rng.nextInt(4, 6);
        const type = this.rng.nextBool(0.3) ? 'question' : 'brick';
        column.tiles.push({ type, col, tileY: y, solid: true, hasItem: type === 'question' });
    }

    getColumn(col) { return this.columns[col] || null; }

    getSolidTileAt(col, tileY) {
        const column = this.columns[col];
        if (!column) return null;
        return column.tiles.find(t => t.tileY === tileY && t.solid);
    }
}

// ========================================
// ENTITY BASE
// ========================================

class Entity {
    constructor(x, y, width, height) {
        this.x = x;  // World X (pixels from left)
        this.y = y;  // World Y (pixels from BOTTOM)
        this.vx = 0;
        this.vy = 0;
        this.width = width;
        this.height = height;
        this.grounded = false;
    }

    // Convert world Y to screen Y
    toScreenY(canvasHeight) {
        return canvasHeight - this.y - this.height;
    }

    getBounds() {
        return {
            left: this.x,
            right: this.x + this.width,
            bottom: this.y,
            top: this.y + this.height
        };
    }
}

// ========================================
// PLAYER
// ========================================

class Player extends Entity {
    constructor(x, y) {
        super(x, y, TILE_SCALED() * 0.75, TILE_SCALED() * 0.95);
        this.facingRight = true;
        this.state = 'idle';
        this.dead = false;
        this.invincible = false;
        this.invincibleTimer = 0;
        this.animFrame = 0;
        this.animTimer = 0;
    }

    update(input, world, dt, canvasHeight) {
        if (this.dead) {
            this.vy -= CONFIG.GRAVITY;
            this.y += this.vy;
            return;
        }

        // Horizontal movement
        const speed = input.isPressed('run') ? CONFIG.PLAYER_RUN_SPEED : CONFIG.PLAYER_SPEED;
        if (input.isPressed('left')) {
            this.vx = -speed;
            this.facingRight = false;
        } else if (input.isPressed('right')) {
            this.vx = speed;
            this.facingRight = true;
        } else {
            this.vx *= CONFIG.FRICTION;
            if (Math.abs(this.vx) < 0.1) this.vx = 0;
        }

        // Jump
        if (input.jumpJustPressed() && this.grounded) {
            this.vy = CONFIG.PLAYER_JUMP_FORCE;
            this.grounded = false;
            game.sound.play('smb_jump_small');
        }

        // Gravity
        this.vy -= CONFIG.GRAVITY;
        if (this.vy < -CONFIG.MAX_FALL_SPEED) this.vy = -CONFIG.MAX_FALL_SPEED;

        // Move & Collide
        this.x += this.vx;
        this.checkHorizontalCollisions(world);
        this.y += this.vy;
        this.checkVerticalCollisions(world);

        // Bounds
        if (this.x < 0) { this.x = 0; this.vx = 0; }

        // Fell off?
        if (this.y < -100) this.die();

        // State for animation
        this.updateState();
        this.updateAnimation(dt);

        // Invincibility
        if (this.invincible) {
            this.invincibleTimer -= dt;
            if (this.invincibleTimer <= 0) this.invincible = false;
        }
    }

    checkHorizontalCollisions(world) {
        const ts = TILE_SCALED();
        const startCol = Math.floor(this.x / ts);
        const endCol = Math.floor((this.x + this.width) / ts);
        const startY = Math.floor(this.y / ts);
        const endY = Math.floor((this.y + this.height - 1) / ts);

        for (let col = startCol; col <= endCol; col++) {
            for (let ty = startY; ty <= endY; ty++) {
                if (world.getSolidTileAt(col, ty)) {
                    if (this.vx > 0) {
                        this.x = col * ts - this.width;
                    } else if (this.vx < 0) {
                        this.x = (col + 1) * ts;
                    }
                    this.vx = 0;
                }
            }
        }
    }

    checkVerticalCollisions(world) {
        const ts = TILE_SCALED();
        const startCol = Math.floor(this.x / ts);
        const endCol = Math.floor((this.x + this.width - 1) / ts);
        const startY = Math.floor(this.y / ts);
        const endY = Math.floor((this.y + this.height) / ts);

        this.grounded = false;

        for (let col = startCol; col <= endCol; col++) {
            for (let ty = startY; ty <= endY; ty++) {
                const tile = world.getSolidTileAt(col, ty);
                if (tile) {
                    const tileTop = (ty + 1) * ts;
                    const tileBottom = ty * ts;

                    if (this.vy < 0) {
                        // Falling - land on tile
                        this.y = tileTop;
                        this.vy = 0;
                        this.grounded = true;
                    } else if (this.vy > 0) {
                        // Rising - hit head
                        this.y = tileBottom - this.height;
                        this.vy = 0;
                        this.hitBlock(tile, col, ty, world);
                    }
                }
            }
        }
    }

    hitBlock(tile, col, ty, world) {
        if (tile.type === 'question' && tile.hasItem) {
            tile.type = 'questionEmpty';
            tile.hasItem = false;
            game.sound.play('smb_powerup_appears');
            game.addScore(CONFIG.SCORE_QUESTION_BLOCK);
        } else if (tile.type === 'brick') {
            game.sound.play('smb_bump');
        } else {
            game.sound.play('smb_bump');
        }
    }

    updateState() {
        if (this.dead) {
            this.state = 'die';
        } else if (!this.grounded) {
            this.state = this.vy > 0 ? 'jump' : 'fall';
        } else if (Math.abs(this.vx) > 0.5) {
            this.state = 'walk';
        } else {
            this.state = 'idle';
        }
    }

    updateAnimation(dt) {
        if (this.state === 'walk') {
            this.animTimer += dt;
            if (this.animTimer > 100) {
                this.animTimer = 0;
                this.animFrame = (this.animFrame + 1) % 3;
            }
        } else {
            this.animFrame = 0;
        }
    }

    takeDamage() {
        if (this.invincible || this.dead) return;
        this.die();
    }

    die() {
        if (this.dead) return;
        this.dead = true;
        this.vy = CONFIG.PLAYER_JUMP_FORCE;
        game.sound.play('smb_mario_die');
    }

    bounce() {
        this.vy = CONFIG.PLAYER_BOUNCE_FORCE;
    }

    draw(ctx, sprites, cameraX, canvasHeight) {
        if (this.dead && this.y < -200) return;
        if (this.invincible && Math.floor(Date.now() / 100) % 2 === 0) return;

        const screenX = this.x - cameraX;
        const screenY = this.toScreenY(canvasHeight);

        // Sprite frames: idle=0, walk=1-3, jump=5
        let frameX = 0;
        if (this.state === 'walk') frameX = 1 + this.animFrame;
        else if (this.state === 'jump' || this.state === 'fall') frameX = 5;
        else if (this.state === 'die') frameX = 6;

        sprites.drawTile(ctx, 'mario_and_items.png', frameX, 0, screenX, screenY, CONFIG.SCALE, !this.facingRight);
    }
}

// ========================================
// ENEMY
// ========================================

class Enemy extends Entity {
    constructor(type, col, tileY) {
        const ts = TILE_SCALED();
        super(col * ts, tileY * ts, ts * 0.9, ts * 0.9);
        this.type = type;
        this.vx = -1.5;
        this.active = true;
        this.dead = false;
        this.deadTimer = 0;
        this.animFrame = 0;
        this.animTimer = 0;
    }

    update(world, dt, canvasHeight) {
        if (!this.active) return;

        if (this.dead) {
            this.deadTimer -= dt;
            if (this.deadTimer <= 0) this.active = false;
            return;
        }

        // Gravity
        this.vy -= CONFIG.GRAVITY;
        if (this.vy < -CONFIG.MAX_FALL_SPEED) this.vy = -CONFIG.MAX_FALL_SPEED;

        this.x += this.vx;
        this.y += this.vy;

        // Simple ground collision
        // ts already defined in constructor, but better re-fetch or use helper
        const ts = TILE_SCALED();
        const groundY = CONFIG.GROUND_HEIGHT * ts;
        if (this.y < groundY) {
            this.y = groundY;
            this.vy = 0;
        }

        // Animation
        this.animTimer += dt;
        if (this.animTimer > 200) {
            this.animTimer = 0;
            this.animFrame = 1 - this.animFrame;
        }

        // Patrol AI: Turn at walls or edges
        // Reuse ts from above or re-declare if scope allows (it does not if 'var' or top level of function, but here it's blocked).
        // Actually, ts is defined multiple times in the same scope (update function).
        // Let's just use the one from line 643? No line 643 is constructor.
        // It was defined at line 671.

        const nextX = this.x + this.vx + (this.vx > 0 ? this.width : 0);
        const col = Math.floor(nextX / ts);
        const row = Math.floor(this.y / ts);

        // Check for wall
        if (world.getSolidTileAt(col, row)) {
            this.vx *= -1;
        } else {
            // Check for ledge (gap ahead)
            const groundRow = row - 1;
            if (groundRow >= 0 && !world.getSolidTileAt(col, groundRow)) {
                this.vx *= -1;
            }
        }

        // Randomly turn around sometimes
        if (Math.random() < 0.005) this.vx *= -1;

        // Off screen left
        if (this.x < game.cameraX - 200) this.active = false;
    }

    stomp() {
        this.dead = true;
        this.deadTimer = 400;
        game.sound.play('smb_stomp');
        game.addScore(CONFIG.SCORE_ENEMY);
    }

    draw(ctx, sprites, cameraX, canvasHeight) {
        if (!this.active) return;

        const screenX = this.x - cameraX;
        const screenY = this.toScreenY(canvasHeight);

        const sprite = SPRITE_MAP[this.type];
        if (sprite) {
            // Calculate frame
            const frame = Math.floor(this.animFrame) % sprite.frames;
            const sx = sprite.x + (frame * 16); // Assuming horizontal strip with 16px stride
            const sy = sprite.y;

            sprites.drawSprite(
                ctx, sprite.sheet,
                sx, sy, sprite.w, sprite.h,
                screenX, screenY + (TILE_SCALED() - (sprite.h * (CONFIG.SCALE))), // Align bottom
                sprite.w * CONFIG.SCALE, sprite.h * CONFIG.SCALE,
                this.vx > 0 // Flip if moving right? Usually sprites look left default.
            );
        } else {
            // Fallback placeholder
            const size = TILE_SCALED();
            ctx.save();
            ctx.fillStyle = this.type === 'goomba' ? '#8B4513' : '#32CD32';
            ctx.fillRect(screenX, screenY, size, size);
            ctx.restore();
        }
    }
}

// ========================================
// COIN
// ========================================

class Coin extends Entity {
    constructor(col, tileY) {
        const ts = TILE_SCALED();
        super(col * ts + ts * 0.25, tileY * ts, ts * 0.5, ts * 0.5);
        this.collected = false;
        this.animFrame = 0;
        this.animTimer = 0;
        this.baseY = this.y;
    }

    update(dt) {
        if (this.collected) return;
        this.y = this.baseY + Math.sin(Date.now() / 200) * 4;
        this.animTimer += dt;
        if (this.animTimer > 100) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 4;
        }
    }

    collect() {
        if (this.collected) return;
        this.collected = true;
        game.sound.play('smb_coin');
        game.addScore(CONFIG.SCORE_COIN);
    }

    draw(ctx, sprites, cameraX, canvasHeight) {
        if (this.collected) return;

        const screenX = this.x - cameraX;
        const screenY = this.toScreenY(canvasHeight);

        const sprite = SPRITE_MAP['coin'];
        if (sprite) {
            const frame = this.animFrame % sprite.frames;
            const sx = sprite.x + (frame * 16);
            const sy = sprite.y;

            sprites.drawSprite(
                ctx, sprite.sheet,
                sx, sy, sprite.w, sprite.h,
                screenX, screenY,
                sprite.w * CONFIG.SCALE, sprite.h * CONFIG.SCALE
            );
        }
    }
}


// ========================================
// MAIN GAME
// ========================================

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        this.sound = new SoundManager();
        this.input = new InputHandler();
        this.sprites = new SpriteSystem();

        this.state = 'menu';
        this.seed = '';
        this.score = 0;
        this.lives = CONFIG.STARTING_LIVES;
        this.distance = 0;

        this.world = null;
        this.player = null;
        this.enemies = [];
        this.coins = [];
        this.cameraX = 0;
        this.lastTime = 0;

        this.setupCanvas();
        this.setupUI();
        this.loadAssets();
    }

    setupCanvas() {
        const resize = () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', resize);
        resize();
    }

    setupUI() {
        document.getElementById('startProceduralBtn').onclick = () => this.startGame();
        document.getElementById('randomSeedBtn').onclick = () => {
            document.getElementById('seedInput').value = Math.random().toString(36).substring(2, 10).toUpperCase();
        };
        document.getElementById('settingsBtn').onclick = () => this.showMenu('settings');
        document.getElementById('highScoresBtn').onclick = () => this.showHighScores();

        document.getElementById('closeSettingsBtn').onclick = () => this.showMenu('main');
        document.getElementById('resetSettingsBtn').onclick = () => this.resetSettings();

        ['sfxVolume', 'musicVolume'].forEach(id => {
            const slider = document.getElementById(id);
            const span = document.getElementById(id + 'Value');
            if (slider) slider.oninput = () => {
                span.textContent = slider.value + '%';
                if (id === 'sfxVolume') this.sound.setVolume(slider.value / 100);
            };
        });

        const touchToggle = document.getElementById('showMobileControls');
        if (touchToggle) {
            touchToggle.addEventListener('change', () => {
                const mc = document.getElementById('mobileControls');
                if (touchToggle.checked && 'ontouchstart' in window) {
                    mc.classList.remove('hidden');
                } else {
                    mc.classList.add('hidden');
                }
            });
        }

        document.getElementById('pauseBtn').onclick = () => this.togglePause();
        document.getElementById('resumeBtn').onclick = () => this.togglePause();
        document.getElementById('pauseSettingsBtn').onclick = () => {
            this.showMenu('settings');
            document.getElementById('closeSettingsBtn').onclick = () => this.showMenu('pause');
        };
        document.getElementById('quitBtn').onclick = () => this.quitToMenu();

        document.getElementById('retryBtn').onclick = () => this.startGame(this.seed);
        document.getElementById('menuBtn').onclick = () => this.quitToMenu();

        document.getElementById('closeHighScoresBtn').onclick = () => this.showMenu('main');
        document.getElementById('clearScoresBtn').onclick = () => {
            localStorage.removeItem('platformerHighScores');
            this.showHighScores();
        };

        document.addEventListener('keydown', e => {
            if ((e.code === 'Escape' || e.code === 'KeyP') && (this.state === 'playing' || this.state === 'paused')) {
                this.togglePause();
            }
        });
    }

    async loadAssets() {
        await Promise.all([this.sprites.load(), this.sound.load()]);
        const btn = document.getElementById('startProceduralBtn');
        if (btn) { btn.textContent = 'START GAME'; btn.disabled = false; }
    }

    showMenu(name) {
        ['mainMenu', 'settingsMenu', 'pauseMenu', 'gameOverMenu', 'highScoresMenu']
            .forEach(m => document.getElementById(m)?.classList.add('hidden'));
        document.getElementById(name + 'Menu')?.classList.remove('hidden');
    }

    showHighScores() {
        const scores = JSON.parse(localStorage.getItem('platformerHighScores') || '[]');
        const list = document.getElementById('highScoresList');
        while (list.children.length > 1) list.removeChild(list.lastChild);

        if (scores.length === 0) {
            const row = document.createElement('div');
            row.className = 'high-score-row';
            row.innerHTML = '<span>-</span><span>No scores yet</span><span>-</span>';
            list.appendChild(row);
        } else {
            scores.slice(0, 10).forEach((s, i) => {
                const row = document.createElement('div');
                row.className = 'high-score-row';
                row.innerHTML = `<span class="rank">${i + 1}</span><span class="score">${s.score.toLocaleString()}</span><span class="seed">${s.seed}</span>`;
                list.appendChild(row);
            });
        }
        this.showMenu('highScores');
    }

    resetSettings() {
        document.getElementById('sfxVolume').value = 80;
        document.getElementById('sfxVolumeValue').textContent = '80%';
        this.sound.setVolume(0.8);
    }

    startGame(useSeed = null) {
        this.seed = useSeed || document.getElementById('seedInput').value.trim() ||
            Math.random().toString(36).substring(2, 10).toUpperCase();
        document.getElementById('currentSeed').textContent = this.seed;

        this.score = 0;
        this.lives = CONFIG.STARTING_LIVES;
        this.distance = 0;
        this.cameraX = 0;

        this.world = new WorldGenerator(this.seed, CONFIG.WORLD_HEIGHT);
        this.world.generateTo(CONFIG.GENERATION_BUFFER);

        const ts = TILE_SCALED();
        this.player = new Player(ts * 3, ts * CONFIG.GROUND_HEIGHT);
        this.enemies = [];
        this.coins = [];

        this.updateHUD();
        this.showMenu('');
        document.getElementById('hud').classList.remove('hidden');
        document.getElementById('seedDisplay').classList.remove('hidden');
        if ('ontouchstart' in window) document.getElementById('mobileControls').classList.remove('hidden');

        this.state = 'playing';
        this.lastTime = performance.now();
        requestAnimationFrame(t => this.gameLoop(t));
    }

    togglePause() {
        if (this.state === 'playing') {
            this.state = 'paused';
            this.showMenu('pause');
            this.sound.play('smb_pause');
        } else if (this.state === 'paused') {
            this.state = 'playing';
            this.showMenu('');
            this.lastTime = performance.now();
            requestAnimationFrame(t => this.gameLoop(t));
        }
    }

    quitToMenu() {
        this.state = 'menu';
        document.getElementById('hud').classList.add('hidden');
        document.getElementById('seedDisplay').classList.add('hidden');
        document.getElementById('mobileControls').classList.add('hidden');
        this.showMenu('main');
    }

    gameOver() {
        this.state = 'gameover';

        const scores = JSON.parse(localStorage.getItem('platformerHighScores') || '[]');
        scores.push({ score: this.score, seed: this.seed, distance: this.distance });
        scores.sort((a, b) => b.score - a.score);
        scores.splice(10);
        localStorage.setItem('platformerHighScores', JSON.stringify(scores));
        const isNew = scores[0].score === this.score;

        document.getElementById('finalScore').textContent = this.score.toLocaleString();
        document.getElementById('finalDistance').textContent = Math.floor(this.distance) + 'm';
        document.getElementById('finalSeed').textContent = this.seed;
        document.getElementById('newHighScore').classList.toggle('hidden', !isNew);

        this.sound.play('smb_game_over');
        document.getElementById('mobileControls').classList.add('hidden');

        setTimeout(() => this.showMenu('gameOver'), 1500);
    }

    addScore(pts) {
        this.score += pts;
        this.updateHUD();
    }

    updateHUD() {
        document.getElementById('hudScore').textContent = this.score.toLocaleString();
        document.getElementById('hudDistance').textContent = Math.floor(this.distance) + 'm';
        document.getElementById('hudLives').textContent = '❤'.repeat(Math.max(0, this.lives));
    }

    gameLoop(timestamp) {
        if (this.state !== 'playing') return;

        const dt = Math.min(timestamp - this.lastTime, 50);
        this.lastTime = timestamp;

        this.update(dt);
        this.render();

        requestAnimationFrame(t => this.gameLoop(t));
    }

    update(dt) {
        this.input.update();
        this.player.update(this.input, this.world, dt, this.canvas.height);

        if (this.player.dead && this.player.y < -300) {
            this.lives--;
            if (this.lives <= 0) {
                this.gameOver();
                return;
            }
            const ts = TILE_SCALED();
            this.player = new Player(this.cameraX + ts * 3, ts * CONFIG.GROUND_HEIGHT);
        }

        // Camera
        const targetX = this.player.x - this.canvas.width / 3;
        this.cameraX = Math.max(0, targetX);

        // Distance
        this.distance = this.player.x / 50;
        this.updateHUD();

        // Generate world
        const ts = TILE_SCALED();
        const endCol = Math.ceil((this.cameraX + this.canvas.width + ts * 10) / ts);
        this.world.generateTo(endCol);

        // Spawn entities
        this.spawnEntities();

        // Update enemies
        this.enemies.forEach(e => e.update(this.world, dt, this.canvas.height));
        this.enemies = this.enemies.filter(e => e.active);

        // Update coins
        this.coins.forEach(c => c.update(dt));

        // Collisions
        this.checkCollisions();
    }

    spawnEntities() {
        const ts = TILE_SCALED();
        const startCol = Math.floor(this.cameraX / ts);
        const endCol = Math.ceil((this.cameraX + this.canvas.width + ts * 5) / ts);

        for (let col = startCol; col <= endCol; col++) {
            const column = this.world.getColumn(col);
            if (!column) continue;

            column.enemies.forEach(e => {
                if (e.spawned) return;
                e.spawned = true;
                this.enemies.push(new Enemy(e.type, e.col, e.tileY));
            });

            column.items.forEach(i => {
                if (i.spawned) return;
                i.spawned = true;
                if (i.type === 'coin') this.coins.push(new Coin(i.col, i.tileY));
            });
        }
    }

    checkCollisions() {
        const pb = this.player.getBounds();

        this.enemies.forEach(enemy => {
            if (!enemy.active || enemy.dead || this.player.dead) return;
            const eb = enemy.getBounds();

            if (pb.left < eb.right && pb.right > eb.left && pb.bottom < eb.top && pb.top > eb.bottom) {
                if (this.player.vy < 0 && pb.bottom > eb.bottom + (eb.top - eb.bottom) * 0.3) {
                    enemy.stomp();
                    this.player.bounce();
                } else {
                    this.player.takeDamage();
                }
            }
        });

        this.coins.forEach(coin => {
            if (coin.collected) return;
            const cb = coin.getBounds();
            if (pb.left < cb.right && pb.right > cb.left && pb.bottom < cb.top && pb.top > cb.bottom) {
                coin.collect();
            }
        });
    }

    render() {
        const ctx = this.ctx;
        const ts = TILE_SCALED();
        const h = this.canvas.height;

        // Sky
        ctx.fillStyle = '#5c94fc';
        ctx.fillRect(0, 0, this.canvas.width, h);

        // Tiles
        const startCol = Math.floor(this.cameraX / ts);
        const endCol = Math.ceil((this.cameraX + this.canvas.width) / ts);

        for (let col = startCol; col <= endCol; col++) {
            const column = this.world.getColumn(col);
            if (!column) continue;

            column.tiles.forEach(tile => {
                const screenX = col * ts - this.cameraX;
                const screenY = h - (tile.tileY + 1) * ts;

                let sx = 0, sy = 0;
                switch (tile.type) {
                    case 'ground': sx = 0; sy = 1; break;
                    case 'groundTop': sx = 0; sy = 0; break;
                    case 'brick': sx = 1; sy = 0; break;
                    case 'question': sx = 24; sy = 0; break;
                    case 'questionEmpty': sx = 3; sy = 0; break;
                    case 'pipeTop': sx = 0; sy = 8; break;
                    case 'pipeBody': sx = 0; sy = 9; break;
                }

                this.sprites.drawTile(ctx, 'blocks.png', sx, sy, screenX, screenY, CONFIG.SCALE);
            });
        }

        // Coins
        this.coins.forEach(c => c.draw(ctx, this.sprites, this.cameraX, h));

        // Enemies
        this.enemies.forEach(e => e.draw(ctx, this.sprites, this.cameraX, h));

        // Player
        this.player.draw(ctx, this.sprites, this.cameraX, h);
    }
}

// ========================================
// INIT
// ========================================

let game;
window.addEventListener('DOMContentLoaded', () => { game = new Game(); });
