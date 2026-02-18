/**
 * ui.js — Chess UI Manager
 * 
 * Handles:
 * - Screen transitions (menu ↔ bot select ↔ game ↔ evaluation)
 * - Bot roster rendering
 * - Player bar updates (with bot name/avatar)
 * - Move history rendering (clickable)
 * - Game status messages
 * - Control button handlers
 * - Promotion dialog
 * - AI thinking indicator + hint loading
 * - Engine loading indicator
 */

const ChessUI = (() => {
    let currentScreen = 'menu';
    let promotionCallback = null;
    let currentBotInfo = null; // Store selected bot info for player bars

    // DOM references
    const els = {};

    /**
     * Cache DOM references
     */
    function cacheDom() {
        els.menuScreen = document.getElementById('menu-screen');
        els.gameScreen = document.getElementById('game-screen');
        els.evalScreen = document.getElementById('eval-screen');
        els.diffScreen = document.getElementById('ai-difficulty-screen');

        els.playerTopName = document.getElementById('player-top-name');
        els.playerBottomName = document.getElementById('player-bottom-name');
        els.playerTopCaptures = document.getElementById('player-top-captures');
        els.playerBottomCaptures = document.getElementById('player-bottom-captures');
        els.playerBarTop = document.getElementById('player-bar-top');
        els.playerBarBottom = document.getElementById('player-bar-bottom');

        els.gameStatus = document.getElementById('game-status');
        els.moveList = document.getElementById('move-list');
        els.boardWrapper = document.querySelector('.board-wrapper');

        els.rotationToggle = document.getElementById('toggle-rotation');
        els.rotationContainer = document.getElementById('rotation-toggle-container');

        // AI indicators
        els.aiThinking = document.getElementById('ai-thinking');
        els.engineLoading = document.getElementById('engine-loading');

        // Control buttons
        els.btnBackMenu = document.getElementById('btn-back-menu');
        els.btnNewGame = document.getElementById('btn-new-game');
        els.btnUndo = document.getElementById('btn-undo');
        els.btnFlip = document.getElementById('btn-flip');
        els.btnResign = document.getElementById('btn-resign');
        els.btnHint = document.getElementById('btn-hint');

        // Eval bar
        els.evalBarContainer = document.getElementById('eval-bar-container');
        els.evalBarFill = document.getElementById('eval-bar-fill');

        // Menu buttons
        els.modePvp = document.getElementById('mode-pvp');
        els.modeAi = document.getElementById('mode-ai');
        els.modeEval = document.getElementById('mode-eval');
        els.modeVariants = document.getElementById('mode-variants');

        // Bot roster container
        els.botRoster = document.getElementById('bot-roster');

        // Difficulty screen back
        els.btnDiffBack = document.getElementById('btn-diff-back');

        // Eval screen
        els.btnEvalBack = document.getElementById('btn-eval-back');
    }

    /**
     * Initialize UI
     */
    function init(config = {}) {
        cacheDom();

        // Menu mode selection handlers
        els.modePvp.addEventListener('click', () => {
            if (config.onModeSelect) config.onModeSelect('pvp');
        });

        els.modeAi.addEventListener('click', () => {
            // Show bot selector and render roster
            renderBotRoster(config.onBotSelect);
            showScreen('difficulty');
        });

        els.modeEval.addEventListener('click', () => {
            showScreen('eval');
        });

        els.btnDiffBack.addEventListener('click', () => {
            showScreen('menu');
        });

        // Eval screen back button
        els.btnEvalBack.addEventListener('click', () => {
            showScreen('menu');
        });

        // Game control handlers
        els.btnBackMenu.addEventListener('click', () => {
            if (config.onBackToMenu) config.onBackToMenu();
        });

        els.btnNewGame.addEventListener('click', () => {
            if (config.onNewGame) config.onNewGame();
        });

        els.btnUndo.addEventListener('click', () => {
            if (config.onUndo) config.onUndo();
        });

        els.btnFlip.addEventListener('click', () => {
            if (config.onFlip) config.onFlip();
        });

        els.btnResign.addEventListener('click', () => {
            if (config.onResign) config.onResign();
        });

        els.btnHint.addEventListener('click', () => {
            if (config.onHint) config.onHint();
        });

        // Rotation toggle
        els.rotationToggle.addEventListener('change', (e) => {
            if (config.onRotationToggle) config.onRotationToggle(e.target.checked);
        });

        // Store move click handler
        _onMoveClick = config.onMoveClick || null;

        // Create promotion overlay
        createPromotionDialog();
    }

    // Private ref for move click callback
    let _onMoveClick = null;

    /**
     * Render the bot roster cards dynamically
     */
    function renderBotRoster(onBotSelect) {
        if (!els.botRoster) return;
        els.botRoster.innerHTML = '';

        const bots = ChessAI.getAllBots();

        bots.forEach((bot, index) => {
            const card = document.createElement('button');
            card.className = 'bot-card';
            card.dataset.botId = bot.id;

            // Color gradient from green to red based on index
            const hue = 120 - (index / (bots.length - 1)) * 120; // 120 (green) -> 0 (red)

            card.innerHTML = `
                <div class="bot-avatar" style="background: hsl(${hue}, 65%, 45%);">${bot.avatar}</div>
                <div class="bot-info">
                    <div class="bot-name">${bot.name}</div>
                    <div class="bot-tagline">${bot.tagline}</div>
                </div>
                <div class="bot-elo" style="color: hsl(${hue}, 65%, 55%);">${bot.elo >= 3000 ? '3000+' : bot.elo}</div>
            `;

            card.addEventListener('click', () => {
                if (onBotSelect) onBotSelect(bot.id);
            });

            els.botRoster.appendChild(card);
        });
    }

    /**
     * Switch visible screen
     */
    function showScreen(screenName) {
        [els.menuScreen, els.gameScreen, els.evalScreen, els.diffScreen].forEach(s => {
            if (s) s.classList.remove('active');
        });

        currentScreen = screenName;

        switch (screenName) {
            case 'menu': els.menuScreen.classList.add('active'); break;
            case 'game': els.gameScreen.classList.add('active'); break;
            case 'eval': els.evalScreen.classList.add('active'); break;
            case 'difficulty': els.diffScreen.classList.add('active'); break;
        }
    }

    /**
     * Show/hide rotation toggle based on game mode
     */
    function showRotationToggle(show) {
        els.rotationContainer.style.display = show ? 'flex' : 'none';
    }

    /**
     * Set the current bot info for player bars
     */
    function setCurrentBot(bot) {
        currentBotInfo = bot;
    }

    /**
     * Update player bars
     */
    function updatePlayerBars(state) {
        const isWhiteTurn = state.turn === 'w';
        const flipped = ChessBoard.isFlipped();
        const isAI = state.mode === 'ai';

        // Set player labels (AI mode shows bot name for computer side)
        let bottomLabel = flipped ? 'Black' : 'White';
        let topLabel = flipped ? 'White' : 'Black';

        if (isAI && currentBotInfo) {
            const botLabel = `${currentBotInfo.avatar} ${currentBotInfo.name}`;
            if (!flipped) {
                topLabel = botLabel;
                bottomLabel = 'You (White)';
            } else {
                bottomLabel = botLabel;
                topLabel = 'You (White)';
            }
        } else if (isAI) {
            if (!flipped) {
                topLabel = 'AI (Black)';
                bottomLabel = 'You (White)';
            } else {
                bottomLabel = 'AI (Black)';
                topLabel = 'You (White)';
            }
        }

        els.playerBottomName.textContent = bottomLabel;
        els.playerTopName.textContent = topLabel;

        // Active turn highlight
        els.playerBarBottom.classList.toggle('active-turn',
            (flipped ? !isWhiteTurn : isWhiteTurn));
        els.playerBarTop.classList.toggle('active-turn',
            (flipped ? isWhiteTurn : !isWhiteTurn));
    }

    /**
     * Update move history panel (with clickable moves)
     */
    function updateMoveHistory(history) {
        els.moveList.innerHTML = '';

        history.forEach((entry, idx) => {
            const pair = document.createElement('span');
            pair.className = 'move-pair';

            const num = document.createElement('span');
            num.className = 'move-number';
            num.textContent = entry.number + '.';
            pair.appendChild(num);

            // White's move
            const white = document.createElement('span');
            white.className = 'move-notation';
            white.textContent = entry.white || '';
            const whiteMoveIdx = idx * 2; // 0-based half-move index
            white.addEventListener('click', () => {
                if (_onMoveClick) _onMoveClick(whiteMoveIdx);
            });
            if (entry.black === null && idx === history.length - 1) {
                white.classList.add('current');
            }
            pair.appendChild(white);

            // Black's move
            if (entry.black) {
                const black = document.createElement('span');
                black.className = 'move-notation';
                black.textContent = entry.black;
                const blackMoveIdx = idx * 2 + 1;
                black.addEventListener('click', () => {
                    if (_onMoveClick) _onMoveClick(blackMoveIdx);
                });
                if (idx === history.length - 1) {
                    black.classList.add('current');
                }
                pair.appendChild(black);
            }

            els.moveList.appendChild(pair);
        });

        // Auto-scroll to latest move
        els.moveList.scrollTop = els.moveList.scrollHeight;
    }

    /**
     * Update game status message
     */
    function updateStatus(state) {
        els.gameStatus.classList.remove('check', 'game-over');

        if (state.isCheckmate) {
            const winner = state.turn === 'w' ? 'Black' : 'White';
            els.gameStatus.textContent = `Checkmate! ${winner} wins`;
            els.gameStatus.classList.add('game-over');
        } else if (state.isStalemate) {
            els.gameStatus.textContent = 'Stalemate — Draw';
            els.gameStatus.classList.add('game-over');
        } else if (state.isDraw) {
            els.gameStatus.textContent = 'Draw';
            els.gameStatus.classList.add('game-over');
        } else if (state.isCheck) {
            els.gameStatus.textContent = 'Check!';
            els.gameStatus.classList.add('check');
        } else {
            const turnLabel = state.turn === 'w' ? 'White' : 'Black';
            els.gameStatus.textContent = `${turnLabel} to move`;
        }
    }

    /**
     * Create promotion dialog overlay
     */
    function createPromotionDialog() {
        const overlay = document.createElement('div');
        overlay.className = 'promotion-overlay';
        overlay.id = 'promotion-overlay';

        const dialog = document.createElement('div');
        dialog.className = 'promotion-dialog';

        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
    }

    /**
     * Show promotion dialog and return choice
     * @param {string} color - 'w' or 'b'
     * @returns {Promise<string>} - chosen piece type ('q', 'r', 'b', 'n')
     */
    function showPromotionDialog(color) {
        return new Promise((resolve) => {
            const overlay = document.getElementById('promotion-overlay');
            const dialog = overlay.querySelector('.promotion-dialog');
            dialog.innerHTML = '';

            const pieces = [
                { type: 'q', symbol: color === 'w' ? '♕' : '♛' },
                { type: 'r', symbol: color === 'w' ? '♖' : '♜' },
                { type: 'b', symbol: color === 'w' ? '♗' : '♝' },
                { type: 'n', symbol: color === 'w' ? '♘' : '♞' }
            ];

            pieces.forEach(p => {
                const btn = document.createElement('button');
                btn.className = 'promotion-piece';
                btn.textContent = p.symbol;
                btn.addEventListener('click', () => {
                    overlay.classList.remove('active');
                    resolve(p.type);
                });
                dialog.appendChild(btn);
            });

            overlay.classList.add('active');
        });
    }

    /**
     * Animate board rotation for PvP rotate mode
     */
    function animateBoardRotation(toFlipped) {
        if (!els.boardWrapper) return;

        const className = toFlipped ? 'rotating' : 'rotating-back';
        els.boardWrapper.classList.add(className);

        setTimeout(() => {
            els.boardWrapper.classList.remove(className);
            if (toFlipped) {
                els.boardWrapper.classList.add('rotated');
            } else {
                els.boardWrapper.classList.remove('rotated');
            }
        }, 600);
    }

    /**
     * Show/hide AI thinking indicator
     */
    function showThinking(show) {
        if (els.aiThinking) {
            els.aiThinking.style.display = show ? 'flex' : 'none';
        }
    }

    /**
     * Show/hide engine loading indicator
     */
    function showEngineLoading(show) {
        if (els.engineLoading) {
            els.engineLoading.style.display = show ? 'flex' : 'none';
        }
    }

    /**
     * Show/hide hint loading spinner on the hint button
     */
    function showHintLoading(show) {
        if (els.btnHint) {
            els.btnHint.classList.toggle('loading', show);
            els.btnHint.disabled = show;
        }
    }

    /**
     * Update evaluation bar
     * @param {number} score - pawns (positive = white advantage)
     * @param {number|null} mate - mate in N moves (positive = white wins)
     */
    function updateEvalBar(score, mate) {
        if (!els.evalBarContainer || !els.evalBarFill) return;

        let percentage = 50;

        if (mate !== null && mate !== undefined) {
            // Mate detected: full bar for winner
            percentage = mate > 0 ? 100 : 0;
        } else {
            // Score to percentage (sigmoid-ish)
            // Cap at +/- 10 pawns implies 100%/0%
            const clamped = Math.max(-10, Math.min(10, score));
            percentage = 50 + (clamped / 20) * 100;
        }

        // Clamp 5-95% to always show a bit of bar
        percentage = Math.max(5, Math.min(95, percentage));

        els.evalBarFill.style.height = `${percentage}%`;
    }

    /**
     * Show hint (highlight best move)
     */
    function showHint(from, to) {
        ChessBoard.highlightHint(from, to);
    }

    /**
     * Clear hint
     */
    function clearHint() {
        ChessBoard.clearHighlights('hint-move');
        ChessBoard.clearHighlights('hint-from');
    }

    /**
     * Show/hide eval bar, reset to 50% on show
     */
    function showEvalBar(show) {
        if (els.evalBarContainer) {
            els.evalBarContainer.style.display = show ? 'flex' : 'none';
            if (show && els.evalBarFill) {
                els.evalBarFill.style.height = '50%'; // Neutral start
            }
        }
    }

    // Public API
    return {
        init,
        showScreen,
        showRotationToggle,
        setCurrentBot,
        updatePlayerBars,
        updateMoveHistory,
        updateStatus,
        showPromotionDialog,
        animateBoardRotation,
        showThinking,
        showEngineLoading,
        showHintLoading,
        updateEvalBar,
        showEvalBar,
        showHint,
        clearHint
    };
})();
