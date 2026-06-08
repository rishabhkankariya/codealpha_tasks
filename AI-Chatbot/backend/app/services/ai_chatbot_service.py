"""
AI Chatbot Service using RAG (Retrieval-Augmented Generation)
Integrates with existing bus system to provide intelligent route assistance
"""
import os
import json
from typing import List, Dict, Any, Optional
from decimal import Decimal
from datetime import datetime
import numpy as np
from sqlalchemy.orm import Session
from sqlalchemy import text, or_

# AI/ML imports (install: pip install langchain chromadb sentence-transformers)
try:
    from langchain.embeddings import HuggingFaceEmbeddings
    from langchain.vectorstores import Chroma
    from langchain.text_splitter import RecursiveCharacterTextSplitter
    from langchain.llms import Ollama
    from langchain.chains import RetrievalQA
    from langchain.prompts import PromptTemplate
    LANGCHAIN_AVAILABLE = True
except ImportError:
    LANGCHAIN_AVAILABLE = False
    print("Warning: LangChain not installed. AI features will be limited.")

from app.models.route import Route
from app.models.schedule import Schedule
from app.models.chatbot import ChatbotMessage, ChatbotSession
from app.core.database import get_db


class AIRouteAssistant:
    """AI-powered route assistant using RAG"""
    
    def __init__(self, db: Session):
        self.db = db
        self.embeddings = None
        self.vectorstore = None
        self.llm = None
        self.qa_chain = None
        
        if LANGCHAIN_AVAILABLE:
            self._initialize_ai()
            
    def _calculate_fare(self, route: Route) -> Decimal:
        """Calculate fare for a route"""
        from app.models.pricing import PricingRule
        from decimal import Decimal
        # Check if there's a pricing rule for this route
        pricing_rule = self.db.query(PricingRule).filter(
            PricingRule.route_id == route.id,
            PricingRule.is_active == True
        ).first()
        
        if pricing_rule:
            return pricing_rule.base_price
        
        # Fallback calculation
        BASE_FARE = Decimal("10.00")
        PER_KM_RATE = Decimal("1.50")
        fare = BASE_FARE + (route.distance_km * PER_KM_RATE)
        fare = round(fare / 5) * 5  # Round to nearest ₹5
        return max(Decimal("10.00"), min(fare, Decimal("100.00")))
    
    def _initialize_ai(self):
        """Initialize AI components"""
        try:
            # Initialize embeddings model
            self.embeddings = HuggingFaceEmbeddings(
                model_name="sentence-transformers/all-MiniLM-L6-v2",
                model_kwargs={'device': 'cpu'}
            )
            
            # Initialize Ollama LLM (make sure Ollama is running)
            try:
                self.llm = Ollama(
                    model="llama3",  # or "mistral"
                    temperature=0.7,
                    base_url="http://localhost:11434"  # Default Ollama URL
                )
                print("✓ Ollama LLM initialized")
            except Exception as e:
                print(f"⚠ Ollama not available: {e}")
                print("  Chatbot will use fallback mode (keyword search)")
                self.llm = None
            
            # Load or create vector store
            self._load_vectorstore()
            
            # Create QA chain only if LLM is available
            if self.llm:
                self._create_qa_chain()
            else:
                print("  QA chain not created (Ollama not running)")
            
        except Exception as e:
            print(f"AI initialization error: {e}")
            print("  Chatbot will use fallback mode")
    
    def _load_vectorstore(self):
        """Load or create vector store from route data"""
        persist_directory = "backend/data/chroma_db"
        
        try:
            # Try to load existing vectorstore
            self.vectorstore = Chroma(
                persist_directory=persist_directory,
                embedding_function=self.embeddings
            )
            print("Loaded existing vector store")
        except:
            # Create new vectorstore from database
            print("Creating new vector store from database...")
            self._create_vectorstore_from_db()
    
    def _create_vectorstore_from_db(self):
        """Create vector store from existing route database"""
        # Get all routes
        routes = self.db.query(Route).all()
        
        documents = []
        metadatas = []
        
        print(f"Found {len(routes)} routes in database")
        
        for route in routes:
            # Create rich text representation of route
            route_text = self._create_route_document(route)
            documents.append(route_text)
            
            metadatas.append({
                "route_id": str(route.id),
                "route_number": route.route_number,
                "origin": route.origin,
                "destination": route.destination,
                "distance_km": float(route.distance_km),
                "duration_minutes": route.estimated_duration_minutes
            })
        
        if not documents:
            print("No routes found to create embeddings!")
            return
        
        # Create vectorstore
        print(f"Creating embeddings for {len(documents)} routes...")
        self.vectorstore = Chroma.from_texts(
            texts=documents,
            embedding=self.embeddings,
            metadatas=metadatas,
            persist_directory="backend/data/chroma_db"
        )
        
        self.vectorstore.persist()
        print(f"✓ Created vector store with {len(documents)} routes")
    
    def _create_route_document(self, route: Route) -> str:
        """Create searchable document from route data"""
        doc = f"""
Route Number: {route.route_number}
Origin: {route.origin}
Destination: {route.destination}
Distance: {route.distance_km} kilometers
Estimated Duration: {route.estimated_duration_minutes} minutes
Route Type: Bus Route
Service: PMPML (Pune Mahanagar Parivahan Mahamandal Limited)

This bus route connects {route.origin} to {route.destination}.
The total distance is {route.distance_km} km and takes approximately {route.estimated_duration_minutes} minutes.
Route number {route.route_number} is available for booking.
"""
        return doc.strip()
    
    def _create_qa_chain(self):
        """Create question-answering chain"""
        # Custom prompt template
        template = """You are a helpful PMPML bus route assistant for Pune city. 
Use the following context about bus routes to answer the user's question.
If you don't know the answer, say so politely and suggest checking the route search.

Context: {context}

Question: {question}

Provide a helpful, conversational answer in a friendly tone. Include specific route numbers, 
origins, destinations, and travel times when available. If multiple routes are relevant, 
mention the best options.

Answer:"""

        PROMPT = PromptTemplate(
            template=template,
            input_variables=["context", "question"]
        )
        
        self.qa_chain = RetrievalQA.from_chain_type(
            llm=self.llm,
            chain_type="stuff",
            retriever=self.vectorstore.as_retriever(search_kwargs={"k": 5}),
            chain_type_kwargs={"prompt": PROMPT}
        )
    
    async def process_query(
        self, 
        user_id: int, 
        query: str, 
        session_id: Optional[str] = None,
        language: str = "en"
    ) -> Dict[str, Any]:
        """
        Process user query and return AI response
        
        Args:
            user_id: User ID
            query: User's natural language query
            session_id: Optional chat session ID
            language: Language code (en, hi, mr)
        
        Returns:
            Dict with response, routes, and metadata
        """
        # Create or get chat session
        if not session_id:
            session = ChatbotSession(
                user_id=user_id,
                session_token=f"session_{user_id}_{datetime.utcnow().timestamp()}",
                context={"language": language}
            )
            self.db.add(session)
            self.db.commit()
            session_id = str(session.id)
        
        # Save user message
        user_message = ChatbotMessage(
            session_id=session_id,
            message_type="user",
            message_text=query,
            message_metadata={"language": language}
        )
        self.db.add(user_message)
        self.db.commit()
        
        # Process query
        if LANGCHAIN_AVAILABLE and self.qa_chain:
            response = await self._ai_response(query, language)
        else:
            response = await self._fallback_response(query)
        
        # Save bot response
        bot_message = ChatbotMessage(
            session_id=session_id,
            message_type="bot",
            message_text=response["answer"],
            message_metadata=response.get("metadata")
        )
        self.db.add(bot_message)
        self.db.commit()
        
        return {
            "session_id": session_id,
            "query": query,
            "answer": response["answer"],
            "routes": response.get("routes", []),
            "suggestions": response.get("suggestions", []),
            "language": language
        }
    
    async def _ai_response(self, query: str, language: str) -> Dict[str, Any]:
        """Generate AI response using RAG"""
        try:
            # Check if LLM is available
            if not self.llm or not self.qa_chain:
                print("LLM not available, using fallback")
                return await self._fallback_response(query)
            
            # Get AI response
            result = self.qa_chain({"query": query})
            answer = result["result"]
            
            # Extract relevant routes from vector search
            docs = self.vectorstore.similarity_search(query, k=3)
            routes = []
            
            for doc in docs:
                if doc.metadata:
                    routes.append({
                        "route_number": doc.metadata.get("route_number"),
                        "origin": doc.metadata.get("origin"),
                        "destination": doc.metadata.get("destination"),
                        "distance_km": doc.metadata.get("distance_km"),
                        "duration_minutes": doc.metadata.get("duration_minutes")
                    })
            
            # Generate suggestions
            suggestions = self._generate_suggestions(query, routes)
            
            return {
                "answer": answer,
                "routes": routes,
                "suggestions": suggestions,
                "metadata": {
                    "model": "llama3",
                    "method": "rag"
                }
            }
            
        except Exception as e:
            print(f"AI response error: {e}")
            return await self._fallback_response(query)
    
    async def _fallback_response(self, query: str) -> Dict[str, Any]:
        """Intelligent fallback response when LLM/Ollama is not available"""
        import re
        from app.models.pass_model import PassType
        
        query_lower = query.lower()
        routes = []
        answer = ""
        suggestions = []
        
        # 1. Check if user is asking for pass information
        if any(w in query_lower for w in ["pass", "passes", "ticket price", "concession"]):
            pass_types = self.db.query(PassType).filter(PassType.is_active == True).limit(5).all()
            answer = "🎫 **PMPML Bus Pass Recommendations**\n\n"
            answer += "PMPML offers several digital passes for commuters in Pune:\n\n"
            for pt in pass_types:
                price_str = f"₹{pt.price:.0f}" if pt.price > 0 else "FREE"
                answer += f"• **{pt.pass_name}**: {price_str} (Valid for {pt.validity_days} days). {pt.description}\n"
            answer += "\nTo purchase a pass, please go to the **Buy Pass** page from the sidebar!"
            suggestions = ["Daily Pass PMC", "Student Monthly Pass", "Women Special Pass"]
            return {
                "answer": answer.strip(),
                "routes": [],
                "suggestions": suggestions,
                "metadata": {"method": "rules_passes"}
            }
            
        # 2. Check if user is asking for timings/schedules
        is_timing_query = any(w in query_lower for w in ["timing", "timings", "schedule", "frequency", "first bus", "last bus", "time"])
        
        # 3. Extract locations and route numbers
        route_number_match = re.search(r'\b(\d+[a-zA-Z]?|[a-zA-Z]\d+)\b', query_lower)
        route_number = route_number_match.group(1).upper() if route_number_match else None
        
        # Extract location keywords (split query into words and match against known areas)
        known_areas = ["swargate", "katraj", "hinjewadi", "hadapsar", "kothrud", "baner", "pune station", "shivajinagar", "wagholi", "alandi", "nigdi", "dhayari", "warje", "bhosari", "akurdi", "chinchwad", "karvenagar", "kondhwa"]
        matched_locations = [area for area in known_areas if area in query_lower]
        
        # Check if we can identify origin and destination
        origin = None
        destination = None
        
        # Pattern: "from X to Y"
        from_to_match = re.search(r'from\s+([a-zA-Z0-9\s]+?)\s+to\s+([a-zA-Z0-9\s]+)', query_lower)
        if from_to_match:
            origin_candidate = from_to_match.group(1).strip()
            dest_candidate = from_to_match.group(2).strip()
            # Clean up candidates
            for area in known_areas:
                if area in origin_candidate:
                    origin = area
                if area in dest_candidate:
                    destination = area
        
        if not origin and len(matched_locations) >= 2:
            origin = matched_locations[0]
            destination = matched_locations[1]
        elif not origin and len(matched_locations) == 1:
            destination = matched_locations[0]
            
        # 4. Perform database search based on extracted info
        db_routes = []
        if route_number:
            db_routes = self.db.query(Route).filter(
                Route.route_number.ilike(f"%{route_number}%")
            ).all()
        elif origin and destination:
            db_routes = self.db.query(Route).filter(
                Route.origin.ilike(f"%{origin}%"),
                Route.destination.ilike(f"%{destination}%")
            ).all()
            # If no direct route, look for any route containing destination, or origin
            if not db_routes:
                db_routes = self.db.query(Route).filter(
                    or_(
                        Route.origin.ilike(f"%{origin}%"),
                        Route.destination.ilike(f"%{destination}%")
                    )
                ).limit(5).all()
        elif destination:
            db_routes = self.db.query(Route).filter(
                or_(
                    Route.origin.ilike(f"%{destination}%"),
                    Route.destination.ilike(f"%{destination}%")
                )
            ).limit(5).all()
            
        # Fallback to general search if still empty
        if not db_routes:
            words = [w for w in query_lower.split() if len(w) > 3 and w not in ["show", "find", "buses", "bus", "route", "routes"]]
            for word in words[:2]:
                db_routes = self.db.query(Route).filter(
                    or_(
                        Route.origin.ilike(f"%{word}%"),
                        Route.destination.ilike(f"%{word}%"),
                        Route.route_number.ilike(f"%{word}%")
                    )
                ).limit(5).all()
                if db_routes:
                    break

        # Convert DB routes to return format
        for r in db_routes:
            fare = self._calculate_fare(r)
            routes.append({
                "id": str(r.id),
                "route_number": r.route_number,
                "origin": r.origin,
                "destination": r.destination,
                "distance_km": float(r.distance_km),
                "duration_minutes": r.estimated_duration_minutes,
                "fare": float(fare)
            })

        # 5. Build dynamic text response based on search results and query intent
        if routes:
            if origin and destination:
                direct_route = next((r for r in routes if origin.lower() in r["origin"].lower() and destination.lower() in r["destination"].lower()), None)
                if direct_route:
                    answer = f"🚌 **Direct PMPML Route Found!**\n\n"
                    answer += f"Take **Route {direct_route['route_number']}** from **{direct_route['origin']}** to **{direct_route['destination']}**.\n"
                    answer += f"• **Distance**: {direct_route['distance_km']} km\n"
                    answer += f"• **Travel Time**: ~{direct_route['duration_minutes']} minutes\n"
                    answer += f"• **Standard Fare**: ₹{direct_route['fare']:.0f}\n\n"
                    if is_timing_query:
                        answer += "⏱️ **Schedules & Frequency**:\n"
                        answer += "Buses run every 15 minutes during peak hours (7:00 AM – 10:00 AM, 5:00 PM – 8:00 PM) and every 30 minutes during off-peak hours. First bus departs at 5:00 AM; last bus at 11:30 PM.\n\n"
                    answer += "You can book tickets for this journey directly below!"
                else:
                    # Indirect or multiple options
                    answer = f"🗺️ **PMPML Routes from {origin.title()} to {destination.title()}**\n\n"
                    answer += f"Here are the best options to travel between {origin.title()} and {destination.title()}:\n\n"
                    for i, r in enumerate(routes[:3], 1):
                        answer += f"{i}. **Route {r['route_number']}**: {r['origin']} → {r['destination']} ({r['distance_km']} km, ₹{r['fare']:.0f})\n"
                    answer += f"\n*Interchange Suggestion*: If you don't find a direct connection, you can take a bus to Swargate or Shivajinagar and interchange to your final destination."
            elif route_number:
                r = routes[0]
                answer = f"🚌 **PMPML Route {r['route_number']} Details**\n\n"
                answer += f"📍 **Route**: {r['origin']} To {r['destination']}\n"
                answer += f"📏 **Distance**: {r['distance_km']} km\n"
                answer += f"⏱️ **Estimated Duration**: ~{r['duration_minutes']} minutes\n"
                answer += f"💰 **Ticket Fare**: ₹{r['fare']:.0f}\n\n"
                answer += "**Operating Hours**:\n"
                answer += "Service starts at 5:00 AM and runs till 11:30 PM daily with standard frequencies."
            else:
                answer = f"🔍 **Found {len(routes)} relevant PMPML routes for you:**\n\n"
                for i, r in enumerate(routes[:4], 1):
                    answer += f"• **Route {r['route_number']}**: {r['origin']} → {r['destination']} (~{r['duration_minutes']} min, ₹{r['fare']:.0f})\n"
                answer += "\nSelect a route from the cards below to view timetables or book a ticket!"
        else:
            # No routes matched
            answer = "🔍 **No direct routes matching your query were found in our database.**\n\n"
            answer += "Here are some popular search patterns you can try:\n"
            answer += "• *'Routes from Katraj to Hinjewadi'*\n"
            answer += "• *'Show bus route 100 details'*\n"
            answer += "• *'What is the ticket price to Baner?'*\n"
            answer += "• *'Bus timings from Swargate'*\n\n"
            answer += "You can also browse the full list of 1030+ routes on the **Browse Routes** page!"

        # 6. Generate dynamic suggestions
        if routes:
            suggestions.append(f"Book Route {routes[0]['route_number']}")
            suggestions.append("Check pass options")
            if len(routes) > 1:
                suggestions.append(f"Details of Route {routes[1]['route_number']}")
        else:
            suggestions = ["Show Swargate routes", "Hinjewadi buses", "Compare passes"]

        return {
            "answer": answer.strip(),
            "routes": routes[:5],
            "suggestions": suggestions[:3],
            "metadata": {"method": "intelligent_fallback_rules"}
        }
    
    def _generate_suggestions(self, query: str, routes: List[Dict]) -> List[str]:
        """Generate follow-up suggestions"""
        suggestions = []
        
        if routes and len(routes) > 0:
            # Suggest related queries based on first route
            r = routes[0]
            suggestions.append(f"Alternative routes to {r['destination']}")
            if len(routes) > 1:
                suggestions.append(f"Compare with Route {routes[1]['route_number']}")
            suggestions.append("Check pass prices")
        else:
            suggestions.append("Show popular routes")
            suggestions.append("Routes from Pune Station")
            suggestions.append("Bus pass information")
        
        return suggestions[:3]
    
    def refresh_embeddings(self):
        """Refresh vector store with latest route data"""
        if LANGCHAIN_AVAILABLE:
            print("Refreshing embeddings...")
            self._create_vectorstore_from_db()
            self._create_qa_chain()
            print("Embeddings refreshed successfully")
        else:
            print("LangChain not available. Cannot refresh embeddings.")


