import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ApolloProvider } from '@apollo/client/react'
import '@/index.css'
import App from '@/App.tsx'
import { logVersion } from '@/version'
import { apolloClient } from '@/lib/apollo-client'
import { AuthProvider } from '@/contexts/AuthContext'

// Log version on mount
logVersion();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ApolloProvider client={apolloClient}>
      <AuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
    </ApolloProvider>
  </StrictMode>,
)
