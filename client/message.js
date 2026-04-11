const params = new URLSearchParams(window.location.search);
const roomCode = params.get("roomId");
const language1 = params.get("language1");
const language2 = params.get("language2");
import { API_BASE_URL } from './config.js';
const baseUrl = API_BASE_URL;
const socket = io(baseUrl);
let microphoneon=false;
const microphoneButton = document.getElementById("microphone-on");
const displayCode = document.getElementById("Displaycode");
displayCode.innerText = `Meeting Id: ${roomCode}`;
socket.on("connect", () => {
    console.log("Connected:", socket.id);
    socket.emit("join-room", roomCode);
});

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if(!SpeechRecognition) {
    alert("Speech Recognition API not supported in this browser.");
}
lucide.createIcons();
// Replace your current voice loading + speakText with this:

// let availableVoices = [];

// function loadVoices() {
//     return new Promise((resolve) => {
//         let voices = window.speechSynthesis.getVoices();
//         if (voices.length > 0) {
//             availableVoices = voices;
//             resolve(voices);
//             return;
//         }
//         // Voices not ready yet — wait for the event
//         window.speechSynthesis.onvoiceschanged = () => {
//             voices = window.speechSynthesis.getVoices();
//             availableVoices = voices;
//             console.log("Voices loaded:", voices.length);
//             resolve(voices);
//         };
//     });
// }

// // Pre-load voices immediately on page load
// loadVoices();

// async function speakText(text, lang) {
//     // Cancel any ongoing speech first
//     window.speechSynthesis.cancel();

//     // Ensure voices are loaded before speaking
//     const voices = availableVoices.length > 0
//         ? availableVoices
//         : await loadVoices();

//     const utterance = new SpeechSynthesisUtterance(text);
//     utterance.lang = lang;
//     utterance.rate = 0.9;
//     utterance.pitch = 1.0;

//     // Match voice to language
//     const matchedVoice = voices.find(v => v.lang === lang)          // exact match first
//         || voices.find(v => v.lang.startsWith(lang.split('-')[0])); // e.g. 'hi' fallback

//     if (matchedVoice) {
//         utterance.voice = matchedVoice;
//         console.log(`Speaking with voice: ${matchedVoice.name} (${matchedVoice.lang})`);
//     } else {
//         console.warn(`No voice found for lang: ${lang}. Using browser default.`);
//     }

//     window.speechSynthesis.speak(utterance);
// }

async function speakText(text, lang) {
    window.speechSynthesis.cancel();

    const langCode = lang && lang.includes('hi') ? 'hi' : 'en';
    console.log("TTS lang being sent:", langCode);
    const res = await fetch(`${baseUrl}/tts?text=${encodeURIComponent(text)}&lang=${langCode}`);

    if (!res.ok) { console.error('TTS server error:', res.status); return; }

    const arrayBuffer = await res.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.onended = () => URL.revokeObjectURL(url);
    audio.play();
}

if (SpeechRecognition) {
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language1 || 'en-US'; 
    const translationLang = language2 || 'en-US';
    recognition.onstart = () => {
        console.log("🎤 Mic started in this tab");
    };

    recognition.onend = () => {
    if (microphoneon) recognition.start();
};

    recognition.onresult = (event) => {
        console.log("Speech recognition started");
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            const result = event.results[i];
            if (result.isFinal) {
                const finalSentence = result[0].transcript;
                
                socket.emit("send-transcript", {
                    room: roomCode,
                    text: finalSentence,
                    sourcelang: recognition.lang.split('-')[0],
                    targetlang: translationLang.split('-')[0]
                });
                console.log("Emitted transcript:", finalSentence);
            } else {
                interimTranscript += result[0].transcript;
            }
        }
        
    };
    recognition.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
};

    microphoneButton.addEventListener("click", () => {
    microphoneon = !microphoneon;
    microphoneButton.classList.toggle("active", microphoneon);
      microphoneButton.innerHTML = microphoneon
        ? '<i data-lucide="mic"></i>'
        : '<i data-lucide="mic-off"></i>';

    lucide.createIcons(); // 👈 re-render the new icon


    if (microphoneon) {
        recognition.start();
        console.log("Mic ON");
    } else {
        recognition.stop();
        console.log("Mic OFF");
    }
});
}

socket.on("receive-translation", (data) => {
    const chatContainer = document.querySelector(".chat-container");

    const msgElement = document.createElement("div");
    msgElement.classList.add("message");

    let langtts = data.language;
     const translatedText = data.translatedText;

    // 👇 VALIDATION BEFORE ANYTHING
    if (!translatedText || translatedText.trim() === "") {
        console.warn("❌ Empty or invalid translation received:", data);
        return; // STOP here
    }

    // 👇 Check if message is yours or other user's
    if (data.user === socket.id) {
        msgElement.classList.add("sender");   // RIGHT SIDE
    } else {
        msgElement.classList.add("receiver"); // LEFT SIDE
        speakText(data.translatedText, langtts);
    }

    // Create username
const userTag = document.createElement("div");
userTag.classList.add("username");
userTag.innerText = data.user === socket.id ? "You" : data.user;

// Create message text
const text = document.createElement("div");
text.classList.add("text");
text.innerText = data.translatedText;

// Append both inside message box
msgElement.appendChild(userTag);
msgElement.appendChild(text);

    chatContainer.appendChild(msgElement);
});
