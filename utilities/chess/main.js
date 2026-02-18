/**
 * main.js — Chess Utility Entry Point
 * 
 * Wires together:
 * - ChessBoard (board.js) — rendering
 * - ChessGame (game.js) — game logic
 * - ChessAI (ai.js) — AI opponent
 * - ChessUI (ui.js) — UI controls
 */

(function () {
    'use strict';

    let selectedSquare = null;
    let isEvaluationEnabled = true;

    /**
     * Initialize everything on DOM ready
     */
    document.addEventListener('DOMContentLoaded', () => {
        // Initialize UI
        ChessUI.init({
            onModeSelect: startGame,
            onBotSelect: startAIGame,
            onBackToMenu: backToMenu,
            onNewGame: newGame,
            onUndo: undoMove,
            onFlip: flipBoard,
            onResign: resign,
            onRotationToggle: toggleRotation,
            onHint: handleHint,
            onMoveClick: handleMoveClick
        });

        // Setup AI evaluation callback
        ChessAI.setOnEvaluationUpdate(handleEvaluationUpdate);
    });

    /**
     * Start a game with the selected mode
     */
    function startGame(mode) {
        selectedSquare = null;

        // Initialize game logic
        ChessGame.init({
            mode: mode,
            rotateBoard: false,
            playerColor: 'w',
            onMove: handleMove,
            onGameOver: handleGameOver,
            onStateChange: handleStateChange
        });

        startBoard();

        // Show rotation toggle only for PvP
        ChessUI.showRotationToggle(mode === 'pvp');

        // Hide AI indicators
        ChessUI.showThinking(false);
        ChessUI.showEngineLoading(false);
        ChessUI.showEvalBar(false);

        // Transition to game screen
        ChessUI.showScreen('game');

        // Render initial position
        renderFullState();
    }

    /**
     * Start an AI game (called from bot selector)
     */
    async function startAIGame(botId) {
        selectedSquare = null;

        // Select the bot
        ChessAI.selectBot(botId);
        const bot = ChessAI.getCurrentBot();

        // Tell UI about the bot for player bar labels
        ChessUI.setCurrentBot(bot);

        // Initialize game in AI mode
        ChessGame.init({
            mode: 'ai',
            rotateBoard: false,
            playerColor: 'w',
            onMove: handleMove,
            onGameOver: handleGameOver,
            onStateChange: handleStateChange
        });

        startBoard();

        // Hide rotation toggle for AI mode
        ChessUI.showRotationToggle(false);

        // Show Eval bar (starts at 50% neutral)
        ChessUI.showEvalBar(true);
        ChessUI.updateEvalBar(0, null); // Reset

        // Transition to game screen
        ChessUI.showScreen('game');
        renderFullState();

        // Initialize Stockfish engine
        ChessUI.showEngineLoading(true);
        const success = await ChessAI.init();
        ChessUI.showEngineLoading(false);

        if (success) {
            console.log('Stockfish engine ready');
            // Trigger initial evaluation
            triggerEvaluation();
        } else {
            console.warn('Stockfish failed to load — using random moves fallback');
        }
    }

    /* Common board init */
    function startBoard() {
        ChessBoard.init({
            onSquareClick: handleSquareClick,
            onPieceDrop: handlePieceDrop,
            flipped: false
        });
    }

    /**
     * Handle square click (select piece or make move)
     */
    function handleSquareClick(sqName) {
        if (!ChessGame.isPlayerTurn()) return;

        const state = ChessGame.getState();
        if (state.isGameOver) return;

        if (selectedSquare) {
            // If clicking the same square, deselect
            if (sqName === selectedSquare) {
                deselectPiece();
                return;
            }

            // Try to make a move
            attemptMove(selectedSquare, sqName);
        } else {
            // Select a piece
            selectPiece(sqName);
        }
    }

    /**
     * Handle drag & drop
     */
    function handlePieceDrop(from, to) {
        if (!ChessGame.isPlayerTurn()) return;

        const state = ChessGame.getState();
        if (state.isGameOver) return;

        // Clear any selection
        deselectPiece();

        // Make move directly (animation handled by drag)
        const result = ChessGame.makeMove(from, to);
        if (result) {
            if (result.needsPromotion) {
                handlePromotion(from, to, result.color);
            } else {
                renderFullState();
                postMoveActions(result);
            }
        } else {
            // Invalid move -> snap back
            renderFullState();
        }
    }

    /**
     * Select a piece and show its legal moves
     */
    function selectPiece(sqName) {
        const moves = ChessGame.getLegalMoves(sqName);
        if (moves.length === 0) return;

        selectedSquare = sqName;
        ChessBoard.setSelected(sqName);
        ChessBoard.showLegalMoves(moves);
    }

    /**
     * Deselect current piece
     */
    function deselectPiece() {
        selectedSquare = null;
        ChessBoard.setSelected(null);
        ChessBoard.showLegalMoves([]);
    }

    /**
     * Attempt a move, handling promotion if needed
     */
    async function attemptMove(from, to) {
        const moves = ChessGame.getLegalMoves(from);
        const isValid = moves.some(m => m.to === to);

        if (!isValid) {
            deselectPiece();
            selectPiece(to);
            return;
        }

        // Animate move for click-click
        await ChessBoard.animateMove(from, to);

        const result = ChessGame.makeMove(from, to);

        if (result.needsPromotion) {
            handlePromotion(from, to, result.color);
            return;
        }

        // Move succeeded
        deselectPiece();
        renderFullState();
        postMoveActions(result);
    }

    async function handlePromotion(from, to, color) {
        // Show promotion dialog
        const piece = await ChessUI.showPromotionDialog(color);
        const promoResult = ChessGame.makeMove(from, to, piece);
        if (promoResult) {
            deselectPiece();
            renderFullState();
            postMoveActions(promoResult);
        } else {
            renderFullState(); // Cancelled
        }
    }

    /**
     * Actions after a successful move
     */
    async function postMoveActions(moveResult) {
        ChessUI.clearHint();

        // Board rotation for PvP rotate mode
        if (ChessGame.shouldRotate()) {
            const state = ChessGame.getState();
            const shouldFlip = state.turn === 'b';
            setTimeout(() => {
                ChessUI.animateBoardRotation(shouldFlip);
            }, 300);
        }

        // AI move for AI mode
        if (ChessGame.getMode() === 'ai') {
            if (!ChessGame.isPlayerTurn()) {
                await makeAIMove();
            } else {
                // Player just moved. Trigger eval for the new position
                triggerEvaluation();
            }
        }
    }

    async function makeAIMove() {
        const state = ChessGame.getState();
        if (state.isGameOver) return;

        // Show thinking indicator
        ChessUI.showThinking(true);

        const aiMove = await ChessAI.getBestMove(state.fen);

        // Hide thinking indicator
        ChessUI.showThinking(false);

        if (aiMove) {
            // Animate AI move
            await ChessBoard.animateMove(aiMove.from, aiMove.to);

            // Apply move
            ChessGame.makeMove(aiMove.from, aiMove.to, aiMove.promotion);
            renderFullState();

            // Trigger eval for the new position (Human turn)
            triggerEvaluation();
        }
    }

    /**
     * Provide a hint (with loading indicator)
     */
    async function handleHint() {
        if (!ChessGame.isPlayerTurn()) return;

        const state = ChessGame.getState();
        if (state.isGameOver) return;

        // Show loading spinner on hint button
        ChessUI.showHintLoading(true);

        try {
            const result = await ChessAI.evaluatePosition(state.fen, 15);

            if (result.bestLine && result.bestLine.length > 0) {
                const bestMove = result.bestLine[0]; // e.g., "e2e4"
                const from = bestMove.substring(0, 2);
                const to = bestMove.substring(2, 4);
                ChessUI.showHint(from, to);
            }
        } finally {
            // Always hide loading, even on error
            ChessUI.showHintLoading(false);
        }
    }

    /**
     * Handle clicking a move in the history panel
     */
    function handleMoveClick(halfMoveIndex) {
        // Highlight the clicked move visually
        const moveNotations = document.querySelectorAll('.move-notation');
        moveNotations.forEach((el, idx) => {
            el.classList.toggle('current', idx === halfMoveIndex);
        });
    }

    /**
     * Trigger board evaluation
     */
    function triggerEvaluation() {
        if (isEvaluationEnabled && ChessGame.getMode() === 'ai') {
            const state = ChessGame.getState();
            if (!state.isGameOver) {
                // Run a quick eval
                ChessAI.evaluatePosition(state.fen, 12);
            }
        }
    }

    /**
     * Handle eval update from AI
     */
    function handleEvaluationUpdate(score, mate, depth) {
        ChessUI.updateEvalBar(score, mate);
    }

    /**
     * Handle move callback from game
     */
    function handleMove(moveResult, state) {
        // Sound effects, etc.
    }

    /**
     * Handle game over
     */
    function handleGameOver(state) {
        // TODO: Show game over overlay/modal
    }

    /**
     * Handle state change
     */
    function handleStateChange(state) {
        // Could be used for live updates
    }

    /**
     * Render the full board state (position + highlights + UI)
     */
    function renderFullState() {
        const state = ChessGame.getState();

        // Update board pieces (diff-based, no flicker)
        ChessBoard.updatePosition(state.board);

        // Always clear check highlight before re-evaluating
        ChessBoard.clearHighlights('in-check');

        // Show check highlight only if currently in check
        if (state.isCheck) {
            const kingSq = ChessGame.getKingSquare(state.turn);
            ChessBoard.showCheck(kingSq);
        }

        // Update UI
        ChessUI.updatePlayerBars(state);
        ChessUI.updateMoveHistory(state.moveHistory);
        ChessUI.updateStatus(state);
    }

    /**
     * Back to menu
     */
    function backToMenu() {
        deselectPiece();
        ChessBoard.clearAllHighlights();
        ChessUI.clearHint();
        // Stop AI if thinking
        if (ChessAI.isAIThinking()) {
            ChessAI.stopThinking();
        }
        ChessUI.showThinking(false);
        ChessUI.showEngineLoading(false);
        ChessUI.showEvalBar(false);
        // Clear bot info
        ChessUI.setCurrentBot(null);
        // Destroy engine when leaving
        ChessAI.destroy();
        ChessUI.showScreen('menu');
    }

    /**
     * New game (same mode)
     */
    function newGame() {
        selectedSquare = null;
        // Stop AI if thinking
        if (ChessAI.isAIThinking()) {
            ChessAI.stopThinking();
        }
        ChessUI.showThinking(false);
        ChessUI.clearHint();
        const state = ChessGame.reset();
        ChessBoard.clearAllHighlights();
        ChessBoard.flipBoard(false);
        renderFullState();

        if (ChessGame.getMode() === 'ai') {
            ChessUI.updateEvalBar(0, null);
            triggerEvaluation();
        }
    }

    /**
     * Undo last move
     */
    function undoMove() {
        // Stop AI if thinking
        if (ChessAI.isAIThinking()) {
            ChessAI.stopThinking();
        }
        ChessUI.showThinking(false);
        ChessUI.clearHint();
        selectedSquare = null;
        ChessGame.undo();
        ChessBoard.clearAllHighlights();
        renderFullState();

        if (ChessGame.getMode() === 'ai') {
            triggerEvaluation();
        }
    }

    /**
     * Flip the board
     */
    function flipBoard() {
        const isFlipped = ChessBoard.flipBoard();
        // Also flip eval bar
        const evalBar = document.getElementById('eval-bar-container');
        if (evalBar) {
            evalBar.classList.toggle('flipped', isFlipped);
        }
        renderFullState();
    }

    /**
     * Toggle board rotation for PvP
     */
    function toggleRotation(enabled) {
        ChessGame.setRotation(enabled);
    }

    /**
     * Resign current game
     */
    function resign() {
        const state = ChessGame.getState();
        if (!state.isGameOver) {
            const winner = state.turn === 'w' ? 'Black' : 'White';
            const statusEl = document.getElementById('game-status');
            statusEl.textContent = `${state.turn === 'w' ? 'White' : 'Black'} resigns — ${winner} wins`;
            statusEl.classList.add('game-over');
        }
    }
})();
