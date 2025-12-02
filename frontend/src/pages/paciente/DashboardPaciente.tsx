import { useEffect, useState } from 'react';
import api from '../../services/api';
import { getUserFromToken } from '../../utils/getUserFromToken';
import { AxiosError } from 'axios';
import { toast } from 'react-toastify';
import {
  Calendar,
  Clock,
  User,
  XCircle,
  HeartPulse,
  ClipboardList,
  Stethoscope,
  Mail,
  CheckCircle,
  Star,
  X,
} from 'lucide-react';
import GlassPage from '../../components/GlassPage';

interface Especialidade {
  id: number;
  nome: string;
}

interface Profissional {
  id: number;
  usuarioId: number;
  especialidadeId: number;
  diasAtendimento: string[];
  horaInicio: string;
  horaFim: string;
  biografia?: string | null;
  formacao?: string | null;
  fotoPerfil?: string | null;
  usuario: {
    nome: string;
    email: string;
  };
  especialidade?: {
    nome: string;
  };
}

interface Agendamento {
  id: number;
  data: string;
  status: string;
  profissional: Profissional;
  observacoes?: string | null;
  avaliacoes?: Array<{ id: number; nota: number; comentario?: string | null }>;
}

interface ProfissionalComAvaliacao extends Profissional {
  avaliacaoMedia?: number;
  totalAvaliacoes?: number;
  avaliacoes?: Array<{
    id: number;
    nota: number;
    comentario?: string | null;
    paciente: { nome: string };
    criadoEm: string;
  }>;
}

// Função auxiliar para determinar o status do agendamento
const getStatusAgendamento = (agendamento: Agendamento): string => {
  if (agendamento.status === 'CANCELADO' || agendamento.status === 'FINALIZADO') {
    return agendamento.status;
  }
  const dataAgendamento = new Date(agendamento.data);
  const agora = new Date();
  if (dataAgendamento < agora) {
    return 'EXPIRADO';
  }
  return agendamento.status;
};

