from pydantic import BaseModel

class KBCreate(BaseModel):
    category: str
    question: str
    answer: str

class KBResponse(BaseModel):
    id: int
    category: str
    question: str
    answer: str

    class Config:
        from_attributes = True
