from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, and_, or_, func
from sqlalchemy.orm import selectinload
from typing import Optional, List, Dict, Any
from datetime import date, datetime
from pydantic import BaseModel, Field, validator
import logging

from app.database.database import get_async_db
from app.models.committee import Committee, CommitteeResponse
from app.models.committeeSearch import AutoSuggestionRequest, AutoSuggestionResponse, CommitteeSearchRequest, CommitteeSearchResponse

# Configure logging
logger = logging.getLogger(__name__)

class CommitteeSearchService:
    """Service class for committee search operations"""
    
    def __init__(self, db: AsyncSession):
        self.db = db

    async def search_committees(self, search_request: CommitteeSearchRequest) -> CommitteeSearchResponse:
        """
        Search committees based on provided criteria - FIXED WITH BETTER ERROR HANDLING
        """
        try:
            logger.info(f"Starting search with request: {search_request}")
            
            # Build base query
            query = select(Committee)
            count_query = select(func.count(Committee.id))
            
            # Apply filters
            filters = self._build_filters(search_request)
            if filters:
                combined_filter = and_(*filters)
                query = query.where(combined_filter)
                count_query = count_query.where(combined_filter)
                logger.info(f"Applied {len(filters)} filters to query")
            else:
                logger.info("No filters applied - returning all results")
            
            # Get total count
            total_result = await self.db.execute(count_query)
            total = total_result.scalar()
            logger.info(f"Total matching records: {total}")
            
            # Apply sorting
            query = self._apply_sorting(query, search_request.sort_by, search_request.sort_order)
            
            # Apply pagination
            offset = (search_request.page - 1) * search_request.page_size
            query = query.offset(offset).limit(search_request.page_size)
            logger.info(f"Applied pagination: offset={offset}, limit={search_request.page_size}")
            
            # Execute query
            result = await self.db.execute(query)
            committees = result.scalars().all()
            logger.info(f"Retrieved {len(committees)} records")
            
            # Calculate pagination info
            total_pages = (total + search_request.page_size - 1) // search_request.page_size
            has_next = search_request.page < total_pages
            has_previous = search_request.page > 1
            
            response = CommitteeSearchResponse(
                data=[CommitteeResponse.model_validate(c) for c in committees],
                total=total,
                page=search_request.page,
                page_size=search_request.page_size,
                total_pages=total_pages,
                has_next=has_next,
                has_previous=has_previous
            )
            
            logger.info(f"Returning response with {len(response.data)} items")
            return response
            
        except Exception as e:
            logger.error(f"Error searching committees: {str(e)}")
            raise

    def _build_filters(self, search_request: CommitteeSearchRequest) -> List:
        """Build SQLAlchemy filters from search request - FIXED DATE FILTERING"""
        filters = []
        
        # Add debug logging to see what filters are being applied
        logger.info(f"Building filters for search request: {search_request}")
        
        # Exact committee number match
        if search_request.committeeNo:
            filters.append(Committee.committeeNo == search_request.committeeNo)
            logger.info(f"Added committeeNo filter: {search_request.committeeNo}")
        
        # FIXED: Date range filter - compare string dates directly
        if search_request.committeeDate_from:
            # Compare date column directly with string (SQLAlchemy handles conversion)
            filters.append(Committee.committeeDate >= search_request.committeeDate_from)
            logger.info(f"Added committeeDate_from filter: {search_request.committeeDate_from}")
        
        if search_request.committeeDate_to:
            # Compare date column directly with string (SQLAlchemy handles conversion)
            filters.append(Committee.committeeDate <= search_request.committeeDate_to)
            logger.info(f"Added committeeDate_to filter: {search_request.committeeDate_to}")
        
        # Partial text matches with null check and trimming
        if search_request.committeeTitle and search_request.committeeTitle.strip():
            title_filter = Committee.committeeTitle.ilike(f"%{search_request.committeeTitle.strip()}%")
            filters.append(title_filter)
            logger.info(f"Added committeeTitle filter: {search_request.committeeTitle.strip()}")
        
        if search_request.committeeBossName and search_request.committeeBossName.strip():
            boss_filter = Committee.committeeBossName.ilike(f"%{search_request.committeeBossName.strip()}%")
            filters.append(boss_filter)
            logger.info(f"Added committeeBossName filter: {search_request.committeeBossName.strip()}")
        
        logger.info(f"Total filters applied: {len(filters)}")
        return filters

    def _apply_sorting(self, query, sort_by: str, sort_order: str):
        """Apply sorting to query"""
        sort_column = getattr(Committee, sort_by)
        if sort_order == "desc":
            query = query.order_by(desc(sort_column))
        else:
            query = query.order_by(sort_column)
        
        return query

    async def get_title_suggestions(self, suggestion_request: AutoSuggestionRequest) -> AutoSuggestionResponse:
        """
        Get auto-suggestions for committee titles
        """
        try:
            query = (
                select(Committee.committeeTitle)
                .where(
                    and_(
                        Committee.committeeTitle.ilike(f"%{suggestion_request.query}%"),
                        Committee.committeeTitle.is_not(None)
                    )
                )
                .distinct()
                .limit(suggestion_request.limit)
            )
            
            result = await self.db.execute(query)
            suggestions = [title for title in result.scalars().all() if title]
            
            return AutoSuggestionResponse(
                suggestions=suggestions,
                count=len(suggestions)
            )
            
        except Exception as e:
            logger.error(f"Error getting title suggestions: {str(e)}")
            raise

    async def get_boss_name_suggestions(self, suggestion_request: AutoSuggestionRequest) -> AutoSuggestionResponse:
        """
        Get auto-suggestions for committee boss names
        """
        try:
            query = (
                select(Committee.committeeBossName)
                .where(
                    and_(
                        Committee.committeeBossName.ilike(f"%{suggestion_request.query}%"),
                        Committee.committeeBossName.is_not(None)
                    )
                )
                .distinct()
                .limit(suggestion_request.limit)
            )
            
            result = await self.db.execute(query)
            suggestions = [name for name in result.scalars().all() if name]
            
            return AutoSuggestionResponse(
                suggestions=suggestions,
                count=len(suggestions)
            )
            
        except Exception as e:
            logger.error(f"Error getting boss name suggestions: {str(e)}")
            raise

def get_committee_search_service(db: AsyncSession = Depends(get_async_db)) -> CommitteeSearchService:
    """Dependency to get committee search service"""
    return CommitteeSearchService(db)

    