import { useState } from "react";
import DashboardOverview from "./components/DashboardOverview";
import UsuariosManager from "./components/UsuariosManager";
import EspecialidadesManager from "./components/EspecialidadesManager";
import AgendamentosManager from "./components/AgendamentosManager";
import GlassPage from "../../components/GlassPage";
import { getUserFromToken } from "../../utils/getUserFromToken";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/api";
import { User, LogOut } from "lucide-react";

type TabKey = "overview" | "usuarios" | "especialidades" | "agendamentos";

const tabs: { key: TabKey; label: string }[] = [
  { key: "overview", label: "Visão Geral" },
  { key: "usuarios", label: "Usuários" },
  { key: "especialidades", label: "Especialidades" },
  { key: "agendamentos", label: "Agendamentos" },
];

export default function DashboardRecepcionista() {
  const [tab, setTab] = useState<TabKey>("overview");
  const user = getUserFromToken();
  const { logout } = useAuth();

  return (
    <GlassPage
      maxWidthClass="w-full"
      contentClassName="glass-content"
      className="pb-10"
      withCard={false}
    >
      <div className="space-y-6">
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
                Painel do Recepcionista - Gerencie usuários, especialidades e agendamentos
              </p>
            </div>
            <button
              onClick={async () => {
                try {
                  await api.post('/auth/logout');
                } catch (error) {
                  console.warn('Erro ao chamar logout no backend:', error);
                }
                logout();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition shadow-sm hover:shadow-md"
              title="Sair"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </header>
        <div className="flex items-center flex-wrap gap-3">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 border shadow-sm ${
                tab === key
                  ? "bg-[var(--sand-500)] text-white border-[var(--sand-500)] shadow-md"
                  : "bg-white/90 text-[var(--text-muted)] border-white/40 hover:bg-[var(--sand-200)] hover:text-[var(--sand-600)] backdrop-blur-sm"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="border-b border-[var(--sand-200)]" />

        <div className="transition-all duration-300 bg-white/90 rounded-2xl shadow-sm p-6 backdrop-blur-sm">
          {tab === "overview" && <DashboardOverview />}
          {tab === "usuarios" && <UsuariosManager />}
          {tab === "especialidades" && <EspecialidadesManager />}
          {tab === "agendamentos" && <AgendamentosManager />}
        </div>
      </div>
    </GlassPage>
  );
}
