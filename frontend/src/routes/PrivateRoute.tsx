import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

interface PrivateRouteProps {
  children: ReactNode;
}

export default function PrivateRoute({ children }: PrivateRouteProps) {
  const { isAuthenticated } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (token) {
      const timer = setTimeout(() => {
        setIsChecking(false);
      }, 100);http:
      return () => clearTimeout(timer);
    } else {
      setIsChecking(false);
    }
  }, []);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  const hasToken = localStorage.getItem('token');
  if (isAuthenticated || hasToken) {
    return <>{children}</>;
  }

  return (
    <Navigate 
      to={`/login?redirect=${encodeURIComponent(location.pathname)}&message=${encodeURIComponent('Por favor, faça login com suas credenciais para acessar esta página.')}`} 
      replace 
    />
  );
}