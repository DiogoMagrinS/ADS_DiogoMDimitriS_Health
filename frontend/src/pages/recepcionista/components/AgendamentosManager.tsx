import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api from "../../../services/api";
import {
  CheckCircle,
  XCircle,
  Calendar,
  Clock,
  User,
} from "lucide-react";

interface Usuario {
  id: number;
  nome: string;
  email: string;
}

interface Especialidade {
  id: number;
  nome: string;
}

interface Profissional {
  id: number;
  usuario: Usuario;
  especialidade: Especialidade;
  fotoPerfil?: string | null;
}

interface Agendamento {
  id: number;
  data: string;
  status: "AGENDADO" | "CONFIRMADO" | "CANCELADO";
  profissional?: Profissional | null;
  paciente?: Usuario | null;
}

export default function AgendamentosManager() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [filtro, setFiltro] = useState("");
  const [statusFiltro, setStatusFiltro] = useState<
    "TODOS" | "AGENDADO" | "CONFIRMADO" | "CANCELADO"
  >("TODOS");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAgendamentos = async () => {
      try {
        const res = await api.get("/recepcionista/agendamentos");
        setAgendamentos(res.data);
      } catch (error) {
        console.error("Erro ao carregar agendamentos:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAgendamentos();
  }, []);

  const atualizarStatus = async (
    id: number,
    status: "AGENDADO" | "CONFIRMADO" | "CANCELADO"
  ) => {
    try {
      await api.patch(`/agendamentos/${id}/status`, { status });
      setAgendamentos((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status } : a))
      );
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
  };

  const termo = filtro.toLowerCase();
  const agendamentosFiltrados = agendamentos.filter((a) => {
    const nomeProf = a.profissional?.usuario?.nome?.toLowerCase() ?? "";
    const nomePac = a.paciente?.nome?.toLowerCase() ?? "";
    const statusOk = statusFiltro === "TODOS" || a.status === statusFiltro;
    return statusOk && (nomeProf.includes(termo) || nomePac.includes(termo));
  });

  const agendamentosPorProfissional = agendamentosFiltrados.reduce<
    Record<number, Agendamento[]>
  >((acc, agendamento) => {
    const profId = agendamento.profissional?.id;
    if (!profId) return acc;
    if (!acc[profId]) acc[profId] = [];
    acc[profId].push(agendamento);
    return acc;
  }, {});

  const profissionaisOrdenados = Object.keys(agendamentosPorProfissional)
    .map((id) => agendamentosFiltrados.find((a) => a.profissional?.id === Number(id))?.profissional)
    .filter((p): p is Profissional => p !== undefined && p !== null)
    .sort((a, b) => a.usuario.nome.localeCompare(b.usuario.nome));

  if (loading)
    return (
      <div className="p-8 text-center text-[var(--text-muted)] animate-pulse">
        Carregando agendamentos...
      </div>
    );

  return (
    <div className="text-[var(--ink)]">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Calendar className="w-6 h-6 text-[var(--sand-600)]" /> Agendamentos por Profissional
      </h1>


        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <input
            type="text"
            placeholder="Buscar por paciente ou profissional..."
            className="w-full sm:w-1/2 p-2 border border-[var(--sand-300)] rounded-lg shadow-sm focus:ring-2 focus:ring-[var(--sand-400)] bg-white/90"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          />

          <select
            value={statusFiltro}
            onChange={(e) =>
              setStatusFiltro(
                e.target.value as "TODOS" | "AGENDADO" | "CONFIRMADO" | "CANCELADO"
              )
            }
            className="w-full sm:w-48 p-2 border border-[var(--sand-300)] rounded-lg focus:ring-2 focus:ring-[var(--sand-400)] bg-white/90"
          >
            <option value="TODOS">Todos</option>
            <option value="AGENDADO">Agendados</option>
            <option value="CONFIRMADO">Confirmados</option>
            <option value="CANCELADO">Cancelados</option>
          </select>
        </div>

        {/* Legenda de status */}
        <div className="mb-6 bg-white/80 rounded-xl border border-white/60 px-4 py-3 text-xs text-[var(--text-muted)] flex flex-wrap gap-3 items-center">
          <span className="font-semibold text-[var(--ink)] mr-1">Legenda de status:</span>
          <span className="inline-flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[var(--sand-200)] border border-[var(--sand-300)]" />
            <span>AGENDADO</span>
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[var(--sage-100)] border border-[var(--sage-200)]" />
            <span>CONFIRMADO</span>
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#f8dcd6] border border-[#f1b5aa]" />
            <span>CANCELADO</span>
          </span>
        </div>

        {profissionaisOrdenados.length === 0 ? (
          <div className="text-center text-[var(--text-muted)] mt-10">
            Nenhum agendamento encontrado.
          </div>
        ) : (
          profissionaisOrdenados.map((prof) => (
            <div key={prof.id} className="mb-10">
              <div className="flex items-center gap-4 mb-4 border-b border-[var(--sand-200)] pb-2">
                <img
                  src={
                    prof.fotoPerfil && prof.fotoPerfil.trim() !== ""
                      ? prof.fotoPerfil
                      : `https://i.pravatar.cc/100?u=${prof.id}`
                  }
                  alt={prof.usuario.nome}
                  className="w-12 h-12 rounded-full border"
                />
                <div>
                  <h2 className="text-lg font-semibold">
                    {prof.usuario.nome}
                  </h2>
                  <p className="text-sm text-[var(--text-muted)]">
                    {prof.especialidade?.nome ?? "Sem especialidade"}
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {agendamentosPorProfissional[prof.id].map((a) => {
                  const dataObj = new Date(a.data);
                  const dataFormatada = dataObj.toLocaleDateString();
                  const horaFormatada = dataObj.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <motion.div
                      key={a.id}
                      className="bg-white/90 border border-white/40 rounded-xl p-5 shadow hover:shadow-lg transition backdrop-blur-sm"
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="flex justify-between items-center mb-3">
                        <p className="font-semibold flex items-center gap-2">
                          <User className="w-4 h-4 text-[var(--sand-600)]" />
                          {a.paciente?.nome ?? "Paciente não informado"}
                        </p>
                        <span
                          className={`px-3 py-1 text-xs font-medium rounded-full ${
                            a.status === "AGENDADO"
                              ? "bg-[var(--sand-200)] text-[var(--sand-700)]"
                              : a.status === "CONFIRMADO"
                              ? "bg-[var(--sage-100)] text-[var(--sand-600)]"
                              : "bg-[#f8dcd6] text-[#a45a52]"
                          }`}
                        >
                          {a.status}
                        </span>
                      </div>

                      <p className="text-xs text-[var(--text-muted)] ml-5 mb-2">
                        {a.paciente?.email ?? "—"}
                      </p>

                      <div className="text-sm text-[var(--text-muted)] flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[var(--sand-300)]" /> {dataFormatada}
                        <Clock className="w-4 h-4 text-[var(--sand-300)] ml-2" /> {horaFormatada}
                      </div>

                      {a.status !== "CANCELADO" && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {a.status === "AGENDADO" && (
                            <>
                              <button
                                onClick={() => atualizarStatus(a.id, "CONFIRMADO")}
                                className="flex items-center gap-1 bg-[var(--sage-300)] text-[var(--sand-700)] px-3 py-2 rounded-lg text-sm hover:bg-[var(--sage-100)]"
                              >
                                <CheckCircle className="w-4 h-4" /> Confirmar
                              </button>
                              <button
                                onClick={() => atualizarStatus(a.id, "CANCELADO")}
                                className="flex items-center gap-1 bg-[#e0a39b] text-[#5d2b26] px-3 py-2 rounded-lg text-sm hover:bg-[#d48f86]"
                              >
                                <XCircle className="w-4 h-4" /> Cancelar
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))
        )}
    </div>
  );
}
