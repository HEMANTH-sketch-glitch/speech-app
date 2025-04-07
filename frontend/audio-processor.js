class AudioProcessor extends AudioWorkletProcessor {
    process(inputs) {
        const inputData = inputs[0][0]; // Get mono channel
        const pcmData = new Int16Array(inputData.length);
        
        for (let i = 0; i < inputData.length; i++) {
            pcmData[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32767));
        }
        
        this.port.postMessage(pcmData);
        return true;
    }
}

registerProcessor('audio-processor', AudioProcessor);