import { Router } from 'express';
import { login, logout } from '../controllers/authController';
import { autenticarToken } from '../middlewares/authMiddleware';

const router = Router();

router.post('/login', login);
router.post('/logout', autenticarToken, logout);

export default router;
