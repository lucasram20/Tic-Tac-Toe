const EMPTY = -1;
const PLAYER = 0;
const OPPONENT = 1;

// DOM
const $board = document.querySelector(".board");
const $cells = Array.from($board.children);
const $diceRoll = document.querySelector(".dice-roll");
const $scores = document.querySelector(".scores");
const $message = document.querySelector(".message");
const $playBtn = document.querySelector(".play-btn");

let board = emptyBoard();
let winPatterns = [
    // Rows
    [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5]],
    [[1, 0], [1, 1], [1, 2], [1, 3], [1, 4], [1, 5]],
    [[2, 0], [2, 1], [2, 2], [2, 3], [2, 4], [2, 5]],
    [[3, 0], [3, 1], [3, 2], [3, 3], [3, 4], [3, 5]],
    [[4, 0], [4, 1], [4, 2], [4, 3], [4, 4], [4, 5]],
    // Columns
    [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]],
    [[0, 1], [1, 1], [2, 1], [3, 1], [4, 1]],
    [[0, 2], [1, 2], [2, 2], [3, 2], [4, 2]],
    [[0, 3], [1, 3], [2, 3], [3, 3], [4, 3]],
    [[0, 4], [1, 4], [2, 4], [3, 4], [4, 4]],
    [[0, 5], [1, 5], [2, 5], [3, 5], [4, 5]],
    // Diagonals
    [[0, 1],[1, 0]],
    [[0, 2],[1, 1],[2, 0]],
    [[0, 3],[1, 2],[2, 1],[3, 0]],
    [[0, 4],[1, 3],[2, 2],[4, 0]],
    [[0, 5],[1, 4],[2, 3],[4, 1]],
    [[1, 5],[2, 4],[3, 3],[4, 2]],
    [[2, 5],[3, 4],[4, 3],],
    [[3, 5],[4, 4]],
    [[3, 0],[4, 1]],
    [[2, 0],[3, 1],[4, 2]],
    [[1, 0],[2, 1],[3, 2],[4, 3]],
    [[0, 0],[1, 1],[2, 2],[3, 3],[4, 4]],
    [[0, 1],[1, 2],[3, 4],[4, 5]],
    [[0, 2],[1, 3],[2, 4],[3, 5]],
    [[0, 3],[1, 4],[2, 5]],
    [[0, 4],[1, 5]]
];

// Minimax or Min-Max Algorithm
class AI {
    constructor(difficulty = 1) {
        this.difficulty = difficulty;
    }

    findBestMove() {
        return this.minimax(this.difficulty, OPPONENT).position;
    }

    minimax(depth, minmaxer) {
        let nextMoves = getAvailableMoves();
        let bestMove = {
            score: minmaxer === OPPONENT ? -10000 : 10000,
            position: -1
        };

        if (!nextMoves.length || depth === 0) {
            bestMove.score = this.evaluate();
        } else {
            for (let i = 0; i < nextMoves.length; ++i) {
                let moveSimulation = nextMoves[i];
                board[moveSimulation] = minmaxer;

                let score = this.minimax(
                    depth - 1,
                    minmaxer === OPPONENT ? PLAYER : OPPONENT
                ).score;

                if (
                    (minmaxer === OPPONENT && score > bestMove.score) ||
                    (minmaxer === PLAYER && score < bestMove.score)
                ) {
                    bestMove = { score: score, position: moveSimulation };
                }

                board[moveSimulation] = EMPTY;
            }
        }

        return bestMove;
    }

