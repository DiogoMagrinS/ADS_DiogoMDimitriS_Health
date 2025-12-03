import { Request, Response } from 'express';
import {
  criarAvaliacao,
  listarAvaliacoesDoProfissional,
  obterEstatisticasAvaliacao,
  listarProfissionaisComAvaliacoes
} from '../services/avaliacaoService';
import { prisma } from '../config/prisma';

export async function postAvaliacao(req: Request, res: Response) {
  try {
    if (!req.usuario) {
      return res.status(401).json({ erro: 'Token inválido ou ausente.' });
    }

    const { agendamentoId, nota, comentario } = req.body;
    const pacienteId = req.usuario.id;

    if (!agendamentoId || !nota) {
      return res.status(400).json({ erro: 'agendamentoId e nota são obrigatórios.' });
    }

    const agendamento = await prisma.agendamento.findUnique({
      where: { id: parseInt(agendamentoId) },
      include: { profissional: true }
    });

    if (!agendamento) {
      return res.status(404).json({ erro: 'Agendamento não encontrado.' });
    }

    const avaliacao = await criarAvaliacao({
      agendamentoId: parseInt(agendamentoId),
      profissionalId: agendamento.profissionalId,
      pacienteId,
      nota: parseInt(nota),
      comentario: comentario || undefined
    });

    res.status(201).json(avaliacao);
  } catch (error: any) {
    console.error('Erro ao criar avaliação:', error);
    res.status(400).json({ erro: error.message || 'Erro ao criar avaliação.' });
  }
}

export async function getAvaliacoesProfissional(req: Request, res: Response) {
  try {
    const profissionalId = parseInt(req.params.id);
    const avaliacoes = await listarAvaliacoesDoProfissional(profissionalId);
    res.json(avaliacoes);
  } catch (error: any) {
    res.status(400).json({ erro: error.message });
  }
}

export async function getMinhasAvaliacoes(req: Request, res: Response) {
  try {
    const usuario = (req as any).usuario;
    if (!usuario) {
      return res.status(401).json({ erro: 'Token inválido ou ausente.' });
    }

    if (usuario.tipo !== 'PROFISSIONAL') {
      return res.status(403).json({ erro: 'Acesso permitido apenas para profissionais.' });
    }

    const profissional = await prisma.profissional.findUnique({
      where: { usuarioId: usuario.id },
    });

    if (!profissional) {
      return res.status(404).json({ erro: 'Profissional não encontrado.' });
    }

    const avaliacoes = await listarAvaliacoesDoProfissional(profissional.id);
    return res.json(avaliacoes);
  } catch (error: any) {
    console.error('getMinhasAvaliacoes:', error);
    return res.status(400).json({ erro: error.message || 'Erro ao listar avaliações.' });
  }
}

export async function getEstatisticasAvaliacao(req: Request, res: Response) {
  try {
    const profissionalId = parseInt(req.params.id);
    const stats = await obterEstatisticasAvaliacao(profissionalId);
    res.json(stats);
  } catch (error: any) {
    res.status(400).json({ erro: error.message });
  }
}

export async function getProfissionaisComAvaliacoes(req: Request, res: Response) {
  try {
    const profissionais = await listarProfissionaisComAvaliacoes();
    res.json(profissionais);
  } catch (error: any) {
    res.status(400).json({ erro: error.message });
  }
}

