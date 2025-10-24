from typing import List, Optional
from pydantic import BaseModel, Field
from sqlalchemy import Column, BigInteger, String, SmallInteger,Index
from sqlalchemy.orm import relationship
from app.database.database import Base
from app.models.committee import PDFResponse

class Employee(Base):
    __tablename__ = "employee"
    
    # Step 1: Define columns with proper indexing
    empID = Column(BigInteger, primary_key=True, autoincrement=True, index=True)
    name = Column(String(255), nullable=True, default=None, index=True)  #  Indexed for search
    employee_desc = Column(BigInteger, nullable=True, index=True)  #  Indexed for search
    gender = Column(SmallInteger, nullable=True)
    
    # Step 2: Relationship to junction table only
    committee_memberships = relationship(
        "JunctionCommitteeEmployee",
        back_populates="employee",
        cascade="all, delete-orphan"
    )
    
    # Step 3: Composite index for combined searches
    __table_args__ = (
        Index('ix_employee_name_desc', 'name', 'employee_desc'),
        
    )



class EmployeeResponse(BaseModel):
    """Response schema for employee"""
    empID: int
    name: Optional[str] = None
    employee_desc: Optional[int] = None
    gender: Optional[int] = None
    genderName: Optional[str] = None
    
    class Config:
        from_attributes = True


class EmployeeSearchParams(BaseModel):
    """Search parameters for employee"""
    searchTerm: Optional[str] = Field(None, description="Search by name or employee_desc")
    name: Optional[str] = Field(None, description="Filter by name (partial match)")
    employee_desc: Optional[int] = Field(None, description="Filter by employee_desc (exact match)")
    gender: Optional[int] = Field(None, description="Filter by gender (1=male, 2=female)")
    page: int = Field(1, ge=1, description="Page number")
    limit: int = Field(20, ge=1, le=100, description="Items per page")
    
    class Config:
        from_attributes = True



#  Updated Response Model
class EmployeeInCommitteeResponse(BaseModel):
    empID: int
    name: str
    employee_desc: int
    gender: Optional[int] = None
    genderName: Optional[str] = None

class CommitteeResponseWithEmployees(BaseModel):
    id: int
    committeeNo: str
    committeeDate: str
    committeeTitle: str
    committeeBossName: str
    sex: Optional[str] = None
    committeeCount: Optional[int] = None
    notes: Optional[str] = None
    currentDate: Optional[str] = None
    userID: Optional[int] = None
    username: Optional[str] = None
    pdfFiles: List[PDFResponse] = []
    employees: List[EmployeeInCommitteeResponse] = []  # ✅ NEW


    
    