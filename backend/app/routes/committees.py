
from datetime import datetime,date
import logging
import os
import traceback
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Body, File, HTTPException, Query, Request, UploadFile, Form, Depends
from fastapi.responses import FileResponse
import pydantic
from sqlalchemy import select,extract, desc
from sqlalchemy.ext.asyncio import AsyncSession  
from app.database.database import get_async_db
from pydantic import BaseModel, Field
from fastapi import APIRouter
from app.database.config import settings
from app.helper.save_pdf import save_pdf_to_server
from app.models.PDFTable import DeletePDFRequest, PDFCreate, PDFResponse, PDFTable
from app.models.committee import Committee, CommitteeCreate, CommitteeResponse
from app.models.committeeSearch import AutoSuggestionRequest, AutoSuggestionResponse, CommitteeBossNameResponse, CommitteeNoResponse, CommitteeSearchRequest, CommitteeSearchResponse, CommitteeTitleResponse
from app.models.users import Users
from app.services.committee import CommitteeService
from app.services.committeeSearch import CommitteeSearchService, get_committee_search_service
from app.services.pdf import PDFService
from urllib.parse import unquote


committeesRouter = APIRouter(prefix="/api/committees", tags=["COMMITTEES"])

# Configure logging
logger = logging.getLogger(__name__)


@committeesRouter.get("/test-health")
async def test_path():
    return {
        "health": "good and healthy",
        "PDF_UPLOAD_PATH": settings.PDF_UPLOAD_PATH.as_posix(),
        "PDF_SOURCE_PATH": settings.PDF_SOURCE_PATH.as_posix(),
    }


@committeesRouter.post("/post")
async def addCommitteeDoc( 
    committeeNo: str = Form(...),
    committeeDate: str = Form(...),
    committeeTitle: str = Form(...),
    committeeBossName: str = Form(...),
    sex: Optional[str] = Form(None),  #  Changed from Form(...) to Form(None)
    committeeCount: Optional[int] = Form(None),  #  Changed from Form(...) to Form(None)
    notes: Optional[str] = Form(None),  #  Changed from Form(...) to Form(None)
    userID: str = Form(...),
    file: UploadFile = File(...),  #  Changed from Form(...) to File(...)
    db: AsyncSession = Depends(get_async_db)
):
    """
    Add a new committee with PDF file
    Required fields: committeeNo, committeeDate, committeeTitle, committeeBossName, userID, file
    Optional fields: sex, committeeCount, notes
    """
    try: 
        committeesDocsData = CommitteeCreate(
            committeeNo=committeeNo,
            committeeDate=committeeDate,
            committeeTitle=committeeTitle,
            committeeBossName=committeeBossName,
            sex=sex,  #  Can be None now
            committeeCount=committeeCount,
            notes=notes,
            currentDate=datetime.today().strftime('%Y-%m-%d'),
            userID=userID
        )
        
        # Insert committee record
        newCommiteeID = await CommitteeService.insertCommitteesDocsData(db, committeesDocsData)
        print(f"Inserted committee with ID: {newCommiteeID}")
        print(f"Committee data: {committeesDocsData}")

        # Count PDFs
        count = await PDFService.get_pdf_count(db, newCommiteeID)
        print(f"PDF count for new Committee record {newCommiteeID}: {count}")

        # Save file
        upload_dir = settings.PDF_UPLOAD_PATH
        with file.file as f:
            pdf_path = save_pdf_to_server(f, committeeNo, committeeDate, count, upload_dir)
        print(f"Saved PDF to: {pdf_path}")

        # Close upload stream
        file.file.close()

        # Insert PDF record
        pdf_data = PDFCreate(
            committeeID=newCommiteeID,
            committeeNo=committeeNo,
            committeeDate=committeeDate,
            countPdf=count + 1,  #  Increment count
            pdf=pdf_path,
            userID=int(userID),
            currentDate=datetime.now().date().isoformat()
        )
        print(f"Inserting PDF record: {pdf_data}")
        await PDFService.insert_pdf(db, pdf_data)
        print(f"Successfully inserted PDF record")

        return {
            "success": True,
            "message": "Committee and PDF added successfully",
            "id": newCommiteeID,
            "count": count + 1
        }

    except Exception as e:
        print(f"❌ Error in addCommitteeDoc: {str(e)}")
        logger.error(f"Error in addCommitteeDoc: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")


