from sqlalchemy import Column, Integer, String, Date,Unicode
from app.database.database import Base
from pydantic import BaseModel, field_validator, validator
from datetime import date, datetime
from typing import List, Optional



class Committee(Base):
    __tablename__ = "committee"
    id = Column(Integer, primary_key=True, index=True)
    committeeNo = Column(Unicode(255), nullable=False)
    committeeDate = Column(Date, nullable=True)
    committeeTitle = Column(Unicode, nullable=True)
    committeeBossName = Column(Unicode(100), nullable=True)
    sex = Column(Unicode(10), nullable=True)
    committeeCount = Column(Integer, nullable=True)
    sexCountPerCommittee= Column(Integer, nullable=True)
    notes = Column(Unicode(500), nullable=True)
    currentDate = Column(Date, nullable=True)
    userID = Column(Integer, nullable=True)





class CommitteeCreate(BaseModel):
 
    committeeNo:Optional[str]= None
    committeeDate: Optional[str] = None
    committeeTitle: Optional[str] = None
    committeeBossName:Optional[str] = None
    sex : Optional[str] =None
    committeeCount:Optional[int] = None
    sexCountPerCommittee:Optional[int] = None
    notes: Optional[str] = None
    currentDate: Optional[str] = None
    userID: Optional[int] = None
   

    @field_validator('committeeDate', 'currentDate')
    def validate_date(cls, value):
        if value is None:
            return None
        if isinstance(value, str):
            try:
                datetime.strptime(value, '%Y-%m-%d')
                return value
            except ValueError:
                raise ValueError(f"Invalid date format for {value}; expected YYYY-MM-DD")
        elif isinstance(value, date):
            return value.strftime('%Y-%m-%d')
        raise ValueError(f"Invalid date type for {value}; expected string or date")

    class Config:
        from_attributes = True


class CommitteeResponse(BaseModel):
    id: Optional[int] = None
    committeeNo: Optional[str] = None
    committeeDate: Optional[str] = None
    committeeTitle: Optional[str] = None
    committeeBossName: Optional[str] = None
    sex: Optional[str] = None
    committeeCount: Optional[int] = None
    sexCountPerCommittee: Optional[int] = None
    notes: Optional[str] = None
    currentDate: Optional[str] = None
    userID: Optional[int] = None

    @field_validator('committeeDate', 'currentDate', mode='before')
    @classmethod
    def convert_date_to_string(cls, value):
        """Convert date objects to string format - PYDANTIC V2 COMPATIBLE"""
        if value is None:
            return None
        if isinstance(value, date):
            return value.strftime('%Y-%m-%d')
        if isinstance(value, str):
            return value
        return str(value)

    class Config:
        from_attributes = True


class PaginatedCommittees(BaseModel):
    data: List[CommitteeResponse]
    total: int
    page: int
    limit: int
    totalPages: int


