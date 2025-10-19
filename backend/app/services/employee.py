# services/employee_service.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_, cast, String
from app.models.employee import EmployeeSearchParams
from  app.models.employee import Employee
from typing import List, Dict, Any
import logging

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
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Fast autocomplete for employee names"""
        try:
            if not query or not query.strip():
                return []
            
            search_term = query.strip()
            
            logger.info(f"Autocomplete search: '{search_term}'")
            
            # Step 1: Build query with LTRIM(RTRIM()) for SQL Server
            stmt = (
                select(Employee)
                .where(func.ltrim(func.rtrim(Employee.name)).like(f"%{search_term}%"))
                .order_by(Employee.name.asc())
                .limit(limit)
            )
            
            # Step 2: Execute query
            result = await db.execute(stmt)
            employees = result.scalars().all()
            
            logger.info(f"Autocomplete found {len(employees)} results")
            
            # Step 3: Return results
            return [
                {
                    "empID": emp.empID,
                    "name": emp.name,
                    "employee_desc": emp.employee_desc
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