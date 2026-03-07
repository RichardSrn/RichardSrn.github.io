/**
 * multiplayer.js
 * 
 * Logic for room management, real-time state sync,
 * database cleanup, and spectator mode.
 */

const ChessMultiplayer = (function () {
    'use strict';

    const ROOM_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

    let currentRoomId = null;
    let playerRole = null; // 'w', 'b', or 'spectator'
    let roomRef = null;
    let disconnectRef = null; // for onDisconnect cleanup

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
            variant: config.variant || 'standard',
            createdAt: firebase.database.ServerValue.TIMESTAMP,
            status: 'waiting',
            finishedAt: null,
            allowSpectators: config.allowSpectators !== undefined ? config.allowSpectators : true,
            spectatorCount: 0
        };

        console.log("Multiplayer: Saving initial state to Firebase for room:", roomId);
        await roomRef.set(initialState);

        // Opportunistically clean up old rooms
        cleanupOldRooms();

        return roomId;
    }

    /**
     * Join an existing room (as player or spectator)
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
        const isFull = data.players && data.players.w && data.players.b;

        if (isFull) {
            // Room is full — try spectator mode
            if (data.allowSpectators) {
                console.log("Multiplayer: Room full, joining as spectator.");
                playerRole = 'spectator';
                currentRoomId = roomId;
                roomRef = ref;

                // Increment spectator count
                await roomRef.child('spectatorCount').transaction(count => (count || 0) + 1);

                // On disconnect, decrement spectator count
                disconnectRef = roomRef.child('spectatorCount');
                disconnectRef.onDisconnect().transaction(count => Math.max((count || 1) - 1, 0));

                // Inject updated data for local use
                data.players = data.players || {};
                return data;
            } else {
                console.warn("Multiplayer: Room is full and spectators not allowed.");
                throw new Error('Room is full');
            }
        }

        // Join as a player
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
        if (!roomRef || playerRole === 'spectator') return;

        roomRef.update({
            fen: fen,
            turn: playerRole === 'w' ? 'b' : 'w',
            lastMove: lastMove
        });
    }

    /**
     * Mark the game as active (both players joined)
     */
    function markGameActive() {
        if (!roomRef) return;
        roomRef.update({ status: 'active' });
    }

    /**
     * Mark the game as finished
     */
    function markGameFinished() {
        if (!roomRef) return;
        roomRef.update({
            status: 'finished',
            finishedAt: firebase.database.ServerValue.TIMESTAMP
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

    /**
     * Leave the current room (cleanup for spectators)
     */
    function leaveRoom() {
        if (playerRole === 'spectator' && roomRef) {
            roomRef.child('spectatorCount').transaction(count => Math.max((count || 1) - 1, 0));
            if (disconnectRef) {
                disconnectRef.onDisconnect().cancel();
                disconnectRef = null;
            }
        }
        stopListening();
        roomRef = null;
        currentRoomId = null;
        playerRole = null;
    }

    /**
     * Cleanup old rooms (older than ROOM_TTL_MS)
     * Called opportunistically when creating new rooms.
     */
    async function cleanupOldRooms() {
        try {
            const cutoff = Date.now() - ROOM_TTL_MS;
            const roomsRef = database.ref('rooms');

            // Query rooms created before the cutoff
            const snapshot = await roomsRef
                .orderByChild('createdAt')
                .endAt(cutoff)
                .limitToFirst(50) // Process in batches to avoid huge reads
                .once('value');

            if (!snapshot.exists()) return;

            const updates = {};
            snapshot.forEach(child => {
                updates[child.key] = null; // Mark for deletion
            });

            if (Object.keys(updates).length > 0) {
                console.log(`Multiplayer: Cleaning up ${Object.keys(updates).length} old room(s).`);
                await roomsRef.update(updates);
            }
        } catch (err) {
            console.warn("Multiplayer: Cleanup failed (non-critical):", err.message);
        }
    }

    /**
     * Check if current role is spectator
     */
    function isSpectator() {
        return playerRole === 'spectator';
    }

    return {
        createRoom,
        joinRoom,
        sendMove,
        onRoomUpdate,
        stopListening,
        leaveRoom,
        markGameActive,
        markGameFinished,
        isSpectator,
        getRole: () => playerRole,
        getRoomId: () => currentRoomId
    };
})();
