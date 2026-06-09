"""Custom types for database compatibility"""

from sqlalchemy import String, TypeDecorator, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB as PG_JSONB, INET as PG_INET, ARRAY as PG_ARRAY
import uuid
import json


class UUID(TypeDecorator):
    """Platform-independent UUID type.
    
    Uses PostgreSQL's UUID type when available, otherwise uses String(36).
    """
    impl = String
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            return dialect.type_descriptor(PG_UUID(as_uuid=True))
        else:
            return dialect.type_descriptor(String(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        elif dialect.name == 'postgresql':
            return value
        else:
            if isinstance(value, uuid.UUID):
                return str(value)
            return value

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        if isinstance(value, uuid.UUID):
            return value
        return uuid.UUID(value)


class JSONB(TypeDecorator):
    """Platform-independent JSONB type.
    
    Uses PostgreSQL's JSONB type when available, otherwise uses Text with JSON encoding.
    """
    impl = Text
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            return dialect.type_descriptor(PG_JSONB())
        else:
            return dialect.type_descriptor(Text())

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        if dialect.name == 'postgresql':
            return value
        return json.dumps(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        if dialect.name == 'postgresql':
            return value
        return json.loads(value)


class INET(TypeDecorator):
    """Platform-independent INET type.
    
    Uses PostgreSQL's INET type when available, otherwise uses String(45) for IPv6.
    """
    impl = String
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            return dialect.type_descriptor(PG_INET())
        else:
            return dialect.type_descriptor(String(45))  # Max length for IPv6


def ARRAY(item_type):
    """Platform-independent ARRAY type.
    
    Uses PostgreSQL's ARRAY type when available, otherwise uses Text with JSON encoding.
    """
    class ARRAYImpl(TypeDecorator):
        impl = Text
        cache_ok = True

        def load_dialect_impl(self, dialect):
            if dialect.name == 'postgresql':
                return dialect.type_descriptor(PG_ARRAY(item_type))
            else:
                return dialect.type_descriptor(Text())

        def process_bind_param(self, value, dialect):
            if value is None:
                return value
            if dialect.name == 'postgresql':
                return value
            return json.dumps(value)

        def process_result_value(self, value, dialect):
            if value is None:
                return value
            if dialect.name == 'postgresql':
                return value
            return json.loads(value)
    
    return ARRAYImpl()
