from datetime import datetime
from typing import Any, Dict, List, Optional
from fastapi import HTTPException, Request
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.PDFTable import PDFTable
from app.models.committee import Committee, CommitteeCreate, CommitteeResponse
from app.models.users import Users
import logging



# Configure logger
logger = logging.getLogger(__name__)
if not logger.handlers:  # Avoid duplicate handlers
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )


class CommitteeService:
    @staticmethod
    async def insertCommitteesDocsData(db: AsyncSession, CommitteeCreateArgs:CommitteeCreate ) -> int:
        newCommitteeObject = Committee(**CommitteeCreateArgs.model_dump())
        db.add(newCommitteeObject)
        await db.commit()
        await db.refresh(newCommitteeObject)
        return newCommitteeObject.id
    

    

    @staticmethod
    async def getAllCommitteeNoMethod(db: AsyncSession):
        stmt = (
            select(Committee.committeeNo)
            .where(Committee.committeeNo.isnot(None))
            .where(Committee.committeeNo != '')
            .where(Committee.committeeNo != 'NULL')  # Handle string 'NULL'
            .where(Committee.committeeNo != 'null')  # Handle string 'null'
            .group_by(Committee.committeeNo)
            .order_by(Committee.committeeNo)
        )
        
        result = await db.execute(stmt)
        values = result.scalars().all()
        
        # Extra aggressive filtering
        filtered_values = [
            str(v).strip() 
            for v in values 
            if v is not None 
            and str(v).strip() 
            and str(v).upper() not in ['NULL', 'NONE']
        ]
        
        # Return both list and count
        return {
            "committeeNoList": filtered_values,
            "count": len(filtered_values)
        }
    

    @staticmethod
    async def getAllCommitteeTitleMethod(db: AsyncSession, query: str = ""):
            stmt = (
                select(Committee.committeeTitle)
                .where(Committee.committeeTitle.isnot(None))
                .where(Committee.committeeTitle.ilike(f"%{query}%"))
                .distinct()
                .order_by(Committee.committeeTitle)
            )
            result = await db.execute(stmt)
            values=  result.scalars().all()

                # Extra aggressive filtering
            filtered_values = [
                str(v).strip() 
                for v in values 
                if v is not None 
                and str(v).strip() 
                and str(v).upper() not in ['NULL', 'NONE']
            ]
            
            # Return both list and count
            return {
                "committeeTitleList": filtered_values,
                "count": len(filtered_values)
            }


    @staticmethod
    async def getAllCommitteeBossNameMethod(db: AsyncSession, query: str = ""):
            stmt = (
                select(Committee.committeeBossName)
                .where(Committee.committeeBossName.isnot(None))
                .where(Committee.committeeBossName.ilike(f"%{query}%"))
                .distinct()
                .order_by(Committee.committeeBossName)
            )
            result = await db.execute(stmt)
            values=  result.scalars().all()

                # Extra aggressive filtering
            committeeBossNamefiltered_values = [
                str(v).strip() 
                for v in values 
                if v is not None 
                and str(v).strip() 
                and str(v).upper() not in ['NULL', 'NONE']
            ]
            
            # Return both list and count
            return {
                "committeeBossNameList": committeeBossNamefiltered_values,
                "count": len(committeeBossNamefiltered_values)
            }
    

    @staticmethod
    async def getCommitteeNoBYQueryParams(
        request: Request,
        db: AsyncSession,
        page: int = 1,
        limit: int = 10,
        committeeNo: Optional[str] = None,
        committeeTitle: Optional[str] = None,
        committeeBossName: Optional[str] = None,
        committeeDate_from: Optional[str] = None,
        committeeDate_to: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Retrieve committee records with pagination and optional filters.
        Supports independent filtering by committeeNo, committeeTitle, committeeBossName, or date range.
        """
        try:
            # Build filters dynamically
            filters = []
            if committeeNo:
                filters.append(Committee.committeeNo == committeeNo.strip())
            if committeeTitle:
                filters.append(Committee.committeeTitle.ilike(f"%{committeeTitle.strip().lower()}%"))
            if committeeBossName:
                filters.append(Committee.committeeBossName.ilike(f"%{committeeBossName.strip()}%"))
            if committeeDate_from and committeeDate_to:
                try:
                    start_date = datetime.strptime(committeeDate_from, "%Y-%m-%d").date()
                    end_date = datetime.strptime(committeeDate_to, "%Y-%m-%d").date()
                    if start_date > end_date:
                        raise HTTPException(status_code=400, detail="startDate cannot be after endDate")
                    filters.append(Committee.committeeDate.isnot(None))
                    filters.append(Committee.committeeDate.between(start_date, end_date))
                    logger.debug(f"Applying date range filter: {start_date} to {end_date}")
                except ValueError as e:
                    logger.error(f"Invalid date format: {str(e)}")
                    raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

            # Count total records
            count_stmt = select(func.count()).select_from(
                select(Committee.committeeNo).distinct().filter(*filters).subquery()
            )
            count_result = await db.execute(count_stmt)
            total = count_result.scalar() or 0
            logger.info(f"Total records: {total}, Page: {page}, Limit: {limit}")

            # Pagination offset
            offset = (page - 1) * limit

            # Fetch paginated records
            query = (
                select(
                    Committee.id,
                    Committee.committeeNo,
                    Committee.committeeDate,
                    Committee.committeeTitle,
                    Committee.committeeBossName,
                    Committee.committeeCount,
                    Committee.sex,
                    Committee.sexCountPerCommittee,
                    Committee.notes,
                    Committee.userID,
                    Committee.currentDate,
                    Users.username,
                )
                .outerjoin(Users, Committee.userID == Users.id)
                .filter(*filters)
                .distinct(Committee.committeeNo)
                .order_by(Committee.committeeNo)
                .offset(offset)
                .limit(limit)
            )
            result = await db.execute(query)
            rows = result.fetchall()

            # Fetch PDFs for the committeeNos
            committee_nos = [row.committeeNo for row in rows]
            pdf_stmt = (
                select(
                    PDFTable.id,
                    PDFTable.committeeNo,
                    PDFTable.pdf,
                    PDFTable.currentDate,
                    Users.username,
                )
                .outerjoin(Users, PDFTable.userID == Users.id)
                .filter(PDFTable.committeeNo.in_(committee_nos))
            )
            pdf_result = await db.execute(pdf_stmt)
            pdf_rows = pdf_result.fetchall()

            # Group PDFs by committeeNo
            pdf_map = {}
            for pdf in pdf_rows:
                if pdf.committeeNo not in pdf_map:
                    pdf_map[pdf.committeeNo] = []
                pdf_map[pdf.committeeNo].append({
                    "id": pdf.id,
                    "pdf": pdf.pdf,
                    "currentDate": pdf.currentDate.strftime("%Y-%m-%d") if pdf.currentDate else None,
                    "username": pdf.username,
                })

            # Format response data
            data = [
                {
                    "serialNo": offset + i + 1,
                    "id": row.id,
                    "committeeNo": row.committeeNo,
                    "committeeDate": row.committeeDate.strftime("%Y-%m-%d") if row.committeeDate else None,
                    "committeeTitle": row.committeeTitle,
                    "committeeBossName": row.committeeBossName,
                    "committeeCount": row.committeeCount,
                    "sex": row.sex,
                    "sexCountPerCommittee": row.sexCountPerCommittee,
                    "notes": row.notes,
                    "currentDate": row.currentDate.strftime("%Y-%m-%d") if row.currentDate else None,
                    "userID": row.userID,
                    "username": row.username,
                    "pdfFiles": pdf_map.get(row.committeeNo, []),
                }
                for i, row in enumerate(rows)  # Fixed: Iterate over rows
            ]

            logger.info(f"Fetched {len(data)} records with PDFs")
            return {
                "data": data,
                "total": total,
                "page": page,
                "limit": limit,
                "totalPages": (total + limit - 1) // limit,
            }
        except Exception as e:
            logger.error(f"Error fetching committees: {str(e)}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
        


    @staticmethod
    async def getAllCommitteeCountsMethod(db: AsyncSession) -> dict:
        try:
            # Count committees
            committee_query = select(func.count(Committee.committeeNo))
            committee_result = await db.execute(committee_query)
            committee_count = committee_result.scalar_one()

            # Count users
            user_query = (
                select(Users.username, func.count(Committee.id))
                .join(Committee, Committee.userID == Users.id)  # join Committee to Users
                .group_by(Users.username)
                .order_by(func.count(Committee.id).desc())
            )
            user_result = await db.execute(user_query)
            user_count_list = [{"username": row[0], "committee_count": row[1]} for row in user_result.all()]

            CountOfUsers =  select(func.count(Users.id))
            users_result = await db.execute(CountOfUsers)
            users_count = users_result.scalar_one()
            
            

            return {
                "allCommitteeCount": committee_count,
                "userCount": user_count_list,  # now it's a serializable list of dicts
                "usersCount" : users_count

            }

        except Exception as e:
            print(f"Error in getCommitteeCountsMethod: {str(e)}")
            raise HTTPException(status_code=500, detail="Error retrieving committee count")

            

    @staticmethod
    async def committeeReportMethod(
        db: AsyncSession,
        committeeDate_from: Optional[str] = None,
        committeeDate_to: Optional[str] = None,
        
    ) -> List[CommitteeResponse]:
        
        try:
            # Step 1: Build filters
            filters = []
            
            if committeeDate_from and committeeDate_to:
                try:
                    start_date = datetime.strptime(committeeDate_from, "%Y-%m-%d").date()
                    end_date = datetime.strptime(committeeDate_to, "%Y-%m-%d").date()
                    if start_date > end_date:
                        raise HTTPException(status_code=400, detail="startDate cannot be after endDate")
                    filters.append(Committee.committeeDate.isnot(None))
                    filters.append(Committee.committeeDate.between(start_date, end_date))
                    logger.debug(f"Applying date range filter: {start_date} to {end_date}")
                except ValueError as e:
                    logger.error(f"Invalid date format: {str(e)}")
                    raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

            # Step 3: Fetch matching records with optional user info
            stmt = (
                select(
                    Committee.id,
                    Committee.committeeNo,
                    Committee.committeeDate,
                    Committee.committeeTitle,
                    Committee.committeeBossName,
                    Committee.committeeCount,
                    Committee.sex,
                    Committee.sexCountPerCommittee,
                    Committee.notes,
                    Committee.userID,
                    Committee.currentDate,
                    Users.username,
                )
                .outerjoin(Users, Committee.userID == Users.id)
               
                .filter(*filters)
                .order_by(Committee.committeeDate)
            )

            result = await db.execute(stmt)
            rows = result.fetchall()

            # Step 4: Format response
            return [
                {
                #    "serialNo": offset + i + 1,
                    "id": row.id,
                    "committeeNo": row.committeeNo,
                    "committeeDate": row.committeeDate.strftime("%Y-%m-%d") if row.committeeDate else None,
                    "committeeTitle": row.committeeTitle,
                    "committeeBossName": row.committeeBossName,
                    "committeeCount": row.committeeCount,
                    "sex": row.sex,
                    "sexCountPerCommittee": row.sexCountPerCommittee,
                    "notes": row.notes,
                    "currentDate": row.currentDate.strftime("%Y-%m-%d") if row.currentDate else None,
                    "userID": row.userID,
                    "username": row.username,
                }
                for row in rows
            ]

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error in reportBookFollowUp: {str(e)}")
            raise HTTPException(status_code=500, detail="Error retrieving filtered report.")