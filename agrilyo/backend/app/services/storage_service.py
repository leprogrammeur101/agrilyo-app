"""
Service de stockage AGRILYO — Cloudflare R2 (compatible S3), 100% async.

boto3 est une librairie synchrone : chaque appel réseau est délégué à un
thread via asyncio.to_thread pour ne jamais bloquer l'event loop FastAPI.

Préfixes utilisés dans l'app :
  - "annonces" : photos des annonces Foncier
  - "products" : photos des produits Semences
  - "conseil"  : photos jointes aux demandes de diagnostic Conseil
  - "avatars"  : photos de profil utilisateur
"""

import asyncio
import uuid
from typing import BinaryIO, Literal

import boto3
from botocore.exceptions import ClientError

from app.core.config import settings

StoragePrefix = Literal["annonces", "products", "conseil", "avatars"]

_s3_client = None


def _get_s3_client():
    global _s3_client
    if _s3_client is None:
        _s3_client = boto3.client(
            "s3",
            endpoint_url=settings.R2_ENDPOINT_URL,
            aws_access_key_id=settings.R2_ACCESS_KEY_ID,
            aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
        )
    return _s3_client


def _generate_key(prefix: str, original_filename: str) -> str:
    ext = original_filename.split(".")[-1].lower() if "." in original_filename else "bin"
    return f"{prefix}/{uuid.uuid4()}.{ext}"


def _upload_sync(client, file_stream: BinaryIO, bucket: str, key: str, content_type: str) -> None:
    client.upload_fileobj(
        file_stream,
        bucket,
        key,
        ExtraArgs={"ContentType": content_type},
    )


async def upload_image_to_r2(
    file_stream: BinaryIO,
    filename: str,
    content_type: str,
    prefix: StoragePrefix | str = "products",
) -> dict:
    """
    Upload une image vers R2 après validation.
    Retourne : {url, key, size}
    """
    if content_type not in settings.ALLOWED_IMAGE_TYPES:
        raise ValueError(f"Type de fichier non autorisé : {content_type}")

    key = _generate_key(prefix, filename)
    client = _get_s3_client()

    file_stream.seek(0, 2)  # Fin du fichier
    size = file_stream.tell()
    file_stream.seek(0)

    if size > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
        raise ValueError(f"Fichier trop volumineux (max {settings.MAX_FILE_SIZE_MB} Mo)")

    try:
        # upload_fileobj est bloquant (I/O réseau synchrone) — délégué à un thread
        await asyncio.to_thread(
            _upload_sync, client, file_stream, settings.R2_BUCKET_NAME, key, content_type
        )

        public_url = f"{settings.R2_PUBLIC_URL}/{key}" if settings.R2_PUBLIC_URL else key
        return {
            "url": public_url,
            "key": key,
            "size": size,
        }
    except ClientError as exc:
        raise RuntimeError(f"Erreur upload R2 : {exc}") from exc


async def get_signed_url(key: str, expires_in: int = 3600) -> str:
    """
    Génère une URL signée temporaire pour accéder à un fichier privé
    (bucket non public, ou accès restreint dans le temps).

    expires_in : durée de validité en secondes (par défaut 1h, max recommandé 7 jours).
    """
    client = _get_s3_client()
    try:
        url = await asyncio.to_thread(
            client.generate_presigned_url,
            "get_object",
            Params={"Bucket": settings.R2_BUCKET_NAME, "Key": key},
            ExpiresIn=expires_in,
        )
        return url
    except ClientError as exc:
        raise RuntimeError(f"Erreur génération URL signée R2 : {exc}") from exc


async def delete_from_r2(key: str) -> None:
    client = _get_s3_client()
    try:
        await asyncio.to_thread(
            client.delete_object, Bucket=settings.R2_BUCKET_NAME, Key=key
        )
    except ClientError as exc:
        raise RuntimeError(f"Erreur suppression R2 : {exc}") from exc