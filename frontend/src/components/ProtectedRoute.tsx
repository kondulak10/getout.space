import { useAuth } from '@/contexts/useAuth';
import { Loading } from '@/components/ui/Loading';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return <Loading />;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-[rgba(10,10,10,0.9)] backdrop-blur-md border border-white/10 rounded-xl shadow-2xl p-8 text-center">
          <div className="mb-4">
            <FontAwesomeIcon icon="lock" className="w-12 h-12 text-orange-500" />
          </div>
          <h2 className="text-2xl font-bold mb-4 text-gray-100">Authentication Required</h2>
          <p className="text-gray-400 mb-6">
            You need to be logged in to access this page.
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors font-medium"
          >
            Go to Home & Login
          </a>
        </div>
      </div>
    );
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-[rgba(10,10,10,0.9)] backdrop-blur-md border border-red-500/20 rounded-xl shadow-2xl p-8 text-center">
          <div className="mb-4">
            <FontAwesomeIcon icon="shield-halved" className="w-12 h-12 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold mb-4 text-red-400">Access Denied</h2>
          <p className="text-gray-400 mb-6">
            You need admin privileges to access this page.
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors font-medium"
          >
            Go to Home
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
