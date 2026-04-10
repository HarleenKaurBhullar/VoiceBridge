const express = require("express");
const http = require("http");          // 👈 REQUIRED
const { Server } = require("socket.io");
const crypto = require("crypto");
const cors = require("cors");
const app = express();
app.use(cors());
const server = http.createServer(app); // 👈 wrap express
const io = new Server(server, {
    cors: {
        origin: "*"
    }
});
const axios = require("axios");
const rooms = new Set();

app.use(express.static("public"));

function generateRoomCode() {
    return crypto.randomUUID().slice(0, 8).toUpperCase();
}

// API route
app.get("/create-room", (req, res) => {
    const code = generateRoomCode();
    rooms.add(code);
    res.json({ code });
});


// 🔥 SOCKET.IO LOGIC
io.on("connection", (socket) => {
    console.log("User connected:", socket.id);
    socket.onAny((event, ...args) => {
        console.log("📩 Event received:", event, args);
    });

    socket.on("join-room", (roomCode) => {
        if (!rooms.has(roomCode)) {
            socket.emit("error", "Room does not exist");
            return;
        }

        socket.join(roomCode);
        console.log(`User ${socket.id} joined room ${roomCode}`);
    });

    // Example: send message to room
    socket.on("send-transcript", async (data) => {
    const { room, text, sourcelang, targetlang } = data;
    if(!text || !sourcelang || !targetlang) {
        socket.emit("error", "Invalid transcript data");
        return;
    }
    if(!rooms.has(room)) {
        socket.emit("error", "Room does not exist");
        return;
    }


    try {
        // Call Python API
        const response = await axios.post("http://localhost:5001/translate", {
            text: text,
            source: sourcelang,
            target: targetlang
        });

        console.log("FULL RESPONSE FROM FLASK:", response.data);
        const translatedText = response.data.translation;

        // Send to ALL users (including sender)
        io.to(room).emit("receive-translation", {
    user: socket.id,
    translatedText: translatedText,
    language: response.data.language   // 👈 THIS FIXES EVERYTHING
});
        console.log("Emitting to room:", room, "user:", socket.id, "Translated Text:", translatedText);

    } catch (error) {
        console.error("Translation error:", error.message);
    }
});

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });
});


(async () => {
    const module = await import('@andresaya/edge-tts');
    EdgeTTS = module.EdgeTTS;
    console.log("✅ EdgeTTS library loaded globally");
})();
// Add this alongside your existing socket.io setup
// server.js — replace the endpoint
app.get('/tts', async (req, res) => {
    const { text, lang } = req.query;
    if (!text) return res.status(400).send('No text');

    try {
        // ✅ dynamic import (IMPORTANT)
        

        const tts = new EdgeTTS();
        const voice = lang && lang.includes('hi')
            ? 'hi-IN-SwaraNeural'
            : 'en-US-AriaNeural';

        await tts.synthesize(text, voice, { rate: '-5%', volume: '90%' });

        const buffer = tts.toBuffer();
        console.log(`✅ TTS Success: [${voice}] | Buffer Size: ${buffer.length} bytes`);

        res.set('Content-Type', 'audio/mpeg');
        res.send(buffer);

    } catch (err) {
        console.error('TTS error:', err);
        res.status(500).send('TTS failed');
    }
});

// 🔥 IMPORTANT: use server.listen NOT app.listen
server.listen(5000,'0.0.0.0', () => {
    console.log("Server + Socket.IO running on port 5000");
});