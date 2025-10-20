from sqlalchemy import Column, BigInteger, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.database import Base

class JunctionCommitteeEmployee(Base):
    __tablename__ = "junctionCommitteeEmployee"
    
    # Step 1: Define table columns
    id = Column(BigInteger, primary_key=True, autoincrement=True, index=True)
    committeeID = Column(
        BigInteger, 
        ForeignKey("committee.id", ondelete="CASCADE"), 
        nullable=False,
        index=True
    )
    empID = Column(
        BigInteger, 
        ForeignKey("employee.empID", ondelete="CASCADE"), 
        nullable=False,
        index=True
    )
    createdDate = Column(DateTime, default=func.now())
    createdBy = Column(Integer, nullable=True)  #  No FK, just store userID
    
    # Step 2: Define relationships (only committee and employee)
    committee = relationship("Committee", back_populates="committee_members")
    employee = relationship("Employee", back_populates="committee_memberships")
       
    
    