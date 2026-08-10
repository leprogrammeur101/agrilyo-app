from dataclasses import dataclass


@dataclass(frozen=True)
class PageParams:
    """Paramètres de pagination normalisés, prêts pour une requête SQLAlchemy."""

    page: int
    size: int
    offset: int
    limit: int


def get_page_params(page: int = 1, size: int = 20, max_size: int = 100) -> PageParams:
    """
    Normalise page/size en offset/limit pour SQLAlchemy.
    - page < 1 est ramené à 1
    - size est borné entre 1 et max_size
    """
    safe_page = max(1, page)
    safe_size = max(1, min(size, max_size))
    offset = (safe_page - 1) * safe_size
    return PageParams(page=safe_page, size=safe_size, offset=offset, limit=safe_size)


def compute_total_pages(total: int, size: int) -> int:
    """Nombre total de pages pour `total` éléments avec `size` éléments par page."""
    if size <= 0:
        return 1
    return max(1, -(-total // size))  # division entière arrondie au supérieur