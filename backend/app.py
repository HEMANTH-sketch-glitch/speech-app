from flask import Flask, request, jsonify
from flask_cors import CORS  # New import
import json
import os

app = Flask(__name__)
CORS(app)  # New line - enables CORS for all routes

# Your existing configuration
LANGUAGE_MODELS = {
    "en": "models/vosk-model-small-en-us-0.15",
    "hi": "models/vosk-model-small-hi-0.22",
    "ja": "models/vosk-model-small-ja-0.22"
}

@app.route('/recognize', methods=['POST'])
def recognize():
    try:
        audio_data = request.json['audio']
        language = request.json.get('lang', 'en')
        
        model_path = LANGUAGE_MODELS[language]
        if not os.path.exists(model_path):
            return jsonify({"error": f"Model for {language} not found"}), 400
        
        model = Model(model_path)
        recognizer = KaldiRecognizer(model, 16000)
        recognizer.AcceptWaveform(bytes(audio_data))
        result = json.loads(recognizer.Result())
        
        return jsonify({"text": result.get("text", "")})
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=10000)