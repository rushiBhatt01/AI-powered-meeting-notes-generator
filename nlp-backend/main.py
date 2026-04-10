import os
import shutil
from pathlib import Path
from tempfile import NamedTemporaryFile
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from faster_whisper import WhisperModel

# Configure app with larger body size limits (500MB for large audio files like 20-min audio)
app = FastAPI(title="Local NLP Backend")

# Allow CORS for local Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Set max upload size to 500MB for large audio files
MAX_UPLOAD_SIZE = 500 * 1024 * 1024  # 500MB

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


def save_upload_to_temp(upload, filename: str) -> str:
    suffix = Path(filename).suffix
    with NamedTemporaryFile(delete=False, prefix="transcribe_", suffix=suffix) as temp_file:
        shutil.copyfileobj(upload, temp_file, length=1024 * 1024)
        return temp_file.name


def transcribe_file(temp_file_path: str) -> str:
    segments, _ = whisper_model.transcribe(temp_file_path, beam_size=5)
    return " ".join(segment.text.strip() for segment in segments if segment.text).strip()

@app.post("/api/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")
    
    # Check file size before processing
    file.file.seek(0, 2)  # Seek to end
    file_size = file.file.tell()
    file.file.seek(0)  # Reset to beginning
    
    if file_size > MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=413, 
            detail=f"File too large. Maximum size: {MAX_UPLOAD_SIZE / (1024*1024):.0f}MB"
        )
    
    temp_file_path = None
    try:
        temp_file_path = await run_in_threadpool(save_upload_to_temp, file.file, file.filename)
        print(f"Transcribing {temp_file_path} (Size: {file_size / (1024*1024):.2f}MB)...")
        transcribed_text = await run_in_threadpool(transcribe_file, temp_file_path)
        return {"text": transcribed_text}
    
    except Exception as e:
        print(f"Transcription error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await file.close()
        # Clean up temp file
        if temp_file_path and os.path.exists(temp_file_path):
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
