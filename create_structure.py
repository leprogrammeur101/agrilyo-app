from pathlib import Path

# ======================================================
# CONFIG
# ======================================================

PROJECT_NAME = "agrilyo"

# ======================================================
# STRUCTURE
# ======================================================

STRUCTURE = {
    "CLAUDE.md": "# AGRILYO\n\nContexte persistant du projet.\n",

    "backend": {
        "requirements.txt": "",
        "Procfile": "web: uvicorn app.main:app --host 0.0.0.0 --port $PORT\n",
        "railway.json": "{}",
        "alembic.ini": "",
        "pytest.ini": "[pytest]\nasyncio_mode = auto\n",
        ".env.example": (
            "DATABASE_URL=\n"
            "SECRET_KEY=\n"
            "JWT_SECRET=\n"
            "AFRICASTALKING_API_KEY=\n"
        ),
        ".env": "",

        "app": {
            "__init__.py": "",
            "main.py": (
                "from fastapi import FastAPI\n\n"
                "app = FastAPI(title='AGRILYO API')\n\n"
                "@app.get('/')\n"
                "async def root():\n"
                "    return {'message': 'AGRILYO API'}\n"
            ),

            "core": {
                "__init__.py": "",
                "config.py": "",
                "database.py": "",
                "security.py": "",
            },

            "models": {
                "__init__.py": (
                    "# Importer tous les modèles ici pour Alembic\n"
                ),
                "user.py": "",
                "otp.py": "",
                "foncier.py": "",
                "semences.py": "",
                "conseil.py": "",
            },

            "schemas": {
                "__init__.py": "",
                "auth.py": "",
                "foncier.py": "",
                "semences.py": "",
                "conseil.py": "",
            },

            "api": {
                "__init__.py": "",
                "v1": {
                    "__init__.py": "",
                    "router.py": "",
                    "endpoints": {
                        "__init__.py": "",
                        "health.py": "",
                        "auth.py": "",
                        "foncier.py": "",
                        "semences.py": "",
                        "conseil.py": "",
                    }
                }
            },

            "services": {
                "__init__.py": "",
                "sms_service.py": "",
                "auth_service.py": "",
                "paiement_service.py": "",
                "storage_service.py": "",
                "notification_service.py": "",
                "matching_service.py": "",
            },

            "utils": {
                "__init__.py": "",
                "phone.py": "",
                "fcfa.py": "",
                "pagination.py": "",
            }
        },

        "alembic": {
            "env.py": "",
            "versions": {
                ".gitkeep": ""
            }
        },

        "tests": {
            "__init__.py": "",

            "unit": {
                "__init__.py": "",
                "test_security.py": "",
                "test_schemas.py": "",
            },

            "integration": {
                "__init__.py": "",
                "test_auth.py": "",
            }
        }
    },

    "mobile": {
        "package.json": "{}",
        "app.json": "{}",
        "tsconfig.json": "{}",
        "babel.config.js": (
            "module.exports = function(api) {\n"
            "  api.cache(true);\n"
            "  return {\n"
            "    presets: ['babel-preset-expo'],\n"
            "  };\n"
            "};\n"
        ),
        ".env": "EXPO_PUBLIC_API_URL=\n",

        "app": {
            "_layout.tsx": "",

            "(auth)": {
                "_layout.tsx": "",
                "login.tsx": "",
                "verify-otp.tsx": "",
                "onboarding.tsx": "",
            },

            "(tabs)": {
                "_layout.tsx": "",
                "index.tsx": "",
                "foncier.tsx": "",
                "semences.tsx": "",
                "conseil.tsx": "",
            }
        },

        "api": {
            "client.ts": "",
            "auth.api.ts": "",
            "foncier.api.ts": "",
            "semences.api.ts": "",
            "conseil.api.ts": "",
        },

        "store": {
            "auth.store.ts": "",
            "foncier.store.ts": "",
            "semences.store.ts": "",
            "conseil.store.ts": "",
        },

        "constants": {
            "colors.ts": "",
            "theme.ts": "",
        },

        "components": {
            "ui": {
                "Button.tsx": "",
                "Input.tsx": "",
                "Badge.tsx": "",
                "LoadingScreen.tsx": "",
            },

            "common": {
                "AnnonceCard.tsx": "",
                "ProduitCard.tsx": "",
                "AgronomeCard.tsx": "",
            }
        },

        "hooks": {
            "useAuth.ts": "",
            "useFormatFCFA.ts": "",
        },

        "utils": {
            "phone.ts": "",
            "formatters.ts": "",
        },

        "assets": {
            "fonts": {},
            "icon.png": "",
            "splash.png": "",
            "adaptive-icon.png": "",
            "favicon.png": "",
            "notification-icon.png": "",
        }
    }
}


# ======================================================
# CREATE STRUCTURE
# ======================================================

def create_structure(base_path: Path, structure: dict):
    """
    Crée récursivement les dossiers et fichiers.
    """

    for name, content in structure.items():
        path = base_path / name

        # -----------------------------------
        # DOSSIER
        # -----------------------------------
        if isinstance(content, dict):
            path.mkdir(parents=True, exist_ok=True)
            print(f"[DIR]  {path}")
            create_structure(path, content)

        # -----------------------------------
        # FICHIER
        # -----------------------------------
        else:
            path.parent.mkdir(parents=True, exist_ok=True)

            if not path.exists():
                path.write_text(content, encoding="utf-8")
                print(f"[FILE] {path}")
            else:
                print(f"[SKIP] {path}")


def main():
    root = Path.cwd() / PROJECT_NAME
    root.mkdir(exist_ok=True)

    print(f"\nCréation du projet : {PROJECT_NAME}\n")

    create_structure(root, STRUCTURE)

    print("\n✅ Projet AGRILYO créé avec succès !")
    print(f"📂 Emplacement : {root}")


if __name__ == "__main__":
    main()