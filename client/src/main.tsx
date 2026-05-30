import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { EventType, PublicClientApplication } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { msalConfig } from './lib/msalConfig';
import { apiClient, setupTokenInterceptor } from './lib/apiClient';
import { installMockInterceptors } from './lib/mockInterceptors';
import { clearAuthError, storeAuthError } from './lib/authDiagnostics';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import App from './App';
import './index.css';

const IS_DEV_MODE = !import.meta.env.VITE_AZURE_CLIENT_ID;

export const msalInstance = new PublicClientApplication(msalConfig);

if (IS_DEV_MODE) {
  // No Azure config — intercept all API calls with mock data
  installMockInterceptors(apiClient);
} else {
  await msalInstance.initialize();
  msalInstance.addEventCallback((event) => {
    if (event.eventType === EventType.LOGIN_FAILURE) {
      storeAuthError(event.error);
    }
    if (event.eventType === EventType.LOGIN_SUCCESS) {
      clearAuthError();
    }
  });
  setupTokenInterceptor(msalInstance);
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, retry: 1 },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MsalProvider instance={msalInstance}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </AuthProvider>
      </QueryClientProvider>
    </MsalProvider>
  </StrictMode>
);
