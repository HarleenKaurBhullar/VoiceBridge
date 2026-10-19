# VoiceBridge 🌉

**Breaking Language Barriers, One Conversation at a Time**

VoiceBridge is a real-time, multilingual translation meeting application. It allows users to join virtual rooms, speak in their native language, and have their speech instantly transcribed, translated, and spoken aloud in the recipient's language. 

## ✨ Key Features

* **Real-Time Speech-to-Text (STT):** Leverages the browser's Web Speech API to capture and transcribe audio in real-time.
* **AI-Powered Translation:** Uses Meta's `NLLB-200-distilled-600M` model via a Python microservice for highly accurate, contextual translations.
* **Text-to-Speech (TTS):** Integrated with Microsoft Edge TTS to speak the translated text naturally in the listener's chosen language.
* **Seamless Room Creation:** Easily generate a unique room code to host a meeting or enter a code to join an existing one.
* **Bi-Directional Websockets:** Fast, low-latency communication between users powered by Socket.IO.
* **Modern UI:** Features an interactive 3D animated background powered by Vanta.js and Three.js.

## 🛠️ Tech Stack

### Frontend
* **HTML5, CSS3, Vanilla JavaScript**
* **Web Speech API** (Speech Recognition)
* **Vanta.js & Three.js** (Hero section animations)
* **Lucide Icons** (UI Iconography)

### Primary Backend (Node.js)
* **Node.js & Express** (Web server and API routing)
* **Socket.IO** (Real-time WebSocket communication)
* **Edge-TTS** (`@andresaya/edge-tts` for generating voice audio)
* **Axios** (To communicate with the Python ML microservice)

### Machine Learning / Translation Service (Python)
* **Python 3 & Flask** (Microservice API)
* **PyTorch & Hugging Face Transformers** (Running the NLLB-200 translation model)

---

## 🏗️ Architecture Flow

1. **User Speaks:** The frontend Web Speech API converts the user's voice into text.
2. **Socket Emission:** The frontend sends the transcript and language preferences to the Node.js server via Socket.IO.
3. **Translation Request:** Node.js forwards the text to the Python Flask API.
4. **AI Translation:** The Flask API processes the text using the NLLB model and returns the translated string.
5. **Broadcast:** Node.js broadcasts the translated text back to the Socket room.
6. **TTS Playback:** The receiving frontend hits the Node.js `/tts` endpoint to generate an audio buffer, which is played aloud.

---

## 🚀 Setup & Installation

### Prerequisites
* **Node.js** (v16+)
* **Python** (v3.8+)
* **NVIDIA GPU** (Optional but highly recommended to speed up PyTorch inference)

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/VoiceBridge.git
cd VoiceBridge
```

### 2. Set up the Python Translation Server
Navigate to the folder containing `backendpython.py` and install the required Python packages.

```bash
pip install flask transformers torch
```
Run the Python server:
```bash
python backendpython.py
```
*(The Flask server will start on `http://127.0.0.1:7860`)*

### 3. Set up the Node.js Server
Navigate to the folder containing `backend.js` and install the Node dependencies.

```bash
npm install express socket.io cors dotenv axios @andresaya/edge-tts
```

Create a `.env` file in the same directory as your Node server and add the URL to your Python backend:
```env
PYTHON_BACKEND_URL=http://127.0.0.1:7860
```

Run the Node server:
```bash
node backend.js
```
*(The Node server will start on port `5000` and also serve your frontend client files)*

### 4. Start Translating
Open your browser and navigate to:
```text
http://localhost:5000
```

---

## 🌍 Supported Languages
Currently configured to support 5 primary languages (easily expandable via the Python dictionary and TTS mapper):
* 🇺🇸 English (`en-US`)
* 🇮🇳 Hindi (`hi-IN`)
* 🇪🇸 Spanish (`es-ES`)
* 🇫🇷 French (`fr-FR`)
* 🇮🇹 Italian (`it-IT`)

## 📝 License
This project is licensed under the MIT License.
