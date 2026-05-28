// Study Guild — Azure infrastructure
// Deploy: az deployment group create -g <rg> -f infra/main.bicep -p @infra/params.json
// After deployment, copy outputs into .env and client/.env.local

@description('Name prefix for all resources (e.g. studyguild)')
param appName string = 'studyguild'

@description('Azure region for most resources')
param location string = resourceGroup().location

// Static Web Apps and CosmosDB have limited availability in eastus
var staticWebAppLocation = location == 'eastus' ? 'eastus2' : location
var cosmosLocation = location == 'eastus' ? 'eastus2' : location

@description('App Service SKU (F1=free/dev, B1=prod minimum)')
@allowed(['F1', 'B1', 'B2', 'S1'])
param appServiceSku string = 'B1'

@description('CosmosDB free tier (only one free-tier account per subscription)')
param cosmosFreeTier bool = false

// ---------------------------------------------------------------------------
// Variables
// ---------------------------------------------------------------------------
var cosmosAccountName = '${appName}-cosmos-${uniqueString(resourceGroup().id)}'
var appServicePlanName = '${appName}-plan'
var apiAppName = '${appName}-api'
var staticWebAppName = '${appName}-web'
var dbName = 'study-guild'

// ---------------------------------------------------------------------------
// CosmosDB account (NoSQL / serverless)
// ---------------------------------------------------------------------------
resource cosmosAccount 'Microsoft.DocumentDB/databaseAccounts@2024-02-15-preview' = {
  name: cosmosAccountName
  location: cosmosLocation
  kind: 'GlobalDocumentDB'
  properties: {
    databaseAccountOfferType: 'Standard'
    enableFreeTier: cosmosFreeTier
    capabilities: [
      { name: 'EnableServerless' }
    ]
    consistencyPolicy: {
      defaultConsistencyLevel: 'Session'
    }
    locations: [
      {
        locationName: cosmosLocation
        failoverPriority: 0
        isZoneRedundant: false
      }
    ]
    backupPolicy: {
      type: 'Continuous'
      continuousModeProperties: { tier: 'Continuous7Days' }
    }
  }
}

resource cosmosDb 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases@2024-02-15-preview' = {
  parent: cosmosAccount
  name: dbName
  properties: {
    resource: { id: dbName }
  }
}

var containers = [
  { name: 'users',         partitionKey: '/id' }
  { name: 'courses',       partitionKey: '/id' }
  { name: 'lessons',       partitionKey: '/id' }
  { name: 'progress',      partitionKey: '/id' }
  { name: 'ratings',       partitionKey: '/id' }
  { name: 'xp-events',     partitionKey: '/id' }
  { name: 'achievements',  partitionKey: '/id' }
]

resource cosmosContainers 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2024-02-15-preview' = [for c in containers: {
  parent: cosmosDb
  name: c.name
  properties: {
    resource: {
      id: c.name
      partitionKey: {
        paths: [ c.partitionKey ]
        kind: 'Hash'
        version: 2
      }
    }
  }
}]

// ---------------------------------------------------------------------------
// App Service Plan + API app
// ---------------------------------------------------------------------------
resource appServicePlan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: appServicePlanName
  location: location
  sku: {
    name: appServiceSku
    tier: appServiceSku == 'F1' ? 'Free' : 'Basic'
  }
  properties: {
    reserved: true  // Linux
  }
  kind: 'linux'
}

resource apiApp 'Microsoft.Web/sites@2023-12-01' = {
  name: apiAppName
  location: location
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      linuxFxVersion: 'NODE|22-lts'
      nodeVersion: '~22'
      appCommandLine: 'npm start'
      appSettings: [
        { name: 'NODE_ENV',           value: 'production' }
        { name: 'PORT',               value: '8080' }
        { name: 'COSMOS_ENDPOINT',    value: cosmosAccount.properties.documentEndpoint }
        { name: 'COSMOS_DATABASE',    value: dbName }
        { name: 'CLIENT_ORIGIN',      value: 'https://${staticWebApp.properties.defaultHostname}' }
        { name: 'SCM_DO_BUILD_DURING_DEPLOYMENT', value: 'false' }
        { name: 'WEBSITE_NODE_DEFAULT_VERSION', value: '~22' }
        // Secrets added manually or via Key Vault reference:
        // COSMOS_KEY, AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET
      ]
      alwaysOn: appServiceSku != 'F1'
    }
    httpsOnly: true
  }
}

// ---------------------------------------------------------------------------
// Static Web App (React SPA — free tier)
// ---------------------------------------------------------------------------
resource staticWebApp 'Microsoft.Web/staticSites@2023-12-01' = {
  name: staticWebAppName
  location: staticWebAppLocation
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {
    buildProperties: {
      appLocation: 'client'
      outputLocation: 'dist'
      appBuildCommand: 'npm run build'
    }
  }
}

// ---------------------------------------------------------------------------
// Outputs — copy these into your .env files
// ---------------------------------------------------------------------------
output cosmosEndpoint string = cosmosAccount.properties.documentEndpoint
output cosmosAccountName string = cosmosAccount.name
output apiUrl string = 'https://${apiApp.properties.defaultHostName}'
output staticWebAppName string = staticWebApp.name
output staticWebAppUrl string = 'https://${staticWebApp.properties.defaultHostname}'
