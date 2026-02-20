import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { normalizeRussianPhone } from '../utils/phone.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/tokens.js';

const registerSchema = z
  .object({
    email: z.string().email('Введите корректный email'),
    phone: z.string().min(1, 'Введите телефон'),
    password: z.string().min(6, 'Пароль должен быть минимум 6 символов'),
    passwordConfirm: z.string().min(1, 'Подтвердите пароль'),
    selectedMarketplaces: z.array(z.enum(['wb', 'ozon'])).min(1, 'Выберите минимум один маркетплейс'),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: 'Пароли не совпадают',
    path: ['passwordConfirm'],
  });

const loginSchema = z.object({
  email: z.string().email('Введите корректный email'),
  password: z.string().min(1, 'Введите пароль'),
});

const router = Router();

function setAuthCookies(res, accessToken, refreshToken) {
  const common = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  };

  res.cookie('accessToken', accessToken, {
    ...common,
    maxAge: 15 * 60 * 1000,
  });

  res.cookie('refreshToken', refreshToken, {
    ...common,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

router.post('/register', async (req, res, next) => {
  try {
    const parsed = registerSchema.parse(req.body);
    const normalizedPhone = normalizeRussianPhone(parsed.phone);

    if (!normalizedPhone) {
      return res.status(400).json({ message: 'Телефон должен быть в российском формате' });
    }

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: parsed.email.toLowerCase() }, { phone: normalizedPhone }],
      },
    });

    if (existing) {
      return res.status(409).json({ message: 'Пользователь с таким email или телефоном уже существует' });
    }

    const passwordHash = await bcrypt.hash(parsed.password, 10);

    const user = await prisma.user.create({
      data: {
        email: parsed.email.toLowerCase(),
        phone: normalizedPhone,
        passwordHash,
        selectedMarketplaces: parsed.selectedMarketplaces,
      },
    });

    const payload = { sub: user.id, email: user.email };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    setAuthCookies(res, accessToken, refreshToken);

    return res.status(201).json({
      id: user.id,
      email: user.email,
      phone: user.phone,
      selectedMarketplaces: user.selectedMarketplaces,
      createdAt: user.createdAt,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0]?.message || 'Ошибка валидации' });
    }
    return next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const parsed = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email: parsed.email.toLowerCase() } });
    if (!user) {
      return res.status(401).json({ message: 'Неверный email или пароль' });
    }

    const isValid = await bcrypt.compare(parsed.password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ message: 'Неверный email или пароль' });
    }

    const payload = { sub: user.id, email: user.email };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    setAuthCookies(res, accessToken, refreshToken);

    return res.json({ message: 'Успешный вход' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0]?.message || 'Ошибка валидации' });
    }
    return next(error);
  }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;

    if (!token) {
      return res.status(401).json({ message: 'Refresh token отсутствует' });
    }

    const tokenInDb = await prisma.refreshToken.findUnique({ where: { token } });
    if (!tokenInDb || tokenInDb.expiresAt < new Date()) {
      return res.status(401).json({ message: 'Refresh token недействителен' });
    }

    const payload = verifyRefreshToken(token);
    const newAccessToken = signAccessToken({ sub: payload.sub, email: payload.email });

    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60 * 1000,
    });

    return res.json({ message: 'Токен обновлен' });
  } catch (error) {
    return next(error);
  }
});

router.post('/logout', async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    }

    res.clearCookie('accessToken', { path: '/' });
    res.clearCookie('refreshToken', { path: '/' });
    return res.json({ message: 'Выход выполнен' });
  } catch (error) {
    return next(error);
  }
});

export default router;
