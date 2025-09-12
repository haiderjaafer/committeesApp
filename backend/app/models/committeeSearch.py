
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, and_, or_, func
from sqlalchemy.orm import selectinload
from typing import Optional, List, Dict, Any
from datetime import date, datetime
from pydantic import BaseModel, Field, field_validator, validator
import logging
from enum import Enum
from app.models.committee import CommitteeResponse

# Configure logging
logger = logging.getLogger(__name__)

# ========================= SEARCH MODELS =========================


class SortOrder(str, Enum):
    asc = "asc"
    desc = "desc"

class CommitteeSearchRequest(BaseModel):
    """Search request model with all search criteria"""
    committeeNo: Optional[str] = Field(None, description="Exact committee number")
    committeeDate_from: Optional[str] = Field(None, description="Start date (YYYY-MM-DD)")
    committeeDate_to: Optional[str] = Field(None, description="End date (YYYY-MM-DD)")
    committeeTitle: Optional[str] = Field(None, min_length=1, description="Committee title (partial match)")
    committeeBossName: Optional[str] = Field(None, min_length=1, description="Boss name (partial match)")
    
    # Pagination 
    page: int = Field(1, ge=1, description="Page number")
    page_size: int = Field(10, ge=1, le=100, description="Items per page")
    
    # Sorting
    sort_by: Optional[str] = Field("id", description="Sort field")
    sort_order: SortOrder = Field(SortOrder.desc, description="Sort order")
 

    @field_validator('committeeDate_from', 'committeeDate_to')
    def validate_dates(cls, v):
        if v is None:
            return None
        try:
            datetime.strptime(v, '%Y-%m-%d')
            return v
        except ValueError:
            raise ValueError("Date must be in YYYY-MM-DD format")
    
    @field_validator('sort_by')
    def validate_sort_by(cls, v):
        allowed_fields = ['id', 'committeeNo', 'committeeDate', 'committeeTitle', 'committeeBossName']
        if v not in allowed_fields:
            raise ValueError(f"sort_by must be one of: {allowed_fields}")
        return v

class AutoSuggestionRequest(BaseModel):
    """Auto-suggestion request model"""
    query: str = Field(..., min_length=1, max_length=100, description="Search query")
    limit: int = Field(5, ge=1, le=20, description="Maximum suggestions")

class CommitteeSearchResponse(BaseModel):
    """Search response with pagination"""
    data: List[CommitteeResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
    has_next: bool
    has_previous: bool

class AutoSuggestionResponse(BaseModel):
    """Auto-suggestion response"""
    suggestions: List[str]
    count: int

class CommitteeNoResponse(BaseModel):
    committeeNoList: List[str]
    count: int


class CommitteeTitleResponse(BaseModel):
    committeeTitleList: List[str]
    count: int

class CommitteeBossNameResponse(BaseModel):
    committeeBossNameList: List[str]
    count: int    