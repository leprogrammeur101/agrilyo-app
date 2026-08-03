# (colle tout le script ci-dessus)
#!/bin/bash

echo "======================================================"
echo "🚀 AUDIT DES DÉPENDANCES - AGRILYO MOBILE"
echo "======================================================"
echo "Date : $(date)"
echo "Dossier : $(pwd)"
echo ""

# Vérifier si package.json existe
if [ ! -f "package.json" ]; then
  echo "❌ ERREUR : package.json non trouvé !"
  exit 1
fi

echo "📋 Versions actuelles dans package.json :"
echo "---------------------------------------------"

# Extraire et afficher les dépendances principales
echo "Dépendances principales :"
jq -r '.dependencies | to_entries[] | "\(.key): \(.value)"' package.json

echo ""
echo "Dépendances de développement :"
jq -r '.devDependencies | to_entries[] | "\(.key): \(.value)"' package.json 2>/dev/null || echo "Aucune devDependency trouvée"

echo ""
echo "======================================================"
echo "📊 VERSIONS INSTALLÉES (node_modules) :"
echo "======================================================"

# Liste des packages critiques pour Expo SDK 56
PACKAGES=(
  "expo"
  "react"
  "react-native"
  "expo-router"
  "react-native-reanimated"
  "expo-font"
  "expo-splash-screen"
  "@expo/vector-icons"
  "ajv"
  "schema-utils"
)

for pkg in "${PACKAGES[@]}"; do
  if [ -d "node_modules/$pkg" ]; then
    version=$(jq -r '.version' "node_modules/$pkg/package.json" 2>/dev/null || echo "N/A")
    echo "✅ $pkg → $version"
  else
    echo "❌ $pkg → NON INSTALLÉ"
  fi
done

echo ""
echo "======================================================"
echo "📋 RAPPORT FINAL"
echo "======================================================"

# Vérifier la version Expo
expo_version=$(jq -r '.dependencies.expo' package.json 2>/dev/null)
if [[ "$expo_version" == *"56"* ]]; then
  echo "🎉 Expo SDK 56 détecté !"
else
  echo "⚠️  Version Expo actuelle : $expo_version (SDK 56 recommandé)"
fi

echo ""
echo "Script terminé. Copie ce rapport si tu veux de l'aide."