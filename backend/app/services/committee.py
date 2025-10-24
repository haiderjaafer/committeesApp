from datetime import date, datetime
import os
from typing import Any, Dict, List, Optional
from fastapi import HTTPException, Request, UploadFile
from pydantic import BaseModel
from sqlalchemy import delete, desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from urllib.parse import unquote
from app.helper.save_pdf import save_pdf_to_server
from app.models.PDFTable import PDFCreate, PDFResponse, PDFTable
from app.models.committee import Committee, CommitteeCreate, CommitteeResponse
from app.models.employee import CommitteeResponseWithEmployees, Employee, EmployeeInCommitteeResponse
from app.models.junction_committee_employee import JunctionCommitteeEmployee
from app.models.users import Users
import logging
from app.database.config import settings
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
    async def insertCommitteesDocsData(
        db: AsyncSession, 
        committeeCreateArgs: CommitteeCreate,
        userID: int
    ) -> int:
        """
        Insert new committee and link employees as members
        
        Steps:
        1. Create committee record
        2. Link employees to committee via junction table
        3. Return new committee ID
        """
        try:
            # Step 1: Create committee record
            logger.info(f"Creating committee: {committeeCreateArgs.committeeNo}")
            
            # Extract employee IDs before creating committee
            employee_ids = committeeCreateArgs.employeeIDs or []
            
            # Create committee dict without employeeIDs
            committee_data = committeeCreateArgs.model_dump(exclude={'employeeIDs'})
            new_committee = Committee(**committee_data)
            
            db.add(new_committee)
            await db.flush()  #  Flush to get ID without committing
            
            logger.info(f"Committee created with ID: {new_committee.id}")
            
            # Step 2: Link employees to committee
            if employee_ids:
                logger.info(f"Adding {len(employee_ids)} employees to committee {new_committee.id}")
                
                for emp_id in employee_ids:
                    # Verify employee exists
                    emp_stmt = select(Employee).where(Employee.empID == emp_id)
                    emp_result = await db.execute(emp_stmt)
                    employee = emp_result.scalar_one_or_none()
                    
                    if not employee:
                        logger.warning(f"Employee ID {emp_id} not found, skipping")
                        continue
                    
                    # Create junction record
                    junction_record = JunctionCommitteeEmployee(
                        committeeID=new_committee.id,
                        empID=emp_id,
                        createdBy=userID
                    )
                    db.add(junction_record)
                    logger.info(f"Added employee {employee.name} (ID: {emp_id}) to committee")
            
            # Step 3: Commit transaction
            await db.commit()
            await db.refresh(new_committee)
            
            logger.info(f"Successfully created committee {new_committee.id} with {len(employee_ids)} members")
            
            return new_committee.id
            
        except Exception as e:
            await db.rollback()
            logger.error(f"Error creating committee: {str(e)}", exc_info=True)
            raise
    

    

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
        Now includes employee count for each committee.
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
                    filters.append(Committee.currentDate.isnot(None))
                    filters.append(Committee.currentDate.between(start_date, end_date))
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
                    Committee.notes,
                    Committee.userID,
                    Committee.currentDate,
                    Users.username,
                )
                .outerjoin(Users, Committee.userID == Users.id)
                .filter(*filters)
                .group_by(
                    Committee.id,
                    Committee.committeeNo,
                    Committee.committeeDate,
                    Committee.committeeTitle,
                    Committee.committeeBossName,
                    Committee.committeeCount,
                    Committee.notes,
                    Committee.userID,
                    Committee.currentDate,
                    Users.username,
                )
                .order_by(desc(Committee.currentDate))
                .offset(offset)
                .limit(limit)
            )
            
            result = await db.execute(query)
            rows = result.fetchall()

            # Extract committee IDs for fetching related data
            committee_ids = [row.id for row in rows]
            committee_nos = [row.committeeNo for row in rows]

            # ✅ Step 1: Fetch PDFs for the committeeNos
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

            #  Step 2: Fetch employee counts for each committee
            employee_count_stmt = (
                select(
                    JunctionCommitteeEmployee.committeeID,
                    func.count(JunctionCommitteeEmployee.empID).label('employee_count')
                )
                .filter(JunctionCommitteeEmployee.committeeID.in_(committee_ids))
                .group_by(JunctionCommitteeEmployee.committeeID)
            )
            employee_count_result = await db.execute(employee_count_stmt)
            employee_count_rows = employee_count_result.fetchall()

            # Create map of committee ID to employee count
            employee_count_map = {
                row.committeeID: row.employee_count 
                for row in employee_count_rows
            }

            logger.info(f"Employee counts: {employee_count_map}")

            # ✅ Step 3: Format response data with employee count
            data = [
                {
                    "serialNo": offset + i + 1,
                    "id": row.id,
                    "committeeNo": row.committeeNo,
                    "committeeDate": row.committeeDate.strftime("%Y-%m-%d") if row.committeeDate else None,
                    "committeeTitle": row.committeeTitle,
                    "committeeBossName": row.committeeBossName,
                    "committeeCount": row.committeeCount,
                    "notes": row.notes,
                    "currentDate": row.currentDate.strftime("%Y-%m-%d") if row.currentDate else None,
                    "userID": row.userID,
                    "username": row.username,
                    "pdfFiles": pdf_map.get(row.committeeNo, []),
                    "pdfCount": len(pdf_map.get(row.committeeNo, [])),
                    "employeeCount": employee_count_map.get(row.id, 0)  # ✅ NEW: Employee count
                }
                for i, row in enumerate(rows)
            ]

            logger.info(f"Fetched {len(data)} records with PDFs and employees")
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
                    filters.append(Committee.currentDate.isnot(None))
                    filters.append(Committee.currentDate.between(start_date, end_date))
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
                    Committee.notes,
                    Committee.userID,
                    Committee.currentDate,
                    Users.username,
                )
                .outerjoin(Users, Committee.userID == Users.id)
               
                .filter(*filters).group_by(
                    Committee.id,
                    Committee.committeeNo,
                    Committee.committeeDate,
                    Committee.committeeTitle,
                    Committee.committeeBossName,
                    Committee.committeeCount,
                    Committee.sex,
                    Committee.notes,
                    Committee.userID,
                    Committee.currentDate,
                    Users.username,
                    
                )
                .order_by(Committee.committeeDate)
            )

            result = await db.execute(stmt)
            rows = result.fetchall()

            # Step 4: Format response
            data = [
                
                {
                #    "serialNo": offset + i + 1,
                    "id": row.id,
                    "committeeNo": row.committeeNo,
                    "committeeDate": row.committeeDate.strftime("%Y-%m-%d") if row.committeeDate else None,
                    "committeeTitle": row.committeeTitle,
                    "committeeBossName": row.committeeBossName,
                    "committeeCount": row.committeeCount,
                    "sex": row.sex,
                    "notes": row.notes,
                    "currentDate": row.currentDate.strftime("%Y-%m-%d") if row.currentDate else None,
                    "userID": row.userID,
                    "username": row.username,
                }
                for row in rows
            ]

            return {
                "count": len(rows),  #   total count
                "data": data         #   list of objects 
            }

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error in reportBookFollowUp: {str(e)}")
            raise HTTPException(status_code=500, detail="Error retrieving filtered report.")








    
    @staticmethod
    async def getCommitteeWithPdfsByIDMethod(
        db: AsyncSession, 
        id: int
    ) -> Dict[str,Any]:
        """
        Fetch committee with all associated PDFs, user information, and employees
        """
        try:
            # Step 1: Fetch committee with PDFs
            result = await db.execute(
                select(Committee, PDFTable, Users)
                .outerjoin(PDFTable, Committee.id == PDFTable.committeeID)
                .outerjoin(Users, PDFTable.userID == Users.id)
                .filter(Committee.id == id)
            )
            rows = result.fetchall()
            
            if not rows or not rows[0][0]:
                raise HTTPException(status_code=404, detail="Committee not found")

            committee = rows[0][0]
            pdfs = [(row[1], row[2]) for row in rows if row[1]] or []

            # Convert committee dates
            converted_committee_date = (
                committee.committeeDate.strftime('%Y-%m-%d') 
                if isinstance(committee.committeeDate, date) 
                else committee.committeeDate
            )
            
            converted_current_date = (
                committee.currentDate.strftime('%Y-%m-%d') 
                if isinstance(committee.currentDate, date) 
                else committee.currentDate
            )

            # Build PDF responses
            pdf_responses: List[PDFResponse] = [
                PDFResponse(
                    id=pdf.id,
                    committeeID=pdf.committeeID,
                    committeeNo=pdf.committeeNo,
                    countPdf=pdf.countPdf,
                    pdf=pdf.pdf,
                    currentDate=pdf.currentDate,
                    userID=pdf.userID,
                    username=user.username if user else None
                )
                for pdf, user in pdfs
            ]

            # Fetch committee owner's username
            committee_user = None
            if committee.userID:
                committee_user_result = await db.execute(
                    select(Users).filter(Users.id == committee.userID)
                )
                committee_user = committee_user_result.scalars().first()

            # ✅ Step 2: Fetch employees for this committee
            employees_result = await db.execute(
                select(Employee)
                .join(
                    JunctionCommitteeEmployee,
                    Employee.empID == JunctionCommitteeEmployee.empID
                )
                .filter(JunctionCommitteeEmployee.committeeID == id)
                .order_by(Employee.name.asc())
            )
            employees = employees_result.scalars().all()
            
            logger.info(f"Found {len(employees)} employees for committee {id}")
            
            # Build employee responses
            employee_responses: List[EmployeeInCommitteeResponse] = [
                EmployeeInCommitteeResponse(
                    empID=emp.empID,
                    name=emp.name,
                    employee_desc=emp.employee_desc,
                    gender=emp.gender,
                    genderName="ذكر" if emp.gender == 1 else "أنثى" if emp.gender == 2 else None
                )
                for emp in employees
            ]

            # ✅ Step 3: Return complete response
            return CommitteeResponseWithEmployees(
                id=committee.id,
                committeeNo=committee.committeeNo,
                committeeDate=converted_committee_date,
                committeeTitle=committee.committeeTitle,
                committeeBossName=committee.committeeBossName,
                sex=committee.sex,
                committeeCount=committee.committeeCount,
                notes=committee.notes,
                currentDate=converted_current_date,
                userID=committee.userID,
                username=committee_user.username if committee_user else None,
                pdfFiles=pdf_responses,
                employees=employee_responses  # ✅ Include employees
            )

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error fetching Committee ID {id}: {str(e)}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    


    @staticmethod
    async def UpdateRecordWithoutFile(
        db: AsyncSession,
        id: int,
        update_data: Dict[str, Any],
        employee_ids: Optional[List[int]] = None  #  Optional employee IDs
    ) -> Dict[str, Any]:
        """
        Update a committee record without file upload
        
        Args:
            db: Database session
            id: Committee ID
            update_data: Dictionary of committee fields to update
            employee_ids: Optional list of employee IDs
                - If provided: Update junction table (replace all employees)
                - If None: Leave employees unchanged
                - If empty list []: Remove all employees
        
        Returns:
            Dictionary with updated committee data and employee count
        """
        try:
            print(f"Service - Updating committee ID: {id}")
            print(f"Update data: {update_data}")
            print(f"Employee IDs: {employee_ids}")
            
            # Step 1: Check if committee exists
            stmt = select(Committee).where(Committee.id == id)
            result = await db.execute(stmt)
            existing_record = result.scalar_one_or_none()
            
            if not existing_record:
                raise HTTPException(
                    status_code=404,
                    detail=f"Committee with ID {id} not found"
                )
            
            # Step 2: Update committee fields
            if update_data:
                for key, value in update_data.items():
                    if hasattr(existing_record, key):
                        setattr(existing_record, key, value)
                        logger.info(f"Updated {key} = {value}")
            
            #  Step 3: Update employee associations if provided
            employee_count = None
            if employee_ids is not None:
                logger.info(f"Updating employees for committee {id}")
                
                # Step 3a: Delete all existing employee associations
                delete_stmt = delete(JunctionCommitteeEmployee).where(
                    JunctionCommitteeEmployee.committeeID == id
                )
                delete_result = await db.execute(delete_stmt)
                deleted_count = delete_result.rowcount
                logger.info(f"Deleted {deleted_count} existing employee associations")
                
                # Step 3b: Insert new employee associations
                if employee_ids:  # Only if list is not empty
                    # Validate that all employee IDs exist
                    valid_emp_stmt = select(Employee.empID).where(
                        Employee.empID.in_(employee_ids)
                    )
                    valid_emp_result = await db.execute(valid_emp_stmt)
                    valid_emp_ids = [row[0] for row in valid_emp_result.fetchall()]
                    
                    # Check for invalid IDs
                    invalid_ids = set(employee_ids) - set(valid_emp_ids)
                    if invalid_ids:
                        await db.rollback()
                        raise HTTPException(
                            status_code=400,
                            detail=f"Invalid employee IDs: {list(invalid_ids)}"
                        )

                    userID = update_data.get('userID') or existing_record.userID

                    # Insert new associations
                    for emp_id in employee_ids:
                        junction_entry = JunctionCommitteeEmployee(
                            committeeID=id,
                            empID=emp_id,
                            createdBy=userID
                        )
                        db.add(junction_entry)
                    
                    logger.info(f"Added {len(employee_ids)} new employee associations")
                    employee_count = len(employee_ids)
                else:
                    logger.info("Removed all employee associations (empty array provided)")
                    employee_count = 0
            else:
                # Step 3c: If employee_ids is None, count existing employees
                count_stmt = select(JunctionCommitteeEmployee).where(
                    JunctionCommitteeEmployee.committeeID == id
                )
                count_result = await db.execute(count_stmt)
                employee_count = len(count_result.scalars().all())
                logger.info(f"Employee associations unchanged, current count: {employee_count}")
            
            # Step 4: Commit all changes
            await db.commit()
            await db.refresh(existing_record)
            
            logger.info(f"Successfully updated committee ID {id}")
            
            # Step 5: Return updated data
            response_data = {
                "id": existing_record.id,
                "committeeNo": existing_record.committeeNo,
                "committeeDate": existing_record.committeeDate.isoformat() if existing_record.committeeDate else None,
                "committeeTitle": existing_record.committeeTitle,
                "committeeBossName": existing_record.committeeBossName,
                "sex": existing_record.sex,
                "committeeCount": existing_record.committeeCount,
                "notes": existing_record.notes,
                "currentDate": existing_record.currentDate.isoformat() if existing_record.currentDate else None,
                "userID": existing_record.userID,
                "employeeCount": employee_count  #  Include employee count
            }
            
            return response_data
            
        except HTTPException:
            await db.rollback()
            raise
        except Exception as e:
            logger.error(f"Error updating committee ID {id}: {str(e)}", exc_info=True)
            await db.rollback()
            raise HTTPException(
                status_code=500,
                detail=f"Database error: {str(e)}"
            )



    

    @staticmethod
    async def UpdateRecordWithFile(
        db: AsyncSession,
        id: int,
        update_data: Dict[str, Any],
        file: UploadFile,
        username: Optional[str] = None,
        employee_ids: Optional[List[int]] = None  #  NEW: Optional employee IDs
    ) -> Dict[str, Any]:
        """
        Update a committee record with file upload
        
        Args:
            db: Database session
            id: Committee ID
            update_data: Dictionary of committee fields to update
            file: PDF file to upload
            username: Username for file saving
            employee_ids: Optional list of employee IDs
                - If provided: Update junction table (replace all employees)
                - If None: Leave employees unchanged
                - If empty list []: Remove all employees
        
        Returns:
            Dictionary with updated committee data, file info, and employee count
        """
        try:
            print(f"Service (With File) - Updating committee ID: {id}")
            print(f"Update data: {update_data}")
            print(f"Employee IDs: {employee_ids}")
            
            # Step 1: Check if committee exists
            stmt = select(Committee).where(Committee.id == id)
            result = await db.execute(stmt)
            existing_record = result.scalar_one_or_none()
            
            if not existing_record:
                raise HTTPException(
                    status_code=404,
                    detail=f"Committee with ID {id} not found"
                )
            
            # Step 2: Get userID
            userID = update_data.get('userID') or existing_record.userID
            
            # Step 3: Get committeeNo and committeeDate (for file naming)
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
            
            # Step 4: Save the file
            file_path = None
            try:
                count = await PDFService.get_pdf_count(db, id)
                file_path = save_pdf_to_server(
                    source_file=file.file,
                    committeeNo=committee_no,
                    committeeDate=committee_date_str,
                    count=count,
                    dest_dir=settings.PDF_UPLOAD_PATH
                )
                
                # Insert PDF record
                pdf_data = PDFCreate(
                    committeeID=id,
                    committeeNo=committee_no,
                    countPdf=count + 1,
                    pdf=file_path,
                    userID=userID,
                    currentDate=datetime.now().date().isoformat()
                )
                await PDFService.insert_pdf(db, pdf_data)
                logger.info(f"Successfully saved PDF for committee ID {id}")
                
            except FileExistsError as e:
                raise HTTPException(
                    status_code=409,
                    detail=str(e)
                )
            except Exception as e:
                logger.error(f"Error saving file: {str(e)}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Error saving file: {str(e)}"
                )
            
            # Step 5: Update committee fields
            if update_data:
                for key, value in update_data.items():
                    if hasattr(existing_record, key):
                        setattr(existing_record, key, value)
                        logger.info(f"Updated {key} = {value}")
            
            #  Step 6: Update employee associations if provided
            employee_count = None
            if employee_ids is not None:
                logger.info(f"Updating employees for committee {id}")
                
                # Step 6a: Delete all existing employee associations
                delete_stmt = delete(JunctionCommitteeEmployee).where(
                    JunctionCommitteeEmployee.committeeID == id
                )
                delete_result = await db.execute(delete_stmt)
                deleted_count = delete_result.rowcount
                logger.info(f"Deleted {deleted_count} existing employee associations")
                
                # Step 6b: Insert new employee associations
                if employee_ids:  # Only if list is not empty
                    # Validate that all employee IDs exist
                    valid_emp_stmt = select(Employee.empID).where(
                        Employee.empID.in_(employee_ids)
                    )
                    valid_emp_result = await db.execute(valid_emp_stmt)
                    valid_emp_ids = [row[0] for row in valid_emp_result.fetchall()]
                    
                    # Check for invalid IDs
                    invalid_ids = set(employee_ids) - set(valid_emp_ids)
                    if invalid_ids:
                        await db.rollback()
                        raise HTTPException(
                            status_code=400,
                            detail=f"Invalid employee IDs: {list(invalid_ids)}"
                        )
                    
                    # Insert new associations
                    for emp_id in employee_ids:
                        junction_entry = JunctionCommitteeEmployee(
                            committeeID=id,
                            empID=emp_id,
                            createdBy=userID
                            
                        )
                        db.add(junction_entry)
                    
                    logger.info(f"Added {len(employee_ids)} new employee associations")
                    employee_count = len(employee_ids)
                else:
                    logger.info("Removed all employee associations (empty array provided)")
                    employee_count = 0
            else:
                # Step 6c: If employee_ids is None, count existing employees
                count_stmt = select(JunctionCommitteeEmployee).where(
                    JunctionCommitteeEmployee.committeeID == id
                )
                count_result = await db.execute(count_stmt)
                employee_count = len(count_result.scalars().all())
                logger.info(f"Employee associations unchanged, current count: {employee_count}")
            
            # Step 7: Commit all changes
            await db.commit()
            await db.refresh(existing_record)
            
            logger.info(f"Successfully updated committee ID {id} with file")
            
            # Step 8: Return updated data
            response_data = {
                "id": existing_record.id,
                "committeeNo": existing_record.committeeNo,
                "committeeDate": existing_record.committeeDate.isoformat() if existing_record.committeeDate else None,
                "committeeTitle": existing_record.committeeTitle,
                "committeeBossName": existing_record.committeeBossName,
                "sex": existing_record.sex,
                "committeeCount": existing_record.committeeCount,
                "notes": existing_record.notes,
                "currentDate": existing_record.currentDate.isoformat() if existing_record.currentDate else None,
                "userID": existing_record.userID,
                "file_saved": True,
                "file_path": file_path,
                "employeeCount": employee_count  #   employee count
            }
            
            return response_data
            
        except HTTPException:
            await db.rollback()
            raise
        except Exception as e:
            logger.error(f"Error updating committee ID {id} with file: {str(e)}", exc_info=True)
            await db.rollback()
            raise HTTPException(
                status_code=500,
                detail=f"Database error: {str(e)}"
            )

             


        
    @staticmethod
    async def getBossNameSuggestions(
        db: AsyncSession,
        BossName: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get unique boss name suggestions for autocomplete
        More efficient - only returns unique names, not full records
        """
        try:
            if not BossName:
                raise HTTPException(status_code=400, detail="BossName is required")
            
            logger.info(f"Getting suggestions for BossName: {BossName}")
            
            # Get distinct boss names matching the search
            stmt = select(
                Committee.committeeBossName, func.count(Committee.id).label('committee_count')
            ).where(
                Committee.committeeBossName.ilike(f"%{BossName}%")
            ).group_by(
                # Committee.committeeBossName,Committee.id
                 Committee.committeeBossName
            ).order_by(
                func.count(Committee.id).desc()  # Most used names first
            ).limit(10)  # Limit for autocomplete
            
            result = await db.execute(stmt)
            suggestions = result.all()
            
            if not suggestions:
                return {
                    "success": True,
                    "message": "No suggestions found",
                    "count": 0,
                    "suggestions": []
                }
            
            # Format suggestions with count
            formatted_suggestions = [
                {
                    # "id":row.id,
                    "bossName": row.committeeBossName,
                    "count": row.committee_count
                }
                for row in suggestions
            ]
            
            logger.info(f"Found {len(suggestions)} unique boss names")
            
            return {
                "success": True,
                "message": f"Found {len(suggestions)} suggestions",
                "count": len(suggestions),
                "suggestions": formatted_suggestions
            }
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error in getBossNameSuggestions: {str(e)}", exc_info=True)
            raise HTTPException(status_code=500, detail="Internal server error")
        




    @staticmethod
    async def getCommitteesByBossNameWithDetails(
        db: AsyncSession,
        bossName: str
    ) -> Dict[str, Any]:
        """
        Get all committees with full details by boss name
        Includes PDFs, user info, and all related data
        """
        try:
            logger.info(f"Searching for committees with boss name: {bossName}")
            
            if not bossName or bossName.strip() == "":
                raise HTTPException(
                    status_code=400,
                    detail="Boss name is required"
                )
            
            # Query committees with exact match (case-insensitive)
            stmt = (
                select(Committee)
                .where(Committee.committeeBossName.ilike(bossName))
                .order_by(Committee.committeeDate.desc())
            )
            
            result = await db.execute(stmt)
            committees = result.scalars().all()
            
            if not committees:
                return {
                    "success": True,
                    "message": f"No committees found for boss: {bossName}",
                    "bossName": bossName,
                    "count": 0,
                    "data": []
                }
            
            # Build detailed response for each committee
            committees_data = []
            
            for committee in committees:
                # Get PDFs for this committee
                pdf_stmt = select(PDFTable).where(PDFTable.committeeID == committee.id)
                pdf_result = await db.execute(pdf_stmt)
                pdfs = pdf_result.scalars().all()
                
                # Get user info if userID exists
                user_info = None
                if committee.userID:
                    user_stmt = select(Users).where(Users.id == committee.userID)
                    user_result = await db.execute(user_stmt)
                    user = user_result.scalar_one_or_none()
                    if user:
                        user_info = {
                            "id": user.id,
                            "username": user.username,
                            "email": getattr(user, 'email', None)
                        }
                
                # Format PDF data
                pdf_data = []
                for pdf in pdfs:
                    pdf_data.append({
                        "id": pdf.id,
                        "committeeID": pdf.committeeID,
                        "committeeNo": pdf.committeeNo,
                        "countPdf": pdf.countPdf,
                        "pdf": pdf.pdf,
                        "currentDate": pdf.currentDate.isoformat() if pdf.currentDate else None,
                        "userID": pdf.userID
                    })
                
                # Build committee data
                committee_dict = {
                    "id": committee.id,
                    "committeeNo": committee.committeeNo,
                    "committeeDate": committee.committeeDate.isoformat() if committee.committeeDate else None,
                    "committeeTitle": committee.committeeTitle,
                    "committeeBossName": committee.committeeBossName,
                    "sex": committee.sex,
                    "committeeCount": committee.committeeCount,
                    "notes": committee.notes,
                    "currentDate": committee.currentDate.isoformat() if committee.currentDate else None,
                    "userID": committee.userID,
                    "user": user_info,
                    "pdfs": pdf_data,
                    "pdfCount": len(pdf_data)
                }
                
                committees_data.append(committee_dict)
            
            logger.info(f"Found {len(committees_data)} committees for boss: {bossName}")
            
            return {
                "success": True,
                "message": f"Found {len(committees_data)} committees",
                "bossName": bossName,
                "count": len(committees_data),
                "data": committees_data
            }
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error in getCommitteesByBossNameWithDetails: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=500,
                detail=f"Database error: {str(e)}"
            )    
        





    @staticmethod
    async def getCommitteesDetailsByBossNameReport(
        db: AsyncSession,
        bossName: str
    ) -> Dict[str, Any]:
        """
        Get all committees report data by boss name
        Returns only Committee model fields for report generation
        """
        try:
            logger.info(f"Searching for committees report with boss name: {bossName}")
            
            # Validate boss name
            if not bossName or bossName.strip() == "":
                raise HTTPException(
                    status_code=400,
                    detail="Boss name is required"
                )
            
            # Query committees with exact match (case-insensitive)
            stmt = (
                select(Committee)
                .where(Committee.committeeBossName.ilike(bossName))
                .order_by(Committee.committeeDate.desc())
            )
            
            result = await db.execute(stmt)
            committees = result.scalars().all()
            
            if not committees:
                return {
                    "success": True,
                    "message": f"No committees found for boss: {bossName}",
                    "bossName": bossName,
                    "count": 0,
                    "reportDate": datetime.now().isoformat(),
                    "data": []
                }
            
            # Build report data with only Committee model fields
            report_data: List[Dict[str, Any]] = []
            
            for committee in committees:
                committee_dict = {
                    "id": committee.id,
                    "committeeNo": committee.committeeNo,
                    "committeeDate": committee.committeeDate.isoformat() if committee.committeeDate else None,
                    "committeeTitle": committee.committeeTitle,
                    "committeeBossName": committee.committeeBossName,
                    "sex": committee.sex,
                    "committeeCount": committee.committeeCount,
                    "notes": committee.notes,
                    "currentDate": committee.currentDate.isoformat() if committee.currentDate else None,
                    "userID": committee.userID
                }
                report_data.append(committee_dict)
            
            logger.info(f"Found {len(report_data)} committees for report")
            
            return {
                "success": True,
                "message": f"Report generated successfully",
                "bossName": bossName,
                "count": len(report_data),
                "reportDate": datetime.now().isoformat(),
                "data": report_data
            }
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error in getCommitteesDetailsByBossNameReport: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=500,
                detail=f"Database error: {str(e)}"
            )
        

    