// ==== WALLET BLOCKCHAIN - DEVNET ====
const { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } = solanaWeb3;

// ⚠️ À MODIFIER APRÈS DÉPLOIEMENT BACKEND
const BACKEND_API = "https://VOTRE-PROJET.railway.app"; // <-- CHANGEZ CECI PLUS TARD

// State
let walletConnected = false;
let walletPublicKey = null;
let connection = new Connection("https://api.devnet.solana.com");

// Connect wallet
async function connectWallet() {
    try {
        const { solana } = window;
        if (!solana) {
            alert('📦 Installez Phantom wallet !\nhttps://phantom.app/');
            return;
        }
        
        const response = await solana.connect({ onlyIfTrusted: false });
        walletPublicKey = response.publicKey;
        walletConnected = true;
        
        updateWalletUI();
        await loadWalletHighScore();
    } catch (error) {
        console.error("❌ Erreur connexion:", error);
    }
}

// Update UI
function updateWalletUI() {
    const walletBtn = document.getElementById('walletBtn');
    const walletStatus = document.getElementById('walletStatus');
    const walletAddress = document.getElementById('walletAddress');
    
    if (walletConnected) {
        const address = walletPublicKey.toString();
        const shortAddress = `${address.slice(0, 4)}...${address.slice(-4)}`;
        
        walletBtn.textContent = `✅ ${shortAddress}`;
        walletBtn.className = "absolute right-4 top-3 px-3 py-1 bg-gradient-to-r from-green-400 to-emerald-500 text-white font-bold rounded-lg text-xs";
        
        walletStatus.classList.remove('hidden');
        walletAddress.textContent = `Wallet: ${shortAddress}`;
    }
}

// Load high score
async function loadWalletHighScore() {
    try {
        const response = await fetch(`${BACKEND_API}/highscore/${walletPublicKey}`);
        const data = await response.json();
        if (data.highScore) {
            highScore = data.highScore;
            document.getElementById('highScore').textContent = highScore;
        }
    } catch (error) {
        console.warn("⚠️ Pas de highscore:", error);
    }
}

// Submit score
async function submitScoreToBlockchain(score, difficulty) {
    if (!walletConnected) {
        alert('⚠️ Connectez votre wallet !');
        return false;
    }

    try {
        const timestamp = Date.now();
        const message = new TextEncoder().encode(`FlappyCZ-Score:${score}:${timestamp}:${difficulty}`);
        const { solana } = window;
        
        const signed = await solana.signMessage(message, "utf8");
        
        const response = await fetch(`${BACKEND_API}/submit-score`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                wallet: walletPublicKey.toString(),
                score: score,
                difficulty: difficulty,
                signature: Array.from(signed.signature),
                message: Array.from(message)
            })
        });

        const result = await response.json();
        
        if (result.success && result.reward) {
            showRewardNotification(result.reward);
            return true;
        }
        
        return false;
    } catch (error) {
        console.error("❌ Erreur envoi score:", error);
        return false;
    }
}

// Notification récompense
function showRewardNotification(reward) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-3 rounded-xl font-bold shadow-2xl z-50 animate-bounce';
    notification.innerHTML = `🎉 +${reward} SOL gagnés !`;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.remove(), 4000);
}

// Event
document.getElementById('walletBtn').addEventListener('click', connectWallet);