    evaluate() {
        let score = 0;
    
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 6; col++) {
                score += this.evaluateLine(
                    row * 6 + col,
                    row * 6 + col + 1,
                    row * 6 + col + 2
                ); // row
                score += this.evaluateLine(
                    row * 6 + col,
                    (row + 1) * 6 + col,
                    (row + 2) * 6 + col
                ); // column
                score += this.evaluateLine(
                    row * 6 + col,
                    (row + 1) * 6 + col + 1,
                    (row + 2) * 6 + col + 2
                ); // diagonal \
                score += this.evaluateLine(
                    row * 6 + col + 2,
                    (row + 1) * 6 + col + 1,
                    (row + 2) * 6 + col
                ); // diagonal /
            }
        }
    
        // Consider the user's moves
        for (let move of getAvailableMoves()) {
            board[move] = PLAYER; // Assume the user's move
            score += this.evaluateMove(move);
            board[move] = EMPTY; // Reset the board
        }
    
        return score;
    }

    evaluateMove(move) {
        let score = 0;
        let opponentWinningMoves = [];
    
        // Filter winPatterns to include only those affected by the current move
        let affectedPatterns = winPatterns.filter(pattern => pattern.some(([row, col]) => {
            let idx = row * 6 + col;
            return board[idx] === PLAYER || board[idx] === OPPONENT || idx === move;
        }));
    
        // Evaluate the move itself
        for (let pattern of affectedPatterns) {
            if (pattern.some(([row, col]) => board[row * 6 + col] === PLAYER)) {
                score += 5; // Encourages the AI to block user's winning moves
            }
            if (pattern.some(([row, col]) => board[row * 6 + col] === OPPONENT)) {
                opponentWinningMoves.push(pattern);
            }
        }
    
        // Block opponent's winning moves
        for (let move of opponentWinningMoves) {
            let emptyCells = move.filter(([row, col]) => board[row * 6 + col] === EMPTY);
            if (emptyCells.length === 1) {
                score += 20; // Block a potential win for the opponent
            }
        }
    
        // Consider proximity to user's move
        let userRow = Math.floor(move / 6);
        let userCol = move % 6;
    
        for (let pattern of affectedPatterns) {
            let proximity = pattern.reduce((acc, [row, col]) => {
                return acc + Math.abs(row - userRow) + Math.abs(col - userCol);
            }, 0);
    
            score += 1 / (proximity + 1); // Higher score for closer proximity
        }
    
        // Prioritize creating own winning moves
        for (let pattern of affectedPatterns) {
            let emptyCells = pattern.filter(([row, col]) => board[row * 6 + col] === EMPTY);
            if (emptyCells.length === 1) {
                score += 30; // Encourage the AI to secure its winning move
            }
        }
    
        // Additional considerations based on the user's move can be added here
    
        return score;
    }

    evaluateLine(a, b, c) {
        let score = 0;
        let cA = board[a];
        let cB = board[b];
        let cC = board[c];

        if (cA == OPPONENT) {
            score = 1;
        } else if (cA == PLAYER) {
            score = -1;
        }

        if (cB == OPPONENT) {
            if (score == 1) {
                score = 10;
            } else if (score == -1) {
                return 0;
            } else {
                score = 1;
            }
        } else if (cB == PLAYER) {
            if (score == -1) {
                score = -10;
            } else if (score == 1) {
                return 0;
            } else {
                score = -1;
            }
        }

        if (cC == OPPONENT) {
            if (score < 0) {
                score *= 10;
            } else if (score > 0) {
                return 0;
            } else {
                score = 1;
            }
        } else if (cC == PLAYER) {
            if (score > 0) {
                score *= 10;
            } else if (score < 0) {
                return 0;
            } else {
                score = -1;
            }
        }

        // Additional difficulty-based strategies
        if (this.difficulty === 'difficult' || this.difficulty === 'expert') {
            // Block opponent from winning
            if (cA === EMPTY && cB === OPPONENT && cC === OPPONENT) {
                score += 20;
            }

            // Create two-in-a-row opportunities
            if (cA === EMPTY && cB === PLAYER && cC === PLAYER) {
                score += 15;
            }
        }
        // Additional strategies for 'expert' difficulty
        if (this.difficulty === 'expert') {
            // Prioritize center position
            if ((a === 2 && b === 3 && c === 4) || (a === 3 && b === 2 && c === 4)) {
                score += 5;
            }

            // Prioritize corners
            if ((a === 0 && c === 5) || (a === 5 && c === 0)) {
                score += 3;
            }
        }

        return score;
    }
}

