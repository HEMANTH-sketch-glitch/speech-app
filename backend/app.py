from flask import Flask, request, jsonify
from vosk import Model, KaldiRecognizer
import json
import os

app = Flask(__name__)

# Language configuration
LANGUAGE_MODELS = {
    "en": "models/vosk-model-small-en-us-0.15",
    "hi": "models/vosk-model-small-hi-0.22",
    "ja": "models/vosk-model-small-ja-0.22"
}

@app.route('/recognize', methods=['POST'])
def recognize():
    try:
        # Get audio data and language from frontend
        audio_data = request.json['audio']  # List of numbers
        language = request.json.get('lang', 'en')  # Default to English
        
        # Load the correct model
        model_path = LANGUAGE_MODELS[language]
        if not os.path.exists(model_path):
            return jsonify({"error": f"Model for {language} not found"}), 400
        
        model = Model(model_path)
        recognizer = KaldiRecognizer(model, 16000)  # 16000 Hz sample rate
        
        # Convert audio data to bytes
        audio_bytes = bytes(audio_data)
        
        # Process audio
        recognizer.AcceptWaveform(audio_bytes)
        result = json.loads(recognizer.Result())
        
        return jsonify({"text": result.get("text", "")})
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=10000)