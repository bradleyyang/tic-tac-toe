const board = document.getElementById("board");
const cells = document.querySelectorAll(".cell");
const status = document.getElementById("status");
const turnIndicator = document.getElementById("turn-indicator");
const restartBtn = document.getElementById("restart");
const xScoreEl = document.getElementById("x-score");
const oScoreEl = document.getElementById("o-score");
const particlesContainer = document.getElementById("particles");

let currentPlayer = "X";
let gameBoard = ["", "", "", "", "", "", "", "", ""];
let gameActive = true;
let scores = { X: 0, O: 0 };

const winPatterns = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8], // Rows
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8], // Columns
    [0, 4, 8],
    [2, 4, 6], // Diagonals
];

function createXMark() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "x-mark animate");
    svg.setAttribute("viewBox", "0 0 60 60");

    const line1 = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line",
    );
    line1.setAttribute("x1", "10");
    line1.setAttribute("y1", "10");
    line1.setAttribute("x2", "50");
    line1.setAttribute("y2", "50");

    const line2 = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line",
    );
    line2.setAttribute("x1", "50");
    line2.setAttribute("y1", "10");
    line2.setAttribute("x2", "10");
    line2.setAttribute("y2", "50");

    svg.appendChild(line1);
    svg.appendChild(line2);
    return svg;
}

function createOMark() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "o-mark animate");
    svg.setAttribute("viewBox", "0 0 60 60");

    const circle = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle",
    );
    circle.setAttribute("cx", "30");
    circle.setAttribute("cy", "30");
    circle.setAttribute("r", "22");

    svg.appendChild(circle);
    return svg;
}

function createRipple(e, cell) {
    const ripple = document.createElement("div");
    ripple.className = "ripple";
    const rect = cell.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = size + "px";
    ripple.style.left = e.clientX - rect.left - size / 2 + "px";
    ripple.style.top = e.clientY - rect.top - size / 2 + "px";
    cell.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
}

function createParticles(x, y, color) {
    const colors = ["#DA7756", "#E8956F", "#C4654A", "#5A4F3F", "#FAF9F7"];
    for (let i = 0; i < 30; i++) {
        const particle = document.createElement("div");
        particle.className = "particle";
        particle.style.left = x + "px";
        particle.style.top = y + "px";
        particle.style.backgroundColor =
            colors[Math.floor(Math.random() * colors.length)];
        particle.style.width = Math.random() * 10 + 5 + "px";
        particle.style.height = particle.style.width;

        const angle = Math.random() * 360 * (Math.PI / 180);
        const velocity = Math.random() * 200 + 100;
        const vx = Math.cos(angle) * velocity;
        const vy = Math.sin(angle) * velocity;

        particle.animate(
            [
                {
                    transform: "translate(0, 0) rotate(0deg) scale(1)",
                    opacity: 1,
                },
                {
                    transform: `translate(${vx}px, ${vy + 200}px) rotate(720deg) scale(0)`,
                    opacity: 0,
                },
            ],
            {
                duration: 1000 + Math.random() * 500,
                easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
            },
        );

        particlesContainer.appendChild(particle);
        setTimeout(() => particle.remove(), 1500);
    }
}

function createWinLine(pattern) {
    const winLine = document.createElement("div");
    winLine.className = "win-line";

    const firstCell = cells[pattern[0]];
    const lastCell = cells[pattern[2]];
    const boardRect = board.getBoundingClientRect();
    const firstRect = firstCell.getBoundingClientRect();
    const lastRect = lastCell.getBoundingClientRect();

    const startX = firstRect.left + firstRect.width / 2 - boardRect.left;
    const startY = firstRect.top + firstRect.height / 2 - boardRect.top;
    const endX = lastRect.left + lastRect.width / 2 - boardRect.left;
    const endY = lastRect.top + lastRect.height / 2 - boardRect.top;

    // Horizontal
    if (
        pattern[0] % 3 === 0 &&
        pattern[2] % 3 === 2 &&
        Math.floor(pattern[0] / 3) === Math.floor(pattern[2] / 3)
    ) {
        winLine.classList.add("horizontal");
        winLine.style.left = "20px";
        winLine.style.top = startY + "px";
        winLine.style.transform = "translateY(-50%)";
    }
    // Vertical
    else if (pattern[2] - pattern[0] === 6) {
        winLine.classList.add("vertical");
        winLine.style.left = startX + "px";
        winLine.style.top = "20px";
        winLine.style.transform = "translateX(-50%)";
    }
    // Diagonal
    else {
        winLine.classList.add("diagonal");
        const centerX = (startX + endX) / 2;
        const centerY = (startY + endY) / 2;
        const angle =
            Math.atan2(endY - startY, endX - startX) * (180 / Math.PI);
        winLine.style.left = "50%";
        winLine.style.top = "50%";
        winLine.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
    }

    board.appendChild(winLine);
}