class HumanPlayer {
    constructor() {
        this.name = "You";
        this.win = 0;
    }

   
    play() {
        $message.textContent = "Your turn!";

        return new Promise((resolve) => {
            let disposeFn = event($board, "click", (e) => {
                let target = e.target;
                if (target.classList.contains("cell")) {
                    // If we hit a cell
                    let idx = $cells.indexOf(target); // get the cell index.
                    if (getAvailableMoves().indexOf(idx) !== -1) {
                        // must be available
                        disposeFn();
                        resolve(idx);
                    }
                }
            });
        });
    }
}

class AIPlayer {
    constructor(difficulty = 2) {
        this.difficulty = difficulty;
        this.name = `${this._getRandomName()}(AI)`;
        this.win = 0;
        this.ai = new AI(this.difficulty); // Pass the difficulty level
    }

    _getRandomName() {
        return AIPlayer.names[
            Math.floor(Math.random() * (AIPlayer.names.length - 1))
        ];
    }

    play() {
        $message.textContent = `${this.name}'s turn`;
        return new Promise((res) => {
            let randomTimer = Math.floor(Math.random() * 1000 + 500);
            let move = this.ai.findBestMove();
            setTimeout(() => res(move), randomTimer);
        });
    }
}


AIPlayer.names = [
    "Athena",
    "Zeus",
    "Zagreus",
    "Hades",
    "Poseidon",
    "Magnus",
    "Hermes",
    "Percy",
    "Odin",
    "Erebus",
    "Dionysus",
    "Jesus",
    "Nyarlath",
    "Zenith"
];

let player = null;
let opponent = null;
let startingPlayer = null;
let currentPlayer = null;

/**
 * Game utils
 */
function emptyBoard() {
    return [
        EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY,
        EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY,
        EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY,
        EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY,
        EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY,
    ];
}

function hasAvailableMove() {
    return board.some((cell) => cell === EMPTY);
}

function getAvailableMoves() {
    return board.reduce((acc, current, idx) => {
        current === EMPTY && acc.push(idx);
        return acc;
    }, []);
}

function hasWon(player) {
    let pattern = board.reduce((acc, curr, i) => {
        curr === player.symbol && (acc |= 1 << i);
        return acc;
    }, 0b000000000);

    console.log(pattern, winPatterns);

    return winPatterns.some((winPattern) => {
        return winPattern.every(([row, col]) => board[row * 6 + col] === player.symbol);
    });
}


function getWinner() {
    if (hasWon(player)) return player;
    if (hasWon(opponent)) return opponent;
    return null;
}

function clearBoard() {
    board = emptyBoard();
    $cells.forEach((cell) => {
        cell.classList.remove("cross");
        cell.classList.remove("circle");
    });
}

function updateBoard(idx, symbol) {
    board[idx] = symbol;
    $board.children[idx].classList.add(symbol === PLAYER ? "cross" : "circle");
}

function isOver() {
    console.log(board);
    return hasWon(player) || hasWon(opponent) || !hasAvailableMove();
}
function declareTurnWinner() {
    let winner = getWinner();

    if (winner) {
        winner.win++;
        $message.textContent = `${winner.name} win!`;
        $scores.children[winner.symbol]
            .querySelectorAll("li")
            [winner.win - 1].classList.add("won");

        if (player.win == 5) {
            endState(player);
        } else if (opponent.win == 5) {
            endState(opponent);
        } else {
            nextTurn();
        }
    } else {
        $message.textContent = `Draw!`;
        nextTurn();
    }
}

function nextTurn() {
    $playBtn.textContent = "Next turn";
    $playBtn.classList.remove("hide");

    let disposeEvent = event($playBtn, "click", () => {
        currentPlayer = startingPlayer;
        $playBtn.classList.add("hide");
        clearBoard();
        disposeEvent();
        takeTurn();
    });
}

