from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.api.auth import get_current_admin
from app.models.database import User, Chat, Message, Feedback, KnowledgeBase

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/stats")
def get_analytics_statistics(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Retrieve system analytics metrics for dashboard reporting (Admin-only)"""
    # 1. Standard Counts
    total_users = db.query(User).count()
    total_chats = db.query(Chat).count()
    total_messages = db.query(Message).count()
    total_kb = db.query(KnowledgeBase).count()
    
    # 2. Feedback average and counts
    feedback_stats = db.query(
        func.avg(Feedback.rating).label("avg_rating"),
        func.count(Feedback.id).label("total_reviews")
    ).first()
    
    avg_rating = round(float(feedback_stats.avg_rating), 2) if feedback_stats.avg_rating else 0.0
    total_reviews = feedback_stats.total_reviews if feedback_stats.total_reviews else 0
    
    # 3. Rating distribution (1 to 5 stars)
    rating_counts = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    ratings_query = db.query(Feedback.rating, func.count(Feedback.id)).group_by(Feedback.rating).all()
    for rating, count in ratings_query:
        if rating in rating_counts:
            rating_counts[rating] = count
            
    # 4. KB Categories distribution
    kb_categories = {}
    kb_query = db.query(KnowledgeBase.category, func.count(KnowledgeBase.id)).group_by(KnowledgeBase.category).all()
    for cat, count in kb_query:
        kb_categories[cat] = count
        
    # 5. Message distribution by sender (user vs bot)
    sender_counts = {"user": 0, "bot": 0}
    sender_query = db.query(Message.sender, func.count(Message.id)).group_by(Message.sender).all()
    for sender, count in sender_query:
        if sender in sender_counts:
            sender_counts[sender] = count

    # 6. Retrieve recent chats (with user details)
    recent_chats = []
    chats_db = db.query(Chat).order_by(Chat.created_at.desc()).limit(5).all()
    for chat in chats_db:
        # Fetch user name
        chat_user = db.query(User).filter(User.id == chat.user_id).first()
        user_name = chat_user.name if chat_user else "Unknown User"
        msg_count = db.query(Message).filter(Message.chat_id == chat.id).count()
        recent_chats.append({
            "id": chat.id,
            "title": chat.title,
            "created_at": chat.created_at,
            "username": user_name,
            "message_count": msg_count
        })

    return {
        "summary": {
            "total_users": total_users,
            "total_chats": total_chats,
            "total_messages": total_messages,
            "total_kb_entries": total_kb,
            "average_rating": avg_rating,
            "total_feedbacks": total_reviews
        },
        "rating_distribution": rating_counts,
        "kb_categories": kb_categories,
        "sender_distribution": sender_counts,
        "recent_chats": recent_chats
    }
