import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ApolloProvider } from '@apollo/client/react'
import { Toaster } from 'sonner'
import '@/index.css'
import App from '@/App.tsx'
import { logVersion } from '@/version'
import { apolloClient } from '@/lib/apollo-client'
import { AuthProvider } from '@/contexts/AuthProvider'
import '@/lib/fontawesome'

logVersion();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ApolloProvider client={apolloClient}>
      <AuthProvider>
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
      </AuthProvider>
    </ApolloProvider>
  </StrictMode>,
)