function getOpponent(which) {
    return which === player ? opponent : player;
}

function takeTurn() {
    return currentPlayer.play().then((move) => {
        updateBoard(move, currentPlayer.symbol);
        currentPlayer = getOpponent(currentPlayer);
        return isOver() ? declareTurnWinner() : takeTurn();
    });
}

/**
 * Events handling
 */
let events = [];

function event(target, type, handler) {
    target.addEventListener(type, handler);
    return function disposeEvent() {
        target.removeEventListener(type, handler);
    };
}

function removeEvents() {
    events.forEach((disposeFn) => disposeFn());
    events = [];
}

/**
 * Game States
 */
function initState() {
    removeEvents();

    $scores.classList.add("hide");
    $diceRoll.classList.add("hide");
    $playBtn.classList.remove("hide");

    $playBtn.textContent = "Click to start";
    $message.textContent = "Tic Tac Toe";

    events.push(event($playBtn, "click", playerSetup));
}

function dice() {
    $playBtn.classList.add("hide");
    document.body.classList.remove("playing");

    setTimeout(() => {
        $playBtn.textContent = "Click to throw the dice";
        $playBtn.classList.remove("hide");
    }, 500);

    let disposeEvent = event($playBtn, "click", onDiceRoll);

    function onDiceRoll() {
        $playBtn.classList.add("hide");

        $diceRoll.querySelector(".dice-rolling").textContent =
            "The dices are rolling!";

        let scoreA = Math.floor(Math.random() * 5) + 1;
        let scoreB = Math.floor(Math.random() * 3) + 1; // Yes...cheating here, so player has more chance to start... :)

        while (scoreA === scoreB) {
            scoreA = Math.floor(Math.random() * 5) + 1;
            scoreB = Math.floor(Math.random() * 3) + 1;
        }

        startingPlayer = scoreA > scoreB ? player : opponent;
        currentPlayer = startingPlayer;

        disposeEvent();

        setTimeout(() => {
            $diceRoll.querySelector(
                ".dice-score"
            ).textContent = `You: ${scoreA} - ${opponent.name}: ${scoreB}.`;
            $diceRoll.querySelector(
                ".dice-result"
            ).textContent = `${startingPlayer.name} start!`;

            $playBtn.textContent = "Start";
            $playBtn.classList.remove("hide");

            events.push(event($playBtn, "click", playingState));
        }, 1000);
    }
}

function playerSetup() {
    removeEvents();

    $scores.classList.add("hide");
    $message.classList.add("hide");
    $playBtn.classList.add("hide");
    $board.classList.add("hide");
    $diceRoll.classList.remove("hide");

    $diceRoll.querySelector(".dice-rolling").textContent = "";
    $diceRoll.querySelector(".dice-score").textContent = "";
    $diceRoll.querySelector(".dice-result").textContent = "";

    player = new HumanPlayer();
    player.symbol = PLAYER;

    opponent = new AIPlayer();
    opponent.symbol = OPPONENT;

    $diceRoll.querySelector(
        ".opponent"
    ).textContent = `You are playing against ${opponent.name}`;

    dice();
}


function playingState() {
    removeEvents();
    clearBoard();
    Array.from($scores.querySelectorAll("li")).forEach((li) =>
        li.classList.remove("won")
    );

    $board.classList.remove("hide");
    $scores.classList.remove("hide");
    $playBtn.classList.add("hide");
    $diceRoll.classList.add("hide");
    $message.classList.remove("hide");

    $scores.children[PLAYER].querySelector("span").textContent = player.name;
    $scores.children[OPPONENT].querySelector("span").textContent =
        opponent.name;

    document.body.classList.add("playing");

    takeTurn();
}

function endState(winner) {
    removeEvents();

    $message.textContent = `${winner.name} won the game!`;
    document.body.classList.remove("playing");

    $playBtn.classList.remove("hide");
    $playBtn.textContent = "Try again!";

    events.push(event($playBtn, "click", playerSetup));
}

initState();
