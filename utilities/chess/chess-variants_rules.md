Here is the comprehensive, precise, and highly structured guide to implementing 3-, 4-, 5-, and 6-player chess variants.

Because you are developing a game, standard 2D arrays (`board[x][y]`) will fail for most of these geometries. A **Graph Data Structure** (where squares are nodes, and directional adjacencies are edges) is the most efficient way to handle movement logic across all these variants.

---

### 1. Three-Player Chess

**The Board Layout**

* **Shape:** A hexagonal board consisting of 96 quadrilateral spaces (32 per player).
* **Center:** The center usually features a "rosette" or a convergence point where the three halves meet.

**The Pieces & Setup**

* **Sets:** 3 standard sets of 16 pieces (e.g., White, Black, Red).
* **Placement:** Pieces are set up on the outermost two ranks of each player's side. The Queen is placed on her own color (or always to the left of the King, to ensure symmetry).

**Rules & Differences**

* **Movement:** Standard chess movement applies, but diagonals curve when passing through the center. A Bishop entering the center must exit on the same color square.
* **Pawns:** Pawns move "forward" toward the center. Once they reach the center line, they can capture diagonally into *either* opponent's territory.
* **Winning:** The most common rule is **"First to Checkmate Wins."** If Player A checkmates Player B, Player A wins (1 point), Player B loses (0 points), and Player C draws (0.5 points). This prevents two players from endlessly ganging up on one.

---

### 2. Four-Player Chess

**The Board Layout**

* **Shape:** A standard 8x8 board with three additional 3x8 rectangular rows extending from each of the four sides. Total = 160 squares.
* **Geometry:** Forms a cross/plus shape. This is the only variant here that perfectly retains orthogonal grid rules.

**The Pieces & Setup**

* **Sets:** 4 standard sets of 16 pieces (e.g., Red, Blue, Yellow, Green).
* **Placement:** Placed in the 3x8 extensions. Pawns are on the 2nd rank of the extension, standard back-rank layout for the rest.

**Rules & Differences**