@committeesRouter.get("/lastCommitteeNo")
async def getLastCommitteeNo(db: AsyncSession = Depends(get_async_db)):
    """Get the last inserted committee number"""
    try:
        # Query for just the committeeNo of the highest ID
        stmt = select(Committee.committeeNo).order_by(desc(Committee.id)).limit(1)
        result = await db.execute(stmt)
        lastCommitteeNo = result.scalar_one_or_none()
        
        if lastCommitteeNo is None:
            raise HTTPException(status_code=404, detail="No committees no found")
        
        return {"lastCommitteeNo": lastCommitteeNo}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    







@committeesRouter.get("/search", response_model=CommitteeSearchResponse)
async def search_committees_get(
    committeeNo: Optional[str] = Query(None, description="Committee number"),
    committeeDate_from: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    committeeDate_to: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    committeeTitle: Optional[str] = Query(None, description="Committee title"),
    committeeBossName: Optional[str] = Query(None, description="Boss name"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    sort_by: str = Query("id", description="Sort field"),
    sort_order: str = Query("desc", regex="^(asc|desc)$", description="Sort order"),
    service: CommitteeSearchService = Depends(get_committee_search_service)
):
    """
    Search committees using GET method (alternative to POST)
    """
    try:
        logger.error(f"Search committees GET committeeDate_from: {committeeDate_from}")
        search_request = CommitteeSearchRequest(
            committeeNo=committeeNo,
            committeeDate_from=committeeDate_from,
            committeeDate_to=committeeDate_to,
            committeeTitle=committeeTitle,
            committeeBossName=committeeBossName,
            page=page,
            page_size=limit,
            sort_by=sort_by,
            sort_order=sort_order
        )
        
        return await service.search_committees(search_request)
    except Exception as e:
        logger.error(f"Search committees GET error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@committeesRouter.get("/suggestions/titles", response_model=AutoSuggestionResponse)
async def get_title_suggestions(
    q: str = Query(..., min_length=1, max_length=100, description="Search query"),
    limit: int = Query(5, ge=1, le=20, description="Maximum suggestions"),
    service: CommitteeSearchService = Depends(get_committee_search_service)
):
    """
    Get auto-suggestions for committee titles
    """
    try:
        suggestion_request = AutoSuggestionRequest(query=q, limit=limit)
        return await service.get_title_suggestions(suggestion_request)
    except Exception as e:
        logger.error(f"Title suggestions error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@committeesRouter.get("/suggestions/boss-names", response_model=AutoSuggestionResponse)
async def get_boss_name_suggestions(
    q: str = Query(..., min_length=1, max_length=100, description="Search query"),
    limit: int = Query(5, ge=1, le=20, description="Maximum suggestions"),
    service: CommitteeSearchService = Depends(get_committee_search_service)
):
    """
    Get auto-suggestions for committee boss names
    """
    try:
        suggestion_request = AutoSuggestionRequest(query=q, limit=limit)
        return await service.get_boss_name_suggestions(suggestion_request)
    except Exception as e:
        logger.error(f"Boss name suggestions error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@committeesRouter.get("/checkCommitteeNoExistsForDebounce")
async def check_order_exists(
    
    committeeNo: str = Query(..., alias="committeeNo"),      # Required query parameter for committee number
    committeeDate: str = Query(..., alias="committeeDate"),  # Required query parameter for full date (YYYY-MM-DD)
    db: AsyncSession = Depends(get_async_db),      # Async database session dependency
):

    # Validate and extract year from bookDate
    try:
        print(committeeNo)
        # Parse the input date to ensure it's in YYYY-MM-DD format//// Validation: Uses datetime.strptime to parse the date and validate the format
        parsed_date = datetime.strptime(committeeDate.strip(), "%Y-%m-%d")
        year = parsed_date.year  # Extract the year
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD (e.g., 2025-06-08)")

    # Build async query to check for existence
    query = select(Committee).filter(
        Committee.committeeNo == committeeNo.strip(),  # Match committeeNo (strip whitespace)
        
        extract('year', Committee.committeeDate) == year   # this year front-end ... from Match year of bookDate //// SQLAlchemy extract: Uses extract('year', BookFollowUpTable.bookDate) to extract the year from the bookDate column in the database:


    )

    try:
        # Execute query and fetch the first result
        result = await db.execute(query)
        committeeNo = result.scalars().first()  # Get the first matching record (or None if none found)
        print(f"Query result: {committeeNo}")  # Debug query result
        return {"exists": bool(committeeNo)}  # Return existence as boolean
    except Exception as e:
        print(f"Database error: {str(e)}")  # Debug database errors
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")



@committeesRouter.get("/getAllCommitteeNo", response_model=CommitteeNoResponse)
async def getAllCommitteeNoFunction(db: AsyncSession = Depends(get_async_db)):
    print("getAllCommitteeNo ... route")
    return await CommitteeService.getAllCommitteeNoMethod(db)


@committeesRouter.get("/getAllCommitteeTitle", response_model=CommitteeTitleResponse)
async def getAllCommitteeNoFunction(search: str = Query(default="", description="Partial match for CommitteeTitle"),db: AsyncSession = Depends(get_async_db)):
    print("getAllCommitteeNo ... route")
    return await CommitteeService.getAllCommitteeTitleMethod(db,search)



@committeesRouter.get("/getAllCommitteeBossName", response_model=CommitteeBossNameResponse)
async def getAllCommitteeBossNameFunction(search: str = Query(default="", description="Partial match for CommitteeBossName"),db: AsyncSession = Depends(get_async_db)):
    print("getAllCommitteeBossName ... route")
    return await CommitteeService.getAllCommitteeBossNameMethod(db,search)




@committeesRouter.get("/getAllCommitteeNoBYQueryParams", response_model=Dict[str, Any])
async def getByFilterBooksNo(
    request: Request,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    committeeNo: Optional[str] = Query(None),
    committeeTitle: Optional[str] = Query(None),
    committeeBossName: Optional[str] = Query(None),
    committeeDate_from: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    committeeDate_to: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    # incomingNo: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_async_db)
) -> Dict[str, Any]:
    return await CommitteeService.getCommitteeNoBYQueryParams(
        request, db, page, limit, committeeNo,committeeTitle,committeeBossName,committeeDate_from,committeeDate_to
        # bookStatus, bookType, directoryName,subject, incomingNo
    )



@committeesRouter.get("/pdf/{committeeNo}", response_model=List[PDFResponse])
async def get_pdfs_by_book_no(committeeNo: str, db: AsyncSession = Depends(get_async_db)):
    print(f"Fetching PDFs for bookNo: {committeeNo}")
    try:
        query = (
            select(
                PDFTable.id,
                PDFTable.committeeID,
                PDFTable.pdf,
                PDFTable.committeeNo,
                PDFTable.currentDate,
                Users.username
            )
            .outerjoin(Users, PDFTable.userID == Users.id)
            .filter(PDFTable.committeeNo == committeeNo)
        )
        # print("Executing query...")
        result = await db.execute(query)
        # print("Query executed, fetching results...")
        pdf_records = result.fetchall()
        # print(f"Fetched {len(pdf_records)} records")
        
        pdfs = [
            {
                "id": record.id,
                "committeeID":str(record.committeeID),
                "pdf": record.pdf,
                "committeeNo": record.committeeNo,
                "currentDate": record.currentDate.strftime('%Y-%m-%d') if record.currentDate else None,
                "username": record.username if record.username else None
            }
            for record in pdf_records
        ]
        
        # print(f"Returning {pdfs} PDFs for bookNo: {committeeNo}")
        # for item in pdfs:
        #     print(f" forloop.... {type(item.get("committeeID"))}")  check committeeID type from list of dic(object)  

        return pdfs  # Returns [] if no records
    
    except Exception as e:
        print(f"Error fetching PDFs for bookNo {committeeNo}: {str(e)}")
        print("Traceback:", traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")



@committeesRouter.get("/pdf/file/{pdf_id}")
async def get_pdf_file(pdf_id: int, db: AsyncSession = Depends(get_async_db)):

    """
    Retrieve a single PDF file by its ID from PDFTable.
    Returns the PDF file if found and accessible.
    """
    print(f"Fetching PDF file with id: {pdf_id}")
    try:
        query = select(
            PDFTable.pdf,
            PDFTable.committeeNo,
            PDFTable.userID
        ).filter(PDFTable.id == pdf_id)

        result = await db.execute(query)
        pdf_record = result.first()

        print(f"Fetching pdf_record file with id: {pdf_record}")
        
        if not pdf_record:
            print(f"No PDF found for id: {pdf_id}")
            raise HTTPException(status_code=404, detail="PDF record not found in database")
        
        pdf_path, book_no, user_id = pdf_record
        print(f"Queried PDF path: {pdf_path}, bookNo: {book_no}, userID: {user_id}")
        
        if not os.path.exists(pdf_path):
            print(f"PDF file does not exist at: {pdf_path}")
            raise HTTPException(status_code=404, detail="PDF file not found on server")
        
        print(f"Serving PDF file: {pdf_path} for bookNo: {book_no}, userID: {user_id}")
        return FileResponse(pdf_path, media_type="application/pdf")
    except Exception as e:
        print(f"Error fetching PDF file with id {pdf_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")
    


@committeesRouter.delete("/delete_pdf", response_model=dict)
async def delete_pdf(request: DeletePDFRequest, db: AsyncSession = Depends(get_async_db)):
    """
    Deletes a PDFTable record and its associated file based on ID and pdf path.

    Args:
        request: JSON body with id and pdf
        db: Database session

    Returns:
        dict: {"success": true} if deletion succeeds, {"success": false} otherwise
    """
    try:
       # print(request.id)
      #  print(request.pdf)
        success = await PDFService.delete_pdf_record(db, request.id, request.pdf)
        return {"success": success}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in delete_pdf endpoint: {str(e)}")
        return {"success": False}
    

@committeesRouter.get("/getCommitteeCounts", response_model=dict)
async def getCommitteeCountsRoute(db: AsyncSession = Depends(get_async_db)):
    print("getCommitteeCountsRoute ... route")
    return await CommitteeService.getAllCommitteeCountsMethod(db)    
  



@committeesRouter.get("/report", response_model=List[CommitteeResponse])
async def committeeReportFunction(
    committeeDate_from: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    committeeDate_to: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    db: AsyncSession = Depends(get_async_db)
):
  
    print(committeeDate_from + committeeDate_to)
    return await CommitteeService.committeeReportMethod(db, committeeDate_from, committeeDate_to)



@committeesRouter.get("/getCommitteeWithPdfsByID/{id}", response_model=CommitteeResponse)
async def getCommitteeWithPdfsByIDFunction(
    id: int,
    db: AsyncSession = Depends(get_async_db)
):
   
    try:
        CommitteeData = await CommitteeService.getCommitteeWithPdfsByIDMethod(db, id)
        return CommitteeData
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching book ID {id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")
    

# without file route accept body
@committeesRouter.patch("/{id}/json", response_model=Dict[str, Any])
async def updateRecordWithoutFile(
    id: int,
    data: Dict[str, Any] = Body(...),
    db: AsyncSession = Depends(get_async_db)
):
    """
    Update a committee record by ID (without file upload)
    Content-Type: application/json
    """
    try:
        print(f"Route (No File) - Updating record ID: {id}")
        
        # Extract and validate data
        update_data = {}
        
        if data.get('committeeNo') is not None:
            update_data['committeeNo'] = data['committeeNo']
        if data.get('committeeDate') is not None:
            update_data['committeeDate'] = data['committeeDate']
        if data.get('committeeTitle') is not None:
            update_data['committeeTitle'] = data['committeeTitle']
        if data.get('committeeBossName') is not None:
            update_data['committeeBossName'] = data['committeeBossName']
        if data.get('sex') is not None:
            update_data['sex'] = data['sex']
        if data.get('committeeCount') is not None:
            update_data['committeeCount'] = data['committeeCount']
        
        if data.get('notes') is not None:
            update_data['notes'] = data['notes']
        if data.get('currentDate') is not None:
            update_data['currentDate'] = data['currentDate']
        if data.get('userID') is not None:
            update_data['userID'] = data['userID']
        
        if not update_data:
            raise HTTPException(
                status_code=400,
                detail="No fields provided for update"
            )
        
        updated_record = await CommitteeService.UpdateRecordWithoutFile(
            db, 
            id, 
            update_data
        )
        
        return {
            "success": True,
            "message": "Record updated successfully",
            "data": updated_record
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Server error: {str(e)}"
        )    
    
# # without file
# @committeesRouter.patch("/{id}/json", response_model=Dict[str, Any])
# async def updateRecordWithoutFile(
#     id: int,
#     committeeNo: Optional[str] = Form(None),
#     committeeDate: Optional[date] = Form(None),
#     committeeTitle: Optional[str] = Form(None),
#     committeeBossName: Optional[str] = Form(None),
#     sex: Optional[str] = Form(None),
#     committeeCount: Optional[int] = Form(None),
#     sexCountPerCommittee: Optional[int] = Form(None),
#     notes: Optional[str] = Form(None),
#     currentDate: Optional[date] = Form(None),
#     userID: Optional[int] = Form(None),
#     db: AsyncSession = Depends(get_async_db)
# ):
#     """
#     Update a committee record by ID (without file upload)
#     Content-Type: multipart/form-data (but no file)
#     """
#     try:
#         print(f"Route (No File) - Updating record ID: {id}")
        
#         # Build update dictionary
#         update_data = {
#             k: v for k, v in {
#                 "committeeNo": committeeNo,
#                 "committeeDate": committeeDate,
#                 "committeeTitle": committeeTitle,
#                 "committeeBossName": committeeBossName,
#                 "sex": sex,
#                 "committeeCount": committeeCount,
#                 "sexCountPerCommittee": sexCountPerCommittee,
#                 "notes": notes,
#                 "currentDate": currentDate,
#                 "userID": userID
#             }.items() if v is not None
#         }
        
#         # Validate that there's data to update
#         if not update_data:
#             raise HTTPException(
#                 status_code=400,
#                 detail="No fields provided for update"
#             )
        
#         # Call service method without file
#         updated_record = await CommitteeService.UpdateRecordWithoutFile(
#             db, 
#             id, 
#             update_data
#         )
        
#         return {
#             "success": True,
#             "message": "Record updated successfully",
#             "data": updated_record
#         }
#     except HTTPException:
#         raise
#     except Exception as e:
#         raise HTTPException(
#             status_code=500,
#             detail=f"Server error: {str(e)}"
#         )    
    

# with file
@committeesRouter.patch("/{id}", response_model=Dict[str, Any])
async def updateRecordWithFile(
    id: int,
    committeeNo: Optional[str] = Form(None),
    committeeDate: Optional[date] = Form(None),
    committeeTitle: Optional[str] = Form(None),
    committeeBossName: Optional[str] = Form(None),
    sex: Optional[str] = Form(None),
    committeeCount: Optional[int] = Form(None),
    
    notes: Optional[str] = Form(None),
    currentDate: Optional[date] = Form(None),
    userID: Optional[int] = Form(None),
    username: Optional[str] = Form(None),
    file: UploadFile = File(...),  # File is REQUIRED in this route
    db: AsyncSession = Depends(get_async_db)
):
    """
    Update a committee record by ID with file upload
    Content-Type: multipart/form-data
    """
    try:
        print(f"Route (With File) - Updating record ID: {id}")
        
        # Validate file
        if not file or file.size == 0:
            raise HTTPException(
                status_code=400,
                detail="File is required for this endpoint"
            )
        
        if file.content_type != 'application/pdf':
            raise HTTPException(
                status_code=400,
                detail="Only PDF files are allowed"
            )
        
        # Build update dictionary
        update_data = {
            k: v for k, v in {
                "committeeNo": committeeNo,
                "committeeDate": committeeDate,
                "committeeTitle": committeeTitle,
                "committeeBossName": committeeBossName,
                "sex": sex,
                "committeeCount": committeeCount,
    
                "notes": notes,
                "currentDate": currentDate,
                "userID": userID
            }.items() if v is not None
        }
        
        # Call service method with file
        updated_record = await CommitteeService.UpdateRecordWithFile(
            db, 
            id, 
            update_data,
            file,
            username
        )
        
        return {
            "success": True,
            "message": "Record and file updated successfully",
            "data": updated_record
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Server error: {str(e)}"
        )





class CommitteeBossName(BaseModel):
    BossName: str = Field(..., min_length=1, max_length=500, description="BossName to search for")

@committeesRouter.post("/getRecordsCommitteeBossName", response_model=Dict[str, Any])
async def getRecordsCommitteeBossNameFunction(
    request: CommitteeBossName,
    db: AsyncSession = Depends(get_async_db),
) -> Dict[str, Any]:
    """
    Get committee records by boss name
    Returns all committees with matching boss name
    """
    try:
        logger.info(f"Received POST request for BossName: {request.BossName}")
        logger.info(f"BossName length: {len(request.BossName)}")
        return await CommitteeService.getBossNameSuggestions(db, request.BossName)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in POST getRecords BossName: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@committeesRouter.get("/boss/{bossName}", response_model=Dict[str, Any])
async def getCommitteesByBossNameWithDetails(
    bossName: str,
    db: AsyncSession = Depends(get_async_db)
) -> Dict[str, Any]:
    """
    Get all committees with full details by boss name
    Includes related PDFs and all committee information
    
    Example: GET /api/committees/boss/رامي%20خالد%20مجيد%20الدلوي
    """
    try:
        logger.info(f"Fetching committees for boss: {bossName}")
        
        # Decode URL-encoded boss name
        from urllib.parse import unquote
        decoded_boss_name = unquote(bossName)
        
        return await CommitteeService.getCommitteesByBossNameWithDetails(db, decoded_boss_name)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in getCommitteesByBossNameWithDetails: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")
    





@committeesRouter.get("/reportBasedOnBossName/{bossName}", response_model=Dict[str, Any])
async def getCommitteesDetailsByBossNameReport(
    bossName: str,
    db: AsyncSession = Depends(get_async_db)
) -> Dict[str, Any]:
    """
    Get committees report by boss name

    """
    try:
        logger.info(f"Fetching committees report for boss: {bossName}")
        
        # Decode URL-encoded boss name
        decoded_boss_name = unquote(bossName)  # Replace %xx escapes by their single-character equivalent
        
        return await CommitteeService.getCommitteesDetailsByBossNameReport(db, decoded_boss_name)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in getCommitteesDetailsByBossNameReport: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")