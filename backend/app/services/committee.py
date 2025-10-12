from datetime import date, datetime
from typing import Any, Dict, List, Optional
from fastapi import HTTPException, Request
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date, datetime
from app.helper.save_pdf import save_pdf_to_server
from app.models.PDFTable import PDFCreate, PDFResponse, PDFTable
from app.models.committee import Committee, CommitteeCreate, CommitteeResponse
from app.models.users import Users
from app.database.config import settings
import logging

from app.services.pdf import PDFService



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



    
    @staticmethod
    async def getCommitteeWithPdfsByIDMethod(db: AsyncSession, id: int) -> CommitteeResponse:
       
        try:
            # Fetch book, PDFs, and users in a single query
            result = await db.execute(
                select(Committee, PDFTable, Users)
                .outerjoin(PDFTable, Committee.id == PDFTable.committeeID)
                
                .outerjoin(Users, PDFTable.userID == Users.id)  # Join Users with PDFTable.userID
                .filter(Committee.id == id)
            )
            rows = result.fetchall()
            
            if not rows or not rows[0][0]:
                logger.error(f"Committee ID {id} not found")
                raise HTTPException(status_code=404, detail="Committee not found")

            # Extract book, PDFs, user, committee, and department
            book = rows[0][0]
        
            pdfs = [(row[1], row[2]) for row in rows if row[1]] or []  # Pair PDF with its user

            # Convert date fields to strings for book
            ConvertedCommitteeDate = book.committeeDate.strftime('%Y-%m-%d') if isinstance(book.committeeDate, date) else book.committeeDate
            

            # Construct PDF responses
            pdf_responses = [
                PDFResponse(
                    id=pdf.id,
                    committeeID=pdf.committeeID,
                    committeeNo=pdf.committeeNo,
                    pdf=pdf.pdf,
                    currentDate=pdf.currentDate,
                    username=user.username if user else None
                )
                for pdf, user in pdfs
            ]

            # Fetch the book owner's username separately if needed
            book_user = None
            if book.userID:
                book_user_result = await db.execute(
                    select(Users).filter(Users.id == book.userID)
                )
                book_user = book_user_result.scalars().first()

            # Construct response
            CommitteeResponsedata = CommitteeResponse(
                id= book.id,
                committeeNo= book.committeeNo,
                committeeDate= ConvertedCommitteeDate,
                committeeTitle= book.committeeTitle,
                committeeBossName= book.committeeBossName,
                sex= book.sex,
                committeeCount= book.committeeCount,
                sexCountPerCommittee= book.sexCountPerCommittee,
                notes= book.notes,
                currentDate= book.currentDate,
                userID= book.userID,
                username=book_user.username if book_user else None,

                
            )

            logger.info(f"Fetched Committee ID {id} with {len(pdf_responses)} PDFs and username {CommitteeResponsedata.username}")
            return CommitteeResponsedata

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error Committee  ID {id}: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")    


    
    from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any, Optional
from fastapi import HTTPException, UploadFile
from datetime import date
import logging

logger = logging.getLogger(__name__)

class CommitteeService:
    
    @staticmethod
    async def UpdateRecord(
        db: AsyncSession,
        id: int,
        update_data: Dict[str, Any],
        file: Optional[UploadFile] = None
    ) -> Dict[str, Any]:
        """
        Update a committee record in the database
        
        Args:
            db: Database session
            id: Record ID to update
            update_data: Dictionary containing fields to update
            file: Optional uploaded file
            
        Returns:
            Updated record as dictionary
        """
        try:
            print(f"Service - Updating committee ID: {id}")
            
            # Validate that there's data to update
            if not update_data and not file:
                raise HTTPException(
                    status_code=400,
                    detail="No fields provided for update"
                )
            
            # Check if record exists
            stmt = select(Committee).where(Committee.id == id)
            result = await db.execute(stmt)
            existing_record = result.scalar_one_or_none()
            
            if not existing_record:
                raise HTTPException(
                    status_code=404,
                    detail=f"Committee with ID {id} not found"
                )
            
            userID =  update_data.get('userID') or existing_record.userID
            
            # Handle file upload if provided
            if file is not None:
                # Get committeeNo and committeeDate from update_data or existing record
                committee_no = update_data.get('committeeNo') or existing_record.committeeNo
                committee_date = update_data.get('committeeDate') or existing_record.committeeDate

                
                # Validate required fields for file upload
                if not committee_no:
                    raise HTTPException(
                        status_code=400,
                        detail="committeeNo is required for file upload"
                    )
                if not committee_date:
                    raise HTTPException(
                        status_code=400,
                        detail="committeeDate is required for file upload"
                    )
                
                # Convert date to string format YYYY-MM-DD
                if isinstance(committee_date, date):
                    committee_date_str = committee_date.isoformat()
                else:
                    committee_date_str = str(committee_date)
                
                # Get current count (or default to 0)
                # current_count = existing_record.committeeCount or 0
                
                # Save the file using your existing helper function
                try:
                    count = await PDFService.get_pdf_count(db, id)
                    file_path = save_pdf_to_server(
                        source_file=file.file,
                        committeeNo=committee_no,
                        committeeDate=committee_date_str,
                        count=count,
                        dest_dir=settings.PDF_UPLOAD_PATH
                    )
                    # Add file path to update_data
                    update_data["file_path"] = file_path

                    pdf_data = PDFCreate(
                         committeeID= id,
                         committeeNo =committee_no,
                         countPdf= count,
                         pdf= file_path,
                         userID = userID,
                        currentDate=datetime.now().date().isoformat()
                    )
                    await PDFService.insert_pdf(db, pdf_data)
                    logger.info(f"Successfully saved PDF for book ID {id}")
                    
                except FileExistsError as e:
                    raise HTTPException(
                        status_code=409,
                        detail=str(e)
                    )
                except Exception as e:
                    raise HTTPException(
                        status_code=500,
                        detail=f"Error saving file: {str(e)}"
                    )
            
            # Update the record
            for key, value in update_data.items():
                if hasattr(existing_record, key):
                    setattr(existing_record, key, value)
            
            # Commit changes
            await db.commit()
            await db.refresh(existing_record)
            
            # Convert to dictionary
            return {
                "id": existing_record.id,
                "committeeNo": existing_record.committeeNo,
                "committeeDate": existing_record.committeeDate.isoformat() if existing_record.committeeDate else None,
                "committeeTitle": existing_record.committeeTitle,
                "committeeBossName": existing_record.committeeBossName,
                "sex": existing_record.sex,
                "committeeCount": existing_record.committeeCount,
                "sexCountPerCommittee": existing_record.sexCountPerCommittee,
                "notes": existing_record.notes,
                "currentDate": existing_record.currentDate.isoformat() if existing_record.currentDate else None,
                "userID": existing_record.userID,
                "file_path": getattr(existing_record, 'file_path', None)
            }
            
        except HTTPException:
            await db.rollback()
            raise
        except Exception as e:
            logger.error(f"Error updating committee ID {id}: {str(e)}")
            await db.rollback()
            raise HTTPException(
                status_code=500,
                detail=f"Database error: {str(e)}"
            )