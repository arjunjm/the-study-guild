import { type Configuration, LogLevel } from '@azure/msal-browser';

export const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID ?? '',
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID ?? 'common'}`,
    redirectUri: window.location.origin,
    navigateToLoginRequestUrl: false,
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: true,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii || import.meta.env.PROD) return;
        if (level === LogLevel.Error) console.error(message);
        if (level === LogLevel.Warning) console.warn(message);
      },
    },
  },
};

export const loginRequest = {
  // Scope is on the API app registration, not the SPA registration
  scopes: [`api://${import.meta.env.VITE_AZURE_API_CLIENT_ID ?? import.meta.env.VITE_AZURE_CLIENT_ID}/access_as_user`],
};

export const apiConfig = {
  baseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api',
};
