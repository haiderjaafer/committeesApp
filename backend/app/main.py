#  Import FastAPI core
from fastapi import FastAPI

#  CORS middleware to allow frontend (like React on localhost:3000) to access the API
from fastapi.middleware.cors import CORSMiddleware

#  Context manager to define startup/shutdown behavior
from contextlib import asynccontextmanager

#  SQLAlchemy engine and base (used to create tables)
from app.database.database import engine, Base

#  Custom app settings from .env or config file
from app.database.config import settings

#  Import your route modules
from app.routes.committees import committeesRouter
# from app.routes.authentication import router
from app.routes.authentication import router

from app.routes.employees import employeesRouter  




@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.MODE.upper() == "DEVELOPMENT":  # Ensures dev mode is case-insensitive // READ MODE from .env file
        print("🌱 DEVELOPMENT mode: creating database tables...")
        
        # Fixed: Use async method for table creation
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    else:
        print("🚀 PRODUCTION mode: skipping table creation.")
        print(f"{app.title}...")

    yield  #  Allows the application to continue startup


def create_app() -> FastAPI:              #create_app() just defines a factory function returning a FastAPI app.

    app = FastAPI(
        title="COMMITEES API PROJECT",         # Shown in docs
        version="1.0.0",
        docs_url="/api/docs",             # Swagger UI
        redoc_url="/api/redoc",           # ReDoc UI
        lifespan=lifespan                 # Hook startup logic
    )

    #  Enable CORS for frontend (e.g., Next.js or React app on port 3000)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
        
        
         "http://localhost:3005",  # Local Next.js
        # "http://10.20.11.33:3000",  # server Production Next.js
        
    ],
        allow_credentials=True,
        # allow_methods=["*"],
        allow_methods=["GET", "POST", "PUT", "DELETE","PATCH", "OPTIONS"],

        allow_headers=["*"],
        expose_headers=["*"]
    )

    #  Register routers
    app.include_router(committeesRouter)
    app.include_router(router)
    app.include_router(employeesRouter)  


    return app


app = create_app()