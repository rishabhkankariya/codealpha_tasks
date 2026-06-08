"""System configuration models"""

from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean, Text
from app.core.types import UUID, JSONB
from sqlalchemy.sql import func
import uuid

from app.core.database import Base


class SystemConfig(Base):
    """System configuration model"""
    __tablename__ = "system_config"
    
    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    config_key = Column(String(100), unique=True, nullable=False, index=True)
    config_value = Column(JSONB, nullable=False)
    description = Column(Text, nullable=True)
    updated_by = Column(UUID(), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        return f"<SystemConfig {self.config_key}>"


class FeatureFlag(Base):
    """Feature flag model"""
    __tablename__ = "feature_flags"
    
    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    flag_name = Column(String(100), unique=True, nullable=False, index=True)
    is_enabled = Column(Boolean, default=False)
    description = Column(Text, nullable=True)
    updated_by = Column(UUID(), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        return f"<FeatureFlag {self.flag_name}: {self.is_enabled}>"
