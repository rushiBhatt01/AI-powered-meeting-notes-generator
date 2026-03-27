import os
import shutil
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from faster_whisper import WhisperModel

app = FastAPI(title="Local NLP Backend")

# Allow CORS for local Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize models (will download on first run)
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import torch

print("Loading Whisper model (tiny)...")
whisper_model = WhisperModel("tiny", device="cpu", compute_type="int8")

print("Loading BART model natively for summarization...")
tokenizer = AutoTokenizer.from_pretrained("facebook/bart-large-cnn")
model = AutoModelForSeq2SeqLM.from_pretrained("facebook/bart-large-cnn")
# Run on CPU explicitly
model = model.to("cpu")

class SummarizeRequest(BaseModel):
    text: str

@app.post("/api/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")
    
    # Save uploaded file temporarily
    temp_file_path = f"temp_{file.filename}"
    try:
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        print(f"Transcribing {temp_file_path}...")
        segments, info = whisper_model.transcribe(temp_file_path, beam_size=5)
        
        transcribed_text = ""
        for segment in segments:
            transcribed_text += segment.text + " "
            
        return {"text": transcribed_text.strip()}
    
    except Exception as e:
        print(f"Transcription error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Clean up temp file
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

@app.post("/api/summarize")
async def summarize_text(request: SummarizeRequest):
    if not request.text or len(request.text.strip()) == 0:
        raise HTTPException(status_code=400, detail="Text cannot be empty")
        
    try:
        # Simple truncation for CPU memory safety (BART max length is 1024 tokens)
        input_text = request.text[:3000]
        
        # Tokenize and generate natively
        inputs = tokenizer(input_text, max_length=1024, return_tensors="pt", truncation=True)
        # Move inputs to CPU explicitly
        inputs = {k: v.to("cpu") for k, v in inputs.items()}
        
        # Generate summary (equivalent to pipeline params)
        summary_ids = model.generate(
            inputs["input_ids"], 
            num_beams=4, 
            min_length=30, 
            max_length=130, 
            early_stopping=True
        )
        
        summary = tokenizer.decode(summary_ids[0], skip_special_tokens=True)
        return {"summary": summary}
    
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Summarization error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
