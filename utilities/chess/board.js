/**
 * board.js — Chess Board Renderer
 * 
 * Handles:
 * - Creating the 8x8 grid of DOM elements
 * - Placing Unicode chess pieces
 * - Visual highlights (selected, legal moves, last move, check, hints)
 * - Click and drag-and-drop piece movement
 * - Board flipping / coordinate labels
 * - Promotion dialog
 * - Smooth piece animation
 */

const ChessBoard = (() => {
    // Unicode chess pieces
    const PIECE_SYMBOLS = {
        wK: '♔', wQ: '♕', wR: '♖', wB: '♗', wN: '♘', wP: '♙',
        bK: '♚', bQ: '♛', bR: '♜', bB: '♝', bN: '♞', bP: '♟'
    };

    const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

    let boardEl = null;
    let coordsFilesEl = null;
    let coordsRanksEl = null;
    let squares = {};         // { 'a1': domElement, ... }
    let flipped = false;
    let selectedSquare = null;
    let legalMoves = [];
    let lastMove = null;      // { from, to }
    let dragState = null;     // { piece, square, ghostEl }
    let previousBoard = null; // For diff-based rendering

    // Callbacks
    let onSquareClick = null;
    let onPieceDrop = null;

    /**
     * Initialize the board
     */
    function init(config = {}) {
        boardEl = document.getElementById('chess-board');
        coordsFilesEl = document.getElementById('coords-files');
        coordsRanksEl = document.getElementById('coords-ranks');

        onSquareClick = config.onSquareClick || (() => { });
        onPieceDrop = config.onPieceDrop || (() => { });
        flipped = config.flipped || false;
        previousBoard = null;

        createBoard();
        createCoords();

        // Global drag listeners
        document.addEventListener('mousemove', handleDragMove);
        document.addEventListener('mouseup', handleDragEnd);
        document.addEventListener('touchmove', handleDragMove, { passive: false });
        document.addEventListener('touchend', handleDragEnd);
    }

    /**
     * Create the 8x8 grid of square elements
     */
    function createBoard() {
        boardEl.innerHTML = '';
        squares = {};

        const rankOrder = flipped ? [...RANKS].reverse() : RANKS;
        const fileOrder = flipped ? [...FILES].reverse() : FILES;

        for (let r = 0; r < 8; r++) {
            for (let f = 0; f < 8; f++) {
                const rank = rankOrder[r];
                const file = fileOrder[f];
                const sqName = file + rank;
                const isLight = (FILES.indexOf(file) + parseInt(rank)) % 2 === 1;

                const sqEl = document.createElement('div');
                sqEl.className = `square ${isLight ? 'light' : 'dark'}`;
                sqEl.dataset.square = sqName;

                // Click handler
                sqEl.addEventListener('mousedown', (e) => {
                    if (e.button !== 0) return;
                    handleSquareInteraction(sqName, e);
                });

                sqEl.addEventListener('touchstart', (e) => {
                    handleSquareInteraction(sqName, e);
                }, { passive: false });

                boardEl.appendChild(sqEl);
                squares[sqName] = sqEl;
            }
        }
    }

    /**
     * Create coordinate labels
     */
    function createCoords() {
        coordsFilesEl.innerHTML = '';
        coordsRanksEl.innerHTML = '';

        const fileOrder = flipped ? [...FILES].reverse() : FILES;
        const rankOrder = flipped ? [...RANKS].reverse() : RANKS;

        fileOrder.forEach((file, i) => {
            const label = document.createElement('div');
            label.className = `coord-label ${(i + 0) % 2 === 0 ? 'on-dark' : 'on-light'}`;
            label.textContent = file;
            coordsFilesEl.appendChild(label);
        });

        rankOrder.forEach((rank, i) => {
            const label = document.createElement('div');
            label.className = `coord-label ${(i + 0) % 2 === 0 ? 'on-light' : 'on-dark'}`;
            label.textContent = rank;
            coordsRanksEl.appendChild(label);
        });
    }

    /**
     * Handle click/touch on a square
     */
    function handleSquareInteraction(sqName, event) {
        event.preventDefault();
        const sqEl = squares[sqName];
        const hasPiece = sqEl.querySelector('.piece');

        // If a piece is on this square and it's a potential drag start
        if (hasPiece && !selectedSquare) {
            // Start potential drag
            startDrag(sqName, event);
        }

        // Notify game logic
        onSquareClick(sqName);
    }

    /**
     * Start dragging a piece
     */
    function startDrag(sqName, event) {
        const sqEl = squares[sqName];
        const pieceEl = sqEl.querySelector('.piece');
        if (!pieceEl) return;

        sqEl.classList.add('dragging');

        // Create ghost element
        const ghost = document.createElement('div');
        ghost.className = 'drag-ghost';
        ghost.textContent = pieceEl.textContent;
        document.body.appendChild(ghost);

        const pos = getEventPos(event);
        ghost.style.left = pos.x + 'px';
        ghost.style.top = pos.y + 'px';

        dragState = {
            square: sqName,
            piece: pieceEl.textContent,
            ghostEl: ghost
        };
    }

    /**
     * Handle drag movement
     */
    function handleDragMove(event) {
        if (!dragState) return;
        event.preventDefault();

        const pos = getEventPos(event);
        dragState.ghostEl.style.left = pos.x + 'px';
        dragState.ghostEl.style.top = pos.y + 'px';
    }

    /**
     * Handle drag end
     */
    function handleDragEnd(event) {
        if (!dragState) return;

        const pos = getEventPos(event);
        const targetSq = getSquareAtPosition(pos.x, pos.y);

        // Clean up ghost
        dragState.ghostEl.remove();

        // Remove dragging class
        const srcEl = squares[dragState.square];
        if (srcEl) srcEl.classList.remove('dragging');

        // If dropped on a valid different square, attempt move
        if (targetSq && targetSq !== dragState.square) {
            onPieceDrop(dragState.square, targetSq);
        }

        dragState = null;
    }

    /**
     * Get the square name under a screen position
     */
    function getSquareAtPosition(x, y) {
        const boardRect = boardEl.getBoundingClientRect();
        const col = Math.floor((x - boardRect.left) / (boardRect.width / 8));
        const row = Math.floor((y - boardRect.top) / (boardRect.height / 8));

        if (col < 0 || col > 7 || row < 0 || row > 7) return null;

        const fileOrder = flipped ? [...FILES].reverse() : FILES;
        const rankOrder = flipped ? [...RANKS].reverse() : RANKS;

        return fileOrder[col] + rankOrder[row];
    }

    /**
     * Get position from mouse or touch event
     */
    function getEventPos(event) {
        if (event.touches && event.touches.length > 0) {
            return { x: event.touches[0].clientX, y: event.touches[0].clientY };
        }
        if (event.changedTouches && event.changedTouches.length > 0) {
            return { x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY };
        }
        return { x: event.clientX, y: event.clientY };
    }

    /**
     * Update the board to reflect a chess.js board state (diff-based to avoid flicker)
     * @param {Array} boardState - from chess.board() — 8x8 array
     */
    function updatePosition(boardState) {
        if (!boardState) {
            // Full clear
            Object.values(squares).forEach(sq => {
                const piece = sq.querySelector('.piece');
                if (piece) piece.remove();
            });
            previousBoard = null;
            return;
        }

        for (let r = 0; r < 8; r++) {
            for (let f = 0; f < 8; f++) {
                const newCell = boardState[r][f];
                const oldCell = previousBoard ? previousBoard[r][f] : null;

                // Check if piece changed
                const newKey = newCell ? newCell.color + newCell.type : null;
                const oldKey = oldCell ? oldCell.color + oldCell.type : null;

                if (newKey === oldKey) continue; // No change

                const sqName = FILES[f] + RANKS[r];
                const sqEl = squares[sqName];
                if (!sqEl) continue;

                // Remove old piece
                const existing = sqEl.querySelector('.piece');
                if (existing) existing.remove();

                // Place new piece
                if (newCell) {
                    const key = newCell.color + newCell.type.toUpperCase();
                    const pieceEl = document.createElement('span');
                    pieceEl.className = 'piece';
                    pieceEl.textContent = PIECE_SYMBOLS[key];
                    sqEl.appendChild(pieceEl);
                }
            }
        }

        // Deep-copy board state for next diff
        previousBoard = boardState.map(row =>
            row.map(cell => cell ? { color: cell.color, type: cell.type } : null)
        );
    }

    /**
     * Place a Unicode piece on a square
     */
    function placePiece(sqName, symbol) {
        const sqEl = squares[sqName];
        if (!sqEl) return;

        // Remove existing piece
        const existing = sqEl.querySelector('.piece');
        if (existing) existing.remove();

        if (symbol) {
            const pieceEl = document.createElement('span');
            pieceEl.className = 'piece';
            pieceEl.textContent = symbol;
            sqEl.appendChild(pieceEl);
        }
    }

    /**
     * Animate a piece moving from `from` to `to`
     * @returns {Promise<void>} resolves when animation complete
     */
    async function animateMove(from, to) {
        const fromSq = squares[from];
        const toSq = squares[to];
        const piece = fromSq ? fromSq.querySelector('.piece') : null;

        if (!fromSq || !toSq || !piece) return Promise.resolve();

        return new Promise(resolve => {
            // Calculate distance
            const fromRect = fromSq.getBoundingClientRect();
            const toRect = toSq.getBoundingClientRect();
            const dx = toRect.left - fromRect.left;
            const dy = toRect.top - fromRect.top;

            // Apply transform
            piece.style.transform = `translate(${dx}px, ${dy}px)`;
            piece.classList.add('animating');

            // Listen for end
            const transitionEndHandler = () => {
                piece.removeEventListener('transitionend', transitionEndHandler);
                piece.classList.remove('animating');
                piece.style.transform = '';
                resolve();
            };

            piece.addEventListener('transitionend', transitionEndHandler);

            // Fallback safety in case transitionend doesn't fire
            setTimeout(transitionEndHandler, 300);
        });
    }

    /**
     * Highlight the selected square
     */
    function setSelected(sqName) {
        clearHighlights('selected');
        selectedSquare = sqName;

        if (sqName && squares[sqName]) {
            squares[sqName].classList.add('selected');
        }
    }

    /**
     * Show legal move indicators
     * @param {Array} moves - array of { from, to, captured, ... }
     */
    function showLegalMoves(moves) {
        clearHighlights('legal-move');
        clearHighlights('legal-capture');
        legalMoves = moves;

        moves.forEach(move => {
            const sqEl = squares[move.to];
            if (!sqEl) return;

            if (move.captured || sqEl.querySelector('.piece')) {
                sqEl.classList.add('legal-capture');
            } else {
                sqEl.classList.add('legal-move');
            }
        });
    }

    /**
     * Highlight the last move
     */
    function showLastMove(from, to) {
        clearHighlights('last-move');
        lastMove = { from, to };

        if (squares[from]) squares[from].classList.add('last-move');
        if (squares[to]) squares[to].classList.add('last-move');
    }

    /**
     * Show hint (best move suggestion)
     */
    function highlightHint(from, to) {
        clearHighlights('hint-move');
        clearHighlights('hint-from');

        if (squares[from]) squares[from].classList.add('hint-from');
        if (squares[to]) squares[to].classList.add('hint-move');
    }

    /**
     * Highlight a king in check
     */
    function showCheck(kingSq) {
        clearHighlights('in-check');
        if (kingSq && squares[kingSq]) {
            squares[kingSq].classList.add('in-check');
        }
    }

    /**
     * Clear specific highlight class from all squares
     */
    function clearHighlights(className) {
        Object.values(squares).forEach(sq => sq.classList.remove(className));
    }

    /**
     * Clear all highlights
     */
    function clearAllHighlights() {
        clearHighlights('selected');
        clearHighlights('legal-move');
        clearHighlights('legal-capture');
        clearHighlights('last-move');
        clearHighlights('in-check');
        clearHighlights('hint-move');
        clearHighlights('hint-from');
        selectedSquare = null;
        legalMoves = [];
    }

    /**
     * Flip the board (toggle or set)
     */
    function flipBoard(forceFlipped) {
        flipped = forceFlipped !== undefined ? forceFlipped : !flipped;
        previousBoard = null; // Force full redraw after flip
        createBoard();
        createCoords();
        return flipped;
    }

    /**
     * Get whether board is flipped
     */
    function isFlipped() {
        return flipped;
    }

    // Public API
    return {
        init,
        updatePosition,
        placePiece,
        setSelected,
        showLegalMoves,
        showLastMove,
        showCheck,
        highlightHint,
        clearHighlights,
        clearAllHighlights,
        flipBoard,
        isFlipped,
        animateMove,
        PIECE_SYMBOLS
    };
})();
