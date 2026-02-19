/**
 * game.js — Chess Game Controller
 * 
 * Handles:
 * - Wrapping chess.js for game logic
 * - Game modes (PvP, PvP-rotate, AI, evaluation)
 * - Turn management and move execution
 * - Game state tracking
 * - Move history
 */

const ChessGame = (() => {
    let game = null;           // chess.js instance
    let mode = 'pvp';          // 'pvp', 'ai', 'evaluation'
    let rotateBoard = false;   // PvP board rotation toggle
    let playerColor = 'w';     // For AI mode: which color the human plays
    let moveHistory = [];      // Array of { moveNumber, white, black }
    let fullSANHistory = [];   // Raw SAN array, always kept up-to-date
    let isGameOver = false;
    let historyMode = false;   // true when browsing past moves
    let historyView = null;    // Temporary chess.js instance used for history view

    // Callbacks
    let onMove = null;
    let onGameOver = null;
    let onStateChange = null;

    /**
     * Initialize a new game
     */
    function init(config = {}) {
        game = new Chess();
        mode = config.mode || 'pvp';
        rotateBoard = config.rotateBoard || false;
        playerColor = config.playerColor || 'w';
        moveHistory = [];
        isGameOver = false;

        onMove = config.onMove || (() => { });
        onGameOver = config.onGameOver || (() => { });
        onStateChange = config.onStateChange || (() => { });

        onStateChange(getState());
        return getState();
    }

    /**
     * Attempt to make a move
     * @param {string} from - source square (e.g. 'e2')
     * @param {string} to - target square (e.g. 'e4')
     * @param {string} promotion - promotion piece ('q', 'r', 'b', 'n')
     * @returns {object|null} move result or null if invalid
     */
    function makeMove(from, to, promotion) {
        if (isGameOver) return null;

        // Check if promotion is needed
        if (isPromotionMove(from, to) && !promotion) {
            return { needsPromotion: true, from, to };
        }

        const moveObj = {
            from: from,
            to: to,
            promotion: promotion || undefined
        };

        const result = game.move(moveObj);

        if (result) {
            // Update history
            updateMoveHistory(result);
            fullSANHistory = game.history();

            // Check game state
            const state = getState();
            onMove(result, state);

            if (state.isGameOver) {
                isGameOver = true;
                onGameOver(state);
            }

            return result;
        }

        return null;
    }

    /**
     * Check if a move is a pawn promotion
     */
    function isPromotionMove(from, to) {
        const piece = game.get(from);
        if (!piece || piece.type !== 'p') return false;

        const toRank = to.charAt(1);
        if (piece.color === 'w' && toRank === '8') return true;
        if (piece.color === 'b' && toRank === '1') return true;

        return false;
    }

    /**
     * Get legal moves from a square
     * @param {string} square - square name (e.g. 'e2')
     * @returns {Array} chess.js move objects
     */
    function getLegalMoves(square) {
        if (isGameOver) return [];
        return game.moves({ square: square, verbose: true });
    }

    /**
     * Undo the last move (or last 2 for AI mode)
     */
    function undo() {
        if (mode === 'ai') {
            // Undo both AI and player move
            game.undo();
            game.undo();
        } else {
            game.undo();
        }

        // Rebuild move history
        rebuildMoveHistory();
        isGameOver = false;
        onStateChange(getState());
        return getState();
    }

    /**
     * Get the current game state
     */
    function getState() {
        return {
            board: game.board(),
            turn: game.turn(),
            isCheck: game.in_check(),
            isCheckmate: game.in_checkmate(),
            isStalemate: game.in_stalemate(),
            isDraw: game.in_draw(),
            isThreefold: game.in_threefold_repetition(),
            isInsufficient: game.insufficient_material(),
            isGameOver: game.game_over(),
            fen: game.fen(),
            pgn: game.pgn(),
            moveHistory: moveHistory,
            mode: mode,
            rotateBoard: rotateBoard,
            moveCount: game.history().length
        };
    }

    /**
     * Get the square of the king in check
     */
    function getKingSquare(color) {
        const board = game.board();
        for (let r = 0; r < 8; r++) {
            for (let f = 0; f < 8; f++) {
                const piece = board[r][f];
                if (piece && piece.type === 'k' && piece.color === color) {
                    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
                    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
                    return files[f] + ranks[r];
                }
            }
        }
        return null;
    }

    /**
     * Update move history from a move result
     */
    function updateMoveHistory(moveResult) {
        const historyArr = game.history();
        const moveNum = Math.ceil(historyArr.length / 2);

        if (historyArr.length % 2 === 1) {
            // White's move
            moveHistory.push({
                number: moveNum,
                white: moveResult.san,
                black: null
            });
        } else {
            // Black's move
            if (moveHistory.length > 0) {
                moveHistory[moveHistory.length - 1].black = moveResult.san;
            }
        }
    }

    /**
     * Rebuild move history from scratch (after undo)
     */
    function rebuildMoveHistory() {
        const historyArr = game.history();
        fullSANHistory = [...historyArr];
        moveHistory = [];

        for (let i = 0; i < historyArr.length; i++) {
            const moveNum = Math.floor(i / 2) + 1;
            if (i % 2 === 0) {
                moveHistory.push({
                    number: moveNum,
                    white: historyArr[i],
                    black: null
                });
            } else {
                moveHistory[moveHistory.length - 1].black = historyArr[i];
            }
        }
    }

    /**
     * Navigate to a specific half-move index (0-based)
     * @param {number} halfMoveIdx - 0 = after first white move, 1 = after first black move, etc.
     * @returns {object} state of the board at that point
     */
    function navigateToMove(halfMoveIdx) {
        const movesToPlay = fullSANHistory.slice(0, halfMoveIdx + 1);
        historyView = new Chess();
        for (const san of movesToPlay) {
            historyView.move(san);
        }
        historyMode = true;
        return getHistoryState();
    }

    /**
     * Exit history mode back to live game
     */
    function exitHistoryMode() {
        historyMode = false;
        historyView = null;
    }

    /**
     * Get the current history-view state
     */
    function getHistoryState() {
        if (!historyView) return getState();
        return {
            board: historyView.board(),
            turn: historyView.turn(),
            isCheck: historyView.in_check(),
            isCheckmate: false,
            isStalemate: false,
            isDraw: false,
            isThreefold: false,
            isInsufficient: false,
            isGameOver: false,
            fen: historyView.fen(),
            pgn: historyView.pgn(),
            moveHistory: moveHistory,
            mode: mode,
            rotateBoard: rotateBoard,
            moveCount: historyView.history().length
        };
    }

    /**
     * Get the full raw SAN history (for replaying)
     */
    function getFullMoveHistory() {
        return [...fullSANHistory];
    }

    /**
     * Whether we are in history browsing mode
     */
    function isInHistoryMode() {
        return historyMode;
    }

    /**
     * Check if it's the human player's turn (relevant for AI mode)
     */
    function isPlayerTurn() {
        if (mode !== 'ai') return true;
        return game.turn() === playerColor;
    }

    /**
     * Set board rotation option
     */
    function setRotation(enabled) {
        rotateBoard = enabled;
    }

    /**
     * Get the current mode
     */
    function getMode() {
        return mode;
    }

    /**
     * Get whether board rotation is enabled
     */
    function shouldRotate() {
        return rotateBoard && mode === 'pvp';
    }

    /**
     * Reset to a new game
     */
    function reset() {
        return init({ mode, rotateBoard, playerColor, onMove, onGameOver, onStateChange });
    }

    /**
     * Load a FEN position
     * TODO: Used for board evaluation mode
     */
    function loadFEN(fen) {
        const valid = game.load(fen);
        if (valid) {
            rebuildMoveHistory();
            isGameOver = game.game_over();
            onStateChange(getState());
        }
        return valid;
    }

    // Public API
    return {
        init,
        makeMove,
        getLegalMoves,
        undo,
        getState,
        getHistoryState,
        getKingSquare,
        isPlayerTurn,
        isPromotionMove,
        setRotation,
        getMode,
        shouldRotate,
        reset,
        loadFEN,
        navigateToMove,
        exitHistoryMode,
        isInHistoryMode,
        getFullMoveHistory
    };
})();
