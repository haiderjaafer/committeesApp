from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from app.database.config import settings
from typing import AsyncGenerator


# Create async engine for SQL Server using aioodbc
engine = create_async_engine(
    settings.sqlalchemy_database_url,  # must be mssql+aioodbc://
    echo=False,
    future=True,
    pool_size=5,
    max_overflow=2,
    pool_timeout=30
)

# Async sessionmaker
AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)

# Base class for ORM models
Base = declarative_base()


async def get_async_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session