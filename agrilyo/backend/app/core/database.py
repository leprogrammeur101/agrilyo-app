"""
Connexion à la base de données PostgreSQL — SQLAlchemy 2.0 async
"""

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import text

from app.core.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.is_development,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
    pool_recycle=3600,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

class Base(DeclarativeBase):
    def __repr__(self) -> str:
        cols = {c.name: getattr(self, c.name) for c in self.__table__.columns}
        attrs = ", ".join(f"{k}={v!r}" for k, v in list(cols.items())[:4])
        return f"<{self.__class__.__name__} {attrs}>"

async def get_db() -> AsyncSession:
    """
    Dependency FastAPI — session sans commit auto.
    Les services et endpoints doivent appeler explicitement await db.commit()
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

async def check_db_connection() -> bool:
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
            return True
    except Exception:
        return False