from flask import Flask, request, jsonify
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import torch

app = Flask(__name__)

# --- MODEL SETUP ---
# We load the model once when the script starts
model_name = "facebook/nllb-200-distilled-600M"
print(f"Loading model {model_name}...")

tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSeq2SeqLM.from_pretrained(model_name)

# Move to GPU if available
device = "cuda" if torch.cuda.is_available() else "cpu"
model.to(device)

print("Model loaded and ready.")

# --- UTILITY ---
# Mapping short codes to NLLB long-form codes
# Add more as needed: https://github.com/facebookresearch/flores/blob/main/flores200/README.md#languages-in-flores-200
LANG_MAP = {
    "en": "eng_Latn",
    "hi": "hin_Deva",
    "fr": "fra_Latn",
    "es": "spa_Latn",
    "it": "ita_Latn",
}


@app.route("/translate", methods=["POST"])
def translate():
    data = request.json
    text = data.get("text")
    source_code = data.get("source")  # e.g., 'en'
    target_code = data.get("target")  # e.g., 'hi'

    # 1. Validate inputs
    if not text or not source_code or not target_code:
        return jsonify({"error": "Missing text, source, or target"}), 400

    # 2. Convert short codes to NLLB specific codes
    src_lang = LANG_MAP.get(source_code)
    tgt_lang = LANG_MAP.get(target_code)

    if not src_lang or not tgt_lang:
        return jsonify({"error": "Unsupported language code"}), 400

    try:
        # 3. Tokenize
        tokenizer.src_lang = src_lang
        inputs = tokenizer(text, return_tensors="pt").to(device)

        # 4. Generate
        translated_tokens = model.generate(
            **inputs,
            forced_bos_token_id=tokenizer.convert_tokens_to_ids(tgt_lang),
            max_length=100
        )

        # 5. Decode
        result = tokenizer.batch_decode(translated_tokens, skip_special_tokens=True)[0]

        return jsonify({
            "translation": result,
            "source_language": source_code,
            "target_language": target_code
        })

    except Exception as e:
        print(f"Error during translation: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

if __name__ == "__main__":
    # Note: Using threaded=False can sometimes help with heavy ML models in debug mode
    app.run(port=5001, debug=True, use_reloader=False)