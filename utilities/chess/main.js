/**
 * main.js — Chess Application Entry Point (Phase 2)
 *
 * Orchestrates ChessUI, ChessBoard, ChessGame, ChessAI together.
 * Handles:
 * - Game initialization (PvP, AI)
 * - Move execution + AI move triggering
 * - Screen transitions
 * - History-mode navigation
 * - Game-over detection and overlay
 * - Hint computation
 * - Undo, resign, flip, rotation
 * - Eval bar live updates
 */

(function () {
    'use strict';

    let gameMode = null;     // 'pvp' | 'ai'
    let selectedBot = null;  // bot id string
    let playerColor = 'w';
    let aiIsThinking = false;
    let historyViewIdx = -1; // current history browse index

    /* ===================== INIT ===================== */
    function init() {
        ChessBoard.init({
            onSquareClick: handleSquareClick,
            onPieceDrop: handlePieceDrop
        });

        ChessUI.init({
            onModeSelect: handleModeSelect,
            onBotSelect: handleBotSelect,
            onBackToMenu: handleBackToMenu,
            onNewGame: handleNewGame,
            onUndo: handleUndo,
            onFlip: handleFlip,
            onResign: handleResign,
            onHint: handleHint,
            onRotationToggle: handleRotationToggle,
            onMoveClick: handleMoveClick,
            onHistoryBack: handleHistoryBack,
            onVoiceInput: handleVoiceInput,
            onTextInput: handleTextInput,
            onReadHistory: handleReadHistory
        });

        ChessAI.setOnEvaluationUpdate((score, mate, depth) => {
            ChessUI.updateEvalBar(score, mate);
        });
    }

    /* ===================== MODE SELECTION ===================== */
    function handleModeSelect(mode) {
        if (mode === 'pvp') {
            gameMode = 'pvp';
            startPvPGame();
        }
    }

    function handleBotSelect(botId) {
        selectedBot = botId;
        startAIGame(botId);
    }

    function startPvPGame() {
        ChessUI.showScreen('game');
        ChessUI.showRotationToggle(true);
        ChessUI.showEvalBar(false);
        ChessUI.hideGameOver();

        ChessGame.init({
            mode: 'pvp',
            onMove: handleMove,
            onGameOver: handleGameOver,
            onStateChange: renderFullState
        });

        ChessBoard.flipBoard(false);
        ChessUI.toggleBlindMode(ChessUI.isBlindModeDefault());
        ChessUI.toggleScoreBar(ChessUI.isScoreBarDefault());
        renderFullState(ChessGame.getState());
    }

    async function startAIGame(botId) {
        ChessUI.showScreen('game');
        ChessUI.showRotationToggle(false);
        ChessUI.showEvalBar(true);
        ChessUI.hideGameOver();

        const bot = ChessAI.getBotById(botId);
        ChessUI.setCurrentBot(bot);

        ChessAI.selectBot(botId);
        ChessBoard.flipBoard(false);

        ChessGame.init({
            mode: 'ai',
            playerColor: 'w',
            onMove: handleMove,
            onGameOver: handleGameOver,
            onStateChange: renderFullState
        });

        ChessUI.toggleBlindMode(ChessUI.isBlindModeDefault());
        ChessUI.toggleScoreBar(ChessUI.isScoreBarDefault());
        renderFullState(ChessGame.getState());

        // Init engine in background
        ChessUI.showEngineLoading(true);
        await ChessAI.init();
        ChessUI.showEngineLoading(false);
    }

    /* ===================== SQUARE / MOVE HANDLING ===================== */
    let selectedSquare = null;

    function handleSquareClick(sqName) {
        // Ignore input while in history mode or AI is thinking
        if (ChessGame.isInHistoryMode()) return;
        if (aiIsThinking) return;

        const state = ChessGame.getState();
        if (state.isGameOver) return;
        if (!ChessGame.isPlayerTurn()) return;

        if (!selectedSquare) {
            // Select piece
            const legalMoves = ChessGame.getLegalMoves(sqName);
            if (legalMoves.length > 0) {
                selectedSquare = sqName;
                ChessBoard.setSelected(sqName);
                ChessBoard.showLegalMoves(legalMoves);
            }
        } else {
            if (sqName === selectedSquare) {
                // Deselect
                deselect();
                return;
            }
            // Try move
            attemptMove(selectedSquare, sqName);
        }
    }

    function handlePieceDrop(from, to) {
        if (ChessGame.isInHistoryMode()) return;
        if (aiIsThinking || !ChessGame.isPlayerTurn()) return;
        attemptMove(from, to);
    }

    async function attemptMove(from, to) {
        deselect();

        const moveResult = ChessGame.makeMove(from, to);
        if (!moveResult) return;

        // Pawn promotion
        if (moveResult.needsPromotion) {
            const state = ChessGame.getState();
            const turn = state.turn;
            const promotion = await ChessUI.showPromotionDialog(turn);
            ChessGame.makeMove(from, to, promotion);
        }
    }

    function deselect() {
        selectedSquare = null;
        ChessBoard.setSelected(null);
        ChessBoard.showLegalMoves([]);
    }

    /* ===================== BLIND INPUT HANDLING ===================== */
    function handleVoiceInput(transcript) {
        if (!transcript) return;
        const moveStr = parseVoiceMove(transcript);
        if (moveStr) {
            executeParsedMove(moveStr);
        } else {
            console.warn("Could not understand move:", transcript);
            ChessUI.readOutLoud(ChessI18n.t('move_not_understood') || "I didn't catch that");
        }
    }

    function handleTextInput(pieceId, squareOrMove) {
        if (!squareOrMove) return;

        // If user typed a full move rather than just a destination square
        const inputStr = pieceId + squareOrMove;
        executeParsedMove(inputStr);
    }

    function executeParsedMove(sanAttempt) {
        if (ChessGame.isInHistoryMode() || aiIsThinking || !ChessGame.isPlayerTurn() || ChessGame.getState().isGameOver) return;

        const legalMoves = ChessGame.getAllLegalMoves();
        let attemptedLower = sanAttempt.toLowerCase().replace(/\s+/g, '').replace(/[-_]/g, '');

        // Translate French typed text like 'cf3' (cavalier) -> 'nf3'
        // f (fou) -> b, t (tour) -> r, d (dame) -> q. 
        attemptedLower = attemptedLower.replace(/^c([a-h][1-8])/, 'n$1')
            .replace(/^c(x[a-h][1-8])/, 'n$1')
            .replace(/^f([a-h][1-8])/, 'b$1')
            .replace(/^f(x[a-h][1-8])/, 'b$1')
            .replace(/^t([a-h][1-8])/, 'r$1')
            .replace(/^d([a-h][1-8])/, 'q$1');

        // Roi vs Rook ambiguity: if it's "cf3", 'c' is replaced. 're4' could be Rook e4 or Roi e4 (K).
        let alternateKingLower = attemptedLower.replace(/^r([a-h][1-8])/, 'k$1')
            .replace(/^r(x[a-h][1-8])/, 'k$1');

        let matchedMove = null;
        for (const move of legalMoves) {
            const sanLower = move.san.toLowerCase().replace(/[\+#]/g, '');
            const fromTo = move.from + move.to; // e.g. "e2e4"

            if (sanLower === attemptedLower || sanLower === alternateKingLower) {
                matchedMove = move;
                break;
            }
            if (fromTo === attemptedLower) {
                matchedMove = move;
                break;
            }
            // fallback: e.g. "nf3" vs "nxf3"
            if (sanLower.replace('x', '') === attemptedLower.replace('x', '') ||
                sanLower.replace('x', '') === alternateKingLower.replace('x', '')) {
                matchedMove = move;
                if (sanLower.includes('x')) break; // Prefer capture if it exists
            }
        }

        if (matchedMove) {
            attemptMove(matchedMove.from, matchedMove.to);
        } else {
            ChessUI.readOutLoud(ChessI18n.t('invalid_move') || "Invalid move");
        }
    }

    function parseVoiceMove(text) {
        let parsed = text.toLowerCase()
            // EN Words
            .replace(/knight/g, 'N')
            .replace(/night/g, 'N')
            .replace(/bishop/g, 'B')
            .replace(/rook/g, 'R')
            .replace(/queen/g, 'Q')
            .replace(/king/g, 'K')
            .replace(/takes/g, 'x')
            .replace(/two/g, '2')
            .replace(/to/g, '')
            // FR Words
            .replace(/cavalier/g, 'N')
            .replace(/cheval/g, 'N')
            .replace(/fou/g, 'B')
            .replace(/tour/g, 'R')
            .replace(/dame/g, 'Q')
            .replace(/reine/g, 'Q')
            .replace(/roi/g, 'K')
            .replace(/prend/g, 'x')
            .replace(/prends/g, 'x')
            .replace(/sur/g, '')
            .replace(/en/g, '')
            .replace(/à/g, '')
            .replace(/a/g, 'a') // keep 'a' for coordinate
            // FR Letters (e.g. Dictation might say "bé 4" for "b4")
            .replace(/bé/g, 'b')
            .replace(/cé/g, 'c')
            .replace(/dé/g, 'd')
            .replace(/\s+/g, '');

        return parsed;
    }

    function handleReadHistory() {
        const history = ChessGame.getFullMoveHistory();
        if (history.length === 0) return;

        const textToRead = history.map((move, i) => {
            const moveNum = Math.floor(i / 2) + 1;
            const turn = i % 2 === 0 ? "White" : "Black";
            return `${moveNum}, ${turn}, ${move}`;
        }).join(". ");

        ChessUI.readOutLoud(textToRead);
    }

    /* ===================== MOVE / GAME OVER CALLBACKS ===================== */
    async function handleMove(result, state) {
        // Stop hint display on move
        ChessBoard.clearHighlights('hint-move');
        ChessBoard.clearHighlights('hint-from');

        renderFullState(state);

        // AI response
        if (!state.isGameOver && state.mode === 'ai' && !ChessGame.isPlayerTurn()) {
            await triggerAIMove();
        }
    }

    function handleGameOver(state) {
        ChessUI.updateStatus(state);
        ChessUI.showGameOver(state);
    }

    /* ===================== AI MOVE ===================== */
    async function triggerAIMove() {
        if (aiIsThinking) return;
        aiIsThinking = true;
        ChessUI.showThinking(true);

        const state = ChessGame.getState();
        const aiMove = await ChessAI.getBestMove(state.fen);

        ChessUI.showThinking(false);
        aiIsThinking = false;

        if (!aiMove) return;

        // Animate AI move
        await ChessBoard.animateMove(aiMove.from, aiMove.to);
        const result = ChessGame.makeMove(aiMove.from, aiMove.to, aiMove.promotion);

        // Dictate move if in blind mode
        if (result && result.san) {
            ChessUI.updateBlindLastMove(result.san);
            ChessUI.readOutLoud(result.san);
        }
    }

    /* ===================== RENDER ===================== */
    function renderFullState(state) {
        if (!state) return;

        // Exec in history mode if active
        const activeState = ChessGame.isInHistoryMode()
            ? ChessGame.getHistoryState()
            : state;

        ChessBoard.updatePosition(activeState.board);

        // Clear old check highlight
        ChessBoard.clearHighlights('in-check');
        if (activeState.isCheck) {
            const kingSq = ChessGame.getKingSquare(activeState.turn);
            ChessBoard.showCheck(kingSq);
        }

        ChessUI.updateStatus(activeState);
        ChessUI.updatePlayerBars(activeState);
        ChessUI.updateMoveHistory(state.moveHistory, historyViewIdx);

        // Update blind mode last move text
        const histLength = state.moveHistory.length;
        if (histLength > 0 && !activeState.isGameOver) {
            const lastRound = state.moveHistory[histLength - 1];
            const lastMoveSAN = lastRound.black || lastRound.white || '--';
            ChessUI.updateBlindLastMove(lastMoveSAN);
        }

        // Flip board for PvP if rotation enabled
        if (state.mode === 'pvp' && state.rotateBoard) {
            const shouldFlip = state.turn === 'b';
            if (ChessBoard.isFlipped() !== shouldFlip) {
                ChessBoard.flipBoard(shouldFlip);
            }
        }
    }

    /* ===================== HISTORY NAVIGATION ===================== */
    function handleMoveClick(halfMoveIdx) {
        const history = ChessGame.getFullMoveHistory();
        if (halfMoveIdx < 0 || halfMoveIdx >= history.length) return;

        historyViewIdx = halfMoveIdx;
        const viewState = ChessGame.navigateToMove(halfMoveIdx);

        ChessBoard.updatePosition(viewState.board);
        ChessBoard.clearAllHighlights();

        if (viewState.isCheck) {
            const kingSq = ChessGame.getKingSquare(viewState.turn);
            ChessBoard.showCheck(kingSq);
        }

        const liveState = ChessGame.getState();
        ChessUI.updateMoveHistory(liveState.moveHistory, historyViewIdx);
        ChessUI.setHistoryMode(true, halfMoveIdx);
    }

    function handleHistoryBack() {
        historyViewIdx = -1;
        ChessGame.exitHistoryMode();
        ChessUI.setHistoryMode(false);

        const state = ChessGame.getState();
        renderFullState(state);
    }

    /* ===================== CONTROLS ===================== */
    function handleBackToMenu() {
        ChessGame.exitHistoryMode();
        historyViewIdx = -1;
        ChessUI.setHistoryMode(false);
        ChessUI.hideGameOver();
        ChessAI.stopThinking();
        ChessUI.showScreen('menu');
    }

    function handleNewGame() {
        historyViewIdx = -1;
        ChessGame.exitHistoryMode();
        ChessUI.setHistoryMode(false);
        ChessUI.hideGameOver();

        if (gameMode === 'pvp') {
            ChessGame.reset();
            renderFullState(ChessGame.getState());
        } else if (gameMode === 'ai' && selectedBot) {
            startAIGame(selectedBot);
        }
    }

    function handleUndo() {
        if (ChessGame.isInHistoryMode()) {
            handleHistoryBack();
            return;
        }
        aiIsThinking = false;
        ChessAI.stopThinking();
        ChessGame.undo();
    }

    function handleFlip() {
        const newFlipped = ChessBoard.flipBoard();
        const state = ChessGame.isInHistoryMode()
            ? ChessGame.getHistoryState()
            : ChessGame.getState();
        ChessUI.updatePlayerBars(state);
    }

    function handleResign() {
        if (ChessGame.isInHistoryMode()) return;
        const state = ChessGame.getState();
        if (state.isGameOver) return;

        ChessUI.showGameOver({ ...state, resigned: true });
    }

    async function handleHint() {
        if (ChessGame.isInHistoryMode()) return;
        const state = ChessGame.getState();
        if (state.isGameOver || !ChessGame.isPlayerTurn()) return;

        ChessUI.showHintLoading(true);
        try {
            const result = await ChessAI.evaluatePosition(state.fen, 15);
            if (result && result.bestLine && result.bestLine.length >= 1) {
                const move = result.bestLine[0];
                if (move && move.length >= 4) {
                    ChessUI.showHint(move.substring(0, 2), move.substring(2, 4));
                }
            }
        } finally {
            ChessUI.showHintLoading(false);
        }
    }

    function handleRotationToggle(checked) {
        ChessGame.setRotation(checked);
        const state = ChessGame.getState();
        if (!checked) ChessBoard.flipBoard(false);
        renderFullState(state);
    }

    /* ===================== START ===================== */
    document.addEventListener('DOMContentLoaded', init);
})();
