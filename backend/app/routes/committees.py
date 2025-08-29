from datetime import datetime
from fastapi import APIRouter, File, HTTPException, Query, Request, UploadFile, Form, Depends
import pydantic
from sqlalchemy import select,extract
from sqlalchemy.ext.asyncio import AsyncSession  
from app.database.database import get_async_db

from fastapi import APIRouter
from app.database.config import settings
from app.helper.save_pdf import save_pdf_to_server
from app.models.PDFTable import PDFCreate
from app.models.committee import CommitteeCreate
from app.services.committee import CommitteeService
from app.services.pdf import PDFService


committeesRouter = APIRouter(prefix="/api/committees", tags=["COMMITTEES"])




@committeesRouter.get("/test-health")
async def test_path():
    return {
        "health": "good and healthy",
        "PDF_UPLOAD_PATH": settings.PDF_UPLOAD_PATH.as_posix(),
        "PDF_SOURCE_PATH": settings.PDF_SOURCE_PATH.as_posix(),
    }


@committeesRouter.post("/post")
async def addCommitteeDoc( 
    committeeNo:str= Form(...),
    committeeDate: str = Form(...),
    committeeTitle: str = Form(...),
    committeeBossName: str = Form(...),
    sex: str = Form(...),
    committeeCount: str = Form(...),
    sexCountPerCommittee: str = Form(...),
 
    notes: str = Form(...),
    userID: str = Form(...),
    file: UploadFile = Form(...),
    # username: str = Form(),
    db: AsyncSession = Depends(get_async_db)
    

):

    try: 

        committeesDocsData = CommitteeCreate(
                            committeeNo=committeeNo,
                            committeeDate = committeeDate,
                            committeeTitle= committeeTitle,
                            committeeBossName= committeeBossName,
                            sex =sex,
                            committeeCount= committeeCount,
                            sexCountPerCommittee=sexCountPerCommittee,
                            notes = notes,
                            currentDate = datetime.today().strftime('%Y-%m-%d'),
                            userID = userID
                            )
        
        
        newCommiteeID = await CommitteeService.insertCommitteesDocsData(db,committeesDocsData)
        print(f"Inserted committee with ID: {newCommiteeID}")

        print(f" {committeesDocsData}")

        # Count PDFs
        count = await PDFService.get_pdf_count(db, newCommiteeID)
        print(f"PDF count for new Commitee record {newCommiteeID}: {count}")


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
            committeeDate= committeeDate,
            countPdf=count,
            pdf=pdf_path,
            userID=int(userID),
            currentDate=datetime.now().date().isoformat()
        )
        print(f"Inserted PDF record... pdf_data: {pdf_data}")
        await PDFService.insert_pdf(db, pdf_data)
        print(f"Inserted PDF record... pdf_data: {pdf_data}")

        return {
            "id" : newCommiteeID,
            "count": count
        }

        

    except Exception as e:
        print(f"❌ Error in add_book_with_pdf: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}") 
        