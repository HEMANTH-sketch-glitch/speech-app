const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const outputDiv = document.getElementById('output');
let audioContext;

startBtn.addEventListener('click', async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        
        const processor = audioContext.createScriptProcessor(4096, 1, 1);
        processor.onaudioprocess = e => {
            const audioData = e.inputBuffer.getChannelData(0);
            const int16Data = new Int16Array(audioData.map(x => x * 32767));
            recognizeSpeech(int16Data);
        };
        
        source.connect(processor);
        processor.connect(audioContext.destination);
        
        startBtn.disabled = true;
        stopBtn.disabled = false;
        outputDiv.innerHTML += "<p>Listening...</p>";
    } catch (error) {
        outputDiv.innerHTML += `<p>Error: ${error.message}</p>`;
    }
});

stopBtn.addEventListener('click', () => {
    if (audioContext) audioContext.close();
    startBtn.disabled = false;
    stopBtn.disabled = true;
});

async function recognizeSpeech(audioData) {
    try {
        const response = await fetch('/recognize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audio: Array.from(audioData) })
        });
        const result = await response.json();
        if (result.text) outputDiv.innerHTML += `<p>${result.text}</p>`;
    } catch (error) {
        console.error("Error:", error);
    }
}