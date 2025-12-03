import { Router } from 'express';
import {
  postAvaliacao,
  getAvaliacoesProfissional,
  getEstatisticasAvaliacao,
  getProfissionaisComAvaliacoes,
  getMinhasAvaliacoes
} from '../controllers/avaliacaoController';
import { autenticarToken } from '../middlewares/authMiddleware';

const router = Router();

router.use(autenticarToken);

router.post('/', postAvaliacao);
router.get('/profissionais', getProfissionaisComAvaliacoes);
router.get('/me', getMinhasAvaliacoes);
router.get('/profissional/:id', getAvaliacoesProfissional);
router.get('/profissional/:id/estatisticas', getEstatisticasAvaliacao);

export default router;

