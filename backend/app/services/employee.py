# services/employee_service.py
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_, cast, String
from app.models.committee import Committee
from app.models.employee import EmployeeSearchParams
from  app.models.employee import Employee
from typing import List, Dict, Any
import logging

from app.models.junction_committee_employee import JunctionCommitteeEmployee

logger = logging.getLogger(__name__)

class EmployeeService:
    
    @staticmethod
    async def searchEmployees(
        db: AsyncSession,
        search_term: str = None,
        employee_desc: int = None
    ) -> List[Dict[str, Any]]:
        """
        Search employees by name or employee_desc
        
        Steps:
        1. Build query based on search parameters
        2. Execute query
        3. Format response
        4. Return list of employees
        """
        try:
            # Step 1: Build base query
            query = select(Employee)
            
            # Step 2: Apply filters based on search parameters
            if search_term and search_term.strip():
                search_value = search_term.strip()
                
                # ✅ Log the search value for debugging
                logger.info(f"Search value: '{search_value}'")
                logger.info(f"Search value length: {len(search_value)}")
                
                # Check if search term is numeric (employee_desc search)
                if search_value.isdigit():
                    logger.info("Searching by employee_desc (numeric)")
                    # Search by employee_desc
                    query = query.where(
                        or_(
                            Employee.employee_desc == int(search_value),
                            cast(Employee.employee_desc, String).like(f"%{search_value}%")
                        )
                    )
                else:
                    logger.info("Searching by name (text)")
                    # ✅ Use LTRIM(RTRIM()) for SQL Server instead of trim()
                    query = query.where(
                        func.ltrim(func.rtrim(Employee.name)).like(f"%{search_value}%")
                    )
            
            # Step 3: Apply employee_desc exact filter if provided
            elif employee_desc is not None:
                logger.info(f"Filtering by exact employee_desc: {employee_desc}")
                query = query.where(Employee.employee_desc == employee_desc)
            
            else:
                logger.info("No filters applied, returning all employees")
            
            # Step 4: Order by name
            query = query.order_by(Employee.name.asc())
            
            # Step 5: Execute query
            logger.info(f"Executing query...")
            result = await db.execute(query)
            employees = result.scalars().all()
            
            logger.info(f"Query returned {len(employees)} results")
            
            # ✅ Log first few results for debugging
            if employees:
                for i, emp in enumerate(employees[:3]):
                    logger.info(f"Result {i+1}: empID={emp.empID}, name='{emp.name}', desc={emp.employee_desc}")
            
            # Step 6: Format response with gender names
            formatted_employees = []
            for emp in employees:
                gender_name = None
                if emp.gender == 1:
                    gender_name = "ذكر"
                elif emp.gender == 2:
                    gender_name = "أنثى"
                
                formatted_employees.append({
                    "empID": emp.empID,
                    "name": emp.name,
                    "employee_desc": emp.employee_desc,
                    "gender": emp.gender,
                    "genderName": gender_name
                })
            
            logger.info(f"Employee search completed: found {len(formatted_employees)} results")
            
            return formatted_employees
            
        except Exception as e:
            logger.error(f"Error searching employees: {str(e)}", exc_info=True)
            raise
    
    
    @staticmethod
    async def getEmployeeById(db: AsyncSession, emp_id: int) -> Dict[str, Any]:
        """Get single employee by ID"""
        try:
            # Step 1: Query employee by ID
            stmt = select(Employee).where(Employee.empID == emp_id)
            result = await db.execute(stmt)
            employee = result.scalar_one_or_none()
            
            if not employee:
                return None
            
            # Step 2: Format response
            gender_name = None
            if employee.gender == 1:
                gender_name = "ذكر"
            elif employee.gender == 2:
                gender_name = "أنثى"
            
            return {
                "empID": employee.empID,
                "name": employee.name,
                "employee_desc": employee.employee_desc,
                "gender": employee.gender,
                "genderName": gender_name
            }
            
        except Exception as e:
            logger.error(f"Error getting employee {emp_id}: {str(e)}", exc_info=True)
            raise
    
    
    @staticmethod
    async def autocompleteEmployeeName(
        db: AsyncSession,
        query: str,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """
        Smart autocomplete:
        1. If numeric: EXACT match on employee_desc
        2. If text: Sequential word match (starts with pattern)
        
        Examples:
        - "1022" → only employee_desc = 1022
        - "زهراء حازم" → names starting with "زهراء حازم"
        - "زهراء" → names starting with "زهراء"
        """
        try:
            if not query or not query.strip():
                return []
            
            search_term = query.strip()
            logger.info(f"Autocomplete search: '{search_term}'")
            
            # Step 1: Check if search is numeric (employee_desc)
            if search_term.isdigit():
                logger.info(f"Searching for exact employee_desc: {search_term}")
                
                # ✅ EXACT match only
                stmt = (
                    select(Employee)
                    .where(Employee.employee_desc == int(search_term))
                    .limit(limit)
                )
            else:
                # Step 2: Text search - Sequential word match
                logger.info(f"Searching for name starting with: '{search_term}'")
                
                # ✅ Use LIKE with pattern at START of name
                # This matches names that BEGIN with the search pattern
                stmt = (
                    select(Employee)
                    .where(
                        func.ltrim(func.rtrim(Employee.name)).like(f"{search_term}%")
                    )
                    .order_by(Employee.name.asc())
                    .limit(limit)
                )
            
            # Step 3: Execute query
            result = await db.execute(stmt)
            employees = result.scalars().all()
            
            logger.info(f"Autocomplete found {len(employees)} results")
            
            # Step 4: Format response
            return [
                {
                    "empID": emp.empID,
                    "name": emp.name,
                    "employee_desc": emp.employee_desc,
                    "gender": emp.gender,
                    "genderName": "ذكر" if emp.gender == 1 else "أنثى" if emp.gender == 2 else None
                }
                for emp in employees
            ]
            
        except Exception as e:
            logger.error(f"Error in autocomplete: {str(e)}", exc_info=True)
            raise
    
    
    @staticmethod
    async def getAllEmployees(db: AsyncSession) -> List[Dict[str, Any]]:
        """Get all employees"""
        try:
            # Step 1: Query all employees
            stmt = select(Employee).order_by(Employee.name.asc())
            result = await db.execute(stmt)
            employees = result.scalars().all()
            
            

            # Step 2: Format response
            formatted_employees = []
            for emp in employees:
                gender_name = None
                if emp.gender == 1:
                    gender_name = "ذكر"
                elif emp.gender == 2:
                    gender_name = "أنثى"
                
                formatted_employees.append({
                    "empID": emp.empID,
                    "name": emp.name,
                    "employee_desc": emp.employee_desc,
                    "gender": emp.gender,
                    "genderName": gender_name
                })
            
            logger.info(f"Retrieved {len(formatted_employees)} employees")
            
            return formatted_employees
            
        except Exception as e:
            logger.error(f"Error getting all employees: {str(e)}", exc_info=True)
            raise



    @staticmethod
    async def getCommitteeEmployeesMethod(
        db: AsyncSession,
        committee_id: int
    ) -> List[Dict[str, Any]]:
        """
        Fetch all employees for a specific committee
        
        Args:
            db: Database session
            committee_id: Committee ID
        
        Returns:
            List of employees with their details
        """
        try:
            logger.info(f"Fetching employees for committee ID: {committee_id}")
            
            # Step 1: Check if committee exists
            committee_stmt = select(Committee).where(Committee.id == committee_id)
            committee_result = await db.execute(committee_stmt)
            committee = committee_result.scalar_one_or_none()
            
            if not committee:
                raise HTTPException(
                    status_code=404,
                    detail=f"Committee with ID {committee_id} not found"
                )
            
            # Step 2: Fetch employees for this committee
            employees_stmt = (
                select(Employee)
                .join(
                    JunctionCommitteeEmployee,
                    Employee.empID == JunctionCommitteeEmployee.empID
                )
                .filter(JunctionCommitteeEmployee.committeeID == committee_id)
                .order_by(Employee.name.asc())
            )
            
            employees_result = await db.execute(employees_stmt)
            employees = employees_result.scalars().all()
            
            logger.info(f"Found {len(employees)} employees for committee {committee_id}")
            
            # Step 3: Format response
            formatted_employees = [
                {
                    "empID": emp.empID,
                    "name": emp.name,
                    "employee_desc": emp.employee_desc,
                    "gender": emp.gender,
                    "genderName": "ذكر" if emp.gender == 1 else "أنثى" if emp.gender == 2 else None
                }
                for emp in employees
            ]
            
            return formatted_employees
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error fetching employees for committee {committee_id}: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=500,
                detail=f"Database error: {str(e)}"
            )
