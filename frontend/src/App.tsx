import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthProvider";
import PrivateRoute from "./routes/PrivateRoute";
import Login from "./pages/Login";

import DashboardProfissional from "./pages/profissional/DashboardProfissional";
import DashboardPaciente from "./pages/paciente/DashboardPaciente";
import DashboardRecepcionista from "./pages/recepcionista/DashboardRecepcionista";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          <Route path="/" element={<Navigate to="/login" />} />

          <Route path="/login" element={<Login />} />

          <Route
            path="/dashboard/profissional"
            element={
              <PrivateRoute>
                <DashboardProfissional />
              </PrivateRoute>
            }
          />

          <Route
            path="/dashboard/paciente"
            element={
              <PrivateRoute>
                <DashboardPaciente />
              </PrivateRoute>
            }
          />

          <Route
            path="/dashboard/recepcionista"
            element={
              <PrivateRoute>
                <DashboardRecepcionista />
              </PrivateRoute>
            }
          />

          <Route
            path="/profissional/agenda"
            element={<Navigate to="/dashboard/profissional" replace />}
          />

        </Routes>

        <ToastContainer position="top-right" autoClose={3000} />
      </BrowserRouter>
    </AuthProvider>
  );
}