* **Modes:** Can be played Free-For-All (FFA) or Teams (2v2, teammates sit opposite each other).
* **Turn Order:** Clockwise.
* **Pawns:** Move straight forward. They promote on the 8th rank from their starting position (which is the opponent's back rank) or the 11th rank (the opposite edge of the board).
* **Elimination (FFA):** When a player is checkmated, their King is removed, and their remaining pieces become "zombies" (inactive, grayed-out blocks that cannot move but can be captured by others).
* **Points System:** Standard online rules use points (+20 for checkmate, +1 for capturing a pawn, +9 for a Queen). The game ends when three players are eliminated or time runs out; the highest score wins.

---

### 3. Five-Player Chess

*Note: 5-player chess is the least standardized. You will need to make executive design choices here.*

**The Board Layout**

* **Shape:** A pentagonal board consisting of quadrilateral squares warped into a pentagon, or a 5-way central junction.
* **Center:** Often features a central "null" pentagon space that pieces cannot occupy but can move through.

**Rules & Differences**

* **Movement:** Orthogonal moves follow the physical lines. Diagonal moves (Bishops/Queens) are treated by maintaining square color logic across the central junction.
* **Turn Order:** Clockwise or "Star" order (Player 1, 3, 5, 2, 4) to balance the advantage of moving first.
* **Pawn Promotion:** Pawns promote upon reaching the back rank of *any* opponent.

---

### 4. Six-Player Chess

**The Board Layout**

* **Shape:** Uses the same underlying geometry as the 3-player hexagonal board, but expanded. All 6 sides of the hexagon are utilized as starting zones.
* *(Alternative)*: A circular board (e.g., Sovereign/Harmegedo style) with a null center.

**The Pieces & Setup**

* **Sets:** 6 sets of 16 pieces.
* **Alliances:** Typically played in teams of 2 (3 teams of 2, allies sitting opposite) or teams of 3 (2 teams of 3, alternating seats).

**Rules & Differences**

* **Movement constraints:** Because of the sheer volume of pieces, the center becomes a massive bottleneck.
* **Checkmate logic:** If playing Teams, checkmating one opponent does not end the game. The checkmated player's king is removed, their pieces go dead, and the remaining teammates fight on.

---

### 🛠️ Developer Implementation Tips & Constraints

**1. Abandon the 2D Array**
Do not use `[x][y]` coordinates for 3-, 5-, or 6-player boards. Use a **Node Graph**.

* Every square is a `Node`.
* Every `Node` has pointers to adjacent nodes: `Forward`, `Backward`, `Left`, `Right`, `Diag_FL`, `Diag_FR`, `Diag_BL`, `Diag_BR`.
* When generating the board, link the nodes manually based on the geometry. This allows standard chess algorithms (like "slide along 'Forward' until you hit a piece") to work universally, regardless of how warped the board shape is.

**2. Relative "Forward" Vectors**
In multiplayer chess, "Forward" is relative to the player.

* Store a mapping of directional vectors per player ID. What is `Forward` for Player 1 is `Right` for Player 2 and `Backward` for Player 3.

**3. State Machine & Turn Management**

* Use an array of active players: `[P1, P2, P3, P4]`.
* When a player is eliminated, do **not** remove their turn entirely if they have active checks on the board (otherwise a mate state might immediately resolve). Resolve the checkmate, change their status to `Eliminated`, and have the game loop simply `skip` their turn phase.

**4. The "Zombie" Piece Problem**
When a player dies, what happens to their pieces? Removing them instantly alters the board state drastically, often causing immediate, unfair discovered checks.

* *Solution:* Implement a "Zombie" state. Zombie pieces change to a neutral color, lose their movement abilities, but retain collision. They essentially become obstacles that other players must capture to clear.

**5. UI and Camera Constraints**
Players will struggle to calculate diagonals from an off-angle.

* In local multiplayer, you **must** implement a rotatable camera.
* Provide a UI toggle that highlights the valid movement path of a selected piece. On non-Euclidean boards (3, 5, 6 player), players cannot intuitively predict where a Bishop will land after crossing the center. Highlight the exact nodes the piece can legally travel to.

----------

# WebSpecific Implementation Details

Here is the candid reality of web-based chess variants: **there are no standard, out-of-the-box libraries for what you are building.** Standard web libraries like `chess.js`, `chessboard.js`, `chessground`, or `react-chessboard` are strictly hardcoded for an 8x8 grid, 2 players, and standard FEN/PGN notation. Because you are introducing non-Euclidean geometries (hexagons, central junctions) and extra players, standard coordinate systems will break. You must build the game state, rule validation, and UI from scratch.

Here is the precise, web-tailored architectural guide to implementing these variants on your site.

---

### 1. Web UI Rendering Engine

Do not attempt to use HTML `<table>` elements or CSS Grid for the 3-, 5-, or 6-player variants. The math for hitboxes, rotational symmetry, and overlapping boundaries will fail.

* **4-Player (Cross Board):** You *can* use CSS Grid or HTML/DOM elements since it remains an orthogonal grid. A 14x14 grid with the 3x3 corners set to `visibility: hidden` works perfectly.
* **3-, 5-, and 6-Player (Hex/Polygonal):** Use an HTML5 Canvas library or SVG.
* **SVG:** Excellent for handling custom click/hover events on irregular polygon shapes. You can map `<polygon>` elements to specific board nodes and style them with CSS.
* **Canvas (PixiJS, Konva.js, Fabric.js):** Best if you plan to add complex animations, custom piece dragging, or particle effects. Konva.js is particularly strong for drag-and-drop mechanics on irregular shapes.



---

### 2. State & Move Validation (The Graph Architecture)

Abandon the traditional 2D array (`board[x][y]`). You must represent the board memory state as a **Directed Graph**.

**Node Object Implementation (JavaScript/TypeScript):**

```javascript
class Node {
  constructor(id, color) {
    this.id = id; // Unique string, e.g., "A1" or "Hex_45"
    this.color = color;
    this.piece = null; // null or Piece object
    // Adjacency pointers (absolute directions relative to the screen)
    this.edges = {
      N: null, S: null, E: null, W: null, 
      NE: null, NW: null, SE: null, SW: null
    }; 
  }
}

```

**Relative Vectors:**
Because "Forward" changes depending on whose turn it is, store a mapping of relative directions for each player. When Player 2 selects a Pawn, your move validator looks up Player 2's "Forward" vector (which might be the `West` edge in absolute terms) to calculate the next legal node.

---

### 3. State Serialization (No FEN)

Standard FEN strings cannot handle more than two players or irregular boards. You must serialize the game state as a custom JSON payload to pass between your backend and frontend.

* **Format Example:** `{ "turn": 1, "activePlayers": [0,1,2], "nodes": { "Hex_45": { "piece": "P", "owner": 1 } } }`
* **Multiplayer Syncing:** Use **WebSockets (Socket.io or native WS)**. Broadcast the JSON state change to all connected clients only after your server-side Graph validates the move. Do not trust the client to validate moves.

---

### 4. Variant Implementation Specs

#### Three-Player Chess

* **UI:** Hexagonal board (96 quadrilaterals). Draw this using SVG paths rotated 120 degrees for each third.
* **Logic Constraint:** Diagonals curve. A Bishop entering the center node must map its "Forward-Right" edge to the corresponding exit edge that maintains its square color. You must manually hardcode these specific edge connections at the center junction of your Graph.
* **Victory State:** First to checkmate wins. P1 gets 1pt, P2 gets 0pts, P3 gets 0.5pts.

#### Four-Player Chess

* **Logic Constraint:** Pawns move straight but promote on the 8th rank relative to their start, or the opposite edge.
* **Zombie State:** If playing Free-For-All, do not remove a mated player's pieces. Change their `Piece.owner` property to a neutral "Zombie" string. They cannot move, but they block paths and can be captured. This prevents sudden discovered checks from disappearing pieces.

#### Five-Player Chess

* **UI:** A pentagon with a central "null" hole. SVG is mandatory here for accurate mouse-click hitboxes.
* **Turn Order:** Implement an array mapping for "Star" order `[0, 2, 4, 1, 3]` to negate the massive advantage of moving consecutively before the board state settles.

#### Six-Player Chess

* **UI:** Expanded Hexagon utilizing all 6 sides.
* **Logic Constraint:** The center is a massive bottleneck. Performance-wise, ensure your recursive move validation algorithms (like sliding a Rook or Queen) `break` the loop the exact moment they hit a `Piece !== null` to save CPU cycles on the highly dense board.
* **Team Checkmate:** If playing 3v3 or 2v2v2, checkmating one player turns their pieces into inactive obstacles, but the team continues. The game loop skips the eliminated player's phase until all kings of an opposing alliance are captured.

