#!/usr/bin/env bash
# Study Guild — one-shot Azure deployment
# Usage: ./infra/deploy.sh <resource-group> [location]
#
# Prerequisites:
#   az login
#   az account set --subscription <your-subscription-id>

set -euo pipefail

RG="${1:-study-guild-rg}"
LOCATION="${2:-eastus}"

echo "▶ Creating resource group '$RG' in '$LOCATION'…"
az group create --name "$RG" --location "$LOCATION" --output none

echo "▶ Deploying infrastructure (Bicep)…"
OUTPUTS=$(az deployment group create \
  --resource-group "$RG" \
  --template-file "$(dirname "$0")/main.bicep" \
  --parameters "@$(dirname "$0")/params.json" \
  --query "properties.outputs" \
  --output json)

COSMOS_ENDPOINT=$(echo "$OUTPUTS" | jq -r '.cosmosEndpoint.value')
COSMOS_ACCOUNT=$(echo "$OUTPUTS" | jq -r '.cosmosAccountName.value')
API_URL=$(echo "$OUTPUTS" | jq -r '.apiUrl.value')
STATIC_URL=$(echo "$OUTPUTS" | jq -r '.staticWebAppUrl.value')
DEPLOY_TOKEN=$(echo "$OUTPUTS" | jq -r '.staticWebAppDeploymentToken.value')

echo "▶ Fetching CosmosDB key…"
COSMOS_KEY=$(az cosmosdb keys list \
  --resource-group "$RG" \
  --name "$COSMOS_ACCOUNT" \
  --query "primaryMasterKey" \
  --output tsv)

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Deployment complete — copy these values"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "# .env (server)"
echo "COSMOS_ENDPOINT=$COSMOS_ENDPOINT"
echo "COSMOS_KEY=$COSMOS_KEY"
echo "COSMOS_DATABASE=study-guild"
echo "PORT=8080"
echo "# Add manually: AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET"
echo ""
echo "# client/.env.local"
echo "VITE_API_BASE_URL=https://$API_URL/api"
echo "# Add manually: VITE_AZURE_CLIENT_ID, VITE_AZURE_TENANT_ID"
echo ""
echo "# Static Web App deploy token (CI secret: AZURE_STATIC_WEB_APPS_API_TOKEN)"
echo "DEPLOY_TOKEN=$DEPLOY_TOKEN"
echo ""
echo "API URL:    $API_URL"
echo "Web URL:    $STATIC_URL"
