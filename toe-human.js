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
// HumanPlayer class
class HumanPlayer {
  constructor() {
      this.name = "Player";
      this.win = 0;
  }

  play() {
      $message.textContent = `${this.name}'s turn`; // Updated message

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

function hasConsecutiveSymbols(slice, player) {
    return slice.every(cell => cell === player.symbol);
}

function hasConsecutiveSymbols(slice, player) {
    return slice.every(cell => cell === player.symbol);
}

function hasHorizontalWin(player) {
    for (const combo of winPatterns) {
        if (combo.every(([row, col]) => board[row * 6 + col] === player.symbol)) {
            return true;
        }
    }
    return false;
}

function hasVerticalWin(player) {
    for (let col = 0; col < 6; col++) {
        const combo = [];
        for (let row = 0; row < 5; row++) {
            combo.push(row * 6 + col);
        }
        if (combo.every(index => board[index] === player.symbol)) {
            return true;
        }
    }
    return false;
}
function hasDiagonalWin(player) {
    for (const combo of winPatterns) {
        if (combo.every(([row, col]) => board[row * 6 + col] === player.symbol)) {
            return true;
        }
    }
    return false;
}

function hasWon(player) {
    return hasHorizontalWin(player) || hasVerticalWin(player) || hasDiagonalWin(player);
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
    return hasWon(player) || hasWon(opponent) || !hasAvailableMove();
}

function declareTurnWinner() {
    let winner = getWinner();

    if (winner) {
        winner.win++;
        $message.textContent = `${winner.name} wins!`;
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
            "The dice are rolling!";

        let scoreA = Math.floor(Math.random() * 5) + 1;
        let scoreB = Math.floor(Math.random() * 3) + 1; 

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
            ).textContent = `Player: ${scoreA} - ${opponent.name}: ${scoreB}.`;
            $diceRoll.querySelector(
                ".dice-result"
            ).textContent = `${startingPlayer.name} starts!`;

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
    $board.classList.remove("hide");
    $diceRoll.classList.add("hide");

    player = new HumanPlayer();
    player.name = "Player 1"; // Change player name here
    player.symbol = PLAYER;

    opponent = new HumanPlayer();
    opponent.name = "Player 2"; // Change opponent name here
    opponent.symbol = OPPONENT;

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
