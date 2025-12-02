import { Request, Response } from 'express';
import { autenticarUsuario } from '../services/authService';

export async function login(req: Request, res: Response) {
  try {
    const { email, senha } = req.body;
    const resultado = await autenticarUsuario(email, senha);
    res.json(resultado);
  } catch (error: any) {
    res.status(401).json({ erro: error.message });
  }
}

export async function logout(req: Request, res: Response) {
  try {
    // O logout no backend é principalmente para limpar sessões no servidor se necessário
    // Como estamos usando JWT stateless, apenas retornamos sucesso
    // O frontend é responsável por remover o token do localStorage
    res.status(200).json({ mensagem: 'Logout realizado com sucesso.' });
  } catch (error: any) {
    res.status(500).json({ erro: `Erro ao realizar logout: ${error.message}` });
  }
}
