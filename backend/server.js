const express = require('express');
const { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const bs58 = require('bs58');
const nacl = require('tweetnacl');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors({ origin: "https://moonroadx.github.io" }));
app.use(express.json());

const connection = new Connection(process.env.RPC_ENDPOINT || "https://api.devnet.solana.com");
const REWARD_WALLET = bs58.decode(process.env.PRIVATE_KEY);
const rewardKeypair = solanaWeb3.Keypair.fromSecretKey(REWARD_WALLET);

// Base de données temporaire (scores)
const scoresDB = new Map();

// Endpoint principal
app.post('/api/submit-score', async (req, res) => {
    try {
        const { wallet, score, difficulty, signature, message } = req.body;
        
        // 1. Vérifier signature
        const publicKey = new PublicKey(wallet);
        const signatureUint8 = new Uint8Array(signature);
        const messageUint8 = new Uint8Array(message);
        
        const verified = nacl.sign.detached.verify(
            messageUint8,
            signatureUint8,
            publicKey.toBytes()
        );
        
        if (!verified) return res.status(401).json({ success: false, error: "Signature invalide" });
        
        // 2. Anti-cheat
        if (score > 5000) return res.status(400).json({ success: false, error: "Score suspect" });
        
        // 3. Calcul récompense
        const baseReward = { easy: 0.1, normal: 0.5, hard: 1.0 };
        const rewardAmount = parseFloat((score * baseReward[difficulty] / 100).toFixed(2));
        
        // 4. Vérifier record
        const currentHigh = scoresDB.get(wallet) || 0;
        if (score > currentHigh) {
            scoresDB.set(wallet, score);
            
            // 5. Envoyer SOL sur Devnet
            const transaction = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey: rewardKeypair.publicKey,
                    toPubkey: publicKey,
                    lamports: rewardAmount * LAMPORTS_PER_SOL
                })
            );
            
            const tx = await connection.sendTransaction(transaction, [rewardKeypair]);
            await connection.confirmTransaction(tx);
            
            return res.json({ success: true, reward: rewardAmount, tx, newRecord: true });
        }
        
        res.json({ success: true, newRecord: false });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Récupérer highscore
app.get('/api/highscore/:wallet', (req, res) => {
    res.json({ highScore: scoresDB.get(req.params.wallet) || 0 });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ API en ligne sur le port ${PORT}`));
