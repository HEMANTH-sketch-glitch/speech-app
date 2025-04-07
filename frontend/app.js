// DOM Elements
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const languageSelect = document.getElementById('languageSelect');
const statusDiv = document.getElementById('status');
const transcriptDiv = document.getElementById('transcript');

// Backend configuration
const BACKEND_URL = "https://speech-backend.onrender.com";
let isRecognizing = false;

// Audio processing variables
let audioContext;
let processor;
let stream;

// Language emoji mapping
const LANGUAGE_EMOJIS = {
    en: '🇬🇧',
    hi: '🇮🇳',
    ja: '🇯🇵'
};

// Start recording
startBtn.addEventListener('click', async () => {
    if (isRecognizing) return;
    
    try {
        statusDiv.textContent = "Status: Accessing microphone...";
        transcriptDiv.innerHTML += `<p class="system">Starting recognition...</p>`;
        
        stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                sampleRate: 16000,
                channelCount: 1,
                echoCancellation: true,
                noiseSuppression: true
            },
            video: false
        });

        audioContext = new AudioContext({ sampleRate: 16000 });
        const source = audioContext.createMediaStreamSource(stream);
        
        processor = audioContext.createScriptProcessor(4096, 1, 1);
        processor.onaudioprocess = processAudio;
        
        source.connect(processor);
        processor.connect(audioContext.destination);
        
        isRecognizing = true;
        startBtn.disabled = true;
        stopBtn.disabled = false;
        statusDiv.textContent = "Status: Listening (speak now)...";
        
    } catch (error) {
        handleError(`Microphone access failed: ${error.message}`);
    }
});

// Stop recording
stopBtn.addEventListener('click', () => {
    if (!isRecognizing) return;
    
    cleanupAudio();
    transcriptDiv.innerHTML += `<p class="system">Recognition stopped</p>`;
    statusDiv.textContent = "Status: Ready";
});

function cleanupAudio() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    if (processor) {
        processor.disconnect();
    }
    if (audioContext) {
        audioContext.close();
    }
    
    isRecognizing = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
}

// Process audio chunks
function processAudio(e) {
    if (!isRecognizing) return;
    
    const audioData = e.inputBuffer.getChannelData(0);
    const int16Data = new Int16Array(audioData.length);
    
    for (let i = 0; i < audioData.length; i++) {
        int16Data[i] = Math.max(-32768, Math.min(32767, audioData[i] * 32767));
    }
    
    recognizeSpeech(int16Data, languageSelect.value);
}

// Send audio to backend
async function recognizeSpeech(audioData, language) {
    try {
        const response = await fetch(`${BACKEND_URL}/recognize`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                audio: Array.from(audioData),
                lang: language || 'en'
            })
        });

        if (!response.ok) {
            throw new Error(`Server responded with status ${response.status}`);
        }

        const result = await response.json();
        
        if (result.text?.trim()) {
            const emoji = LANGUAGE_EMOJIS[language] || '';
            transcriptDiv.innerHTML += `
                <p data-lang="${language}">
                    ${emoji} <strong>${result.text}</strong>
                </p>
            `;
            transcriptDiv.scrollTop = transcriptDiv.scrollHeight;
        }
        
    } catch (error) {
        handleError(`Recognition failed: ${error.message}`);
    }
}

function handleError(message) {
    console.error(message);
    statusDiv.textContent = `Status: Error - ${message}`;
    transcriptDiv.innerHTML += `<p class="error">${message}</p>`;
    cleanupAudio();
}