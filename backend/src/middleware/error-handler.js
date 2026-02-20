export function errorHandler(err, req, res, next) {
  // eslint-disable-line no-unused-vars
  console.error(err);
  return res.status(500).json({ message: 'Внутренняя ошибка сервера' });
}
