import { Router } from 'express';
import {
  getAgendamentos,
  getAgendamentoPorId,
  postAgendamento,
  putAgendamento,
  deleteAgendamento,
  atualizarStatus,
  listarAgendamentosUsuario,
  listarAgendamentosProfissional,
  editarObservacoes,
  getHistoricoStatus
} from '../controllers/agendamentoController';
import { autenticarToken } from '../middlewares/authMiddleware';

const router = Router();

router.use(autenticarToken);

router.get('/me', listarAgendamentosUsuario);
router.get('/profissional/me', listarAgendamentosProfissional);
router.patch('/:id/status', atualizarStatus);
router.patch('/:id/observacoes', editarObservacoes);
router.get('/:id/historico', getHistoricoStatus);

router.get('/', getAgendamentos);
router.get('/:id', getAgendamentoPorId);
router.post('/', postAgendamento);
router.put('/:id', putAgendamento);
router.delete('/:id', deleteAgendamento);

export default router;
