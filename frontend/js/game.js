// ==== JEU FLAPPY CZ - VERSION SIMPLIFIÉE ====
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const menuOverlay = document.getElementById('menuOverlay');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const soundBtn = document.getElementById('soundBtn');
const soundIcon = document.getElementById('soundIcon');
const highScoreEl = document.getElementById('highScore');
const finalScoreEl = document.getElementById('finalScore');
const finalHighScoreEl = document.getElementById('finalHighScore');
const difficultyBadge = document.getElementById('difficultyBadge');

// Game variables
let gameState = 'menu';
let bird = { y: 250, velocity: 0, x: 100 };
let pipes = [];
let score = 0;
let highScore = 0;
let animationId;

// Difficulty settings
const difficulties = {
    easy: { gravity: 0.4, jumpStrength: -9, pipeGap: 280, pipeSpeed: 2.5, pipeSpacing: 450 },
    normal: { gravity: 0.5, jumpStrength: -10, pipeGap: 250, pipeSpeed: 3, pipeSpacing: 400 },
    hard: { gravity: 0.6, jumpStrength: -11, pipeGap: 220, pipeSpeed: 3.5, pipeSpacing: 350 }
};
let currentDifficulty = 'easy';

// Set difficulty
function setDifficulty(diff) {
    currentDifficulty = diff;
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.className = 'difficulty-btn px-4 py-2 rounded-lg font-bold text-sm transition-all bg-white/10 text-gray-300';
    });
    const selected = document.getElementById(diff + 'Btn');
    selected.className = `difficulty-btn px-4 py-2 rounded-lg font-bold text-sm transition-all bg-gradient-to-r from-green-400 to-green-600 text-white shadow-lg`;
}

// Initialize game
function initGame() {
    bird = { y: 250, velocity: 0, x: 100 };
    pipes = [
        { x: 600, topHeight: 150, passed: false },
        { x: 1050, topHeight: 200, passed: false },
        { x: 1500, topHeight: 100, passed: false }
    ];
    score = 0;
}

// Jump
function jump() {
    if (gameState === 'menu') {
        gameState = 'playing';
        menuOverlay.style.display = 'none';
        initGame();
    } else if (gameState === 'playing') {
        bird.velocity = difficulties[currentDifficulty].jumpStrength;
    } else if (gameState === 'gameOver') {
        gameState = 'playing';
        gameOverOverlay.style.display = 'none';
        initGame();
    }
}

// Check collision
function checkCollision() {
    const settings = difficulties[currentDifficulty];
    if (bird.y + 60 > canvas.height || bird.y < 0) return true;
    
    for (let pipe of pipes) {
        if (bird.x + 60 > pipe.x && bird.x < pipe.x + 80) {
            if (bird.y < pipe.topHeight || bird.y + 60 > pipe.topHeight + settings.pipeGap) {
                return true;
            }
        }
    }
    return false;
}

// Game loop
function gameLoop() {
    const settings = difficulties[currentDifficulty];
    
    // Clear canvas
    ctx.fillStyle = '#0ea5e9';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (gameState === 'playing') {
        // Update bird
        bird.velocity += settings.gravity;
        bird.y += bird.velocity;

        // Update pipes
        for (let i = pipes.length - 1; i >= 0; i--) {
            pipes[i].x -= settings.pipeSpeed;

            // Score
            if (!pipes[i].passed && bird.x > pipe.x + 80) {
                pipes[i].passed = true;
                score += 10;
                if (score > highScore) {
                    highScore = score;
                    highScoreEl.textContent = highScore;
                }
            }

            // Remove and add pipes
            if (pipes[i].x + 80 < 0) {
                pipes.splice(i, 1);
                const lastPipe = pipes[pipe.length - 1];
                pipes.push({
                    x: lastPipe.x + settings.pipeSpacing,
                    topHeight: Math.random() * 200 + 50,
                    passed: false
                });
            }
        }

        // Collision
        if (checkCollision()) {
            gameState = 'gameOver';
            finalScoreEl.textContent = score;
            finalHighScoreEl.textContent = highScore;
            difficultyBadge.textContent = currentDifficulty;
            gameOverOverlay.style.display = 'flex';
            
            // ENVOI BLOCKCHAIN
            if (score >= highScore && walletConnected) {
                submitScoreToBlockchain(score, currentDifficulty);
            }
        }
    }

    // Draw pipes
    pipes.forEach(pipe => {
        ctx.fillStyle = '#16a34a';
        ctx.fillRect(pipe.x, 0, 80, pipe.topHeight);
        ctx.fillRect(pipe.x, pipe.topHeight + settings.pipeGap, 80, canvas.height);
    });

    // Draw bird
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(bird.x + 30, bird.y + 30, 30, 0, Math.PI * 2);
    ctx.fill();

    // Draw score
    ctx.fillStyle = 'white';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(score, canvas.width / 2, 80);

    animationId = requestAnimationFrame(gameLoop);
}

// Event listeners
canvas.addEventListener('click', jump);
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    jump();
});
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        jump();
    }
});
startBtn.addEventListener('click', jump);
restartBtn.addEventListener('click', jump);
window.setDifficulty = setDifficulty;

// Start game loop
gameLoop();
