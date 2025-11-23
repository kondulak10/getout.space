// Initialize Sentry FIRST (before other imports)
import { initializeSentry } from '@/config/sentry'
initializeSentry();

// Initialize Amplitude analytics
import { analytics } from '@/lib/analytics'
const amplitudeKey = import.meta.env.VITE_AMPLITUDE_API_KEY;
if (amplitudeKey) {
  analytics.init(amplitudeKey);
}

import * as Sentry from '@sentry/react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ApolloProvider } from '@apollo/client/react'
import { Toaster } from 'sonner'
import '@/index.css'
import App from '@/App.tsx'
import { logVersion } from '@/version'
import { apolloClient } from '@/lib/apollo-client'
import { AuthProvider } from '@/contexts/AuthProvider'
import { NotificationProvider } from '@/contexts/NotificationProvider'
import '@/lib/fontawesome'

logVersion();

// Remove the loading spinner once React starts rendering
const loader = document.getElementById('initial-loader');
if (loader) {
  loader.style.display = 'none';
}

createRoot(document.getElementById('root')!).render(
  <Sentry.ErrorBoundary
    fallback={({ error, resetError }) => (
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0a0a0a',
        color: '#fff'
      }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Something went wrong 😔</h1>
        <p style={{ color: '#888', marginBottom: '2rem' }}>
          {error instanceof Error ? error.message : 'An unexpected error occurred'}
        </p>
        <button
          onClick={resetError}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#fb923c',
            color: '#fff',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          Try again
        </button>
      </div>
    )}
    showDialog
  >
    <ApolloProvider client={apolloClient}>
      <AuthProvider>
        <NotificationProvider>
          <BrowserRouter>
            <App />
            <Toaster
              position="bottom-right"
              theme="dark"
              richColors
              closeButton
              duration={4000}
            />
          </BrowserRouter>
        </NotificationProvider>
      </AuthProvider>
    </ApolloProvider>
  </Sentry.ErrorBoundary>,
)
