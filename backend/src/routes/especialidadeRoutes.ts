import { Router } from "express";
import {
  listarEspecialidades,
  criarEspecialidade,
  excluirEspecialidade,
} from "../controllers/especialidadeController";
import { autenticarToken } from "../middlewares/authMiddleware";

const router = Router();

// Todas as rotas de especialidades requerem autenticação
router.use(autenticarToken);

router.get("/", listarEspecialidades);
router.post("/", criarEspecialidade);
router.delete("/:id", excluirEspecialidade);

export default router;
