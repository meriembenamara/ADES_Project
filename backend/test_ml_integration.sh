#!/bin/bash

# Script de test pour l'intégration ML avec le backend
# Utilisation: bash test_ml_integration.sh

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="http://localhost:8000/api"
TOKEN=""
DOCUMENT_ID=""

echo -e "${BLUE}====== Test d'intégration ML ======${NC}\n"

# Fonction pour afficher les étapes
print_step() {
    echo -e "${YELLOW}▶ $1${NC}"
}

# Fonction pour afficher les succès
print_success() {
    echo -e "${GREEN}✓ $1${NC}\n"
}

# Fonction pour afficher les erreurs
print_error() {
    echo -e "${RED}✗ $1${NC}\n"
}

# 1. Vérifier la connexion au backend
print_step "1. Vérification de la connexion au backend"
if curl -s "$BASE_URL/test" > /dev/null 2>&1; then
    print_success "Backend accessible"
else
    print_error "Impossible de se connecter au backend à $BASE_URL"
    exit 1
fi

# 2. Obtenir un token (créer un utilisateur/token si nécessaire)
print_step "2. Récupération du token API"
TOKEN=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"password"}' | \
    grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    print_error "Impossible de récupérer le token. Vérifiez les identifiants."
    echo "Vous devez d'abord créer un utilisateur test avec les credentials email:password"
    exit 1
fi
print_success "Token obtenu: ${TOKEN:0:20}..."

# 3. Vérifier la santé du service ML
print_step "3. Vérification de la santé du service ML"
HEALTH_RESPONSE=$(curl -s "$BASE_URL/ml/health")
if echo "$HEALTH_RESPONSE" | grep -q "healthy\|available"; then
    print_success "Service ML accessible"
    echo "$HEALTH_RESPONSE" | jq '.' 2>/dev/null || echo "$HEALTH_RESPONSE"
else
    print_error "Service ML indisponible"
    echo "$HEALTH_RESPONSE"
fi

# 4. Récupérer les labelings
print_step "4. Récupération des labelings"
LABELINGS=$(curl -s -X GET "$BASE_URL/labelings/export" \
    -H "Authorization: Bearer $TOKEN")

COUNT=$(echo "$LABELINGS" | jq '.count // 0')
if [ "$COUNT" -gt 0 ]; then
    print_success "$COUNT labelings trouvés"
    echo "$LABELINGS" | jq '.items[0:2]' 2>/dev/null || echo "$LABELINGS"
else
    print_error "Aucun labeling trouvé. Veuillez d'abord créer des labelings."
fi

# 5. Lancer un entraînement du modèle
print_step "5. Lancement d'un entraînement (modèle classification)"
TRAIN_RESPONSE=$(curl -s -X POST "$BASE_URL/ml/train" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"model_type":"classification","description":"Test training"}')

if echo "$TRAIN_RESPONSE" | grep -q "\"id\""; then
    TRAINING_ID=$(echo "$TRAIN_RESPONSE" | jq '.training.id')
    print_success "Entraînement lancé avec ID: $TRAINING_ID"
    echo "$TRAIN_RESPONSE" | jq '.'
    
    # 6. Vérifier le statut de l'entraînement
    print_step "6. Vérification du statut après 2 secondes"
    sleep 2
    
    STATUS_RESPONSE=$(curl -s -X GET "$BASE_URL/ml/trainings/$TRAINING_ID" \
        -H "Authorization: Bearer $TOKEN")
    
    STATUS=$(echo "$STATUS_RESPONSE" | jq -r '.data.status')
    print_success "Statut: $STATUS"
    echo "$STATUS_RESPONSE" | jq '.'
else
    print_error "Impossible de lancer l'entraînement"
    echo "$TRAIN_RESPONSE" | jq '.' 2>/dev/null || echo "$TRAIN_RESPONSE"
fi

# 7. Lister tous les entraînements
print_step "7. Listage de tous les entraînements"
LIST_RESPONSE=$(curl -s -X GET "$BASE_URL/ml/trainings" \
    -H "Authorization: Bearer $TOKEN")

TOTAL=$(echo "$LIST_RESPONSE" | jq '.meta.total // 0')
print_success "$TOTAL entraînements trouvés"
echo "$LIST_RESPONSE" | jq '.data[0:2]' 2>/dev/null || echo "$LIST_RESPONSE"

# 8. Test de prédiction (optionnel)
print_step "8. Test de prédiction"
PREDICT_RESPONSE=$(curl -s -X POST "$BASE_URL/ml/predict" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"text":"Facture du 15 janvier 2026 pour un montant de 1500 euros"}')

if echo "$PREDICT_RESPONSE" | grep -q "Prédiction réussie"; then
    print_success "Prédiction réussie"
    echo "$PREDICT_RESPONSE" | jq '.'
else
    echo -e "${YELLOW}Prédiction non disponible (service peut être en cours d'entraînement)${NC}"
fi

echo -e "\n${BLUE}====== Test terminé ======${NC}"
