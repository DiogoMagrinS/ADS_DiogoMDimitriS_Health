import { useEffect, useState } from "react";
import type { FormEvent, JSX } from "react";
import api from "../../../services/api";
import { toast } from "react-toastify";

interface Especialidade {
  id: number;
  nome: string;
  profissionaisCount?: number;
}

export default function EspecialidadesManager(): JSX.Element {
  const [especialidades, setEspecialidades] = useState<Especialidade[]>([]);
  const [novaEspecialidade, setNovaEspecialidade] = useState<string>("");
  const [editando, setEditando] = useState<Especialidade | null>(null);
  const [carregando, setCarregando] = useState<boolean>(false);

  const carregarEspecialidades = async (): Promise<void> => {
    try {
      setCarregando(true);
      const res = await api.get<Especialidade[]>("/recepcionista/especialidades");
      setEspecialidades(res.data || []);
    } catch (error) {
      console.error("Erro ao carregar especialidades:", error);
      toast.error("Erro ao carregar especialidades.");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    void carregarEspecialidades();
  }, []);

  const handleCriar = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!novaEspecialidade.trim()) {
      toast.warn("Digite o nome da especialidade.");
      return;
    }

    try {
      await api.post("/recepcionista/especialidades", { nome: novaEspecialidade.trim() });
      toast.success("Especialidade criada com sucesso!");
      setNovaEspecialidade("");
      await carregarEspecialidades();
    } catch (error) {
      console.error("Erro ao criar especialidade:", error);
      toast.error("Erro ao criar especialidade.");
    }
  };

  const handleSalvarEdicao = async (): Promise<void> => {
    if (!editando) return;

    try {
      await api.put(`/recepcionista/especialidades/${editando.id}`, {
        nome: editando.nome,
      });
      toast.success("Especialidade atualizada!");
      setEditando(null);
      await carregarEspecialidades();
    } catch (error) {
      console.error("Erro ao editar especialidade:", error);
      toast.error("Erro ao atualizar especialidade.");
    }
  };

  const handleExcluir = async (id: number): Promise<void> => {
    const confirmar = confirm("Tem certeza que deseja excluir esta especialidade?");
    if (!confirmar) return;

    try {
      await api.delete(`/recepcionista/especialidades/${id}`);
      toast.success("Especialidade removida!");
      await carregarEspecialidades();
    } catch (error) {
      console.error("Erro ao excluir especialidade:", error);
      toast.error("Erro ao excluir especialidade.");
    }
  };

  return (
    <div className="bg-white/90 rounded-xl shadow p-6 space-y-6 border border-white/40 backdrop-blur-sm text-[var(--ink)]">
      <h2 className="text-2xl font-bold">Gerenciar Especialidades</h2>

      <form onSubmit={handleCriar} className="flex gap-2">
        <input
          type="text"
          placeholder="Nome da especialidade"
          value={novaEspecialidade}
          onChange={(e) => setNovaEspecialidade(e.target.value)}
          className="border border-[var(--sand-300)] rounded-lg px-3 py-2 flex-1 focus:ring-2 focus:ring-[var(--sand-400)] focus:outline-none bg-white/90"
        />
        <button
          type="submit"
          className="bg-gradient-to-r from-[var(--sand-300)] to-[var(--sand-500)] text-white px-5 py-2 rounded-lg hover:from-[var(--sand-400)] hover:to-[var(--sand-600)] transition"
        >
          Adicionar
        </button>
      </form>

      {carregando ? (
        <p className="text-[var(--text-muted)]">Carregando especialidades...</p>
      ) : especialidades.length === 0 ? (
        <p className="text-[var(--text-muted)]">Nenhuma especialidade cadastrada.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border border-[var(--sand-200)] rounded-lg text-sm">
            <thead className="bg-[var(--sand-100)] text-[var(--ink)]">
              <tr>
                <th className="p-3 text-left">ID</th>
                <th className="p-3 text-left">Nome</th>
                <th className="p-3 text-left">Profissionais</th>
                <th className="p-3 text-left">Ações</th>
              </tr>
            </thead>
            <tbody>
              {especialidades.map((esp) => (
                <tr key={esp.id} className="border-b border-[var(--sand-200)] hover:bg-[var(--sand-50)] transition">
                  <td className="p-3">{esp.id}</td>
                  <td className="p-3">
                    {editando?.id === esp.id ? (
                      <input
                        type="text"
                        value={editando.nome}
                        onChange={(e) =>
                          setEditando({ ...editando, nome: e.target.value })
                        }
                        className="border border-[var(--sand-300)] rounded px-2 py-1 w-full focus:ring-2 focus:ring-[var(--sand-400)] bg-white/90"
                      />
                    ) : (
                      esp.nome
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {esp.profissionaisCount ?? "-"}
                  </td>
                  <td className="p-3 flex gap-2">
                    {editando?.id === esp.id ? (
                      <>
                        <button
                          onClick={handleSalvarEdicao}
                          className="px-3 py-1 bg-[var(--sage-300)] text-[var(--sand-700)] rounded hover:bg-[var(--sage-100)]"
                        >
                          Salvar
                        </button>
                        <button
                          onClick={() => setEditando(null)}
                          className="px-3 py-1 bg-[var(--sand-200)] text-[var(--sand-700)] rounded hover:bg-[var(--sand-100)]"
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setEditando(esp)}
                          className="px-3 py-1 bg-[var(--sand-500)] text-white rounded hover:bg-[var(--sand-600)]"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleExcluir(esp.id)}
                          className="px-3 py-1 bg-[#e0a39b] text-[#5d2b26] rounded hover:bg-[#d48f86]"
                        >
                          Excluir
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
