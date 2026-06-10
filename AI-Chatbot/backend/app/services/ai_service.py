import os
import io
import re
import json
import random
import numpy as np
from sentence_transformers import SentenceTransformer
import faiss
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.database import KnowledgeBase

class AIService:
    def __init__(self):
        self.model = None
        self.intents = []
        self.pattern_to_intent_map = []
        self.intent_embeddings = None
        
        # FAISS index for FAQ
        self.faiss_index = None
        self.kb_mapping = []  # stores list of (kb_id, question, answer)

    def initialize(self):
        """Initialize SentenceTransformer and compute intent embeddings if not already done"""
        if self.model is not None:
            return
        
        print("Initializing AI Service...")
        # Force CPU usage to stay under memory constraints on the VM (1GB RAM)
        self.model = SentenceTransformer(settings.HF_MODEL_NAME, device="cpu")
        print("SentenceTransformer loaded successfully on CPU.")
        
        # Load intents
        catalog_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 
            "data", 
            "intents_catalog"
        )
        intents_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 
            "data", 
            "intents.json"
        )
        
        self.intents = []
        if os.path.exists(catalog_path) and os.path.isdir(catalog_path):
            try:
                for file_name in os.listdir(catalog_path):
                    if file_name.endswith(".json"):
                        file_path = os.path.join(catalog_path, file_name)
                        with open(file_path, "r", encoding="utf-8") as f:
                            self.intents.append(json.load(f))
                print(f"Loaded {len(self.intents)} intents from intents_catalog folder.")
            except Exception as e:
                print(f"Error loading intents from catalog folder: {e}")
                
        if not self.intents and os.path.exists(intents_path):
            try:
                with open(intents_path, "r", encoding="utf-8") as f:
                    self.intents = json.load(f)
                print("Loaded intents from intents.json file.")
            except Exception as e:
                print(f"Error loading intents from intents.json: {e}")

        if self.intents:
            try:
                # Precompute intent embeddings
                all_patterns = []
                self.pattern_to_intent_map = []
                for item in self.intents:
                    for pattern in item["patterns"]:
                        all_patterns.append(pattern)
                        self.pattern_to_intent_map.append(item)
                        
                if all_patterns:
                    embeddings = self.model.encode(all_patterns, convert_to_numpy=True)
                    # Normalize embeddings for cosine similarity
                    norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
                    self.intent_embeddings = embeddings / (norms + 1e-10)
                    print(f"Precomputed {len(all_patterns)} intent patterns for similarity matching.")
            except Exception as e:
                print(f"Error precomputing intent embeddings: {e}")
        else:
            print("No intents dataset loaded.")

    def rebuild_kb_index(self, db_session: Session):
        """Reload all KnowledgeBase entries and rebuild FAISS index"""
        self.initialize()
        
        kb_entries = db_session.query(KnowledgeBase).all()
        if not kb_entries:
            self.faiss_index = None
            self.kb_mapping = []
            print("Knowledge base is empty. FAISS index not built.")
            return
        
        questions = [entry.question for entry in kb_entries]
        embeddings = self.model.encode(questions, convert_to_numpy=True)
        
        # Normalize for cosine similarity search (using IndexFlatIP)
        norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
        normalized_embeddings = embeddings / (norms + 1e-10)
        
        dimension = normalized_embeddings.shape[1]
        # IndexFlatIP finds the largest Inner Product (which equals cosine similarity for normalized vectors)
        self.faiss_index = faiss.IndexFlatIP(dimension)
        self.faiss_index.add(normalized_embeddings)
        
        self.kb_mapping = [(entry.id, entry.question, entry.answer) for entry in kb_entries]
        print(f"FAISS Index rebuilt with {len(kb_entries)} database entries.")

    def predict(self, message: str, db_session: Session) -> str:
        """Predict Response: Intent Classification -> FAISS KB Retrieval -> Fallback"""
        self.initialize()
        
        if not message or not message.strip():
            return "I'm sorry, I didn't receive a message. How can I help you today?"
            
        message = message.strip()
        
        # 1. Embed and normalize the message
        msg_emb = self.model.encode([message], convert_to_numpy=True)
        msg_norm = np.linalg.norm(msg_emb, axis=1, keepdims=True)
        msg_emb_normalized = msg_emb / (msg_norm + 1e-10)
        
        # 2. Try Intent Classification (Pattern Matching)
        if self.intent_embeddings is not None and len(self.intent_embeddings) > 0:
            similarities = np.dot(self.intent_embeddings, msg_emb_normalized.T).flatten()
            max_idx = np.argmax(similarities)
            max_score = float(similarities[max_idx])
            
            print(f"[AI] Intent match: max_score={max_score:.4f}")
            
            if max_score >= settings.INTENT_CONFIDENCE_THRESHOLD:
                matched_intent = self.pattern_to_intent_map[max_idx]
                response = random.choice(matched_intent["responses"])
                print(f"[AI] Success matching intent '{matched_intent['intent']}' (score {max_score:.2f})")
                return response
        
        # 3. Fallback to FAISS FAQ Database Matching
        if self.faiss_index is None or len(self.kb_mapping) == 0:
            self.rebuild_kb_index(db_session)
            
        if self.faiss_index is not None and len(self.kb_mapping) > 0:
            D, I = self.faiss_index.search(msg_emb_normalized, k=1)
            best_idx = I[0][0]
            best_score = float(D[0][0])
            
            print(f"[AI] FAISS match: index={best_idx}, score={best_score:.4f}")
            
            # 0.40 score threshold for semantic match using MiniLM
            if best_idx != -1 and best_idx < len(self.kb_mapping) and best_score >= 0.40:
                kb_id, question, answer = self.kb_mapping[best_idx]
                print(f"[AI] Success matching KB FAQ (ID {kb_id}, score {best_score:.2f})")
                return answer

        # Default fallback response
        return "I'm sorry, I couldn't find a matching answer in our database. Can you try rephrasing your question? Alternatively, you can email support at support@example.com."

    def ingest_pdf(self, file_bytes: bytes, filename: str, db_session: Session) -> int:
        """Extract text from PDF file, chunk it, insert to KnowledgeBase, and rebuild FAISS index"""
        from pypdf import PdfReader
        
        pdf_file = io.BytesIO(file_bytes)
        reader = PdfReader(pdf_file)
        
        full_text = ""
        for page in reader.pages:
            text = page.extract_text()
            if text:
                full_text += text + "\n"
                
        if not full_text.strip():
            raise ValueError("No text content could be extracted from this PDF document.")
            
        # Chunking strategy: split into chunks of ~500 chars with 100 chars overlap
        chunks = []
        chunk_size = 500
        overlap = 100
        
        i = 0
        while i < len(full_text):
            chunk = full_text[i:i+chunk_size].strip()
            if len(chunk) > 30:  # Ignore tiny trailing snippets
                chunks.append(chunk)
            i += (chunk_size - overlap)
            
        if not chunks:
            raise ValueError("The PDF text content was too short to generate chunks.")
            
        inserted_count = 0
        for idx, chunk in enumerate(chunks):
            # Split chunks into sentences using simple regex
            sentences = re.split(r'(?<=[.!?])\s+', chunk)
            valid_sentences = [s.strip() for s in sentences if len(s.strip()) > 25 and len(s.strip()) < 150]
            
            # If no sentence is valid for retrieval matching, make a custom sentence
            if not valid_sentences:
                snippet = chunk[:80] + "..." if len(chunk) > 80 else chunk
                valid_sentences = [f"What information is in {filename} part {idx+1} about: {snippet}"]
                
            # Add up to 3 sentences from the chunk as separate searchable FAQ questions pointing to the full chunk answer
            for sentence in valid_sentences[:3]:
                db_kb = KnowledgeBase(
                    category=f"PDF: {filename}",
                    question=sentence,
                    answer=chunk
                )
                db_session.add(db_kb)
                inserted_count += 1
                
        db_session.commit()
        
        # Rebuild FAISS index
        self.rebuild_kb_index(db_session)
        return inserted_count

# Instantiate singleton
ai_service = AIService()
