/**
 * ai.js — Chess AI Module (Stockfish 18 WASM)
 * 
 * Uses Stockfish 18 lite single-threaded WASM engine via Web Worker.
 * Communicates using UCI (Universal Chess Interface) protocol.
 * 
 * Architecture:
 *   Main thread ←→ Web Worker (stockfish-18-lite-single.js)
 *   postMessage('position fen ...') → onmessage('bestmove ...')
 */

const ChessAI = (() => {
    let worker = null;
    let isReady = false;
    let isThinking = false;
    let currentBot = null;
    let computeMode = 'client';

    // Resolve function for the current bestmove promise
    let bestMoveResolver = null;
    // Resolve function for engine ready promise
    let readyResolver = null;

    // Collected info lines during a search (for evaluation)
    let searchInfoLines = [];

    // Callback for live eval updates
    let onEvaluationUpdate = null;

    /**
     * 10 AI bot characters — each with a personality, ELO, and Stockfish config.
     * Skill Level 0–20 in Stockfish (0 = weakest, 20 = strongest)
     */
    const BOTS = [
        { id: 'woody', name: 'Woody', avatar: '🪵', elo: 400, tagline: 'Just learning the rules', depth: 1, skillLevel: 0 },
        { id: 'cleo', name: 'Cleo', avatar: '🐱', elo: 600, tagline: 'Curious but clumsy', depth: 1, skillLevel: 2 },
        { id: 'finn', name: 'Finn', avatar: '🐟', elo: 800, tagline: 'Slippery but predictable', depth: 2, skillLevel: 4 },
        { id: 'luna', name: 'Luna', avatar: '🌙', elo: 1000, tagline: 'Calm and methodical', depth: 4, skillLevel: 6 },
        { id: 'rex', name: 'Rex', avatar: '🦖', elo: 1200, tagline: 'Aggressive attacker', depth: 6, skillLevel: 8 },
        { id: 'sage', name: 'Sage', avatar: '🧙', elo: 1400, tagline: 'Wise and patient', depth: 8, skillLevel: 10 },
        { id: 'viktor', name: 'Viktor', avatar: '⚔️', elo: 1600, tagline: 'Tactical and sharp', depth: 10, skillLevel: 13 },
        { id: 'athena', name: 'Athena', avatar: '🦉', elo: 1900, tagline: 'Strategic mastermind', depth: 13, skillLevel: 16 },
        { id: 'magnus', name: 'Magnus', avatar: '🏰', elo: 2200, tagline: 'Grandmaster-level play', depth: 16, skillLevel: 18 },
        { id: 'titan', name: 'Titan', avatar: '💀', elo: 3000, tagline: 'Full engine strength — good luck', depth: 20, skillLevel: 20 }
    ];

    /**
     * Initialize the Stockfish engine
     * @returns {Promise<boolean>} true if engine loaded successfully
     */
    async function init() {
        if (worker) {
            destroy();
        }

        return new Promise((resolve) => {
            try {
                worker = new Worker('stockfish/stockfish-18-lite-single.js');

                worker.onmessage = handleMessage;
                worker.onerror = (e) => {
                    console.error('Stockfish Worker error:', e);
                    isReady = false;
                    if (readyResolver) {
                        readyResolver(false);
                        readyResolver = null;
                    }
                };

                // Start UCI initialization
                readyResolver = resolve;
                worker.postMessage('uci');
            } catch (e) {
                console.error('Failed to create Stockfish worker:', e);
                resolve(false);
            }
        });
    }

    /**
     * Handle messages from the Stockfish Web Worker
     */
    function handleMessage(e) {
        const line = typeof e === 'string' ? e : (e.data || '');

        if (line === 'uciok') {
            // UCI initialization complete — configure engine
            configureEngine();
            worker.postMessage('isready');
        } else if (line === 'readyok') {
            isReady = true;
            if (readyResolver) {
                readyResolver(true);
                readyResolver = null;
            }
        } else if (line.startsWith('bestmove')) {
            // Parse: "bestmove e2e4 ponder d7d5"
            const parts = line.split(' ');
            const moveStr = parts[1];

            isThinking = false;

            if (bestMoveResolver && moveStr && moveStr !== '(none)') {
                // Convert UCI move format (e2e4) to {from, to, promotion}
                bestMoveResolver({
                    from: moveStr.substring(0, 2),
                    to: moveStr.substring(2, 4),
                    promotion: moveStr.length > 4 ? moveStr.charAt(4) : undefined
                });
            } else if (bestMoveResolver) {
                bestMoveResolver(null);
            }
            bestMoveResolver = null;
        } else if (line.startsWith('info') && line.includes('score')) {
            // Collect search info for evaluation
            const info = parseInfoLine(line);
            searchInfoLines.push(info);

            if (onEvaluationUpdate && (info.score !== undefined || info.mate !== undefined)) {
                onEvaluationUpdate(info.score, info.mate, info.depth);
            }
        }
    }

    /**
     * Configure engine options based on current difficulty
     */
    function configureEngine() {
        if (!worker) return;
        const bot = currentBot || BOTS[5]; // default to Sage
        worker.postMessage(`setoption name Skill Level value ${bot.skillLevel}`);
        // Limit hash table size for lite engine
        worker.postMessage('setoption name Hash value 16');
    }

    /**
     * Parse a UCI info line into structured data
     * Example: "info depth 12 score cp 35 nodes 484938 pv e2e4 e7e5"
     */
    function parseInfoLine(line) {
        const info = {};
        const tokens = line.split(' ');

        for (let i = 0; i < tokens.length; i++) {
            switch (tokens[i]) {
                case 'depth':
                    info.depth = parseInt(tokens[++i]);
                    break;
                case 'score':
                    if (tokens[i + 1] === 'cp') {
                        info.score = parseInt(tokens[i + 2]) / 100; // centipawns → pawns
                        i += 2;
                    } else if (tokens[i + 1] === 'mate') {
                        info.mate = parseInt(tokens[i + 2]);
                        info.score = tokens[i + 2] > 0 ? 999 : -999;
                        i += 2;
                    }
                    break;
                case 'pv':
                    info.pv = tokens.slice(i + 1);
                    i = tokens.length; // rest is PV
                    break;
                case 'nodes':
                    info.nodes = parseInt(tokens[++i]);
                    break;
                case 'nps':
                    info.nps = parseInt(tokens[++i]);
                    break;
            }
        }
        return info;
    }

    /**
     * Get the AI's best move for a position
     * @param {string} fen - current position in FEN
     * @returns {Promise<{from: string, to: string, promotion?: string}|null>}
     */
    async function getBestMove(fen) {
        if (!worker || !isReady) {
            // Engine not ready — try to init
            const success = await init();
            if (!success) {
                console.warn('Stockfish not available, falling back to random');
                return getRandomMove(fen);
            }
        }

        // Cancel any ongoing search
        if (isThinking) {
            stopThinking();
            // Small delay to let stop process
            await sleep(50);
        }

        isThinking = true;
        searchInfoLines = [];

        const bot = currentBot || BOTS[5];

        return new Promise((resolve) => {
            bestMoveResolver = resolve;

            // Set position
            worker.postMessage('ucinewgame');
            worker.postMessage(`position fen ${fen}`);

            // Start search with depth limit
            worker.postMessage(`go depth ${bot.depth}`);

            // Safety timeout (15 seconds max)
            setTimeout(() => {
                if (isThinking) {
                    console.warn('Stockfish search timeout, stopping');
                    stopThinking();
                }
            }, 15000);
        });
    }

    /**
     * Evaluate a position (returns score and best line)
     * @param {string} fen - position in FEN notation
     * @param {number} depth - search depth (default: current difficulty depth)
     * @returns {Promise<{score: number, bestLine: string[], mate: number|null, depth: number}>}
     */
    async function evaluatePosition(fen, depth = 12) {
        if (!worker || !isReady) {
            const success = await init();
            if (!success) {
                return { score: 0, bestLine: [], mate: null, depth: 0 };
            }
        }

        if (isThinking) {
            stopThinking();
            await sleep(50);
        }

        isThinking = true;
        searchInfoLines = [];

        return new Promise((resolve) => {
            bestMoveResolver = () => {
                // When bestmove arrives, return the last (deepest) info line
                // Filter for lines with scores
                const validLines = searchInfoLines.filter(l => l.score !== undefined);
                const lastInfo = validLines.length > 0
                    ? validLines[validLines.length - 1]
                    : { score: 0, depth: 0 };

                resolve({
                    score: lastInfo.score || 0,
                    bestLine: lastInfo.pv || [],
                    mate: lastInfo.mate || null,
                    depth: lastInfo.depth || 0
                });
            };

            worker.postMessage('ucinewgame');
            worker.postMessage(`position fen ${fen}`);
            worker.postMessage(`go depth ${depth}`);

            // Safety timeout for eval
            setTimeout(() => {
                if (isThinking) {
                    stopThinking();
                }
            }, 6000);
        });
    }

    /**
     * Fallback: get a random legal move (when engine unavailable)
     * Uses a temporary chess.js instance to parse the FEN
     */
    function getRandomMove(fen) {
        try {
            const tempGame = new Chess(fen);
            const moves = tempGame.moves({ verbose: true });
            if (moves.length === 0) return null;

            // Slight preference for captures
            const captures = moves.filter(m => m.captured);
            let move;
            if (captures.length > 0 && Math.random() > 0.5) {
                move = captures[Math.floor(Math.random() * captures.length)];
            } else {
                move = moves[Math.floor(Math.random() * moves.length)];
            }

            return {
                from: move.from,
                to: move.to,
                promotion: move.promotion || undefined
            };
        } catch (e) {
            console.error('Random move fallback failed:', e);
            return null;
        }
    }

    /**
     * Stop the current search
     */
    function stopThinking() {
        if (worker && isThinking) {
            worker.postMessage('stop');
            // isThinking will be set to false when bestmove arrives
        }
    }

    /**
     * Select a bot by ID
     * @param {string} botId
     */
    function selectBot(botId) {
        const bot = BOTS.find(b => b.id === botId);
        if (bot) {
            currentBot = bot;
            if (worker && isReady) {
                configureEngine();
            }
        }
    }

    /**
     * Get a bot by ID
     */
    function getBotById(botId) {
        return BOTS.find(b => b.id === botId) || null;
    }

    /**
     * Get all bots
     */
    function getAllBots() {
        return [...BOTS];
    }

    /**
     * Get the currently selected bot
     */
    function getCurrentBot() {
        return currentBot;
    }

    /**
     * Set computation mode (client/server)
     * @param {'client'|'server'} mode
     */
    function setComputeMode(mode) {
        computeMode = mode;
        // TODO: Implement server-side computation
    }

    /**
     * Check if AI is currently thinking
     */
    function isAIThinking() {
        return isThinking;
    }

    /**
     * Check if engine is ready
     */
    function isEngineReady() {
        return isReady;
    }

    /**
     * Get available difficulty levels
     */
    function getDifficultyLevels() {
        return BOTS.map(b => b.id);
    }

    /**
     * Destroy the engine worker
     */
    function destroy() {
        if (worker) {
            if (isThinking) {
                worker.postMessage('stop');
            }
            worker.postMessage('quit');
            worker.terminate();
            worker = null;
        }
        isReady = false;
        isThinking = false;
        bestMoveResolver = null;
        readyResolver = null;
    }

    // Helper
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Set callback for evaluation updates
     */
    function setOnEvaluationUpdate(callback) {
        onEvaluationUpdate = callback;
    }

    // Public API
    return {
        init,
        getBestMove,
        evaluatePosition,
        selectBot,
        getBotById,
        getAllBots,
        getCurrentBot,
        setComputeMode,
        isAIThinking,
        isEngineReady,
        getDifficultyLevels,
        stopThinking,
        destroy,
        setOnEvaluationUpdate
    };
})();
