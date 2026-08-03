"""
Schemas Pydantic v2 - Module M3 Conseil AGRILYO.
"""

from datetime import date, datetime
from typing import List
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.models.conseil import (
    CanalSessionConseil,
    StatutAgronome,
    StatutDemandeConseil,
    StatutOperationPlanning,
    StatutSessionConseil,
    TypeConseil,
)


class AgronomeCreate(BaseModel):
    titre: str = Field(min_length=2, max_length=200)
    bio: str | None = Field(default=None, max_length=2000)
    numero_agrement: str | None = Field(default=None, max_length=120)
    organisation: str | None = Field(default=None, max_length=200)
    telephone_pro: str | None = Field(default=None, max_length=20)
    email_pro: str | None = Field(default=None, max_length=255)
    specialites: List[str] = Field(default_factory=list, max_length=20)
    cultures: List[str] = Field(default_factory=list, max_length=30)
    regions_couvertes: List[str] = Field(default_factory=list, max_length=20)
    langues: List[str] = Field(default_factory=lambda: ["fr"], max_length=10)
    annees_experience: int = Field(default=0, ge=0, le=70)
    tarif_session: float | None = Field(default=None, ge=0)

    @field_validator("telephone_pro")
    @classmethod
    def validate_phone(cls, v: str | None) -> str | None:
        if v and not v.startswith("+"):
            raise ValueError("Le numero doit etre au format E.164")
        return v


class AgronomeUpdate(BaseModel):
    titre: str | None = Field(default=None, min_length=2, max_length=200)
    bio: str | None = Field(default=None, max_length=2000)
    numero_agrement: str | None = Field(default=None, max_length=120)
    organisation: str | None = Field(default=None, max_length=200)
    telephone_pro: str | None = Field(default=None, max_length=20)
    email_pro: str | None = Field(default=None, max_length=255)
    specialites: List[str] | None = Field(default=None, max_length=20)
    cultures: List[str] | None = Field(default=None, max_length=30)
    regions_couvertes: List[str] | None = Field(default=None, max_length=20)
    langues: List[str] | None = Field(default=None, max_length=10)
    annees_experience: int | None = Field(default=None, ge=0, le=70)
    tarif_session: float | None = Field(default=None, ge=0)


class AgronomeStatutUpdate(BaseModel):
    statut: StatutAgronome
    note_admin: str | None = Field(default=None, max_length=1000)


