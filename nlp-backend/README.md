# Local NLP Backend

This is a completely local Python FastAPI server that replaces OpenAI with free, local machine learning models for the AI-powered-notes app.

## Features
- **Speech-to-Text**: Uses `faster-whisper` (tiny model) to perform offline audio transcription.
- **Summarization**: Uses Hugging Face `transformers` (`facebook/bart-large-cnn`) to generate concise text summaries.

## Setup Instructions

1. **Install Python**: Make sure you have Python 3.9+ installed.
2. **Create a Virtual Environment** (Recommended):
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On Mac/Linux:
   source venv/bin/activate
   ```
3. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
   *Note: If you have a dedicated Nvidia GPU, you might want to install the CUDA version of PyTorch first for even faster inference.*
4. **Run the Server**:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

## Note on First Run
The first time you send an audio file or text, the backend will download the machine learning model weights (~1GB total) from the Hugging Face Hub to your machine. Subsequent requests will load instantly from cache and run entirely offline.
