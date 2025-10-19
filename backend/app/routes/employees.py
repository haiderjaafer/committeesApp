# routes/employees.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List
import logging
from app.models.employee import EmployeeSearchParams
from app.services.employee import EmployeeService
from app.database.database import get_async_db


logger = logging.getLogger(__name__)
employeesRouter = APIRouter(prefix="/api/employees", tags=["employees"])


@employeesRouter.get("/search", response_model=dict)
async def searchEmployees(
    # Step 1: Accept search parameters (simplified)
    searchTerm: Optional[str] = Query(None, description="Search by name or employee_desc"),
    employee_desc: Optional[int] = Query(None, description="Filter by employee_desc"),
    db: AsyncSession = Depends(get_async_db)
):
    """
    Search employees by name or employee_desc
    
    Returns simple list without pagination
    
    Examples:
    - Full name: ?searchTerm=ايات نعمة محمود مهدي الخفاجي
    - Partial name: ?searchTerm=حيدر
    - Employee desc: ?searchTerm=8504
    - Exact employee_desc: ?employee_desc=8504
    """
    try:
        logger.info(f"Searching employees with searchTerm: {searchTerm}, employee_desc: {employee_desc}")
        
        # Step 2: Execute search
        employees = await EmployeeService.searchEmployees(
            db, 
            search_term=searchTerm,
            employee_desc=employee_desc
        )
        
        # Step 3: Return simple list
        return {
            "success": True,
            "count": len(employees),
            "data": employees
        }
        
    except Exception as e:
        logger.error(f"Error in search endpoint: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@employeesRouter.get("/autocomplete", response_model=List[dict])
async def autocompleteEmployee(
    # Step 1: Accept query parameter
    q: str = Query(..., min_length=1, description="Search query for autocomplete"),
    limit: int = Query(10, ge=1, le=50, description="Max results"),
    db: AsyncSession = Depends(get_async_db)
):
    """
    Fast autocomplete for employee names
    
    Examples:
    - ?q=حيدر
    - ?q=ايات&limit=5
    """
    try:
        # Step 2: Execute autocomplete search
        results = await EmployeeService.autocompleteEmployeeName(db, q, limit)
        
        # Step 3: Return suggestions
        return results
        
    except Exception as e:
        logger.error(f"Error in autocomplete: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@employeesRouter.get("/{emp_id}", response_model=dict)
async def getEmployee(
    # Step 1: Accept employee ID
    emp_id: int,
    db: AsyncSession = Depends(get_async_db)
):
    """
    Get single employee by ID
    
    Example: /api/employees/8504
    """
    try:
        # Step 2: Query employee
        employee = await EmployeeService.getEmployeeById(db, emp_id)
        
        if not employee:
            raise HTTPException(
                status_code=404,
                detail=f"Employee with ID {emp_id} not found"
            )
        
        # Step 3: Return employee data
        return {
            "success": True,
            "data": employee
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting employee: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@employeesRouter.get("/", response_model=dict)
async def getAllEmployees(
    db: AsyncSession = Depends(get_async_db)
):
    """
    Get all employees (no pagination)
    
    Example: /api/employees
    """
    try:
        # Step 1: Get all employees
        employees = await EmployeeService.getAllEmployees(db)
        
        # Step 2: Return all employees
        return {
            "success": True,
            "count": len(employees),
            "data": employees
        }
        
    except Exception as e:
        logger.error(f"Error getting all employees: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))