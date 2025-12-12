const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { ethers } = require('ethers');
const crypto = require('crypto');

const app = express();
const PORT = 5000; // Changed to 5000 to avoid conflict with React (3000)

app.use(cors());
app.use(bodyParser.json());

// --- In-Memory Database (For Demo Purposes) ---
// In a real production app, use MongoDB or PostgreSQL
let sessions = []; 
// format: { sessionId, nonce, title, date, createdAt }

let attendanceRecords = []; 
// format: { sessionId, walletAddress, email, tokenId, txHash, timestamp }

// --- API Endpoints ---

// 1. ADMIN: Create a new Session
app.post('/admin/session', (req, res) => {
    const { title, date } = req.body;
    
    if (!title || !date) {
        return res.status(400).json({ error: "Title and Date are required" });
    }

    const newSession = {
        sessionId: crypto.randomUUID(),
        nonce: crypto.randomUUID().substring(0, 16), // longer nonce for security
        title,
        date,
        createdAt: new Date().toISOString()
    };

    sessions.unshift(newSession); // Add to top
    console.log(`[ADMIN] Created Session: ${newSession.title} (${newSession.sessionId})`);
    
    res.json(newSession);
});

// 2. ADMIN: Get all sessions
app.get('/admin/sessions', (req, res) => {
    res.json(sessions);
});

// 3. STUDENT: Redeem/Mint Attendance
app.post('/student/redeem', async (req, res) => {
    const { email, sessionId, nonce, signature, walletAddress } = req.body;

    // A. Validation
    if (!email || !sessionId || !nonce || !signature || !walletAddress) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    // B. Check if session exists
    const session = sessions.find(s => s.sessionId === sessionId);
    if (!session) {
        return res.status(404).json({ error: "Invalid Session ID" });
    }

    // C. Verify Nonce (Prevent Replay Attacks from other sessions)
    if (session.nonce !== nonce) {
        return res.status(401).json({ error: "Invalid Nonce/QR Code" });
    }

    // D. Check if already attended
    const existing = attendanceRecords.find(
        r => r.sessionId === sessionId && r.walletAddress.toLowerCase() === walletAddress.toLowerCase()
    );
    if (existing) {
        return res.status(409).json({ error: "Attendance already marked for this wallet." });
    }

    // E. Cryptographic Signature Verification
    try {
        // Reconstruct the message exactly as the frontend built it
        const message = `Attendance Request\nEmail: ${email}\nSession: ${sessionId}\nNonce: ${nonce}`;
        
        // Recover address from signature
        const recoveredAddress = ethers.verifyMessage(message, signature);

        if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
            return res.status(401).json({ error: "Signature verification failed. Wallet mismatch." });
        }

    } catch (err) {
        console.error("Sig Verify Error:", err);
        return res.status(500).json({ error: "Crypto verification failed" });
    }

    // F. "Mint" the NFT (Simulate Blockchain Transaction)
    // In a real app, you would call a Smart Contract here.
    const tokenId = Math.floor(100000 + Math.random() * 900000).toString();
    const txHash = "0x" + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');

    const newRecord = {
        sessionId,
        walletAddress: walletAddress.toLowerCase(),
        email,
        tokenId,
        txHash,
        timestamp: new Date().toISOString()
    };

    attendanceRecords.push(newRecord);
    console.log(`[STUDENT] Attendance Marked: ${email} -> ${sessionId}`);

    res.json({ success: true, tokenId, txHash });
});

// 4. VALIDATOR: Verify Attendance
app.get('/validator/:sessionId/:walletAddress', (req, res) => {
    const { sessionId, walletAddress } = req.params;

    const record = attendanceRecords.find(
        r => r.sessionId === sessionId && r.walletAddress.toLowerCase() === walletAddress.toLowerCase()
    );

    if (record) {
        // Fetch session details for metadata
        const sessionDetails = sessions.find(s => s.sessionId === sessionId);
        
        return res.json({
            verified: true,
            tokenId: record.tokenId,
            metadata: {
                name: `${sessionDetails?.title || 'Class'} Badge`,
                description: "Official AU AccessX Attendance Proof",
                image: "https://cdn-icons-png.flaticon.com/512/6298/6298900.png", // Generic Badge Icon
                attributes: [
                    { trait_type: "Student Email", value: record.email },
                    { trait_type: "Date", value: sessionDetails?.date || record.timestamp },
                    { trait_type: "Timestamp", value: record.timestamp }
                ]
            }
        });
    } else {
        return res.status(404).json({ 
            verified: false, 
            error: "No attendance record found on-chain for this wallet/session combination." 
        });
    }
});

app.listen(PORT, () => {
    console.log(`AU AccessX Backend running on http://localhost:${PORT}`);
});