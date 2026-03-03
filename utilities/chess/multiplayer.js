/**
 * multiplayer.js
 * 
 * Logic for room management and real-time state sync.
 */

const ChessMultiplayer = (function () {
    'use strict';

    let currentRoomId = null;
    let playerRole = null; // 'w' or 'b'
    let roomRef = null;

    /**
     * Generate a random 6-character room code
     */
    function generateRoomId() {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    /**
     * Create a new room
     */
    async function createRoom(config = {}) {
        console.log("Multiplayer: Generating room with config:", config);
        const roomId = generateRoomId();
        currentRoomId = roomId;

        const chosenColor = config.color || 'random';
        if (chosenColor === 'random') {
            playerRole = Math.random() > 0.5 ? 'w' : 'b';
        } else {
            playerRole = chosenColor;
        }

        roomRef = database.ref('rooms/' + roomId);

        const initialState = {
            fen: 'start',
            turn: 'w',
            lastMove: null,
            players: {
                w: playerRole === 'w',
                b: playerRole === 'b'
            },
            variant: config.variant || 'standard'
        };

        console.log("Multiplayer: Saving initial state to Firebase for room:", roomId);
        await roomRef.set(initialState);
        return roomId;
    }

    /**
     * Join an existing room
     */
    async function joinRoom(roomId) {
        console.log("Multiplayer: Attempting to join room:", roomId);
        const ref = database.ref('rooms/' + roomId);
        const snapshot = await ref.once('value');

        if (!snapshot.exists()) {
            console.warn("Multiplayer: Room not found:", roomId);
            throw new Error('Room not found');
        }

        const data = snapshot.val();
        if (data.players && data.players.w && data.players.b) {
            console.warn("Multiplayer: Room is already full.");
            throw new Error('Room is full');
        }

        if (data.players && data.players.w) {
            playerRole = 'b';
        } else {
            playerRole = 'w';
        }

        currentRoomId = roomId;
        roomRef = ref;

        console.log("Multiplayer: Marking " + playerRole + " as joined...");
        await roomRef.child('players/' + playerRole).set(true);
        console.log("Multiplayer: Successfully joined.");

        // Inject updated player state for local use immediately
        if (!data.players) data.players = {};
        data.players[playerRole] = true;

        return data;
    }

    /**
     * Send a move to the database
     */
    function sendMove(fen, lastMove) {
        if (!roomRef) return;

        roomRef.update({
            fen: fen,
            turn: playerRole === 'w' ? 'b' : 'w',
            lastMove: lastMove
        });
    }

    /**
     * Listen for changes in the room
     */
    function onRoomUpdate(callback) {
        if (!roomRef) return;
        roomRef.on('value', (snapshot) => {
            callback(snapshot.val());
        });
    }

    /**
     * Stop listening for changes
     */
    function stopListening() {
        if (roomRef) {
            roomRef.off('value');
        }
    }

    return {
        createRoom,
        joinRoom,
        sendMove,
        onRoomUpdate,
        stopListening,
        getRole: () => playerRole,
        getRoomId: () => currentRoomId
    };
})();