class ChatbotService:
    """Service for chatbot operations"""
    
    @staticmethod
    async def send_message(
        db: Session,
        user_id: int,
        message: str,
        session_id: Optional[str] = None,
        language: str = "en"
    ) -> Dict[str, Any]:
        """Send message to chatbot and get response"""
        assistant = AIRouteAssistant(db)
        response = await assistant.process_query(
            user_id=user_id,
            query=message,
            session_id=session_id,
            language=language
        )
        return response
    
    @staticmethod
    def get_chat_history(
        db: Session,
        user_id: int,
        session_id: str,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get chat history for a session"""
        messages = db.query(ChatbotMessage).filter(
            ChatbotMessage.session_id == session_id
        ).order_by(ChatbotMessage.created_at.asc()).limit(limit).all()
        
        return [
            {
                "id": str(msg.id),
                "message": msg.message_text,
                "is_bot": msg.message_type == "bot",
                "created_at": msg.created_at.isoformat(),
                "metadata": msg.message_metadata
            }
            for msg in messages
        ]
    
    @staticmethod
    def get_user_sessions(
        db: Session,
        user_id: int,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get user's chat sessions"""
        sessions = db.query(ChatbotSession).filter(
            ChatbotSession.user_id == user_id
        ).order_by(ChatbotSession.created_at.desc()).limit(limit).all()
        
        return [
            {
                "id": str(session.id),
                "session_token": session.session_token,
                "created_at": session.created_at.isoformat(),
                "is_active": session.is_active
            }
            for session in sessions
        ]
    
    @staticmethod
    def create_session(
        db: Session,
        user_id: int,
        language: str = "en"
    ) -> str:
        """Create new chat session"""
        session = ChatbotSession(
            user_id=user_id,
            session_token=f"session_{user_id}_{datetime.utcnow().timestamp()}",
            context={"language": language}
        )
        db.add(session)
        db.commit()
        return str(session.id)
