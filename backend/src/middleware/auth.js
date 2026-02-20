import { verifyAccessToken } from '../utils/tokens.js';

export function requireAuth(req, res, next) {
  const token = req.cookies.accessToken;

  if (!token) {
    return res.status(401).json({ message: 'Требуется авторизация' });
  }

  try {
    req.auth = verifyAccessToken(token);
    return next();
  } catch {
    return res.status(401).json({ message: 'Недействительный токен' });
  }
}
