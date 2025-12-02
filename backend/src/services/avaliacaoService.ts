import { prisma } from '../config/prisma';

export async function criarAvaliacao(data: {
  agendamentoId: number;
  profissionalId: number;
  pacienteId: number;
  nota: number;
  comentario?: string;
}) {
  const agendamento = await prisma.agendamento.findUnique({
    where: { id: data.agendamentoId }
  });

  if (!agendamento) {
    throw new Error('Agendamento não encontrado');
  }

  if (agendamento.status !== 'FINALIZADO') {
    throw new Error('Apenas agendamentos finalizados podem ser avaliados');
  }

  const avaliacaoExistente = await prisma.avaliacao.findUnique({
    where: { agendamentoId: data.agendamentoId }
  });

  if (avaliacaoExistente) {
    throw new Error('Este agendamento já foi avaliado');
  }

  if (agendamento.pacienteId !== data.pacienteId) {
    throw new Error('Você não pode avaliar este agendamento');
  }

  if (data.nota < 1 || data.nota > 5) {
    throw new Error('A nota deve ser entre 1 e 5');
  }

  return prisma.avaliacao.create({
    data: {
      agendamentoId: data.agendamentoId,
      profissionalId: data.profissionalId,
      pacienteId: data.pacienteId,
      nota: data.nota,
      comentario: data.comentario
    },
    include: {
      paciente: {
        select: { id: true, nome: true }
      }
    }
  });
}

export async function listarAvaliacoesDoProfissional(profissionalId: number) {
  return prisma.avaliacao.findMany({
    where: { profissionalId },
    include: {
      paciente: {
        select: { id: true, nome: true }
      },
      agendamento: {
        select: { data: true }
      }
    },
    orderBy: { criadoEm: 'desc' }
  });
}

export async function obterEstatisticasAvaliacao(profissionalId: number) {
  const avaliacoes = await prisma.avaliacao.findMany({
    where: { profissionalId },
    select: { nota: true }
  });

  if (avaliacoes.length === 0) {
    return {
      media: 0,
      total: 0,
      distribuicao: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };
  }

  const total = avaliacoes.length;
  const soma = avaliacoes.reduce((acc: number, a: any) => acc + a.nota, 0);
  const media = soma / total;

  const distribuicao = avaliacoes.reduce((acc: Record<number, number>, a: any) => {
    acc[a.nota as keyof typeof acc] = (acc[a.nota as keyof typeof acc] || 0) + 1;
    return acc;
  }, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<number, number>);

  return {
    media: Math.round(media * 10) / 10,
    total,
    distribuicao
  };
}

export async function listarProfissionaisComAvaliacoes() {
  const profissionais = await prisma.profissional.findMany({
    include: {
      usuario: {
        select: { nome: true, email: true }
      },
      especialidade: true
    }
  });

  const profissionaisComStats = await Promise.all(
    profissionais.map(async (prof) => {
      const stats = await obterEstatisticasAvaliacao(prof.id);
      const avaliacoes = await prisma.avaliacao.findMany({
        where: { profissionalId: prof.id },
        include: {
          paciente: {
            select: { nome: true }
          }
        },
        orderBy: { criadoEm: 'desc' },
        take: 5
      });
      
      return {
        ...prof,
        avaliacaoMedia: stats.media,
        totalAvaliacoes: stats.total,
        avaliacoes
      };
    })
  );

  return profissionaisComStats;
}