class AgronomeResume(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    titre: str
    organisation: str | None
    specialites: List[str]
    cultures: List[str]
    regions_couvertes: List[str]
    langues: List[str]
    annees_experience: int
    tarif_session: float | None
    note_moyenne: float
    nombre_sessions: int
    statut: StatutAgronome


class AgronomeResponse(AgronomeResume):
    user_id: UUID
    bio: str | None
    numero_agrement: str | None
    telephone_pro: str | None
    email_pro: str | None
    verifie_le: datetime | None
    note_admin: str | None
    created_at: datetime
    updated_at: datetime


class AgronomeListResponse(BaseModel):
    items: List[AgronomeResume]
    total: int
    page: int
    size: int
    pages: int


class DemandeConseilCreate(BaseModel):
    type_conseil: TypeConseil = TypeConseil.DIAGNOSTIC
    culture: str = Field(min_length=2, max_length=100)
    variete: str | None = Field(default=None, max_length=100)
    region: str = Field(min_length=2, max_length=100)
    ville: str | None = Field(default=None, max_length=100)
    titre: str = Field(min_length=5, max_length=200)
    description: str = Field(min_length=10, max_length=4000)
    urgence: bool = False
    photos_urls: List[str] | None = Field(default=None, max_length=8)
    metadata: dict | None = None


class DemandeConseilAssign(BaseModel):
    agronome_id: UUID
    score_matching: float | None = Field(default=None, ge=0, le=100)


class DemandeConseilStatutUpdate(BaseModel):
    statut: StatutDemandeConseil


class DemandeConseilResume(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    agriculteur_id: UUID
    agronome_id: UUID | None
    type_conseil: TypeConseil
    statut: StatutDemandeConseil
    culture: str
    region: str
    titre: str
    urgence: bool
    score_matching: float | None
    created_at: datetime
    updated_at: datetime


class DemandeConseilResponse(DemandeConseilResume):
    variete: str | None
    ville: str | None
    description: str
    photos_urls: List[str] | None
    metadata: dict | None = None
    assigned_at: datetime | None
    closed_at: datetime | None


class DemandeConseilListResponse(BaseModel):
    items: List[DemandeConseilResume]
    total: int
    page: int
    size: int
    pages: int


class MatchingSuggestion(BaseModel):
    agronome: AgronomeResume
    score: float = Field(ge=0, le=100)
    raisons: List[str] = []


class SessionConseilCreate(BaseModel):
    demande_id: UUID
    canal: CanalSessionConseil = CanalSessionConseil.CHAT
    scheduled_at: datetime | None = None


class SessionConseilUpdate(BaseModel):
    statut: StatutSessionConseil | None = None
    scheduled_at: datetime | None = None
    started_at: datetime | None = None
    ended_at: datetime | None = None
    duree_minutes: int | None = Field(default=None, ge=0)
    notes_agronome: str | None = Field(default=None, max_length=4000)
    compte_rendu: str | None = Field(default=None, max_length=4000)


class SessionConseilResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    demande_id: UUID
    agronome_id: UUID
    agriculteur_id: UUID
    canal: CanalSessionConseil
    statut: StatutSessionConseil
    scheduled_at: datetime | None
    started_at: datetime | None
    ended_at: datetime | None
    duree_minutes: int | None
    notes_agronome: str | None
    compte_rendu: str | None
    created_at: datetime
    updated_at: datetime


class OperationPlanningCreate(BaseModel):
    titre: str = Field(min_length=2, max_length=200)
    description: str | None = Field(default=None, max_length=2000)
    date_prevue: date | None = None
    rappel_sms: bool = True
    ordre: int = Field(default=0, ge=0)


class OperationPlanningUpdate(BaseModel):
    titre: str | None = Field(default=None, min_length=2, max_length=200)
    description: str | None = Field(default=None, max_length=2000)
    date_prevue: date | None = None
    date_realisee: date | None = None
    statut: StatutOperationPlanning | None = None
    rappel_sms: bool | None = None
    ordre: int | None = Field(default=None, ge=0)


class OperationPlanningResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    planning_id: UUID
    titre: str
    description: str | None
    date_prevue: date | None
    date_realisee: date | None
    statut: StatutOperationPlanning
    rappel_sms: bool
    rappel_envoye_le: datetime | None
    ordre: int
    created_at: datetime
    updated_at: datetime


class PlanningCulturalCreate(BaseModel):
    demande_id: UUID | None = None
    titre: str = Field(min_length=3, max_length=200)
    description: str | None = Field(default=None, max_length=3000)
    culture: str = Field(min_length=2, max_length=100)
    variete: str | None = Field(default=None, max_length=100)
    region: str = Field(min_length=2, max_length=100)
    superficie_ha: float | None = Field(default=None, gt=0)
    date_debut: date | None = None
    date_fin: date | None = None
    operations: List[OperationPlanningCreate] = Field(default_factory=list, max_length=60)

    @model_validator(mode="after")
    def validate_dates(self) -> "PlanningCulturalCreate":
        if self.date_debut and self.date_fin and self.date_fin < self.date_debut:
            raise ValueError("date_fin doit etre posterieure a date_debut")
        return self


class PlanningCulturalUpdate(BaseModel):
    titre: str | None = Field(default=None, min_length=3, max_length=200)
    description: str | None = Field(default=None, max_length=3000)
    culture: str | None = Field(default=None, min_length=2, max_length=100)
    variete: str | None = Field(default=None, max_length=100)
    region: str | None = Field(default=None, min_length=2, max_length=100)
    superficie_ha: float | None = Field(default=None, gt=0)
    date_debut: date | None = None
    date_fin: date | None = None
    actif: bool | None = None


class PlanningCulturalResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    agriculteur_id: UUID
    agronome_id: UUID | None
    demande_id: UUID | None
    titre: str
    description: str | None
    culture: str
    variete: str | None
    region: str
    superficie_ha: float | None
    date_debut: date | None
    date_fin: date | None
    actif: bool
    operations: List[OperationPlanningResponse] = []
    created_at: datetime
    updated_at: datetime


class PlanningCulturalListResponse(BaseModel):
    items: List[PlanningCulturalResponse]
    total: int
    page: int
    size: int
    pages: int
