import { jwtDecode } from 'jwt-decode';
export interface DecodedToken {
  id: number;
  email: string;
  tipo: 'PACIENTE' | 'PROFISSIONAL' | 'RECEPCIONISTA';
  nome?: string;
  exp: number;
  iat: number;
}

export function getUserFromToken(): DecodedToken | null {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const decoded = jwtDecode<DecodedToken>(token);
    return decoded;
  } catch (err) {
    console.error('Erro ao decodificar token:', err);
    return null;
  }
}

