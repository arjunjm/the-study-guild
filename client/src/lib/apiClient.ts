import axios from 'axios';
import type { PublicClientApplication } from '@azure/msal-browser';
import { loginRequest, apiConfig } from './msalConfig';

export const apiClient = axios.create({
  baseURL: apiConfig.baseUrl,
});

// Called from main.tsx after MSAL is initialized — avoids circular import
export function setupTokenInterceptor(instance: PublicClientApplication) {
  apiClient.interceptors.request.use(async (config) => {
    try {
      const accounts = instance.getAllAccounts();
      if (accounts.length > 0) {
        const result = await instance.acquireTokenSilent({
          ...loginRequest,
          account: accounts[0],
        });
        config.headers.Authorization = `Bearer ${result.accessToken}`;
      }
    } catch {
      // Silent token refresh failed — user will be prompted to log in
    }
    return config;
  });
}
