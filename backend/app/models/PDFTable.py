from sqlalchemy import Column, Integer, String, Date
from app.database.database import Base
from pydantic import BaseModel
from typing import Optional
from datetime import date

class PDFTable(Base):
    __tablename__ = "PDFTable"

    id = Column(Integer, primary_key=True, index=True)
    committeeID = Column(Integer,  nullable=True)
    committeeNo = Column(String(50), nullable=True)
    countPdf = Column(Integer, nullable=True)
    pdf = Column(String, nullable=True)  # Stores PDF file path or URL
    userID = Column(Integer, nullable=True)
    currentDate = Column(Date, nullable=True)






class PDFCreate(BaseModel):
    committeeID: Optional[int]
    committeeNo: Optional[str]
    countPdf: Optional[int]
    pdf: Optional[str]
    userID: Optional[int]
    currentDate: Optional[date]

class PDFResponse(BaseModel):
    id: int
    committeeNo: Optional[str]
    committeeID: Optional[int]
    pdf: Optional[str]
    currentDate: Optional[date]  # Stringified date
    username: Optional[str] = None  # Added username from users table

    class Config:
        from_attributes = True

# Pydantic model for request body
class DeletePDFRequest(BaseModel):
    id: int
    pdf: str  # Matches frontend 'pdf' field        