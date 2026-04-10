import torch
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
from IndicTransToolkit import IndicProcessor
from flask import Flask, request, jsonify

app = Flask(__name__)

# 1. Setup device
device="cpu"

# 2. Initialize Processor
ip = IndicProcessor(inference=True)

# 3. Load BOTH models and tokenizers globally (at startup)
print("Loading models... this may take a minute.")

en_indic_name = "ai4bharat/indictrans2-en-indic-dist-200M"
indic_en_name = "ai4bharat/indictrans2-indic-en-dist-200M"

# Load En -> Indic
tokenizer_en_indic = AutoTokenizer.from_pretrained(en_indic_name, trust_remote_code=True)
model_en_indic = AutoModelForSeq2SeqLM.from_pretrained(en_indic_name, trust_remote_code=True).to(device)

# Load Indic -> En
tokenizer_indic_en = AutoTokenizer.from_pretrained(indic_en_name, trust_remote_code=True)
model_indic_en = AutoModelForSeq2SeqLM.from_pretrained(indic_en_name, trust_remote_code=True).to(device)

print(f"Models loaded successfully on {device}!")

@app.route("/translate", methods=["POST"])
def translate():
    data = request.json
    text = data.get("text")
    source = data.get("source")   # e.g., "eng_Latn"
    target = data.get("target")   # e.g., "hin_Deva"

    if not text:
        return jsonify({"error": "No text provided"}), 400

    # 4. Select correct model/tokenizer pair
    if source == "eng_Latn":
        model, tokenizer = model_en_indic, tokenizer_en_indic
    else:
        model, tokenizer = model_indic_en, tokenizer_indic_en

    try:
        # Pre-process
        batch = ip.preprocess_batch([text], src_lang=source, tgt_lang=target)
        
        # Tokenize
        inputs = tokenizer(batch, truncation=True, padding="longest", return_tensors="pt").to(device)

        # Generate
        with torch.no_grad():
            generated_tokens = model.generate(
                **inputs, 
                use_cache=True, 
                num_beams=5, 
                max_length=256
            )

        # Decode and Post-process
        outputs = tokenizer.batch_decode(generated_tokens, skip_special_tokens=True)
        final_outputs = ip.postprocess_batch(outputs, lang=target)

        return jsonify({"translation": final_outputs[0]})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001)