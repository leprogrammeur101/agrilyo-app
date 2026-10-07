"""
Fixtures pytest partagées — AGRILYO backend.

Stratégie d'isolation : chaque test s'exécute dans une transaction SQL ouverte
sur une connexion dédiée, et cette transaction est annulée (rollback) à la fin
du test. Aucune donnée de test ne persiste jamais réellement en base, et les
tests peuvent tourner en parallèle sans se marcher dessus.

Nécessite une base PostgreSQL accessible via TEST_DATABASE_URL (ou DATABASE_URL
à défaut) — les modèles utilisent des types spécifiques à PostgreSQL (ARRAY,
JSONB, ENUM natif) qui ne fonctionnent pas avec SQLite.
"""
import asyncio
import sys
from typing import AsyncGenerator

from typing import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings
from app.core.database import Base, get_db
from app.core.security import create_access_token
from app.main import app
from app.models.user import User, UserRole, UserStatus

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())


TEST_DATABASE_URL = settings.TEST_DATABASE_URL or settings.DATABASE_URL


@pytest_asyncio.fixture
async def db() -> AsyncGenerator[AsyncSession, None]:
    """
    Session liée à une connexion + transaction externe, annulée après chaque test.

    Le moteur (engine) est créé ICI, à chaque test (pas en fixture scope="session") :
    un engine async/asyncpg est lié à la boucle asyncio dans laquelle il a été créé,
    or pytest-asyncio ouvre une nouvelle boucle par test par défaut. Un engine
    partagé entre plusieurs tests provoque un `ConnectionDoesNotExistError` dès
    le 2e test (connexions du pool invalidées par le changement de boucle).

    join_transaction_mode="create_savepoint" : les db.commit() applicatifs du
    code testé ferment un SAVEPOINT interne mais jamais la transaction externe
    portée par `connection` — celle-ci est annulée à la fin du test, donc rien
    ne persiste jamais réellement en base entre deux tests.
    """

    engine = create_async_engine(TEST_DATABASE_URL, pool_pre_ping=True, connect_args={"ssl": False})
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    connection = await engine.connect()
    transaction = await connection.begin()

    session_factory = async_sessionmaker(
        bind=connection,
        class_=AsyncSession,
        expire_on_commit=False,
        join_transaction_mode="create_savepoint",
    )
    session = session_factory()

    try:
        yield session
    finally:
        await session.close()
        await transaction.rollback()
        await connection.close()
        await engine.dispose()


@pytest_asyncio.fixture
async def client(db: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Client HTTP async branché sur l'app FastAPI, avec la DB de test injectée."""

    async def _override_get_db():
        yield db

    app.dependency_overrides[get_db] = _override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def make_user(db: AsyncSession):
    """
    Factory de création d'utilisateur de test.
    Usage : user = await make_user(phone_number="+2250700000001", roles=[UserRole.AGRONOME])
    """

    async def _make(
        phone_number: str = "+2250700000000",
        roles: list[UserRole] | None = None,
        status: UserStatus = UserStatus.ACTIVE,
        **extra,
    ) -> User:
        user = User(
            phone_number=phone_number,
            roles=[r.value for r in (roles or [UserRole.AGRICULTEUR])],
            status=status,
            phone_verified=True,
            is_active=True,
            **extra,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user

    return _make


@pytest.fixture
def auth_headers():
    """Génère un header Authorization Bearer valide pour un user donné."""

    def _headers(user: User) -> dict[str, str]:
        token = create_access_token(str(user.id))
        return {"Authorization": f"Bearer {token}"}

    return _headers