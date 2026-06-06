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


# ── Moteur async ───────────────────────────────────────────────────────────────
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.is_development,     # log SQL en dev uniquement
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,               # vérifie la connexion avant usage
    pool_recycle=3600,                # recycle les connexions toutes les heures
)

# ── Session factory ────────────────────────────────────────────────────────────
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,           # évite les lazy loads post-commit
    autocommit=False,
    autoflush=False,
)


# ── Base déclarative ───────────────────────────────────────────────────────────
class Base(DeclarativeBase):
    """
    Classe de base pour tous les modèles SQLAlchemy AGRILYO.
    Fournit des helpers communs (repr, etc.)
    """

    def __repr__(self) -> str:
        cols = {c.name: getattr(self, c.name) for c in self.__table__.columns}
        attrs = ", ".join(f"{k}={v!r}" for k, v in list(cols.items())[:4])
        return f"<{self.__class__.__name__} {attrs}>"


# ── Dependency FastAPI ─────────────────────────────────────────────────────────
async def get_db() -> AsyncSession:
    """
    Dependency injection FastAPI.
    Utilisée dans toutes les routes avec `db: AsyncSession = Depends(get_db)`.
    Garantit le rollback en cas d'erreur.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# ── Health check DB ────────────────────────────────────────────────────────────
async def check_db_connection() -> bool:
    """Vérifie que la base de données est accessible."""
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
        return True
    except Exception:
        return False