export default function DashboardPaciente() {
  const [especialidades, setEspecialidades] = useState<Especialidade[]>([]);
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [profissionalId, setProfissionalId] = useState('');
  const [especialidadeId, setEspecialidadeId] = useState('');
  const [data, setData] = useState('');
  const [hora, setHora] = useState('');
  const [horariosDisponiveis, setHorariosDisponiveis] = useState<string[]>([]);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [carregandoHorarios, setCarregandoHorarios] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profissionaisComAvaliacoes, setProfissionaisComAvaliacoes] = useState<ProfissionalComAvaliacao[]>([]);
  const [modalAvaliacaoAberto, setModalAvaliacaoAberto] = useState(false);
  const [agendamentoParaAvaliar, setAgendamentoParaAvaliar] = useState<Agendamento | null>(null);
  const [notaAvaliacao, setNotaAvaliacao] = useState(0);
  const [comentarioAvaliacao, setComentarioAvaliacao] = useState('');


  const user = getUserFromToken();
  const dataMinima = new Date().toISOString().split('T')[0];

  // ============= CARREGAR DADOS INICIAIS =============
  useEffect(() => {
    async function fetchData() {
      try {
        const [espRes, agRes, profRes] = await Promise.all([
          api.get('/especialidades'),
          api.get('/agendamentos/me'),
          api.get('/avaliacoes/profissionais'),
        ]);
        setEspecialidades(espRes.data);
        setAgendamentos(agRes.data);
        setProfissionaisComAvaliacoes(profRes.data);
      } catch (err) {
        console.error('Erro ao carregar dados iniciais:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // ============= CARREGAR PROFISSIONAIS =============
  useEffect(() => {
    if (especialidadeId) {
      api
        .get(`/profissionais?especialidade=${especialidadeId}`)
        .then((res) => setProfissionais(res.data))
        .catch(() => setProfissionais([]));
    } else {
      setProfissionais([]);
    }
  }, [especialidadeId]);

  // ============= DISPONIBILIDADE =============
  useEffect(() => {
    if (profissionalId && data) {
      setCarregandoHorarios(true);
      api
        .get(`/profissionais/${profissionalId}/disponibilidade?data=${data}`)
        .then((res) => setHorariosDisponiveis(res.data))
        .catch(() => setHorariosDisponiveis([]))
        .finally(() => setCarregandoHorarios(false));
    }
  }, [profissionalId, data]);

  // ============= CRIAR AGENDAMENTO =============
  const handleAgendar = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profissionalId || !data || !hora) {
      toast.warn('Preencha todos os campos para agendar.');
      return;
    }

    if (!user?.id) {
      toast.error('Usuário não autenticado. Por favor, faça login novamente.');
      return;
    }

    const dataHoraSelecionada = new Date(`${data}T${hora}:00`);
    if (dataHoraSelecionada < new Date()) {
      toast.error('Não é permitido agendar em datas passadas.');
      return;
    }

    try {
      await api.post('/agendamentos', {

        pacienteId: user.id,
        profissionalId: Number(profissionalId),
        data: dataHoraSelecionada.toISOString(),
      });
      toast.success('Agendamento criado com sucesso!');
      const agRes = await api.get('/agendamentos/me');
      setAgendamentos(agRes.data);
      setEspecialidadeId('');
      setProfissionalId('');
      setData('');
      setHora('');
      setHorariosDisponiveis([]);
    } catch (error) {
      const err = error as AxiosError<{ erro: string }>;
      const mensagemErro = err.response?.data?.erro ?? 'Erro ao criar agendamento.';
      console.error('Erro ao criar agendamento:', err.response?.data);
      toast.error(mensagemErro);
    }
  };

  // ============= CONFIRMAR =============
  const handleConfirmar = async (id: number) => {
    try {
      await api.patch(`/agendamentos/${id}/status`, { status: 'CONFIRMADO' });
      setAgendamentos((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: 'CONFIRMADO' } : a))
      );
      toast.success('Agendamento confirmado!');
    } catch {
      toast.error('Erro ao confirmar agendamento.');
    }
  };

  // ============= CANCELAR =============
  const handleCancelar = async (id: number) => {
    if (!confirm('Deseja realmente cancelar este agendamento?')) return;
    try {
      await api.patch(`/agendamentos/${id}/status`, { status: 'CANCELADO' });
      setAgendamentos((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: 'CANCELADO' } : a))
      );
      toast.success('Agendamento cancelado!');
    } catch {
      toast.error('Erro ao cancelar agendamento.');
    }
  };

  // ============= AVALIAR =============
  const abrirModalAvaliacao = (agendamento: Agendamento) => {
    setAgendamentoParaAvaliar(agendamento);
    setNotaAvaliacao(0);
    setComentarioAvaliacao('');
    setModalAvaliacaoAberto(true);
  };

  const fecharModalAvaliacao = () => {
    setModalAvaliacaoAberto(false);
    setAgendamentoParaAvaliar(null);
    setNotaAvaliacao(0);
    setComentarioAvaliacao('');
  };

  const handleAvaliar = async () => {
    if (!agendamentoParaAvaliar || notaAvaliacao === 0) {
      toast.warn('Por favor, selecione uma nota de 1 a 5.');
      return;
    }

    try {
      await api.post('/avaliacoes', {
        agendamentoId: agendamentoParaAvaliar.id,
        nota: notaAvaliacao,
        comentario: comentarioAvaliacao.trim() || undefined,
      });

      // Atualiza o agendamento para incluir a avaliação
      setAgendamentos((prev) =>
        prev.map((a) =>
          a.id === agendamentoParaAvaliar.id
            ? { ...a, avaliacoes: [{ id: 0, nota: notaAvaliacao, comentario: comentarioAvaliacao }] }
            : a
        )
      );

      // Recarrega profissionais com avaliações
      const profRes = await api.get('/avaliacoes/profissionais');
      setProfissionaisComAvaliacoes(profRes.data);

      toast.success('Avaliação enviada com sucesso!');
      fecharModalAvaliacao();
    } catch (error: unknown) {
      const mensagemErro = (error as AxiosError<{ erro: string }>)?.response?.data?.erro || 'Erro ao enviar avaliação.';
      toast.error(mensagemErro);
    }
  };

  if (loading) return <p className="p-6 text-gray-600">Carregando...</p>;

  const proximoAgendamento = agendamentos
    .filter((a) => {
      const status = getStatusAgendamento(a);
      // Não mostra se: cancelado, expirado, finalizado, ou se a data já passou
      return (
        new Date(a.data) > new Date() && 
        status !== 'CANCELADO' && 
        status !== 'EXPIRADO' && 
        status !== 'FINALIZADO' &&
        a.status !== 'FINALIZADO' // Verifica também o status original
      );
    })
    .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())[0];

  const total = agendamentos.length;
  const confirmados = agendamentos.filter((a) => a.status === 'CONFIRMADO').length;
  const cancelados = agendamentos.filter((a) => a.status === 'CANCELADO').length;
  const futuros = agendamentos.filter(
    (a) => {
      const status = getStatusAgendamento(a);
      return (
        new Date(a.data) > new Date() && 
        status !== 'CANCELADO' && 
        status !== 'EXPIRADO' && 
        status !== 'FINALIZADO' &&
        a.status !== 'FINALIZADO' // Verifica também o status original
      );
    }
  ).length;
  return (
    <GlassPage
      maxWidthClass="w-full"
      contentClassName="glass-content"
      className="pb-12"
      withCard={false}
    >
      <div className="space-y-10">
        <header className="bg-gradient-to-r from-[var(--sage-100)] to-[var(--sand-100)] border border-[var(--sage-200)] rounded-2xl p-6 shadow-sm backdrop-blur-sm">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[var(--sand-300)] to-[var(--sand-500)] flex items-center justify-center shadow-md ring-4 ring-white/50">
              <User className="w-10 h-10 text-white" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-[var(--ink)] mb-2">
                Olá, {user?.nome || user?.email?.split("@")[0]} 👋
              </h1>
              <p className="text-[var(--text-muted)] text-base leading-relaxed">
                Aqui você pode acompanhar suas consultas e agendar novas.
              </p>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/90 shadow-sm rounded-xl p-4 text-center border border-white/40 backdrop-blur-sm">
            <HeartPulse className="w-6 h-6 mx-auto text-[var(--sand-600)] mb-2" />
            <h3 className="text-[var(--text-muted)] text-sm">Total de Consultas</h3>
            <p className="text-lg font-bold text-[var(--ink)]">{total}</p>
          </div>
          <div className="bg-white/90 shadow-sm rounded-xl p-4 text-center border border-white/40 backdrop-blur-sm">
            <Calendar className="w-6 h-6 mx-auto text-[var(--sand-600)] mb-2" />
            <h3 className="text-[var(--text-muted)] text-sm">Próximas</h3>
            <p className="text-lg font-bold text-[var(--ink)]">{futuros}</p>
          </div>
          <div className="bg-white/90 shadow-sm rounded-xl p-4 text-center border border-white/40 backdrop-blur-sm">
            <ClipboardList className="w-6 h-6 mx-auto text-[var(--sand-600)] mb-2" />
            <h3 className="text-[var(--text-muted)] text-sm">Confirmadas</h3>
            <p className="text-lg font-bold text-[var(--ink)]">{confirmados}</p>
          </div>
          <div className="bg-white/90 shadow-sm rounded-xl p-4 text-center border border-white/40 backdrop-blur-sm">
            <XCircle className="w-6 h-6 mx-auto text-[var(--sand-600)] mb-2" />
            <h3 className="text-[var(--text-muted)] text-sm">Canceladas</h3>
            <p className="text-lg font-bold text-[var(--ink)]">{cancelados}</p>
          </div>
        </section>

        {proximoAgendamento && (
          <section className="bg-[var(--sage-100)] border border-[var(--sage-300)] rounded-2xl p-5 shadow-sm backdrop-blur-sm">
            <h2 className="text-lg font-semibold text-[var(--sand-600)] mb-2 flex items-center gap-2">
              <Calendar className="w-5 h-5" /> Sua próxima consulta
            </h2>
            <div className="flex items-center gap-3">
              <img
                src={proximoAgendamento.profissional.fotoPerfil || "/default-doctor.png"}
                alt="Médico"
                className="w-14 h-14 rounded-full object-cover border"
              />
              <div>
                <p className="font-medium text-[var(--ink)]">
                  {proximoAgendamento.profissional.usuario.nome}
                </p>
                <p className="text-sm text-[var(--text-muted)]">
                  {proximoAgendamento.profissional.especialidade?.nome}
                </p>
                <p className="flex items-center text-sm text-[var(--text-muted)] gap-1 mt-1">
                  <Clock className="w-4 h-4" /> {new Date(proximoAgendamento.data).toLocaleString("pt-BR")}
                </p>
              </div>
            </div>
          </section>
        )}

        <section>
          <h2 className="text-xl font-semibold text-[var(--ink)] mb-4 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-[var(--sand-600)]" /> Meus Agendamentos
          </h2>

          {agendamentos.length === 0 ? (
            <div className="text-[var(--text-muted)] text-center py-10 bg-white/90 rounded-xl shadow-sm border border-white/40 backdrop-blur-sm">
              <Stethoscope className="mx-auto w-10 h-10 text-[var(--sand-300)] mb-3" />
              <p>Você ainda não possui consultas marcadas.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {agendamentos.map((a) => {
                const statusAtual = getStatusAgendamento(a);
                return (
                  <div
                    key={a.id}
                    className="bg-white/90 rounded-xl shadow-sm border border-white/40 p-5 hover:shadow-md transition backdrop-blur-sm"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <img
                        src={a.profissional.fotoPerfil || "/default-doctor.png"}
                        alt="Médico"
                        className="w-14 h-14 rounded-full object-cover border"
                      />
                      <div>
                        <p className="font-semibold text-[var(--ink)]">{a.profissional.usuario.nome}</p>
                        <p className="text-sm text-[var(--text-muted)]">
                          {a.profissional.especialidade?.nome}
                        </p>
                      </div>
                    </div>

                    <p className="text-[var(--text-muted)] text-sm flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[var(--sand-300)]" />
                      {new Date(a.data).toLocaleDateString("pt-BR")}
                    </p>
                    <p className="text-[var(--text-muted)] text-sm mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[var(--sand-300)]" />
                      {new Date(a.data).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>

                    <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-3">
                      <Mail className="w-4 h-4" />
                      {a.profissional.usuario.email}
                    </div>

                    <span
                      className={`inline-block px-3 py-1 text-xs font-semibold rounded-full mb-3 ${
                        statusAtual === "CONFIRMADO"
                          ? "bg-[var(--sage-100)] text-[var(--sand-600)]"
                          : statusAtual === "CANCELADO"
                          ? "bg-[#f8dcd6] text-[#a45a52]"
                          : statusAtual === "EXPIRADO"
                          ? "bg-[#d4a574] text-[#6b4423]"
                          : statusAtual === "FINALIZADO"
                          ? "bg-[var(--sand-300)] text-[var(--sand-700)]"
                          : "bg-[var(--sand-200)] text-[var(--sand-600)]"
                      }`}
                    >
                      {statusAtual}
                    </span>

                    {/* Mostrar anotações se o agendamento estiver finalizado e tiver observações */}
                    {statusAtual === "FINALIZADO" && a.observacoes && (
                      <div className="bg-[var(--sage-50)] border border-[var(--sage-200)] rounded-lg p-4 mb-3">
                        <div className="flex items-center gap-2 mb-2">
                          <ClipboardList className="w-4 h-4 text-[var(--sand-600)]" />
                          <h4 className="text-sm font-semibold text-[var(--ink)]">Anotações do Profissional</h4>
                        </div>
                        <p className="text-sm text-[var(--text-muted)] whitespace-pre-wrap">
                          {a.observacoes}
                        </p>
                      </div>
                    )}

                    {statusAtual === "FINALIZADO" && (!a.avaliacoes || a.avaliacoes.length === 0) && (
                      <button
                        onClick={() => abrirModalAvaliacao(a)}
                        className="flex items-center gap-1 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white px-4 py-2 rounded-lg text-sm hover:from-yellow-500 hover:to-yellow-600 transition shadow-sm"
                      >
                        <Star className="w-4 h-4" /> Avaliar Atendimento
                      </button>
                    )}

                    {statusAtual !== "CANCELADO" && statusAtual !== "EXPIRADO" && statusAtual !== "FINALIZADO" && (
                      <div className="flex gap-2">
                        {statusAtual === "AGENDADO" && (
                          <button
                            onClick={() => handleConfirmar(a.id)}
                            className="flex items-center gap-1 bg-[var(--sage-300)] text-[var(--sand-700)] px-3 py-1 rounded text-sm hover:bg-[var(--sage-100)] transition"
                          >
                            <CheckCircle className="w-4 h-4" /> Confirmar
                          </button>
                        )}
                        <button
                          onClick={() => handleCancelar(a.id)}
                          className="flex items-center gap-1 bg-[var(--sand-500)] text-white px-3 py-1 rounded text-sm hover:bg-[var(--sand-600)] transition"
                        >
                          <XCircle className="w-4 h-4" /> Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="bg-white/90 rounded-2xl shadow p-6 border border-white/40 backdrop-blur-sm">
          <h2 className="text-xl font-semibold text-[var(--ink)] mb-4">Agendar nova consulta</h2>

          <form onSubmit={handleAgendar} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <select
                value={especialidadeId}
                onChange={(e) => {
                  setEspecialidadeId(e.target.value);
                  setProfissionalId(''); // Limpa profissional quando muda especialidade
                }}
                className="border border-[var(--sand-300)] rounded-lg px-3 py-2 focus:ring-2 focus:ring-[var(--sand-400)]"
                required
              >
                <option value="">Especialidade</option>
                {especialidades.map((esp) => (
                  <option key={esp.id} value={String(esp.id)}>
                    {esp.nome}
                  </option>
                ))}
              </select>

              <select
                value={profissionalId}
                onChange={(e) => setProfissionalId(e.target.value)}
                className="border border-[var(--sand-300)] rounded-lg px-3 py-2 focus:ring-2 focus:ring-[var(--sand-400)]"
                required
                disabled={!especialidadeId}
              >
                <option value="">Profissional</option>
                {profissionais.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.usuario.nome} — {p.especialidade?.nome}
                  </option>
                ))}
              </select>

              <input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                min={dataMinima}
                className="border border-[var(--sand-300)] rounded-lg px-3 py-2 focus:ring-2 focus:ring-[var(--sand-400)]"
                required
                disabled={!profissionalId}
              />

              <select
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                className="border border-[var(--sand-300)] rounded-lg px-3 py-2 focus:ring-2 focus:ring-[var(--sand-400)]"
                disabled={carregandoHorarios || !horariosDisponiveis.length || !data}
                required
              >
                <option value="">{carregandoHorarios ? "Carregando..." : "Horário"}</option>
                {horariosDisponiveis.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            {/* Informações do Profissional Selecionado */}
            {profissionalId && (() => {
              const profissionalSelecionado = profissionais.find(p => p.id === Number(profissionalId));
              if (!profissionalSelecionado) return null;
              
              return (
                <div className="bg-[var(--sage-50)] border border-[var(--sage-200)] rounded-xl p-4 mt-4">
                  <h3 className="font-semibold text-[var(--ink)] mb-3 flex items-center gap-2">
                    <Stethoscope className="w-5 h-5 text-[var(--sand-600)]" />
                    Informações do Profissional
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-[var(--text-muted)] mb-1">Nome</p>
                      <p className="text-[var(--ink)]">{profissionalSelecionado.usuario.nome}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--text-muted)] mb-1">Especialidade</p>
                      <p className="text-[var(--ink)]">{profissionalSelecionado.especialidade?.nome || '—'}</p>
                    </div>
                    {profissionalSelecionado.formacao && (
                      <div>
                        <p className="text-sm font-medium text-[var(--text-muted)] mb-1">Formação</p>
                        <p className="text-[var(--ink)]">{profissionalSelecionado.formacao}</p>
                      </div>
                    )}
                    {profissionalSelecionado.biografia && (
                      <div className="md:col-span-2">
                        <p className="text-sm font-medium text-[var(--text-muted)] mb-1">Biografia</p>
                        <p className="text-[var(--ink)] text-sm">{profissionalSelecionado.biografia}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[var(--sand-300)] to-[var(--sand-500)] text-white px-6 py-2 rounded-lg hover:from-[var(--sand-400)] hover:to-[var(--sand-600)] transition"
            >
              Agendar
            </button>
          </form>
        </section>

        {/* Seção de Profissionais com Feedbacks */}
        <section className="bg-white/90 rounded-2xl shadow p-6 border border-white/40 backdrop-blur-sm">
          <h2 className="text-xl font-semibold text-[var(--ink)] mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" /> Profissionais Disponíveis e Avaliações
          </h2>

          {profissionaisComAvaliacoes.length === 0 ? (
            <p className="text-[var(--text-muted)] text-center py-8">
              Nenhum profissional disponível no momento.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {profissionaisComAvaliacoes.map((prof) => (
                <div
                  key={prof.id}
                  className="bg-gradient-to-br from-white to-[var(--sage-50)] rounded-xl shadow-sm border border-[var(--sand-200)] p-5 hover:shadow-md transition"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <img
                      src={prof.fotoPerfil || "/default-doctor.png"}
                      alt={prof.usuario.nome}
                      className="w-16 h-16 rounded-full object-cover border-2 border-[var(--sand-300)]"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-[var(--ink)]">{prof.usuario.nome}</h3>
                      <p className="text-sm text-[var(--text-muted)]">
                        {prof.especialidade?.nome}
                      </p>
                      {prof.avaliacaoMedia !== undefined && prof.avaliacaoMedia > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium text-[var(--ink)]">
                            {prof.avaliacaoMedia.toFixed(1)}
                          </span>
                          <span className="text-xs text-[var(--text-muted)]">
                            ({prof.totalAvaliacoes} {prof.totalAvaliacoes === 1 ? 'avaliação' : 'avaliações'})
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {prof.biografia && (
                    <p className="text-sm text-[var(--text-muted)] mb-4 line-clamp-2">
                      {prof.biografia}
                    </p>
                  )}

                  {/* Feedbacks recentes */}
                  {prof.avaliacoes && prof.avaliacoes.length > 0 && (
                    <div className="border-t border-[var(--sand-200)] pt-4 mt-4">
                      <h4 className="text-xs font-semibold text-[var(--text-muted)] mb-2 uppercase">
                        Feedbacks Recentes
                      </h4>
                      <div className="space-y-3">
                        {prof.avaliacoes.slice(0, 2).map((avaliacao) => (
                          <div key={avaliacao.id} className="bg-white/60 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-3 h-3 ${
                                      i < avaliacao.nota
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-xs text-[var(--text-muted)]">
                                {avaliacao.paciente.nome}
                              </span>
                            </div>
                            {avaliacao.comentario && (
                              <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2">
                                "{avaliacao.comentario}"
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
        {/* Modal de Avaliação */}
        {modalAvaliacaoAberto && agendamentoParaAvaliar && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-[var(--sand-200)]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-[var(--ink)] flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  Avaliar Atendimento
                </h3>
                <button
                  onClick={fecharModalAvaliacao}
                  className="text-[var(--text-muted)] hover:text-[var(--ink)] transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-sm text-[var(--text-muted)] mb-4">
                Como foi seu atendimento com <strong>{agendamentoParaAvaliar.profissional.usuario.nome}</strong>?
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-[var(--ink)] mb-2">
                  Nota (1 a 5 estrelas)
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((nota) => (
                    <button
                      key={nota}
                      type="button"
                      onClick={() => setNotaAvaliacao(nota)}
                      className="focus:outline-none transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          nota <= notaAvaliacao
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-[var(--ink)] mb-2">
                  Comentário (opcional)
                </label>
                <textarea
                  value={comentarioAvaliacao}
                  onChange={(e) => setComentarioAvaliacao(e.target.value)}
                  placeholder="Deixe um comentário sobre o atendimento..."
                  className="w-full h-24 p-3 border border-[var(--sand-300)] rounded-lg focus:ring-2 focus:ring-[var(--sand-400)] focus:border-[var(--sand-400)] resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={fecharModalAvaliacao}
                  className="flex-1 px-4 py-2 border border-[var(--sand-300)] rounded-lg text-[var(--ink)] hover:bg-[var(--sand-100)] transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAvaliar}
                  disabled={notaAvaliacao === 0}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white rounded-lg hover:from-yellow-500 hover:to-yellow-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Enviar Avaliação
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </GlassPage>
  );
}
