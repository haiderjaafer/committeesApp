import logging
import os
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func,delete
# from app.helper.save_pdf import async_delayed_delete
from app.models.PDFTable import PDFTable, PDFCreate
from pathlib import Path
from app.database.config import settings
import asyncio



class PDFService:
    @staticmethod
    async def get_pdf_count(db: AsyncSession, id: int) -> int:
        """
        Returns the number of PDFs linked to the given book ID using SQL COUNT.
        """
        result = await db.execute(
            select(func.count()).select_from(PDFTable).where(PDFTable.committeeID == id)
        )
        return result.scalar_one()
    

    @staticmethod
    async def insert_pdf(db: AsyncSession, pdf: PDFCreate) -> PDFTable:
        """
        Inserts a new PDF record into the database.
        """
        new_pdf = PDFTable(**pdf.model_dump())
        db.add(new_pdf)
        await db.commit()
        await db.refresh(new_pdf)
        return new_pdf
    