function updateStatus() {
    const statusSpan = status.querySelector("span");
    statusSpan.textContent = `Player ${currentPlayer}'s turn`;
    turnIndicator.className = `turn-indicator ${currentPlayer.toLowerCase()}-turn`;
    status.classList.remove("winner");
}

function checkWin() {
    for (const pattern of winPatterns) {
        const [a, b, c] = pattern;
        if (
            gameBoard[a] &&
            gameBoard[a] === gameBoard[b] &&
            gameBoard[a] === gameBoard[c]
        ) {
            return { winner: gameBoard[a], pattern };
        }
    }
    return null;
}

function checkDraw() {
    return gameBoard.every((cell) => cell !== "");
}

function handleCellClick(e) {
    const cell = e.target.closest(".cell");
    if (!cell) return;

    const index = parseInt(cell.dataset.index);

    if (gameBoard[index] || !gameActive) return;

    createRipple(e, cell);

    gameBoard[index] = currentPlayer;
    cell.classList.add("taken");

    if (currentPlayer === "X") {
        cell.appendChild(createXMark());
    } else {
        cell.appendChild(createOMark());
    }

    const result = checkWin();
    if (result) {
        gameActive = false;
        const statusSpan = status.querySelector("span");
        statusSpan.textContent = `Player ${result.winner} wins!`;
        turnIndicator.style.display = "none";
        status.classList.add("winner");

        // Highlight winning cells
        result.pattern.forEach((index) => {
            cells[index].classList.add("winning");
        });

        // Create win line
        createWinLine(result.pattern);

        // Update score
        scores[result.winner]++;
        const scoreEl = result.winner === "X" ? xScoreEl : oScoreEl;
        scoreEl.textContent = scores[result.winner];
        scoreEl.classList.add("pop");
        setTimeout(() => scoreEl.classList.remove("pop"), 400);

        // Create celebration particles
        const boardRect = board.getBoundingClientRect();
        setTimeout(() => {
            createParticles(
                boardRect.left + boardRect.width / 2,
                boardRect.top + boardRect.height / 2,
            );
        }, 300);

        return;
    }

    if (checkDraw()) {
        gameActive = false;
        const statusSpan = status.querySelector("span");
        statusSpan.textContent = "It's a draw!";
        turnIndicator.style.display = "none";
        board.classList.add("draw-state");
        setTimeout(() => board.classList.remove("draw-state"), 500);
        return;
    }

    currentPlayer = currentPlayer === "X" ? "O" : "X";
    updateStatus();
}

function restartGame() {
    gameBoard = ["", "", "", "", "", "", "", "", ""];
    gameActive = true;
    currentPlayer = "X";

    // Remove win line if exists
    const winLine = board.querySelector(".win-line");
    if (winLine) winLine.remove();

    cells.forEach((cell, index) => {
        cell.innerHTML = "";
        cell.classList.remove("taken", "winning");
        cell.style.animation = "none";
        cell.offsetHeight; // Trigger reflow
        cell.style.animation = `cellEntry 0.4s ease ${0.05 * index}s both`;
    });

    turnIndicator.style.display = "block";
    updateStatus();
}

// Event Listeners
board.addEventListener("click", handleCellClick);
restartBtn.addEventListener("click", restartGame);

// Initialize
updateStatus();
