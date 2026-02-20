import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { prisma } from '../config/prisma.js';
import { getUserStats } from '../services/sheets.service.js';

const router = Router();

router.get('/buyouts', requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.auth.sub } });
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    const rows = await getUserStats({ email: user.email, phone: user.phone });
    return res.json({ rows });
  } catch (error) {
    if (error?.code === 403 || error?.code === 404) {
      return res.status(502).json({ message: 'Не удалось получить данные из Google Sheets' });
    }
    return next(error);
  }
});

export default router;
