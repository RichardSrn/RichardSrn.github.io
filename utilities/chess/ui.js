/**
 * ui.js — Chess UI Manager (Phase 2)
 *
 * Manages:
 * - Screen transitions (menu ↔ bot select ↔ settings ↔ game ↔ eval)
 * - Bot roster rendering
 * - Settings screen (language + board themes)
 * - Player bar updates (with bot name/avatar)
 * - Move history rendering (clickable, with current indicator)
 * - History-mode banner
 * - Game status messages (translated)
 * - Promotion dialog
 * - AI thinking / hint loading indicators (visibility-based, no layout shift)
 * - Engine loading indicator
 * - Eval bar with smooth lerp animation
 * - Game-over overlay with confetti
 */

const ChessUI = (() => {
    let currentScreen = 'menu';
    let currentBotInfo = null;
    let currentHistoryIdx = -1;

    // Coords mode: 0=Off (default), 1=Edge, 2=All
    let coordsMode = 0;

    // Settings
    let isBlindMode = false;
    let isScoreBarVisible = true;
    let blindTtsEnabled = true;

    // Eval bar lerp
    let evalTarget = 50;
    let evalCurrent = 50;
    let evalAnimFrame = null;

    // Callbacks
    let _onMoveClick = null;
    let _onHistoryBack = null;
    let _onTextInputSubmit = null; // added for text/voice inputs
    let resolveTextInput = null;   // modal promise resolver

    // DOM refs
    const els = {};

    /* ===================== INIT ===================== */
    function init(config = {}) {
        cacheDom();

        // Load saved theme and coords
        ChessThemes.loadSavedTheme();
        loadSavedCoords();
        loadSavedPrefs();

        // Init i18n (reads localStorage)
        ChessI18n.init();

        // Menu mode buttons
        els.modePvp.addEventListener('click', () => { if (config.onModeSelect) config.onModeSelect('pvp'); });
        els.modeAi.addEventListener('click', () => {
            renderBotRoster(config.onBotSelect);
            showScreen('difficulty');
        });
        els.modeEval.addEventListener('click', () => showScreen('eval'));
        els.modeSettings.addEventListener('click', () => {
            renderSettings();
            showScreen('settings');
        });

        // Difficulty back
        els.btnDiffBack.addEventListener('click', () => showScreen('menu'));

        // Settings back
        els.btnSettingsBack.addEventListener('click', () => showScreen('menu'));

        // Eval back
        els.btnEvalBack.addEventListener('click', () => showScreen('menu'));

        // Game controls
        els.btnBackMenu.addEventListener('click', () => { if (config.onBackToMenu) config.onBackToMenu(); });
        els.btnNewGame.addEventListener('click', () => { if (config.onNewGame) config.onNewGame(); });
        els.btnUndo.addEventListener('click', () => { if (config.onUndo) config.onUndo(); });
        els.btnFlip.addEventListener('click', () => { if (config.onFlip) config.onFlip(); });
        els.btnResign.addEventListener('click', () => { if (config.onResign) config.onResign(); });
        els.btnHint.addEventListener('click', () => { if (config.onHint) config.onHint(); });
        els.btnHint.addEventListener('click', () => { if (config.onHint) config.onHint(); });
        els.btnCoords.addEventListener('click', cycleCoords);
        els.rotationToggle.addEventListener('change', e => { if (config.onRotationToggle) config.onRotationToggle(e.target.checked); });

        // Settings Toggles
        els.settingBlindChess.addEventListener('change', e => {
            localStorage.setItem('chess_blind_default', e.target.checked);
        });
        els.settingScoreBar.addEventListener('change', e => {
            localStorage.setItem('chess_score_bar_default', e.target.checked);
            toggleScoreBar(e.target.checked); // immediate preview
        });

        // Quick Controls
        els.btnToggleBlind.addEventListener('click', () => toggleBlindMode());
        els.btnToggleEval.addEventListener('click', () => toggleScoreBar());

        // History back & read
        els.btnHistoryBack.addEventListener('click', () => { if (_onHistoryBack) _onHistoryBack(); });
        els.btnReadHistory.addEventListener('click', () => { if (config.onReadHistory) config.onReadHistory(); });

        // Blind UI interactions
        els.btnBlindTts.addEventListener('click', () => {
            blindTtsEnabled = !blindTtsEnabled;
            els.btnBlindTts.classList.toggle('active', blindTtsEnabled);
        });

        els.btnBlindVoice.addEventListener('click', async () => {
            const transcript = await startVoiceInput();
            if (transcript && config.onVoiceInput) config.onVoiceInput(transcript);
        });

        els.btnBlindText.addEventListener('click', async () => {
            const input = await showTextInputDialog();
            if (input && config.onTextInput) config.onTextInput(input.piece, input.square);
        });

        // Text Input Modal setup
        document.querySelectorAll('.ti-piece').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.ti-piece').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
            });
        });
        els.btnTiCancel.addEventListener('click', () => {
            els.textInputOverlay.classList.remove('active');
            if (resolveTextInput) resolveTextInput(null);
        });
        els.btnTiSubmit.addEventListener('click', () => {
            els.textInputOverlay.classList.remove('active');
            const pieceBtn = document.querySelector('.ti-piece.selected');
            const pieceStr = pieceBtn ? pieceBtn.dataset.piece : '';
            const sqStr = els.tiSquare.value.trim();
            if (resolveTextInput) resolveTextInput({ piece: pieceStr, square: sqStr });
        });

        // Game over actions
        els.btnGameoverNew.addEventListener('click', () => { if (config.onNewGame) config.onNewGame(); });
        els.btnGameoverMenu.addEventListener('click', () => { if (config.onBackToMenu) config.onBackToMenu(); });

        // Store callbacks
        _onMoveClick = config.onMoveClick || null;
        _onHistoryBack = config.onHistoryBack || null;

        // Create promotion overlay
        createPromotionDialog();

        // Start eval lerp loop
        startEvalLerp();
    }

    function cacheDom() {
        els.menuScreen = document.getElementById('menu-screen');
        els.gameScreen = document.getElementById('game-screen');
        els.evalScreen = document.getElementById('eval-screen');
        els.diffScreen = document.getElementById('ai-difficulty-screen');
        els.settingsScreen = document.getElementById('settings-screen');

        els.playerTopName = document.getElementById('player-top-name');
        els.playerBottomName = document.getElementById('player-bottom-name');
        els.playerTopCaptures = document.getElementById('player-top-captures');
        els.playerBottomCaptures = document.getElementById('player-bottom-captures');
        els.playerBarTop = document.getElementById('player-bar-top');
        els.playerBarBottom = document.getElementById('player-bar-bottom');

        els.gameStatus = document.getElementById('game-status');
        els.moveList = document.getElementById('move-list');
        els.moveList = document.getElementById('move-list');
        els.boardWrapper = document.querySelector('.board-wrapper');
        els.boardContainer = document.getElementById('board-container'); // Need container for coords classes

        els.rotationToggle = document.getElementById('toggle-rotation');
        els.rotationContainer = document.getElementById('rotation-toggle-container');

        els.aiThinking = document.getElementById('ai-thinking');
        els.engineLoading = document.getElementById('engine-loading');
        els.historyBanner = document.getElementById('history-banner');
        els.btnHistoryBack = document.getElementById('btn-history-back');

        els.btnBackMenu = document.getElementById('btn-back-menu');
        els.btnNewGame = document.getElementById('btn-new-game');
        els.btnUndo = document.getElementById('btn-undo');
        els.btnFlip = document.getElementById('btn-flip');
        els.btnResign = document.getElementById('btn-resign');
        els.btnResign = document.getElementById('btn-resign');
        els.btnHint = document.getElementById('btn-hint');
        els.btnCoords = document.getElementById('btn-coords');

        els.evalBarContainer = document.getElementById('eval-bar-container');
        els.evalBarFill = document.getElementById('eval-bar-fill');
        els.evalScoreText = document.getElementById('eval-score-text');

        els.settingBlindChess = document.getElementById('setting-blind-chess');
        els.settingScoreBar = document.getElementById('setting-score-bar');

        els.btnToggleBlind = document.getElementById('btn-toggle-blind');
        els.btnToggleEval = document.getElementById('btn-toggle-eval');

        els.blindBoardUi = document.getElementById('blind-board-ui');
        els.blindLastMoveText = document.getElementById('blind-last-move-text');
        els.btnBlindTts = document.getElementById('btn-blind-tts');
        els.btnBlindVoice = document.getElementById('btn-blind-voice');
        els.btnBlindText = document.getElementById('btn-blind-text');

        els.btnReadHistory = document.getElementById('btn-read-history');

        els.textInputOverlay = document.getElementById('text-input-overlay');
        els.tiPieces = document.getElementById('text-input-pieces');
        els.tiSquare = document.getElementById('text-input-square');
        els.btnTiCancel = document.getElementById('btn-text-input-cancel');
        els.btnTiSubmit = document.getElementById('btn-text-input-submit');

        els.modePvp = document.getElementById('mode-pvp');
        els.modeAi = document.getElementById('mode-ai');
        els.modeEval = document.getElementById('mode-eval');
        els.modeSettings = document.getElementById('mode-settings');

        els.botRoster = document.getElementById('bot-roster');
        els.btnDiffBack = document.getElementById('btn-diff-back');
        els.btnSettingsBack = document.getElementById('btn-settings-back');
        els.btnEvalBack = document.getElementById('btn-eval-back');
        els.themeSwatches = document.getElementById('theme-swatches');

        els.gameOverOverlay = document.getElementById('game-over-overlay');
        els.gameOverIcon = document.getElementById('game-over-icon');
        els.gameOverTitle = document.getElementById('game-over-title');
        els.gameOverReason = document.getElementById('game-over-reason');
        els.btnGameoverNew = document.getElementById('btn-gameover-new');
        els.btnGameoverMenu = document.getElementById('btn-gameover-menu');
        els.confettiCanvas = document.getElementById('confetti-canvas');
    }

    /* ===================== SCREENS ===================== */
    function showScreen(screenName) {
        [els.menuScreen, els.gameScreen, els.evalScreen, els.diffScreen, els.settingsScreen]
            .forEach(s => { if (s) s.classList.remove('active'); });
        currentScreen = screenName;
        switch (screenName) {
            case 'menu': els.menuScreen.classList.add('active'); break;
            case 'game': els.gameScreen.classList.add('active'); break;
            case 'eval': els.evalScreen.classList.add('active'); break;
            case 'difficulty': els.diffScreen.classList.add('active'); break;
            case 'settings': els.settingsScreen.classList.add('active'); break;
        }
    }

    /* ===================== BOT ROSTER ===================== */
    function renderBotRoster(onBotSelect) {
        if (!els.botRoster) return;
        els.botRoster.innerHTML = '';
        const bots = ChessAI.getAllBots();
        bots.forEach((bot, index) => {
            const hue = 120 - (index / (bots.length - 1)) * 120;
            const card = document.createElement('button');
            card.className = 'bot-card';
            card.dataset.botId = bot.id;
            card.innerHTML = `
                <div class="bot-avatar" style="background: hsl(${hue}, 65%, 45%);">${bot.avatar}</div>
                <div class="bot-info">
                    <div class="bot-name">${bot.name}</div>
                    <div class="bot-tagline">${bot.tagline}</div>
                </div>
                <div class="bot-elo" style="color: hsl(${hue}, 65%, 55%);">${bot.elo >= 3000 ? '3000+' : bot.elo}</div>
            `;
            card.addEventListener('click', () => { if (onBotSelect) onBotSelect(bot.id); });
            els.botRoster.appendChild(card);
        });
    }

    /* ===================== PREFERENCES & SETTINGS ===================== */
    function loadSavedPrefs() {
        const blindSaved = localStorage.getItem('chess_blind_default');
        if (blindSaved !== null) {
            els.settingBlindChess.checked = blindSaved === 'true';
        }

        const scoreSaved = localStorage.getItem('chess_score_bar_default');
        if (scoreSaved !== null) {
            els.settingScoreBar.checked = scoreSaved === 'true';
            isScoreBarVisible = els.settingScoreBar.checked;
        }
    }

    function isBlindModeDefault() {
        return !!els.settingBlindChess.checked;
    }

    function isScoreBarDefault() {
        return !!els.settingScoreBar.checked;
    }

    // Toggle Blind Mode during game
    function toggleBlindMode(forceState) {
        if (forceState !== undefined) isBlindMode = forceState;
        else isBlindMode = !isBlindMode;

        if (isBlindMode) {
            els.boardContainer.style.visibility = 'hidden';
            els.blindBoardUi.style.display = 'flex';
            els.btnReadHistory.style.display = 'block';
            els.btnToggleBlind.style.color = 'var(--accent)';
        } else {
            els.boardContainer.style.visibility = 'visible';
            els.blindBoardUi.style.display = 'none';
            els.btnReadHistory.style.display = 'none';
            els.btnToggleBlind.style.color = 'inherit';
        }
    }

    // Toggle Score Bar during game
    function toggleScoreBar(forceState) {
        if (forceState !== undefined) isScoreBarVisible = forceState;
        else isScoreBarVisible = !isScoreBarVisible;

        if (els.evalBarContainer) {
            els.evalBarContainer.style.display = isScoreBarVisible ? 'flex' : 'none';
        }
        els.btnToggleEval.style.color = isScoreBarVisible ? 'inherit' : 'var(--text-muted)';
    }

    function renderSettings() {
        renderThemeSwatches();
        updateLangButtons();
    }

    function renderThemeSwatches() {
        if (!els.themeSwatches) return;
        els.themeSwatches.innerHTML = '';
        const currentId = ChessThemes.getCurrentThemeId();
        ChessThemes.getAllThemes().forEach(theme => {
            const swatch = document.createElement('button');
            swatch.className = `theme-swatch${theme.id === currentId ? ' active' : ''}`;
            swatch.dataset.theme = theme.id;
            swatch.title = ChessI18n.t(theme.nameKey);
            swatch.innerHTML = `
                <div class="swatch-preview">
                    <span style="background:${theme.preview[0]}"></span>
                    <span style="background:${theme.preview[1]}"></span>
                    <span style="background:${theme.preview[0]}"></span>
                    <span style="background:${theme.preview[1]}"></span>
                </div>
                <div class="swatch-name" data-i18n="${theme.nameKey}">${ChessI18n.t(theme.nameKey)}</div>
            `;
            swatch.addEventListener('click', () => {
                ChessThemes.applyTheme(theme.id);
                updateThemeSwatches(theme.id);
            });
            els.themeSwatches.appendChild(swatch);
        });

        // Lang buttons
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                ChessI18n.setLang(btn.dataset.lang);
                updateLangButtons();
            });
        });
    }

    function updateThemeSwatches(activeId) {
        document.querySelectorAll('.theme-swatch').forEach(el => {
            el.classList.toggle('active', el.dataset.theme === activeId);
        });
    }

    function updateLangButtons() {
        const lang = ChessI18n.getLang();
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
        });
    }

    /* ===================== COORDS TOGGLE ===================== */
    function loadSavedCoords() {
        const saved = localStorage.getItem('chess_coords_mode');
        if (saved !== null) {
            coordsMode = parseInt(saved, 10);
        }
        updateCoordsUI();
    }

    function cycleCoords() {
        // Cycle 1 -> 2 -> 0 -> 1
        if (coordsMode === 1) coordsMode = 2;
        else if (coordsMode === 2) coordsMode = 0;
        else coordsMode = 1;

        localStorage.setItem('chess_coords_mode', coordsMode);
        updateCoordsUI();
    }

    function updateCoordsUI() {
        if (!els.boardContainer || !els.btnCoords) return;

        // Reset classes
        els.boardContainer.classList.remove('coords-mode-0', 'coords-mode-1', 'coords-mode-2');
        els.boardContainer.classList.add(`coords-mode-${coordsMode}`);

        // Update button visual state (opacity or color)
        // 0: dims (off)
        // 1: normal
        // 2: highlighted (all)
        els.btnCoords.style.opacity = coordsMode === 0 ? '0.5' : '1';
        els.btnCoords.style.color = coordsMode === 2 ? 'var(--accent)' : 'inherit';
    }

    /* ===================== PLAYER BARS ===================== */
    function setCurrentBot(bot) { currentBotInfo = bot; }

    function updatePlayerBars(state) {
        const isWhiteTurn = state.turn === 'w';
        const flipped = ChessBoard.isFlipped();
        const isAI = state.mode === 'ai';

        let bottomLabel = flipped ? ChessI18n.t('black') : ChessI18n.t('white');
        let topLabel = flipped ? ChessI18n.t('white') : ChessI18n.t('black');

        if (isAI && currentBotInfo) {
            const botLabel = `${currentBotInfo.avatar} ${currentBotInfo.name}`;
            if (!flipped) { topLabel = botLabel; bottomLabel = ChessI18n.t('you_white'); }
            else { bottomLabel = botLabel; topLabel = ChessI18n.t('you_white'); }
        }

        els.playerBottomName.textContent = bottomLabel;
        els.playerTopName.textContent = topLabel;

        els.playerBarBottom.classList.toggle('active-turn', (flipped ? !isWhiteTurn : isWhiteTurn));
        els.playerBarTop.classList.toggle('active-turn', (flipped ? isWhiteTurn : !isWhiteTurn));
    }

    /* ===================== MOVE HISTORY ===================== */
    function updateMoveHistory(history, currentHalfMove = -1) {
        els.moveList.innerHTML = '';
        history.forEach((entry, idx) => {
            const pair = document.createElement('span');
            pair.className = 'move-pair';

            const num = document.createElement('span');
            num.className = 'move-number';
            num.textContent = entry.number + '.';
            pair.appendChild(num);

            // White's move
            if (entry.white) {
                const whiteMoveIdx = idx * 2;
                const white = document.createElement('span');
                white.className = 'move-notation';
                white.textContent = entry.white;
                if (whiteMoveIdx === currentHalfMove) white.classList.add('current');
                white.addEventListener('click', () => { if (_onMoveClick) _onMoveClick(whiteMoveIdx); });
                pair.appendChild(white);
            }

            // Black's move
            if (entry.black) {
                const blackMoveIdx = idx * 2 + 1;
                const black = document.createElement('span');
                black.className = 'move-notation';
                black.textContent = entry.black;
                if (blackMoveIdx === currentHalfMove) black.classList.add('current');
                black.addEventListener('click', () => { if (_onMoveClick) _onMoveClick(blackMoveIdx); });
                pair.appendChild(black);
            }

            els.moveList.appendChild(pair);
        });
        els.moveList.scrollTop = els.moveList.scrollHeight;
    }

    /* ===================== HISTORY MODE ===================== */
    function setHistoryMode(active, moveIdx = -1) {
        currentHistoryIdx = active ? moveIdx : -1;
        if (els.historyBanner) {
            els.historyBanner.classList.toggle('visible', active);
        }
    }

    /* ===================== GAME STATUS ===================== */
    function updateStatus(state) {
        els.gameStatus.classList.remove('check', 'game-over');
        if (state.isCheckmate) {
            els.gameStatus.textContent = ChessI18n.t('checkmate');
            els.gameStatus.classList.add('game-over');
        } else if (state.isStalemate) {
            els.gameStatus.textContent = ChessI18n.t('stalemate');
            els.gameStatus.classList.add('game-over');
        } else if (state.isDraw) {
            els.gameStatus.textContent = ChessI18n.t('draw');
            els.gameStatus.classList.add('game-over');
        } else if (state.isCheck) {
            els.gameStatus.textContent = ChessI18n.t('check');
            els.gameStatus.classList.add('check');
        } else {
            const turnStr = state.turn === 'w' ? ChessI18n.t('white_to_move') : ChessI18n.t('black_to_move');
            els.gameStatus.textContent = turnStr;
        }
    }

    /* ===================== GAME OVER OVERLAY ===================== */
    function showGameOver(state) {
        const overlay = els.gameOverOverlay;
        if (!overlay) return;

        let icon = '♟';
        let title = '';
        let reason = '';

        if (state.isCheckmate) {
            const winner = state.turn === 'w' ? ChessI18n.t('black') : ChessI18n.t('white');
            icon = state.turn === 'w' ? '♛' : '♕';
            title = ChessI18n.t('checkmate');
            reason = `${winner} ${ChessI18n.t('wins_checkmate')}`;
            launchConfetti();
        } else if (state.isStalemate) {
            icon = '½';
            title = ChessI18n.t('draw');
            reason = ChessI18n.t('draw_stalemate');
        } else if (state.isThreefold) {
            icon = '½';
            title = ChessI18n.t('draw');
            reason = ChessI18n.t('draw_repetition');
        } else if (state.isInsufficient) {
            icon = '½';
            title = ChessI18n.t('draw');
            reason = ChessI18n.t('draw_material');
        } else if (state.isDraw) {
            icon = '½';
            title = ChessI18n.t('draw');
            reason = ChessI18n.t('draw_generic');
        } else {
            // Resignation - winner is the opposite of who resigned
            icon = '🏳️';
            title = ChessI18n.t('checkmate'); // "Game Over"
            reason = ChessI18n.t('wins_resignation');
        }

        els.gameOverIcon.textContent = icon;
        els.gameOverTitle.textContent = title;
        els.gameOverReason.textContent = reason;

        overlay.classList.add('visible');
    }

    function hideGameOver() {
        if (els.gameOverOverlay) els.gameOverOverlay.classList.remove('visible');
    }

    /* ===================== CONFETTI ===================== */
    function launchConfetti() {
        const canvas = els.confettiCanvas;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        const particles = Array.from({ length: 80 }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * -canvas.height,
            vx: (Math.random() - 0.5) * 2,
            vy: 1 + Math.random() * 3,
            color: `hsl(${Math.random() * 360}, 75%, 60%)`,
            size: 5 + Math.random() * 6,
            spin: Math.random() * 0.2 - 0.1,
            angle: Math.random() * Math.PI * 2
        }));

        let frame = 0;
        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.angle += p.spin;
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.angle);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
                ctx.restore();
            });
            frame++;
            if (frame < 200) requestAnimationFrame(animate);
            else ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        animate();
    }

    /* ===================== PROMOTION DIALOG ===================== */
    function createPromotionDialog() {
        const overlay = document.createElement('div');
        overlay.className = 'promotion-overlay';
        overlay.id = 'promotion-overlay';
        const dialog = document.createElement('div');
        dialog.className = 'promotion-dialog';
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
    }

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

    /* ===================== BLIND INPUTS ===================== */
    function showTextInputDialog() {
        return new Promise(resolve => {
            els.tiSquare.value = '';
            els.textInputOverlay.classList.add('active');
            els.tiSquare.focus();
            resolveTextInput = resolve;
        });
    }

    function startVoiceInput() {
        return new Promise(resolve => {
            const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRec) {
                alert(ChessI18n.t('voice_not_supported') || 'Voice input is not supported in your browser.');
                resolve(null);
                return;
            }

            const recognition = new SpeechRec();
            recognition.lang = ChessI18n.getLang() === 'fr' ? 'fr-FR' : 'en-US';
            recognition.interimResults = false;
            recognition.maxAlternatives = 1;

            els.btnBlindVoice.classList.add('listening');

            recognition.onresult = event => {
                const speechResult = event.results[0][0].transcript.toLowerCase();
                els.btnBlindVoice.classList.remove('listening');
                resolve(speechResult);
            };

            recognition.onerror = event => {
                els.btnBlindVoice.classList.remove('listening');
                console.error("Speech recognition error", event.error);
                resolve(null);
            };

            recognition.onend = () => {
                els.btnBlindVoice.classList.remove('listening');
            };

            recognition.start();
        });
    }

    function updateBlindLastMove(san) {
        if (els.blindLastMoveText) els.blindLastMoveText.textContent = san || '--';
    }

    function readOutLoud(text) {
        if (!blindTtsEnabled || !window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        const langCode = ChessI18n.getLang() === 'fr' ? 'fr-FR' : 'en-US';
        utterance.lang = langCode;
        window.speechSynthesis.speak(utterance);
    }

    /* ===================== INDICATORS ===================== */
    function showThinking(show) {
        if (els.aiThinking) els.aiThinking.classList.toggle('visible', show);
    }

    function showEngineLoading(show) {
        if (els.engineLoading) els.engineLoading.classList.toggle('visible', show);
    }

    function showHintLoading(show) {
        if (els.btnHint) {
            els.btnHint.classList.toggle('loading', show);
            els.btnHint.disabled = show;
        }
    }

    function showRotationToggle(show) {
        if (els.rotationContainer) els.rotationContainer.style.display = show ? 'flex' : 'none';
    }

    /* ===================== EVAL BAR (lerp) ===================== */
    function startEvalLerp() {
        function lerp() {
            evalCurrent += (evalTarget - evalCurrent) * 0.06;
            if (Math.abs(evalTarget - evalCurrent) < 0.1) evalCurrent = evalTarget;
            if (els.evalBarFill) {
                els.evalBarFill.style.height = `${evalCurrent}%`;
            }
            evalAnimFrame = requestAnimationFrame(lerp);
        }
        evalAnimFrame = requestAnimationFrame(lerp);
    }

    function updateEvalBar(score, mate) {
        let target = 50;
        let scoreText = '0.0';

        if (mate !== null && mate !== undefined) {
            target = mate > 0 ? 95 : 5;
            scoreText = mate > 0 ? `+M${Math.abs(mate)}` : `-M${Math.abs(mate)}`;
        } else {
            const clamped = Math.max(-10, Math.min(10, score));
            target = 50 + (clamped / 20) * 90;
            scoreText = score > 0 ? `+${score.toFixed(1)}` : score.toFixed(1);
        }
        evalTarget = Math.max(5, Math.min(95, target));

        if (els.evalScoreText) els.evalScoreText.textContent = scoreText;
    }

    function showEvalBar(show) {
        isScoreBarVisible = show;
        if (els.evalBarContainer) {
            els.evalBarContainer.style.display = show ? 'flex' : 'none';
            if (show) { evalTarget = 50; evalCurrent = 50; }
        }
        els.btnToggleEval.style.color = show ? 'inherit' : 'var(--text-muted)';
    }

    /* ===================== HINT ===================== */
    function showHint(from, to) { ChessBoard.highlightHint(from, to); }
    function clearHint() {
        ChessBoard.clearHighlights('hint-move');
        ChessBoard.clearHighlights('hint-from');
    }

    /* ===================== BOARD ANIMATION ===================== */
    function animateBoardRotation(toFlipped) {
        if (!els.boardWrapper) return;
        const className = toFlipped ? 'rotating' : 'rotating-back';
        els.boardWrapper.classList.add(className);
        setTimeout(() => {
            els.boardWrapper.classList.remove(className);
            els.boardWrapper.classList.toggle('rotated', toFlipped);
        }, 600);
    }

    /* ===================== PUBLIC API ===================== */
    return {
        init,
        showScreen,
        showRotationToggle,
        setCurrentBot,
        updatePlayerBars,
        updateMoveHistory,
        setHistoryMode,
        updateStatus,
        showPromotionDialog,
        animateBoardRotation,
        showThinking,
        showEngineLoading,
        showHintLoading,
        updateEvalBar,
        showEvalBar,
        isBlindModeDefault,
        isScoreBarDefault,
        toggleBlindMode,
        toggleScoreBar,
        updateBlindLastMove,
        readOutLoud,
        showHint,
        clearHint,
        showGameOver,
        hideGameOver
    };
})();
