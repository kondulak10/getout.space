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
  </ApolloProvider>,
)
