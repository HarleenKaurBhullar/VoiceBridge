from flask import Flask, request, jsonify
import requests
import os
from dotenv import load_dotenv
load_dotenv()

app=Flask(__name__)
# OLD: ENtoHI = "https://api-inference.huggingface.co/models/Helsinki-NLP/opus-mt-en-hi"
# NEW:
ENtoHI = "https://router.huggingface.co/hf-inference/models/Helsinki-NLP/opus-mt-en-hi"
HItoEN = "https://router.huggingface.co/hf-inference/models/Helsinki-NLP/opus-mt-hi-en"
headers = {"Authorization": f"Bearer {os.getenv('HuggingFace_API_Key')}"}

def query(payload,model):
    response = requests.post(model, headers=headers, json=payload)
    return response.json()


@app.route("/translate", methods=["POST"])
def translate():
    data = request.json
    text = data.get("text")
    source = data.get("source")
    target = data.get("target")

    if source == "en" and target == "hi":
        model = ENtoHI
    elif source == "hi" and target == "en":
        model = HItoEN
    else:
        return jsonify({"error": "Unsupported language pair"}), 400

    try:
        result = query({"inputs": text}, model)
        
        # DEBUG: Print the actual response from Hugging Face to your terminal
        print(f"HF API Response: {result}")

        # Check if the model is still loading
        if isinstance(result, dict) and "error" in result:
            return jsonify({
                "error": "Hugging Face API Error", 
                "details": result.get("error"),
                "estimated_time": result.get("estimated_time", 0)
            }), 503

        # Success case
        print("jsonify response:", jsonify({"translation": result[0]["translation_text"],"language": target}))
        return jsonify({"translation": result[0]["translation_text"], "language": target})

    except Exception as e:
        print(f"Internal Crash: {str(e)}") # This will show in your terminal
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(port='5001',debug=True)